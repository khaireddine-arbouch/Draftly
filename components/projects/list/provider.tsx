'use client';

// Provider for the projects list

import { useAppDispatch } from "@/redux/store";
import { useEffect } from "react";
import { fetchProjectsSuccess } from "@/redux/slice/projects";

// Minimal local type to match the projects array shape
type ProjectSummary = {
    _id: string;
    name: string;
    projectNumber: number;
    thumbnail?: string;
    lastModified: number;
    createdAt: number;
    isPublic?: boolean;
}

type Props = {
    children: React.ReactNode
    initialProjects: { _valueJSON?: ProjectSummary[] } | null
}

export const ProjectsProvider = ({ children, initialProjects }: Props) => {
    const dispatch = useAppDispatch();
  
    useEffect(() => {
      // Initialize Redux state with SSR data
      if (initialProjects?._valueJSON) {
        const projectsData = initialProjects._valueJSON;
        dispatch(fetchProjectsSuccess(projectsData));
        // From the tutorial
        // dispatch(
        //     fetchProjectsSuccess({
        //       projects: projectsData,
        //       total: projectsData.length,
        //     })
        //   );
      }
    }, [dispatch, initialProjects]);
  
    return <>{children}</>; // Render children wrapped by ProjectsProvider
  };
    