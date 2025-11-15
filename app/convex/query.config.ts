// Import necessary utilities and API functions
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server"; // Function to fetch the current user's auth token
import { fetchMutation, fetchQuery, preloadQuery } from "convex/nextjs"; // Function to fetch query results directly
import { api } from "../../convex/_generated/api"; // API methods from Convex backend
import { normalizeProfile, ConvexUserRaw } from "@/types/user";
import { Id } from "@/convex/_generated/dataModel";

const getAuthOptions = async () => {
  const token = await convexAuthNextjsToken();
  return token ? { token } : undefined;
};

// ProfileQuery: Fetches the current user profile with authentication
export const ProfileQuery = async () => {
  // Get the current user authentication token
  const authOptions = await getAuthOptions();

  if (!authOptions) {
    return null;
  }

  // Fetch user data with the authentication token
  return await fetchQuery(
    api.user.getCurrentUser, // API method to get the current user data
    {}, // Parameters for the query (none in this case)
    authOptions // Pass the authentication token as part of the query options
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
  const authOptions = await getAuthOptions();
  if (!authOptions) {
    return { entitlement: false, profileName: profile?.name ?? null };
  }

  const entitlement = await fetchQuery(
    api.subscription.hasEntitlement,
    { userId: profile.id as Id<"users"> }, // Pass userId from profile
    authOptions // Pass the authentication token
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
    const authOptions = await getAuthOptions();
    if (!authOptions) {
      return { projects: null, profile };
    }

    const projects = await fetchQuery(
      api.projects.getUserProjects,
      { userId: profile.id as Id<"users"> }, // Pass the user ID to the query
      authOptions // Include the token for authorization
    );

    return { projects, profile };
  } catch (error) {
    console.error("Error fetching projects:", error);
    return { projects: null, profile: null };
  }
};

export const StyleGuideQuery = async (projectId: string) => {
  // Await the token for authentication
  const authOptions = await getAuthOptions();
  if (!authOptions) {
    return { styleGuide: null };
  }

  // Make the query call with the projectId and token
  const styleGuide = await preloadQuery(
    api.projects.getProjectStyleGuide,
    { projectId: projectId as Id<"projects"> },
    authOptions
  );

  return { styleGuide };
};

export const MoodBoardImagesQuery = async (projectId: string) => {
  // Await the token for authentication
  const authOptions = await getAuthOptions();
  if (!authOptions) {
    return { images: null };
  }

  // Fetch images from the API with the projectId and token
  const images = await preloadQuery(
    api.moodboard.getMoodBoardImages,
    { projectId: projectId as Id<"projects"> },
    authOptions
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

  const authOptions = await getAuthOptions();
  if (!authOptions) {
    return { project: null, profile };
  }

  const projectDoc = await fetchQuery(
    api.projects.getProject,
    { projectId: projectId as Id<"projects"> },
    authOptions
  );

  const project =
    projectDoc != null
      ? (JSON.parse(JSON.stringify(projectDoc)) as Record<string, unknown>)
      : null;

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
    const authOptions = await getAuthOptions();
    if (!authOptions) {
      return { ok: false, balance: 0, profile };
    }

    const balance = await preloadQuery(
      api.subscription.getCreditsBalance,
      {
        userId: profile.id as Id<"users">,
      },
      authOptions
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
  const authOptions = await getAuthOptions();
  if (!authOptions) {
    return { ok: false, balance: 0, profile };
  }

  const credits = await fetchMutation(
    api.subscription.consumeCredits,
    {
      reason: "ai:generation",
      userId: profile.id as Id<"users">,
      amount: amount || 1,
    },
    authOptions
  );

  // Step 4: Return the result with the profile and balance
  return { ok: credits.ok, balance: credits.balance, profile };
};

export const RefundCreditsQuery = async ({ amount }: { amount?: number }) => {
  const rawProfile = await ProfileQuery();
  const profile = normalizeProfile(
    rawProfile as unknown as ConvexUserRaw | null
  );

  if (!profile?.id) {
    return { ok: false, balance: 0, profile: null };
  }

  const authOptions = await getAuthOptions();
  if (!authOptions) {
    return { ok: false, balance: 0, profile };
  }

  const subscription = await fetchQuery(
    api.subscription.getSubscriptionForUser,
    { userId: profile.id as Id<"users"> },
    authOptions
  );

  if (!subscription?._id) {
    return { ok: false, balance: 0, profile };
  }

  const refundAmount = amount ?? 1;

  if (refundAmount <= 0) {
    return {
      ok: false,
      balance: subscription.creditsBalance ?? 0,
      profile,
    };
  }

  try {
    const mutationAuthOptions = await getAuthOptions();
    if (!mutationAuthOptions) {
      return {
        ok: false,
        balance: subscription.creditsBalance ?? 0,
        profile,
      };
    }

    const result = await fetchMutation(
      api.subscription.grantCreditsIfNeeded,
      {
        subscriptionId: subscription._id as Id<"subscriptions">,
        idempotencyKey: `refund:${subscription._id}:${Date.now()}:${Math.random()}`,
        amount: refundAmount,
        reason: "ai:generation:refund",
      },
      mutationAuthOptions
    );

    if (!result?.ok) {
      return {
        ok: false,
        balance: subscription.creditsBalance ?? 0,
        profile,
      };
    }

    return {
      ok: true,
      balance:
        typeof result.balance === "number"
          ? result.balance
          : (subscription.creditsBalance ?? 0) + refundAmount,
      profile,
    };
  } catch (error) {
    console.error("Error refunding credits:", error);
    return {
      ok: false,
      balance: subscription.creditsBalance ?? 0,
      profile,
    };
  }
};

export const InspirationImagesQuery = async (projectId: string) => {
  const authOptions = await getAuthOptions();
  if (!authOptions) {
    return { images: null };
  }

  const images = await preloadQuery(
    api.inspiration.getInspirationImages,
    { projectId: projectId as Id<"projects"> },
    authOptions
  );

  return { images };
};
