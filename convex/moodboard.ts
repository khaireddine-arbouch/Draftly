import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getMoodBoardImages = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const userId = await getAuthUserId(ctx);

    // Check if the user is authenticated
    if (!userId) {
      throw new Error("Not authenticated"); // Throw an error if not authenticated
    }

    // Fetch the project from the database
    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== userId) {
      return []; // Return an empty array if the project is not found or user does not own it
    }

    // Retrieve mood board image storage IDs (fallback to an empty array if not available)
    const storageIds = project.moodBoardImages || [];

    // Fetch the images from the storage
    const images = await Promise.all(
      storageIds.map(async (storageId, index) => {
        try {
          // Get the URL for the storageId
          const url = await ctx.storage.getUrl(storageId);

          // Return the image object with necessary information
          return {
            id: `convex-${storageId}`, // Unique ID for client
            storageId,
            url,
            uploaded: true,
            uploading: false,
            index, // Preserve the order
          };
        } catch (error) {
          // Return null in case of error (image fetch fails)
          return null;
        }
      })
    );

    // Filter out any failed URLs and sort by index
    return images
      .filter((image) => image !== null) // Remove any null values (failed URL fetches)
      .sort((a, b) => a!.index - b!.index); // Sort by index (ascending order)
  },
});

// Define the mutation to generate an upload URL
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    // Get the authenticated user's ID
    const userId = await getAuthUserId(ctx);

    // Check if the user is authenticated
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Generate upload URL that expires in 1 hour
    return await ctx.storage.generateUploadUrl();
  },
});

// Define the mutation to remove a mood board image
export const removeMoodBoardImage = mutation({
  args: {
    projectId: v.id("projects"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, { projectId, storageId }) => {
    // Ensure the user is authenticated before proceeding
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // You can perform operations here to remove the image from the mood board,
    // such as deleting it from storage or updating project metadata
    const project = await ctx.db.get(projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    if (project.userId !== userId) {
      throw new Error("You are not authorized to remove this image");
    }

    const currentImages = project.moodBoardImages || [];
    const updatedImages = currentImages.filter((id) => id !== storageId);

    await ctx.db.patch(projectId, {
      moodBoardImages: updatedImages,
      lastModified: Date.now(),
    });

    try {
      await ctx.storage.delete(storageId);
    } catch (error) {
      console.error(
        `Failed to delete mood board image from storage: ${storageId}`,
        error
      );
    }

    return { success: true, imageCount: updatedImages.length };
  },
});

export const addMoodBoardImage = mutation({
  args: {
    projectId: v.id("projects"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, { projectId, storageId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const project = await ctx.db.get(projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    if (project.userId !== userId) {
      throw new Error("You are not authorized to add this image");
    }

    const currentImages = project.moodBoardImages || [];
    if (currentImages.length >= 5) {
      throw new Error("Maximum 5 images allowed");
    }
    const updatedImages = [...currentImages, storageId];
    await ctx.db.patch(projectId, {
      moodBoardImages: updatedImages,
      lastModified: Date.now(),
    });

    return { success: true, imageCount: updatedImages.length };
  },
});
