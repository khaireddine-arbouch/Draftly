import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    // Get the authenticated user ID
    const userId = await getAuthUserId(ctx);

    if (!userId) throw new Error("Not authenticated");

    // Fetch the project by its ID
    const project = await ctx.db.get(projectId);

    if (!project) throw new Error("Project not found");

    // Check if the user is the owner of the project or if the project is public
    if (project.userId !== userId && !project.isPublic) {
      throw new Error("Access denied");
    }

    // Return the project if the user has access
    return project;
  },
});

export const createProject = mutation({
  args: {
    userId: v.id("users"), // User ID (required)
    name: v.optional(v.string()), // Optional project name
    sketchesData: v.any(), // The sketches data from Redux (JSON structure)
    thumbnail: v.optional(v.string()), // Optional thumbnail image
  },
  handler: async (ctx, { userId, name, sketchesData, thumbnail }) => {
    console.log("[Convex] Creating project for user:", userId);

    const projectNumber = await getNextProjectNumber(ctx, userId);
    const projectName = name || `Project ${projectNumber}`;

    const projectId = await ctx.db.insert('projects', {
      userId,
      name: projectName,                  // Project name (either provided by user or auto-generated)
      sketchesData,                        // The project sketches data (from Redux)
      thumbnail,                           // Optional thumbnail URL
      projectNumber,                       // Generated project number
      lastModified: Date.now(),            // Timestamp for the last modification
      createdAt: Date.now(),               // Timestamp for project creation
      isPublic: false,                     // Default to private project (can be modified if needed)
    });
    
    console.log('✔ [Convex] Project created:', {
      projectId,                           // The ID of the newly created project
      name: projectName,                    // Name of the project
      projectNumber,                        // Project number
    });
    
    // Return the created project data
    return {
      projectId,                            // Return the project's ID
      name: projectName,                    // Return the project name
      projectNumber,                        // Return the project number
    };
    
  },
});

async function getNextProjectNumber(ctx: any, userId: string): Promise<number> {
  // Query for the user's project counter
  const counter = await ctx.db
    .query("project_counters") // Query the 'project_counters' collection
    .withIndex("by_userId", (q: any) => q.eq("userId", userId)) // Use index 'by_userId' to find the counter for the user
    .first(); // Fetch the first result (should be only one)

  // If no counter exists for the user, create one with the next project number set to 2
  if (!counter) {
    await ctx.db.insert("project_counters", {
      userId, // Associate counter with the user
      nextProjectNumber: 2, // Set the initial value for the next project number
    });
    return 1; // The first project number will be 1
  }

  // If a counter exists, use the current value of 'nextProjectNumber'
  const projectNumber = counter.nextProjectNumber;

  // Increment the project counter for the next project
  await ctx.db.patch(counter._id, {
    nextProjectNumber: projectNumber + 1, // Increment the counter
  });

  return projectNumber; // Return the current project number to be used
}

export const getUserProjects = query({
  args: {
    userId: v.id('users'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 20 }) => {
    const allProjects = await ctx.db
      .query('projects')
      .withIndex('by_userId_lastModified', (q) => q.eq('userId', userId))
      .order('desc')
      .collect();
      
    const projects = allProjects.slice(0, limit);

    return projects.map((project) => ({
      _id: project._id,
      name: project.name,
      thumbnail: project.thumbnail,
      lastModified: project.lastModified,
      createdAt: project.createdAt,
      isPublic: project.isPublic,
      projectNumber: project.projectNumber,
    }));
  },
});

export const getProjectStyleGuide = query({
  args: {projectId: v.id('projects')}, // Ensure correct type for projectId
  handler: async (ctx, { projectId }) => {
    const userId = await getAuthUserId(ctx)

    // Check if user is authenticated
    if (!userId) throw new Error('Not authenticated')

    // Fetch the project from the database
    const project = await ctx.db.get(projectId)
    if (!project) throw new Error('Project not found')

    // Check ownership or public access
    if (project.userId !== userId && !project.isPublic) {
      throw new Error('Access denied')
    }

    // Return parsed style guide data or null
    return project.styleGuide ? JSON.parse(project.styleGuide) : null
  },
})

