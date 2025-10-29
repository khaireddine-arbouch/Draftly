// Import necessary utilities and API functions
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server"; // Function to fetch the current user's auth token
import { fetchQuery, preloadQuery } from "convex/nextjs"; // Function to fetch query results directly
import { api } from "../../convex/_generated/api"; // API methods from Convex backend
import { normalizeProfile, ConvexUserRaw } from "@/types/user";
import { Id } from "@/convex/_generated/dataModel";

// ProfileQuery: Fetches the current user profile with authentication
export const ProfileQuery = async () => {
  // Get the current user authentication token
  const token = await convexAuthNextjsToken();

  // Fetch user data with the authentication token
  return await fetchQuery(
    api.user.getCurrentUser, // API method to get the current user data
    {}, // Parameters for the query (none in this case)
    { token } // Pass the authentication token as part of the query options
  );
};

// SubscriptionEntitlementQuery: Function to get and normalize user profile data
export const SubscriptionEntitlementQuery = async () => {
  // Get the raw profile data using ProfileQuery
  const rawProfile = await ProfileQuery();
  // Normalize the profile data
  const profile = normalizeProfile(
    rawProfile as unknown as ConvexUserRaw | null
  );
  // Ensure profile is valid before proceeding
  if (!profile) {
    return { entitlement: false, profileName: null }; // Return default values if profile is invalid
  }

  // Fetch boolean to check for subscription entitlement
  const entitlement = await fetchQuery(
    api.subscription.hasEntitlement,
    { userId: profile.id as Id<"users"> }, // Pass userId from profile
    { token: await convexAuthNextjsToken() } // Pass the authentication token
  );

  // Return the entitlement status and profile name
  return { entitlement, profileName: profile?.name };
};

// Make sure this function is async and returns the correct result for projects and profile
export const ProjectsQuery = async () => {
  // Fetch raw profile data
  const rawProfile = await ProfileQuery();

  // Normalize the profile data
  const profile = normalizeProfile(
    (rawProfile as unknown as ConvexUserRaw | null)
  );

  // Check if profile ID is present
  if (!profile?.id) {
    return { projects: null, profile: null };
  }

  // If the profile exists, fetch the user's projects
  try {
    const projects = await preloadQuery(
      api.projects.getUserProjects,
      { userId: profile.id as Id<"users"> }, // Pass the user ID to the query
      { token: await convexAuthNextjsToken() } // Include the token for authorization
    );

    return { projects, profile };
  } catch (error) {
    console.error("Error fetching projects:", error);
    return { projects: null, profile: null };
  }
};

export const StyleGuideQuery = async (projectId: string) => {
  // Await the token for authentication
  const token = await convexAuthNextjsToken()

  // Make the query call with the projectId and token
  const styleGuide = await preloadQuery(
    api.projects.getProjectStyleGuide,
    { projectId: projectId as Id<'projects'> },
    {token: await convexAuthNextjsToken()}
  )

  return { styleGuide }
}

export const MoodBoardImagesQuery = async (projectId: string) => {
  // Await the token for authentication
  const token = await convexAuthNextjsToken()

  // Fetch images from the API with the projectId and token
  const images = await preloadQuery(
    api.moodboard.getMoodBoardImages,
    { projectId: projectId as Id<'projects'> },
    { token }
  )

  return { images }
}

