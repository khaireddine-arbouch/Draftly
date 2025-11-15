import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { prompts } from "@/prompts";
import {
  ConsumeCreditsQuery,
  CreditsBalanceQuery,
  StyleGuideQuery,
  InspirationImagesQuery,
} from "@/app/convex/query.config";

const HTML_PREVIEW_LIMIT = 2000;

function truncateHtmlSafely(html: string, limit: number): string {
  if (html.length <= limit) {
    return html;
  }

  const sliced = html.slice(0, limit);
  const lastOpenTagIndex = sliced.lastIndexOf("<");
  const lastCloseTagIndex = sliced.lastIndexOf(">");

  if (lastOpenTagIndex > lastCloseTagIndex) {
    return sliced.slice(0, lastOpenTagIndex);
  }

  return sliced;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { generatedUIId, currentHTML, projectId, pageIndex } = body;

    // Validate required fields
    if (
      !generatedUIId ||
      !currentHTML ||
      !projectId ||
      pageIndex == null || typeof pageIndex !== 'number'
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: generatedUIId, currentHTML, projectId, pageIndex",
        },
        { status: 400 }
      );
    }

    // Check credits (workflow generation consumes 1 credit)
    const { ok: balanceOk, balance: balanceBalance } =
      await CreditsBalanceQuery();
    if (!balanceOk || Number(balanceBalance) <= 0) {
      return NextResponse.json(
        { error: "No credits available" },
        { status: 400 }
      );
    }

    let styleGuideData: {
      colorSections: unknown[];
      typographySections: unknown[];
    } = {
      colorSections: [],
      typographySections: [],
    };

    try {
      const styleGuide = await StyleGuideQuery(projectId);
      const rawStyleGuide = styleGuide?.styleGuide?._valueJSON;

      if (rawStyleGuide && typeof rawStyleGuide === "object") {
        const colorSections = (rawStyleGuide as Record<string, unknown>)
          .colorSections;
        const typographySections = (rawStyleGuide as Record<string, unknown>)
          .typographySections;

        styleGuideData = {
          colorSections: Array.isArray(colorSections) ? colorSections : [],
          typographySections: Array.isArray(typographySections)
            ? typographySections
            : [],
        };
      } else {
        console.warn(
          "Style guide data missing or malformed for project:",
          projectId
        );
      }
    } catch (error) {
      console.error("Failed to fetch style guide:", {
        projectId,
        error,
      });
    }

    let inspirationImages: unknown[] = [];

    try {
      const inspirationResult = await InspirationImagesQuery(projectId);
      const rawImages = inspirationResult?.images?._valueJSON;

      if (Array.isArray(rawImages)) {
        inspirationImages = rawImages;
      } else {
        console.warn(
          "Inspiration images data missing or malformed for project:",
          projectId
        );
      }
    } catch (error) {
      console.error("Failed to fetch inspiration images:", {
        projectId,
        error,
      });
    }

    const imageUrls = inspirationImages
      .map((img) => {
        if (img && typeof img === "object" && "url" in img) {
          const url = (img as { url?: unknown }).url;
          return typeof url === "string" ? url : null;
        }
        return null;
      })
      .filter((url): url is string => Boolean(url));

    // Extract design context
    const colors = styleGuideData?.colorSections || [];
    const typography = styleGuideData?.typographySections || [];

    // Define page types for dynamic workflow generation
    const pageTypes = [
      "Dashboard/Analytics page with charts, metrics, and KPIs",
      "Settings/Configuration page with preferences and account management",
      "User Profile page with personal information and activity",
      "Data Listing/Table page with search, filters, and pagination",
    ];

    const selectedPageType = pageTypes[pageIndex] || pageTypes[0];

    const truncatedHtml = truncateHtmlSafely(currentHTML, HTML_PREVIEW_LIMIT);
    const htmlPreview =
      truncatedHtml.length < currentHTML.length
        ? `${truncatedHtml}...`
        : truncatedHtml;

    let userPrompt = `You are tasked with creating a workflow page that complements the provided main page design. 

MAIN PAGE REFERENCE (for design consistency):
${htmlPreview}

WORKFLOW PAGE TO GENERATE:
Create a "${selectedPageType}" that would logically complement the main page shown above.

DYNAMIC PAGE REQUIREMENTS:
1. Analyze the main page design and determine what type of application this appears to be
2. Based on that analysis, create a fitting ${selectedPageType} that would make sense in this application context
3. The page should feel like a natural extension of the main page's functionality
4. Use your best judgment to determine appropriate content, features, and layout for this page type

DESIGN CONSISTENCY REQUIREMENTS:
1. Use the EXACT same visual style, color scheme, and typography as the main page
2. Maintain identical component styling (buttons, cards, forms, navigation, etc.)
3. Keep the same overall layout structure and spacing patterns  
4. Use similar UI patterns and component hierarchy
5. Ensure the page feels like it belongs to the same application - perfect visual consistency

TECHNICAL REQUIREMENTS:
1. Generate clean, semantic HTML with Tailwind CSS classes matching the main page
2. Use similar shadcn/ui component patterns as shown in the main page
3. Include responsive design considerations
4. Add proper accessibility attributes (aria-labels, semantic HTML)
5. Create a functional, production-ready page layout
6. Include realistic content and data that fits the page type and application context

CONTENT GUIDELINES:
- Generate realistic, contextually appropriate content (don't use Lorem Ipsum)
- Create functional UI elements appropriate for the page type
- Include proper navigation elements if they exist in the main page
- Add interactive elements like buttons, forms, tables, etc. as appropriate for the page type

Please generate a complete, professional HTML page that serves as a ${selectedPageType} while maintaining perfect visual and functional consistency with the main design.`;

    if (colors.length > 0) {
      const colorText = colors
        .map((colorSection) => {
          const swatches = Array.isArray(
            (colorSection as { swatches?: unknown })?.swatches
          )
            ? ((colorSection as { swatches?: unknown[] }).swatches ?? [])
            : [];

          return swatches
            .map((swatch) => {
              if (!swatch || typeof swatch !== "object") {
                return null;
              }

              const { name, hexColor, description } = swatch as {
                name?: unknown;
                hexColor?: unknown;
                description?: unknown;
              };

              const safeName =
                typeof name === "string" && name.trim().length > 0
                  ? name
                  : "Unnamed";
              const safeHexColor =
                typeof hexColor === "string" && hexColor.trim().length > 0
                  ? hexColor
                  : "N/A";
              const safeDescription =
                typeof description === "string" && description.trim().length > 0
                  ? `, ${description}`
                  : "";

              return `${safeName}: ${safeHexColor}${safeDescription}`;
            })
            .filter(Boolean)
            .join(", ");
        })
        .filter(Boolean)
        .join(", ");

      if (colorText) {
        userPrompt += `\n\nStyle Guide Colors:\n${colorText}`;
      }
    }

    if (typography.length > 0) {
      const typographyText = typography
        .map((section) => {
          const styles = Array.isArray(
            (section as { styles?: unknown })?.styles
          )
            ? ((section as { styles?: unknown[] }).styles ?? [])
            : [];

          return styles
            .map((style) => {
              if (!style || typeof style !== "object") {
                return null;
              }

              const {
                name,
                description,
                fontFamily,
                fontWeight,
                fontSize,
                lineHeight,
              } = style as {
                name?: unknown;
                description?: unknown;
                fontFamily?: unknown;
                fontWeight?: unknown;
                fontSize?: unknown;
                lineHeight?: unknown;
              };

              const safeName =
                typeof name === "string" && name.trim().length > 0
                  ? name
                  : "Unnamed";
              const safeDescription =
                typeof description === "string" && description.trim().length > 0
                  ? description
                  : "No description";
              const safeFontFamily =
                typeof fontFamily === "string" && fontFamily.trim().length > 0
                  ? fontFamily
                  : "Unknown family";
              const safeFontWeight =
                typeof fontWeight === "string" && fontWeight.trim().length > 0
                  ? fontWeight
                  : "Unknown weight";
              const safeFontSize =
                typeof fontSize === "string" && fontSize.trim().length > 0
                  ? fontSize
                  : "Unknown size";
              const safeLineHeight =
                typeof lineHeight === "string" && lineHeight.trim().length > 0
                  ? lineHeight
                  : "Unknown line height";

              return `${safeName}: ${safeDescription}, ${safeFontFamily}, ${safeFontWeight}, ${safeFontSize}, ${safeLineHeight}`;
            })
            .filter(Boolean)
            .join(", ");
        })
        .filter(Boolean)
        .join(", ");

      if (typographyText) {
        userPrompt += `\n\nTypography:\n${typographyText}`;
      }
    }

    if (imageUrls.length > 0) {
      userPrompt += `\n\nInspiration Images Available: ${imageUrls.length} reference images for visual style and inspiration.`;
    }

    userPrompt += `\n\nPlease generate a professional ${selectedPageType} that maintains complete design consistency with the main page while serving its specific functional purpose. Be creative and contextually appropriate!`;

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
            ...imageUrls.map((url) => ({
              type: "image" as const,
              image: url,
            })),
          ],
        },
      ],
    });

    // Convert to streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const iterator = result.textStream[Symbol.asyncIterator]?.();

        if (!iterator) {
          controller.error(
            new Error("Failed to initiate AI response stream iterator")
          );
          return;
        }

        try {
          let nextChunk = await iterator.next();

          if (nextChunk.done) {
            controller.close();
            return;
          }

          const consumeResult = await ConsumeCreditsQuery({ amount: 1 });

          if (!consumeResult?.ok) {
            throw new Error("Failed to consume credits");
          }

          while (!nextChunk.done) {
            controller.enqueue(encoder.encode(nextChunk.value));
            nextChunk = await iterator.next();
          }

          controller.close();
        } catch (error) {
          console.error("Streaming workflow generation failed:", error);
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
    console.error("Workflow generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate workflow",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
