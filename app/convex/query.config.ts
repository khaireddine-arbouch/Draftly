// Import necessary utilities and API functions
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server"; // Function to fetch the current user's auth token
import { fetchMutation, fetchQuery, preloadQuery } from "convex/nextjs"; // Function to fetch query results directly
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
    rawProfile as unknown as ConvexUserRaw | null
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
  const token = await convexAuthNextjsToken();

  // Make the query call with the projectId and token
  const styleGuide = await preloadQuery(
    api.projects.getProjectStyleGuide,
    { projectId: projectId as Id<"projects"> },
    { token }
  );

  return { styleGuide };
};

export const MoodBoardImagesQuery = async (projectId: string) => {
  // Await the token for authentication
  const token = await convexAuthNextjsToken();

  // Fetch images from the API with the projectId and token
  const images = await preloadQuery(
    api.moodboard.getMoodBoardImages,
    { projectId: projectId as Id<"projects"> },
    { token }
  );

  return { images };
};

export const ProjectQuery = async (projectId: string) => {
  const rawProfile = await ProfileQuery();
  const profile = normalizeProfile(
    // rawProfile._valueJSON as unknown as ConvexUserRaw | null
    (rawProfile as unknown as ConvexUserRaw | null) || null
  );

  if (!profile?.id || !projectId) {
    return { project: null, profile: null };
  }

  const project = await preloadQuery(
    api.projects.getProject,
    { projectId: projectId as Id<"projects"> },
    { token: await convexAuthNextjsToken() }
  );

  return { project, profile };
};

export const CreditsBalanceQuery = async () => {
  try {
    // Step 1: Fetch the user's profile
    const rawProfile = await ProfileQuery();

    // Step 2: Normalize the profile
    const profile = normalizeProfile(
      rawProfile as unknown as ConvexUserRaw | null
    );

    // Step 3: Check if profile ID exists
    if (!profile?.id) {
      return { ok: false, balance: 0, profile: null };
    }

    // Step 4: Fetch the user's credit balance using the user ID from the profile
    const balance = await preloadQuery(
      api.subscription.getCreditsBalance,
      {
        userId: profile.id as Id<"users">,
      },
      {
        token: await convexAuthNextjsToken(),
      }
    );

    // Step 5: Return the result
    return { ok: true, balance: balance._valueJSON, profile };
  } catch (error) {
    console.error("Error fetching credit balance:", error);
    return { ok: false, balance: 0, profile: null };
  }
};

// Define the query to consume credits
export const ConsumeCreditsQuery = async ({ amount }: { amount?: number }) => {
  // Step 1: Fetch the user profile
  const rawProfile = await ProfileQuery();
  const profile = normalizeProfile(
    rawProfile as unknown as ConvexUserRaw | null
  );

  // Step 2: If profile doesn't exist, return error
  if (!profile?.id) {
    return { ok: false, balance: 0, profile: null };
  }

  // Step 3: Fetch the current user's credit balance
  const credits = await fetchMutation(
    api.subscription.consumeCredits,
    {
      reason: "ai:generation",
      userId: profile.id as Id<"users">,
      amount: amount || 1,
    },
    {
      token: await convexAuthNextjsToken(),
    }
  );

  // Step 4: Return the result with the profile and balance
  return { ok: credits.ok, balance: credits.balance, profile };
};

export const InspirationImagesQuery = async (projectId: string) => {
  const images = await preloadQuery(
    api.inspiration.getInspirationImages,
    { projectId: projectId as Id<"projects"> },
    { token: await convexAuthNextjsToken() }
  );

  return { images };
};
