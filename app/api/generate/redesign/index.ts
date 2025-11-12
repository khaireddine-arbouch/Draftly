import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { prompts } from "@/prompts";
import {
  ConsumeCreditsQuery,
  CreditsBalanceQuery,
  InspirationImagesQuery,
  StyleGuideQuery,
} from "@/app/convex/query.config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userMessage,
      generatedUIId,
      currentHTML,
      projectId,
      wireframeSnapshot,
    } = body as {
      userMessage?: string;
      generatedUIId?: string;
      currentHTML?: string;
      projectId?: string;
      wireframeSnapshot?: string | null;
    };

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

    // ✅ Consume 4 credits for workflow generation
    const { ok } = await ConsumeCreditsQuery({ amount: 4 });
    if (!ok) {
      return NextResponse.json(
        { error: "Failed to consume credits" },
        { status: 500 }
      );
    }

    console.log("Current HTML:", currentHTML);

    // ✅ Fetch style guide
    const styleGuide = await StyleGuideQuery(projectId);
    type StyleGuideData = {
      colorSections?: Array<{
        swatches?: Array<{
          name?: string;
          hexColor?: string;
          description?: string;
        }>;
      }>;
      typographySections?: Array<{
        styles?: Array<{
          name?: string;
          description?: string;
          fontFamily?: string;
          fontWeight?: string;
          fontSize?: string;
          lineHeight?: string;
        }>;
      }>;
    };

    const styleGuideData =
      (styleGuide.styleGuide?._valueJSON as unknown as StyleGuideData) || {};
    const colors = Array.isArray(styleGuideData.colorSections)
      ? styleGuideData.colorSections
      : [];
    const typography = Array.isArray(styleGuideData.typographySections)
      ? styleGuideData.typographySections
      : [];

    // Get inspiration images
    const inspirationImages = await InspirationImagesQuery(projectId);
    const images =
      (inspirationImages.images?._valueJSON as unknown as
        | Array<{ url?: string }>
        | undefined) || [];
    const imageUrls = Array.isArray(images)
      ? images.map((img) => img.url).filter(Boolean)
      : [];


    // Build user prompt
    let userPrompt = `Please redesign this UI based on my request: "${userMessage}"`;
    if (currentHTML) {
      userPrompt += `\n\nCurrent HTML for reference:\n${currentHTML.substring(
        0,
        1000
      )}`;
    }

    if (wireframeSnapshot) {
        userPrompt += `\n\nWireframe Context: I'm providing a wireframe image that shows the EXACT original design layout and structure that this UI was generated from. This wireframe represents the specific frame that was used to create the current design. Please use this as visual context to understand the intended layout, structure, and design elements when making improvements. The wireframe shows the original wireframe/mockup that the user drew or created.`;
        console.log("Using wireframe snapshot for regeneration");
    } else {
        console.log("No wireframe snapshot provided for regeneration - using text-only regeneration");
    }

    const colorDescriptions = colors
      .flatMap((color) =>
        (color.swatches ?? []).map((swatch) => {
          const name = swatch.name ?? "Unnamed";
          const hex = swatch.hexColor ?? "N/A";
          const description = swatch.description ?? "No description";
          return `${name}: ${hex}, ${description}`;
        })
      )
      .filter(Boolean);

    if (colorDescriptions.length > 0) {
      userPrompt += `\n\nStyle Guide Colors:\n${colorDescriptions.join(", ")}`;
    }

    const typographyDescriptions = typography
      .flatMap((typo) =>
        (typo.styles ?? []).map((style) => {
          const name = style.name ?? "Unnamed";
          const description = style.description ?? "No description";
          const fontFamily = style.fontFamily ?? "Unknown family";
          const fontWeight = style.fontWeight ?? "Unknown weight";
          const fontSize = style.fontSize ?? "Unknown size";
          const lineHeight = style.lineHeight ?? "Unknown line height";
          return `${name}: ${description}, ${fontFamily}, ${fontWeight}, ${fontSize}, ${lineHeight}`;
        })
      )
      .filter(Boolean);

    if (typographyDescriptions.length > 0) {
      userPrompt += `\n\nTypography:\n${typographyDescriptions.join(", ")}`;
    }
    
      if (imageUrls.length > 0) {
        userPrompt += `\n\nInspiration Images Available: ${imageUrls.length} reference images for visual style and inspiration.`;
      }

      userPrompt += '\n\nPlease generate a completely new HTML design based on my request while following the style guide, maintaining professional quality, and considering the wireframe context for layout understanding.'


      



    const result = streamText({
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
