import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    onboardedAt: v.optional(v.number()),
    lastLoginAt: v.optional(v.number()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),
  // Your other tables...

  // Subscriptions table
  subscriptions: defineTable({
    userId: v.id("users"), // Reference to the user
    polarCustomerId: v.string(), // Unique customer ID from Polar
    polarSubscriptionId: v.string(), // Unique subscription ID from Polar
    productId: v.optional(v.string()), // Optional product ID
    priceId: v.optional(v.string()), // Optional price ID
    planCode: v.optional(v.string()), // Optional plan code
    status: v.string(), // Status of the subscription (e.g., active, canceled)
    currentPeriodEnd: v.optional(v.number()), // Optional: End timestamp for the current period
    trialEndsAt: v.optional(v.number()), // Optional: Trial end timestamp
    cancelAt: v.optional(v.number()), // Optional: Timestamp for when to cancel
    canceledAt: v.optional(v.number()), // Optional: Timestamp for when the subscription was canceled
    seats: v.optional(v.number()), // Optional: Number of seats for multi-user plans
    metadata: v.optional(v.any()), // Optional: Any extra metadata (JSON object)
    creditsBalance: v.number(), // The balance of credits remaining
    creditsGrantPerPeriod: v.number(), // The number of credits granted per period
    creditsRolloverLimit: v.number(), // The max amount of credits that can be rolled over
    lastGrantCursor: v.optional(v.string()), // Optional: Cursor for tracking last credit grant
  })
    .index("by_userId", ["userId"]) // Index for querying by userId
    .index("by_polarSubscriptionId", ["polarSubscriptionId"]) // Index for querying by Polar subscription ID
    .index("by_status", ["status"]), // Index for querying by status (e.g., active, canceled)

  // Credits Grants table
  credits_grants: defineTable({
    userId: v.id("users"), // Reference to the user who receives the credit grant
    subscriptionId: v.id("subscriptions"), // Reference to the subscription associated with the grant
    amount: v.number(), // The amount of credit being granted, consumed, or adjusted
    type: v.string(), // Type of transaction: "grant", "consume", or "adjust"
    reason: v.optional(v.string()), // Optional field for the reason for the credit action
    idempotencyKey: v.optional(v.string()), // Optional field to prevent duplicate grants
    meta: v.optional(v.any()), // Optional metadata for additional data associated with the credit action
  })
    .index("by_subscriptionId", ["subscriptionId"]) // Index for querying by subscriptionId
    .index("by_userId", ["userId"]) // Index for querying by userId
    .index("by_idempotencyKey", ["idempotencyKey"]), // Index to ensure idempotency (no duplicate grants)

  // Credits Ledger table
  credits_ledger: defineTable({
    userId: v.id("users"), // Reference to user table
    subscriptionId: v.id("subscriptions"), // Reference to subscription table
    amount: v.number(), // The amount of credit being granted, consumed, or adjusted
    type: v.string(), // Type of transaction: "grant" | "consume" | "adjust"
    reason: v.optional(v.string()), // Optional field to explain the transaction
    idempotencyKey: v.optional(v.string()), // Optional field for idempotency check (to prevent double processing)
    meta: v.optional(v.any()), // Optional field for additional metadata
  })
    .index("by_subscriptionId", ["subscriptionId"]) // Index for querying by subscription
    .index("by_userId", ["userId"]) // Index for querying by user
    .index("by_idempotencyKey", ["idempotencyKey"]), // Index for idempotency key to avoid duplicate entries

  // Storage references table
  storage_references: defineTable({
    storageId: v.id("_storage"), // Storage identifier from Convex storage
    userId: v.id("users"), // Owner of the storage asset
    projectId: v.id("projects"), // Project that references the asset
    collection: v.string(), // Logical collection, e.g. "inspiration"
    createdAt: v.number(), // Timestamp when the reference was created
  })
    .index("by_storageId", ["storageId"])
    .index("by_storageId_collection", ["storageId", "collection"])
    .index("by_userId_collection", ["userId", "collection"])
    .index("by_projectId_collection", ["projectId", "collection"]),

  // Projects table
  projects: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    styleGuide: v.optional(v.string()),
    sketchesData: v.any(), // JSON structure matching Redux shapes state
    viewportData: v.optional(v.any()), // JSON structure for viewport state
    generatedDesignData: v.optional(v.any()), // JSON for generated UI components
    thumbnail: v.optional(v.string()), // Base64 or URL for project thumbnail
    moodBoardImages: v.optional(v.array(v.string())), // Array of storage IDs for mood board images
    inspirationImages: v.optional(v.array(v.string())), // Array of storage IDs for inspiration images (max 6)
    lastModified: v.number(), // Timestamp for last modification
    createdAt: v.number(), // Project creation timestamp
    isPublic: v.optional(v.boolean()), // For future sharing features
    archived: v.optional(v.boolean()), // Soft-archive flag
    tags: v.optional(v.array(v.string())), // For categorization or filtering
    projectNumber: v.number(), // Auto-incrementing project number per user
  })
    .index("by_userId", ["userId"])
    .index("by_userId_lastModified", ["userId", "lastModified"]),

  // Project counter table
  project_counters: defineTable({
    userId: v.id("users"),
    nextProjectNumber: v.number(),
  }).index("by_userId", ["userId"]),
});

export default schema;
