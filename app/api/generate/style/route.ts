import {
  ConsumeCreditsQuery,
  CreditsBalanceQuery,
  MoodBoardImagesQuery,
  RefundCreditsQuery,
} from "@/app/convex/query.config";
import { MoodBoardImage } from "@/hooks/use-styles";
import { prompts } from "@/prompts";
import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { anthropic } from "@ai-sdk/anthropic";
import { Id } from "@/convex/_generated/dataModel";

// Reusing the previously defined ColorSwatchSchema
const ColorSwatchSchema = z.object({
  name: z.string(), // Name of the color swatch
  hexColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"), // Validates hex color (e.g., #FFFFFF)
  description: z.string().optional(), // Optional description for the color swatch
});

// Define Secondary & Accent Colors schema (exactly 4 swatches)
const SecondaryColorsSchema = z.object({
  title: z.literal("Secondary & Accent Colors"), // Title must be 'Secondary & Accent Colors'
  swatches: z.array(ColorSwatchSchema).length(4), // Must contain exactly 4 swatches
});

// Define UI Component Colors schema (exactly 6 swatches)
const UIComponentColorsSchema = z.object({
  title: z.literal("UI Component Colors"), // Title must be 'UI Component Colors'
  swatches: z.array(ColorSwatchSchema).length(6), // Must contain exactly 6 swatches
});

// Define Utility & Form Colors schema (exactly 3 swatches)
const UtilityColorsSchema = z.object({
  title: z.literal("Utility & Form Colors"), // Title must be 'Utility & Form Colors'
  swatches: z.array(ColorSwatchSchema).length(3), // Must contain exactly 3 swatches
});

// Define Status & Feedback Colors schema (exactly 2 swatches)
const StatusColorsSchema = z.object({
  title: z.literal("Status & Feedback Colors"), // Title must be 'Status & Feedback Colors'
  swatches: z.array(ColorSwatchSchema).length(2), // Must contain exactly 2 swatches
});

// Define the PrimaryColors schema with exactly 4 color swatches
const PrimaryColorsSchema = z.object({
  title: z.literal("Primary Colours"), // Title must always be 'Primary Colours'
  swatches: z.array(ColorSwatchSchema).length(4), // Must be exactly 4 swatches
});

// Define the Typography Style Schema
const TypographyStyleSchema = z.object({
  name: z.string(), // The name of the typography style
  fontFamily: z.string(), // The font family used
  fontSize: z.string(), // The font size (e.g., '16px', '1rem')
  fontWeight: z.string(), // The font weight (e.g., 'bold', 'normal')
  lineHeight: z.string(), // The line height (e.g., '1.5')
  letterSpacing: z.string().optional(), // Optional letter spacing (e.g., '0.1em')
  description: z.string().optional(), // Optional description for the typography style
});

// Define the Typography Section Schema
const TypographySectionSchema = z.object({
  title: z.string(), // The title of the typography section (e.g., 'Heading Styles', 'Body Text')
  styles: z.array(TypographyStyleSchema), // An array of typography styles
});

const StyleGuideSchema = z.object({
  theme: z.string(),
  description: z.string(),
  colorSections: z.tuple([
    PrimaryColorsSchema,
    SecondaryColorsSchema,
    UIComponentColorsSchema,
    UtilityColorsSchema,
    StatusColorsSchema,
  ]),
  typographySections: z.array(TypographySectionSchema).length(3),
});

const ProjectIdSchema = z
  .string()
  .regex(/^[a-z0-9_-]{15,40}$/i, "Invalid project ID format");

const isProjectId = (value: unknown): value is Id<"projects"> => {
  return ProjectIdSchema.safeParse(value).success;
};

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { projectId } = body;

    // Check if projectId is provided
    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    if (!isProjectId(projectId)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }

    // Fetch the credit balance for the project
    const { ok: balanceOk, balance: balanceBalance } =
      await CreditsBalanceQuery();

    // If fetching the balance failed, return an error response
    if (!balanceOk) {
      return NextResponse.json(
        { error: "Failed to retrieve credit balance" },
        { status: 500 }
      );
    }

    if (balanceBalance === 0) {
      return NextResponse.json(
        { error: "Insufficient credits" },
        { status: 402 }
      );
    }

    const moodBoardImages = await MoodBoardImagesQuery(projectId);
    const imagesValue = moodBoardImages.images?._valueJSON;

    if (
      !imagesValue ||
      !Array.isArray(imagesValue) ||
      imagesValue.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "No mood board images found. Please upload images to the mood board first.",
        },
        { status: 400 }
      );
    }

    const images = imagesValue as unknown as MoodBoardImage[];
    const imageUrls = images
      .map((img) => img.url)
      .filter((url): url is string => typeof url === "string" && url.length > 0);
    const imageParts = imageUrls
      .map((url) => {
        try {
          return new URL(url);
        } catch {
          return null;
        }
      })
      .filter((url): url is URL => url !== null);
    const systemPrompt = prompts?.styleGuide?.system || ""; // Safely accessing system prompt

    const userPrompt = `Analyze these ${imageParts.length} mood board images and generate a design system: Extract colors that work harmoniously together and create typography that matches the aesthetic.
Return ONLY the JSON object matching the exact schema structure above.`;

    const consumeResult = await ConsumeCreditsQuery({ amount: 1 });

    if (!consumeResult.ok) {
      const status =
        typeof consumeResult.balance === "number" &&
        consumeResult.balance <= 0
          ? 402
          : 500;
      return NextResponse.json(
        {
          error:
            status === 402
              ? "Insufficient credits"
              : "Unable to reserve credits for generation",
        },
        { status }
      );
    }

    let result;
    try {
      result = await generateObject({
        model: anthropic("claude-sonnet-4-20250514"),
        schema: StyleGuideSchema,
        system: systemPrompt, // Your system prompt for generating the style guide
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: userPrompt, // Assuming userPrompt is a string containing the user's request
              },
              ...imageParts.map((url) => ({
                type: "image" as const,
                image: url,
              })),
            ],
          },
        ],
      });
    } catch (generationError) {
      const refundResult = await RefundCreditsQuery({ amount: 1 });

      if (!refundResult.ok) {
        console.error(
          "Failed to refund credits after generation error:",
          generationError
        );
      }

      return NextResponse.json(
        {
          error: "Failed to generate style guide",
          details:
            generationError instanceof Error
              ? generationError.message
              : "Unknown error",
        },
        { status: 500 }
      );
    }

    await fetchMutation(
      api.projects.updateProjectStyleGuide,
      {
        projectId,
        styleGuideData: result.object,
      },
      {
        token: await convexAuthNextjsToken(),
      }
    );

    return NextResponse.json(
      {
        success: true,
        styleGuide: result.object,
        message: "Style guide generated successfully",
        balance: consumeResult.balance,
      },
      { status: 200 }
    );


  } catch (error) {
    // Catch and log any errors that occur
    console.error("Error generating style guide:", error);

    // Return a generic error response
    return NextResponse.json(
      { error: "Failed to generate style guide" ,
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
