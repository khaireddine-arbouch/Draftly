import { ProjectQuery } from "@/app/convex/query.config";
import InfiniteCanvas from "@/components/canvas";
import ProjectProvider from "@/components/projects/provider";
import React from "react";

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

  const { project, profile } = await ProjectQuery(projectId);

  if (!profile) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Authentication required</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p className="text-red-500">Project not found</p>
      </div>
    );
  }

  return (
    <ProjectProvider initialProject={project}>
      <div className="w-full h-screen">
        <InfiniteCanvas />
      </div>
    </ProjectProvider>
  );
};

export default Page;
