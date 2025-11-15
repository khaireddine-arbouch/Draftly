import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Project summary type used in Redux state
export interface ProjectSummary {
  _id: string;
  name: string;
  projectNumber: number;
  thumbnail?: string;
  lastModified: number;
  createdAt: number;
  isPublic?: boolean;
  description?: string;
  archived?: boolean;
}

interface ProjectsState {
  projects: ProjectSummary[];
  total: number;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  // Track creation state
  isCreating: boolean;
  createError: string | null;
}

const initialState: ProjectsState = {
  projects: [],
  total: 0,
  isLoading: false,
  error: null,
  lastFetched: null,
  isCreating: false,
  createError: null,
};

// Projects Slice
const projectsSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    // Fetch Projects Failure
    fetchProjectsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    // This one was added by me: Double check
    fetchProjectsSuccess: (state, action: PayloadAction<ProjectSummary[]>) => {
      state.projects = action.payload;
      state.total = action.payload.length;
      state.isLoading = false;
      state.error = null;
    },

    // Create Project Actions
    createProjectStart: (state) => {
      state.isCreating = true;
      state.createError = null;
    },
    createProjectSuccess: (state) => {
      state.isCreating = false;
      state.createError = null;
    },
    createProjectFailure: (state, action: PayloadAction<string>) => {
      state.isCreating = false;
      state.createError = action.payload;
    },
    addProject: (state, action: PayloadAction<ProjectSummary>) => {
      state.projects.unshift(action.payload);
      state.total += 1;
    },
    // Update Project
    updateProject: (
      state,
      action: PayloadAction<{ _id: string } & Partial<ProjectSummary>>
    ) => {
      const index = state.projects.findIndex(
        (project) => project._id === action.payload._id
      );
      if (index !== -1) {
        // Update the project at the found index with the new data
        state.projects[index] = { ...state.projects[index], ...action.payload };
      }
    },

    // Remove Project
    removeProject: (state, action: PayloadAction<string>) => {
      state.projects = state.projects.filter(
        (project) => project._id !== action.payload
      );
      state.total = Math.max(0, state.total - 1); // Ensure total doesn't go below 0
    },

    // Clear all projects
    clearProjects: (state) => {
      state.error = null;
      state.createError = null;
    },
  },
});

export const {
  fetchProjectsFailure,
  fetchProjectsSuccess,
  createProjectStart,
  createProjectSuccess,
  createProjectFailure,
  addProject,
  updateProject,
  removeProject,
  clearProjects,
} = projectsSlice.actions;

export default projectsSlice.reducer;
