import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface ColorSwatch {
  name: string;
  hexColor: string;
  description?: string;
}

export type ColorSectionTitle =
  | "Primary Colors"
  | "Secondary & Accent Colors"
  | "UI Component Colors"
  | "Utility & Form Colors"
  | "Status & Feedback Colors";

export interface ColorSection {
  title: ColorSectionTitle;
  swatches: ColorSwatch[];
}

export interface TypographyStyle {
  name: string;
  fontFamily: string;
  fontSize: string;
  fontWeight?: string;
  lineHeight?: string;
  letterSpacing?: string;
}

export interface TypographySection {
  title: string;
  styles: TypographyStyle[];
}

export interface StyleGuide {
  theme: string;
  description: string;
  colorSections: ColorSection[];
  typographySections: TypographySection[];
}

export interface GenerateStyleGuideRequest {
  projectId: string;
}

export interface GenerateStyleGuideResponse {
  success: boolean;
  styleGuide?: StyleGuide;
  message: string;
}

export const styleGuideApi = createApi({
  reducerPath: 'styleGuideApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/generate', // Make sure this endpoint is correct
  }),
  tagTypes: ['StyleGuide'],
  endpoints: (builder) => ({
    generateStyleGuide: builder.mutation<
      GenerateStyleGuideResponse, // Define the expected response type
      GenerateStyleGuideRequest // Define the request body type
    >({
      query: ({ projectId }) => ({
        url: '/style', // The endpoint for generating the style guide
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // Corrected header value
        },
        body: { projectId }, // Send the projectId in the request body
      }),
      invalidatesTags: ['StyleGuide'], // Invalidate the 'StyleGuide' tag for cache invalidation
    }),
  }),
});

export const { useGenerateStyleGuideMutation } = styleGuideApi; // Export hook for usage in components
