import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Request interface for autosaving project data
interface AutosaveProjectRequest {
  projectId: string;
  userId: string;
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

// Response interface for autosave API response
interface AutosaveProjectResponse {
  success: boolean;
  message: string;
  eventId: string;
}

// Create the API slice
export const ProjectApi = createApi({
  reducerPath: 'ProjectApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/project', // Replace with your backend API URL
  }),
  tagTypes: ['Project'],
  endpoints: (builder) => ({
    autosaveProject: builder.mutation<AutosaveProjectResponse, AutosaveProjectRequest>({
      query: (data) => ({
        url: '', // API endpoint for autosave
        method: 'PATCH',
        body: data, // Send request data in the body
      }),
    }),
  }),
});

// Export auto-generated hooks for the autosave mutation
export const { useAutosaveProjectMutation } = ProjectApi;
