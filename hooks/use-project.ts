"use client";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import {
  createProjectStart,
  addProject,
  createProjectSuccess,
  createProjectFailure,
  updateProject,
  removeProject,
} from "@/redux/slice/projects";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";

const generateGradientThumbnail = () => {
  const gradients = [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
    "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
  ];

  const randomGradient =
    gradients[Math.floor(Math.random() * gradients.length)];
  const svgContent = `
      <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${
              randomGradient.match(/#[a-fA-F0-9]{6}/g)?.[0] || "#667eea"
            }" />
            <stop offset="100%" style="stop-color:${
              randomGradient.match(/#[a-fA-F0-9]{6}/g)?.[1] || "#764ba2"
            }" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)" />
        <circle cx="150" cy="100" r="30" fill="white" opacity="0.8" />
        <path d="M140 90 L160 90 L160 110 L140 110 Z" fill="white" opacity="0.6" />
      </svg>
    `;

  return `data:image/svg+xml;base64,${btoa(svgContent)}`;
};

export const useProjectCreation = () => {
  const dispatch = useAppDispatch();
  const createProjectMutation = useMutation(api.projects.createProject);
  const updateProjectMetaMutation = useMutation(api.projects.updateProjectMeta);
  const deleteProjectMutation = useMutation(api.projects.deleteProject);

  // Get user info from profile
  const user = useAppSelector((state) => state.profile.user);

  // Get project-related state from Redux store
  const projectsState = useAppSelector((state) => state.projects);
  const shapesState = useAppSelector((state) => state.shapes);

  // Function to create a project
  const createProject = async (name?: string) => {
    if (!user?.id) {
      toast.error("User is not authenticated");
      return;
    }
    
    dispatch(createProjectStart());

    try {
      const thumbnail = generateGradientThumbnail();

      // Check if shapesState exists and properly initialize sketchesData
      const shapesData = shapesState && shapesState.shapes ? {
        // Convert EntityState to serializable format
        shapes: {
          ids: shapesState.shapes.ids || [],
          entities: shapesState.shapes.entities || {},
        },
        tool: shapesState.tool || 'select',
        selected: shapesState.selected || {},
        frameCounter: shapesState.frameCounter || 0,
      } : {
        shapes: { ids: [], entities: {} },
        tool: 'select',
        selected: {},
        frameCounter: 0,
      };

      const result = await createProjectMutation({
        userId: user.id as Id<"users">, 
        name: name || undefined, 
        sketchesData: shapesData,
        thumbnail
      });
      
      dispatch(addProject({
        _id: result.projectId,
        name: result.name,
        projectNumber: result.projectNumber,
        lastModified: Date.now(),
        createdAt: Date.now(),
        thumbnail,
        isPublic: false
      }));
      dispatch(createProjectSuccess());
      toast.success(`Project created successfully`);
    } catch {
        dispatch(createProjectFailure('Failed to create project'));
        toast.error('Failed to create project');
    }
  };

  const renameProject = async (projectId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Project name cannot be empty");
      return;
    }
    if (!user?.id) {
      toast.error("User is not authenticated");
      return;
    }

    try {
      await updateProjectMetaMutation({
        projectId: projectId as Id<"projects">,
        name: trimmed,
      });

      dispatch(
        updateProject({
          _id: projectId,
          name: trimmed,
          lastModified: Date.now(),
        })
      );
      toast.success("Project renamed");
    } catch (err) {
      console.error("Failed to rename project", err);
      toast.error("Failed to rename project");
    }
  };

  const archiveProject = async (projectId: string, archived: boolean) => {
    if (!user?.id) {
      toast.error("User is not authenticated");
      return;
    }

    try {
      await updateProjectMetaMutation({
        projectId: projectId as Id<"projects">,
        archived,
      });

      dispatch(
        updateProject({
          _id: projectId,
          archived,
          lastModified: Date.now(),
        })
      );
      toast.success(archived ? "Project archived" : "Project unarchived");
    } catch (err) {
      console.error("Failed to update project archive state", err);
      toast.error("Failed to update project");
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!user?.id) {
      toast.error("User is not authenticated");
      return;
    }

    try {
      await deleteProjectMutation({
        projectId: projectId as Id<"projects">,
      });

      dispatch(removeProject(projectId));
      toast.success("Project deleted");
    } catch (err) {
      console.error("Failed to delete project", err);
      toast.error("Failed to delete project");
    }
  };

  return {
    createProject,
    renameProject,
    archiveProject,
    deleteProject,
    isCreating: projectsState.isCreating, // Whether a project is being created
    projects: projectsState.projects, // List of projects
    projectsTotal: projectsState.total, // Total number of projects
    canCreate: !!user?.id, // Can the user create a project?
  };
};
