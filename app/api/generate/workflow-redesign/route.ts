/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { prompts } from "@/prompts";
import {
  ConsumeCreditsQuery,
  CreditsBalanceQuery,
  StyleGuideQuery,
} from "@/app/convex/query.config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userMessage, generatedUIId, currentHTML, projectId } = body;

    // ✅ Validate required fields
    if (!userMessage || !generatedUIId || !currentHTML || !projectId) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: userMessage, generatedUIId, currentHTML, projectId",
        },
        { status: 400 }
      );
    }

    // ✅ Check credits
    const { ok: balanceOk, balance } = await CreditsBalanceQuery();
    if (!balanceOk || Number(balance) <= 0) {
      return NextResponse.json(
        { error: "No credits available" },
        { status: 400 }
      );
    }

    console.log("Current HTML:", currentHTML);

    // ✅ Fetch style guide with validation
    let styleGuideData: {
      colorSections: unknown[];
      typographySections: unknown[];
    };
    try {
      styleGuideData = await (async (): Promise<{
        colorSections: unknown[];
        typographySections: unknown[];
      }> => {
        try {
          const styleGuide = await StyleGuideQuery(projectId);
          const rawData = styleGuide?.styleGuide as unknown;

          if (
            !styleGuide ||
            !styleGuide.styleGuide ||
            typeof rawData !== "object" ||
            rawData === null ||
            !("colorSections" in rawData) ||
            !("typographySections" in rawData)
          ) {
            throw new Error("Style guide data is missing required sections");
          }

          const { colorSections, typographySections } = rawData as {
            colorSections: unknown;
            typographySections: unknown;
          };

          if (!Array.isArray(colorSections) || !Array.isArray(typographySections)) {
            throw new Error("Style guide sections must be arrays");
          }

          return {
            colorSections,
            typographySections,
          };
        } catch (error) {
          console.error(
            "Workflow redesign failed to fetch style guide:",
            error
          );
          throw error;
        }
      })();
    } catch (error) {
      return NextResponse.json(
        {
          error: "Unable to fetch style guide for workflow redesign",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }

    const colorsDescription = (
      styleGuideData.colorSections
        ?.map((color: any) => {
          const swatchDescriptions =
            color?.swatches?.map((swatch: any) => {
              const name = swatch?.name ?? "";
              const hexColor = swatch?.hexColor ?? "";
              const description = swatch?.description ?? "";
              return [name, hexColor, description]
                .filter(Boolean)
                .join(": ");
            }) || [];

          return swatchDescriptions.filter(Boolean).join(", ");
        })
        ?.filter(Boolean) || []
    ).join(", ");

    const typographyDescription = (
      styleGuideData.typographySections
        ?.map((typography: any) => {
          const styleDescriptions =
            typography?.styles?.map((style: any) => {
              const name = style?.name ?? "";
              const description = style?.description ?? "";
              const fontFamily = style?.fontFamily ?? "";
              const fontWeight = style?.fontWeight ?? "";
              const fontSize = style?.fontSize ?? "";
              const lineHeight = style?.lineHeight ?? "";
              return `${name}: ${[
                description,
                fontFamily,
                fontWeight,
                fontSize,
                lineHeight,
              ]
                .filter(Boolean)
                .join(", ")}`;
            }) || [];

          return styleDescriptions.filter(Boolean).join(", ");
        })
        ?.filter(Boolean) || []
    ).join(", ");

    // Build user prompt
    let userPrompt = `CRITICAL: You are redesigning a SPECIFIC WORKFLOW PAGE, not creating a new page from scratch.

    
USER REQUEST: "${userMessage}"

CURRENT WORKFLOW PAGE HTML TO REDESIGN:
${currentHTML}

WORKFLOW REDESIGN REQUIREMENTS:
1. MODIFY THE PROVIDED HTML ABOVE - do not create a completely new page
2. Apply the user's requested changes to the existing workflow page design
3. Keep the same page type and core functionality (Dashboard, Settings, Profile, or Listing)
4. Maintain the existing layout structure and component hierarchy
5. Preserve all functional elements while applying visual/content changes
6. Keep the same general organization and workflow purpose

MODIFICATION GUIDELINES:
1. Start with the provided HTML structure as your base
2. Apply the requested changes (colors, layout, content, styling, etc.)
3. Keep all existing IDs and semantic structure intact
4. Maintain shadcn/ui component patterns and classes
5. Preserve responsive design and accessibility features
6. Update content, styling, or layout as requested but keep core structure

IMPORTANT: 
- DO NOT generate a completely different page
- DO NOT revert to any "original" or "main" page design
- DO redesign the specific workflow page shown in the HTML above
- DO apply the user's changes to that specific page

    colors: ${colorsDescription}
    typography: ${typographyDescription}

Please generate the modified version of the provided workflow page HTML with the requested changes applied.`;

    userPrompt += `\n\nPlease generate a professional redesigned workflow page that incorporates the requested changes while maintaining the core functionality and design consistency.`;

    let result: Awaited<ReturnType<typeof streamText>>;
    try {
      result = await streamText({
        model: anthropic("claude-opus-4-20250514"),
        system: prompts.generativeUi.system,
        temperature: 0.7,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: userPrompt,
              },
            ],
          },
        ],
      });
    } catch (error) {
      console.error("Workflow redesign generation error:", error);
      return NextResponse.json(
        {
          error: "Failed to generate workflow redesign",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }

    // ✅ Consume 4 credits for workflow generation only after generation successfully starts
    const { ok: consumeOk } = await ConsumeCreditsQuery({ amount: 4 });
    if (!consumeOk) {
      console.error("Workflow redesign credit consumption failed post-generation");
      return NextResponse.json(
        { error: "Failed to consume credits" },
        { status: 500 }
      );
    }

    // Convert to streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            const encoder = new TextEncoder();
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Workflow redesign API error:", error);
    return NextResponse.json(
      {
        error: "Failed to redesign workflow",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

