import {
  ConsumeCreditsQuery,
  InspirationImagesQuery,
  StyleGuideQuery,
} from "@/app/convex/query.config";
import { prompts } from "@/prompts";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image") as File;
    const projectIdValue = formData.get("projectId");
    const projectId =
      typeof projectIdValue === "string" ? projectIdValue.trim() : "";

    if (!imageFile) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!imageFile.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Invalid file type. Only images are allowed." },
        { status: 400 }
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { error: "Invalid projectId provided" },
        { status: 400 }
      );
    }

    const imageBuffer = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");

    const toTrimmedString = (value: unknown): string | null => {
      if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed ? trimmed : null;
      }
      if (typeof value === "number") {
        return value.toString();
      }
      return null;
    };

    type StyleGuideJSON = {
      colorSections?: Array<{
        swatches?: Array<{
          name?: string | null;
          hexColor?: string | null;
          description?: string | null;
        } | null>;
      } | null>;
      typographySections?: Array<{
        styles?: Array<{
          name?: string | null;
          description?: string | null;
          fontFamily?: string | null;
          fontWeight?: string | null;
          fontSize?: string | null;
          lineHeight?: string | null;
        } | null>;
      } | null>;
    };

    const isValidStyleGuidePayload = (
      value: unknown
    ): value is StyleGuideJSON => {
      if (!value || typeof value !== "object") {
        return false;
      }

      const { colorSections, typographySections } = value as StyleGuideJSON;
      const colorSectionsValid =
        colorSections === undefined ||
        Array.isArray(colorSections) &&
          colorSections.every(
            (section) =>
              section === null ||
              typeof section === "object" &&
                (section.swatches === undefined ||
                  (Array.isArray(section.swatches) &&
                    section.swatches.every(
                      (swatch) =>
                        swatch === null ||
                        (typeof swatch === "object" &&
                          "name" in swatch &&
                          "hexColor" in swatch)
                    )))
          );

      const typographySectionsValid =
        typographySections === undefined ||
        Array.isArray(typographySections) &&
          typographySections.every(
            (section) =>
              section === null ||
              typeof section === "object" &&
                (section.styles === undefined ||
                  (Array.isArray(section.styles) &&
                    section.styles.every(
                      (style) =>
                        style === null ||
                        (typeof style === "object" && "name" in style)
                    )))
          );

      return colorSectionsValid && typographySectionsValid;
    };

    type InspirationImage = { url: string };

    const isValidInspirationImages = (
      value: unknown
    ): value is InspirationImage[] =>
      Array.isArray(value) &&
      value.every(
        (item) =>
          item &&
          typeof item === "object" &&
          (() => {
            const candidate = (item as { url?: unknown }).url;
            if (typeof candidate !== "string") {
              return false;
            }
            return candidate.trim().length > 0;
          })()
      );

    let guideData: StyleGuideJSON;
    try {
      const styleGuide = await StyleGuideQuery(projectId);
      const rawGuide =
        styleGuide?.styleGuide &&
        typeof styleGuide.styleGuide === "object" &&
        "_valueJSON" in styleGuide.styleGuide
          ? (styleGuide.styleGuide as { _valueJSON?: unknown })._valueJSON
          : null;

      if (!rawGuide || !isValidStyleGuidePayload(rawGuide)) {
        console.error(
          "[Generate] Invalid style guide payload",
          JSON.stringify(rawGuide)
        );
        return NextResponse.json(
          { error: "Invalid style guide data" },
          { status: 400 }
        );
      }

      guideData = rawGuide;
    } catch (error) {
      console.error("[Generate] Failed to fetch style guide", error);
      return NextResponse.json(
        { error: "Failed to load style guide" },
        { status: 500 }
      );
    }

    let inspirationImageList: InspirationImage[] = [];
    try {
      const inspirationImages = await InspirationImagesQuery(projectId);
      const rawImages =
        inspirationImages?.images &&
        typeof inspirationImages.images === "object" &&
        "_valueJSON" in inspirationImages.images
          ? (inspirationImages.images as { _valueJSON?: unknown })._valueJSON
          : null;

      if (
        rawImages !== null &&
        rawImages !== undefined &&
        !isValidInspirationImages(rawImages)
      ) {
        console.error(
          "[Generate] Invalid inspiration images payload",
          JSON.stringify(rawImages)
        );
        return NextResponse.json(
          { error: "Invalid inspiration images data" },
          { status: 400 }
        );
      }

      inspirationImageList = Array.isArray(rawImages) ? rawImages : [];
    } catch (error) {
      console.error("[Generate] Failed to fetch inspiration images", error);
      return NextResponse.json(
        { error: "Failed to load inspiration images" },
        { status: 500 }
      );
    }

    const imageUrls = inspirationImageList
      .map((image) => image.url)
      .filter((url) => typeof url === "string" && url.trim().length > 0);

    const colorSections = Array.isArray(guideData.colorSections)
      ? guideData.colorSections
      : [];
    const typographySections = Array.isArray(guideData.typographySections)
      ? guideData.typographySections
      : [];

    const formattedColors = colorSections
      .filter(Boolean)
      .map((colorSection) => {
        const swatches = (colorSection?.swatches ?? []).filter(Boolean);
        const swatchStrings = swatches
          .map((swatch) => {
            const name = toTrimmedString(swatch?.name);
            const hexColor = toTrimmedString(swatch?.hexColor);
            const description = toTrimmedString(swatch?.description);

            if (!name || !hexColor) {
              return null;
            }

            const suffix = description ? `, ${description}` : "";
            return `${name}: ${hexColor}${suffix}`;
          })
          .filter((value): value is string => Boolean(value));

        return swatchStrings.length > 0 ? swatchStrings.join(", ") : null;
      })
      .filter((value): value is string => Boolean(value))
      .join(", ");

    const formattedTypography = typographySections
      .filter(Boolean)
      .map((typographySection) => {
        const styles = (typographySection?.styles ?? []).filter(Boolean);
        const styleStrings = styles
          .map((style) => {
            const name = toTrimmedString(style?.name);
            if (!name) {
              return null;
            }

            const descriptors = [
              toTrimmedString(style?.description),
              toTrimmedString(style?.fontFamily),
              toTrimmedString(style?.fontWeight),
              toTrimmedString(style?.fontSize),
              toTrimmedString(style?.lineHeight),
            ].filter((value): value is string => Boolean(value));

            const suffix =
              descriptors.length > 0 ? `: ${descriptors.join(", ")}` : "";

            return `${name}${suffix}`;
          })
          .filter((value): value is string => Boolean(value));

        return styleStrings.length > 0 ? styleStrings.join(", ") : null;
      })
      .filter((value): value is string => Boolean(value))
      .join(", ");

    try {
      const { ok } = await ConsumeCreditsQuery({ amount: 1 });

      if (!ok) {
        return NextResponse.json(
          { error: "Insufficient credits" },
          { status: 402 }
        );
      }
    } catch (error) {
      console.error("[Generate] Failed to consume credits", error);
      return NextResponse.json(
        { error: "Unable to process credits for generation" },
        { status: 500 }
      );
    }

    const systemPrompt = prompts?.generativeUi?.system || "";

    const userPrompt = `Use the user-provided styleGuide for all visual decisions: map its colors, typography scale, spacing, and radii directly to Tailwind v4 utilities (use arbitrary color classes like text-[#RRGGBB] / bg-[#RRGGBB] when hexes are given), enforce WCAG AA contrast (≥4.5:1 body, ≥3:1 large text), and if any token is missing fall back to neutral light defaults. Never invent new tokens; keep usage consistent across components.

Inspiration images (URLs):

You will receive up to 6 image URLs in images[].

Use them only for interpretation (mood/keywords/subject matter) to bias choices within the existing styleGuide tokens (e.g., which primary/secondary to emphasize, where accent appears, light vs. dark sections).

Do not derive new colors or fonts from images; do not create tokens that aren’t in styleGuide.

Do not echo the URLs in the output JSON; use them purely as inspiration.

If an image URL is unreachable/invalid, ignore it without degrading output quality.

If images imply low-contrast contexts, adjust class pairings (e.g., text-[#FFFFFF] on bg-[#0A0A0A], stronger border/ring from tokens) to maintain accessibility while staying inside the styleGuide.

For any required illustrative slots, use a public placeholder image (deterministic seed) only if the schema requires an image field; otherwise don’t include images in the JSON.

On conflicts: the styleGuide always wins over image cues.
    colors: ${formattedColors}
    typography: ${formattedTypography}
    `;

    let result;
    try {
      result = await streamText({
        model: anthropic("claude-opus-4-20250514"),
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: userPrompt,
              },
              {
                type: "image",
                image: base64Image, // Base64 image or URL
              },
              // Map through all additional image URLs
              ...imageUrls.map((url) => ({
                type: "image" as const,
                image: url,
              })),
            ],
          },
        ],
        system: systemPrompt,
        temperature: 0.7,
      });
    } catch (error) {
      console.error("[Generate] Failed during generation", error);
      return NextResponse.json(
        { error: "Failed to start generation" },
        { status: 500 }
      );
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            // Stream the HTML markup text
            const encoder = new TextEncoder();
            controller.enqueue(encoder.encode(chunk));
          }

          controller.close();
        } catch (error) {
          console.error("[Stream] Error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to generate UI design",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
