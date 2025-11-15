import { ProjectQuery } from "@/app/convex/query.config";
import InfiniteCanvas from "@/components/canvas";
import ProjectProvider, {
  type ProjectData,
} from "@/components/projects/provider";
import React from "react";
import { notFound } from "next/navigation";

interface CanvasPageProps {
  searchParams: Promise<{ project?: string }>;
}

const Page: React.FC<CanvasPageProps> = async ({ searchParams }) => {
  const params = await searchParams;
  const projectId = params.project;

  if (!projectId) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No project selected</p>
      </div>
    );
  }

  type ProjectQueryResult = Awaited<ReturnType<typeof ProjectQuery>>;
  let projectResult: ProjectQueryResult | null = null;

  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;

  try {
    projectResult = await ProjectQuery(projectId);
  } catch (error) {
    console.error("Failed to fetch project for canvas page", error);

    if (isRecord(error)) {
      const status =
        typeof error.status === "number" ? error.status : undefined;
      const code = typeof error.code === "string" ? error.code : undefined;
      const message =
        typeof error.message === "string"
          ? error.message
          : typeof error.error === "string"
          ? error.error
          : null;

      if (status === 404 || code === "NOT_FOUND") {
        return notFound();
      }

      if (
        status === 401 ||
        status === 403 ||
        code === "UNAUTHORIZED" ||
        code === "FORBIDDEN"
      ) {
        return (
          <div className="w-full h-screen flex items-center justify-center">
            <p className="text-muted-foreground">
              Authentication required to view this project.
            </p>
          </div>
        );
      }

      if (status && status >= 500) {
        return (
          <div className="w-full h-screen flex items-center justify-center">
            <p className="text-red-500">
              Our servers are currently unavailable. Please try again later.
            </p>
          </div>
        );
      }

      if (code === "VALIDATION_ERROR" || status === 400) {
        return (
          <div className="w-full h-screen flex items-center justify-center">
            <p className="text-red-500">
              Unable to load this project: {message ?? "validation error"}.
            </p>
          </div>
        );
      }
    }

    if (error instanceof Error && error.message.includes("not found")) {
      return notFound();
    }

    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p className="text-red-500">
          Something went wrong while loading the project. Please try again.
        </p>
      </div>
    );
  }

  const projectRecord = projectResult?.project as Record<
    string,
    unknown
  > | null;
  const initialProject: ProjectData | null = projectRecord
    ? {
        id: projectRecord._id as string | number | undefined,
        sketchesData: projectRecord.sketchesData as ProjectData["sketchesData"],
        viewportData: projectRecord.viewportData as ProjectData["viewportData"],
        lastModified: projectRecord.lastModified as number | undefined,
      }
    : null;
  const profile = projectResult?.profile ?? null;

  if (!profile) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Authentication required</p>
      </div>
    );
  }

  if (!projectRecord) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p className="text-red-500">Project not found</p>
      </div>
    );
  }

  return (
    <ProjectProvider initialProject={initialProject}>
      <div className="w-full h-screen">
        <InfiniteCanvas />
      </div>
    </ProjectProvider>
  );
};

export default Page;
