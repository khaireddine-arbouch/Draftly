import { getAuthUserId } from "@convex-dev/auth/server";  // To fetch the authenticated user's ID
import { query } from "./_generated/server";  // Import the query utility from Convex

// Define a query to fetch the current user from the database
export const getCurrentUser = query({
  args: {},  // No arguments are needed for fetching the current user
  handler: async (ctx) => {
    // Get the authenticated user's ID
    const userId = await getAuthUserId(ctx);
    
    // If there is no authenticated user, return null
    if (!userId) return null;
    
    // Fetch and return the user data from the database
    return await ctx.db.get(userId);
  },
});
