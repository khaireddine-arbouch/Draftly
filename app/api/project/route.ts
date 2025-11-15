import { inngest } from "@/app/inngest/client";
import { NextRequest, NextResponse } from "next/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";

interface UpdateProjectRequest {
  projectId: string;
  shapesData: {
    shapes: Record<string, unknown>;
    tool: string;
    selected: Record<string, unknown>;
    frameCounter: number;
  };
  viewportData?: {
    scale: number;
    translate: { x: number; y: number };
  };
  thumbnail?: string;
}

export async function PATCH(request: NextRequest) {
  try {
    const body: UpdateProjectRequest & { userId?: string } =
      await request.json();
    const { projectId, shapesData, viewportData, userId, thumbnail } = body;

    if (!projectId || !userId || !shapesData) {
      return NextResponse.json(
        { error: "Project ID, User ID, and shapes data are required" },
        { status: 400 }
      );
    }

    // Persist immediately to Convex so autosave survives refreshes
    const token = await convexAuthNextjsToken();
    const authOptions = token ? { token } : undefined;
    await fetchMutation(
      api.projects.updateProjectSketches,
      {
        projectId: projectId as Id<"projects">,
        sketchesData: shapesData,
        viewportData,
        thumbnail,
      },
      authOptions
    );

    let eventId: string | null = null;
    try {
      const eventResult = await inngest.send({
        name: "project/autosave.requested",
        data: { projectId, userId, shapesData, viewportData, thumbnail },
      });
      eventId = eventResult.ids?.[0] ?? null;
    } catch (eventError) {
      console.error(
        "[autosave] Failed to enqueue autosave workflow:",
        eventError
      );
    }

    return NextResponse.json({
      success: true,
      message: eventId
        ? "Project autosave initiated"
        : "Project autosave saved",
      eventId,
    });
  } catch (error) {
    console.error("[autosave] Autosave PATCH failed:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error";
    const normalized = String(message).toLowerCase();
    const status =
      normalized.includes("not authenticated") ? 401 :
      normalized.includes("access denied") ? 403 :
      normalized.includes("not found") ? 404 :
      500;
    return NextResponse.json(
      {
        success: false,
        message: "Failed to autosave project",
        error: message,
      },
      { status }
    );
  }
}
