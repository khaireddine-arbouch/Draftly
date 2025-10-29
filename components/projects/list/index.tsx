"use client";
import React from "react";
import { useProjectCreation } from "@/hooks/use-project";
import { Plus } from "lucide-react";
import { useAppSelector } from "@/redux/store";
import {formatDistanceToNow} from "date-fns";
import Link from "next/link";
import Image from "next/image";

export const ProjectsList = () => {
  const { projects, canCreate } = useProjectCreation();
  const { user } = useAppSelector((state) => state.profile);
  if (!canCreate) {
    return (
      <div className="text-center py-12">
        <p className="text-lg">You are not authorized to create projects</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">
            Your Projects
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your design projects and continue where you left off.
          </p>
        </div>
      </div>
      {projects.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-muted flex items-center justify-center">
            <Plus className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            No projects yet
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Create your first project to get started
          </p>
        </div>
      ) : (
        // Add a fallback or content for when projects exist, e.g., a list of projects
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {projects.map((project: any) => (
            <Link
              key={project._id}
              href={`/dashboard/${user?.name}/style-guide?project=${project._id}`}
              className="group cursor-pointer"
            >
              <div className="space-y-3">
                <div className="aspect-4/3 rounded-lg overflow-hidden bg-muted">
                  {project.thumbnail ? (
                    <Image
                      src={project.thumbnail}
                      alt={project.name}
                      width={300}
                      height={200}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full bg-linear-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <Plus className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-col items-center justify-between">
                  <h3 className="text-lg font-medium text-foreground group-hover:text-primary transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(project.lastModified)} ago
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
