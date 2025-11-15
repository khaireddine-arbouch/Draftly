import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const DEFAULT_GRANT = 10
const DEFAULT_ROLLOVER_LIMIT = 100
const ENTITLED = new Set(["active", "trialing"])

export const hasEntitlement = query({
  args: { userId: v.id("users") }, // Correct argument definition for userId
  handler: async (ctx, { userId }) => {
    const now = Date.now();

    // Loop through all subscriptions for the given userId
    for await (const sub of ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))) {
      // Get the status of the subscription and normalize it to lowercase
      const status = String(sub.status || "").toLowerCase();

      // Check if the current subscription period is still valid
      const periodOk =
        sub.currentPeriodEnd == null || sub.currentPeriodEnd > now;

      // If the subscription is entitled and the period is still valid, return true
      if (ENTITLED.has(status) && periodOk) {
        return true;
      }
    }

    // If no valid active subscription is found, return false
    return false;
  },
});

export const getByPolarId = query({
  args: { polarSubscriptionId: v.string() },
  handler: async (ctx, { polarSubscriptionId }) => {
    return ctx.db
      .query("subscriptions")
      .withIndex("by_polarSubscriptionId", (q) =>
        q.eq("polarSubscriptionId", polarSubscriptionId)
      )
      .first();
  },
});

export const getSubscriptionForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
  },
});

export const getAllForUser = query({
  args: { userId: v.id("users") },

  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", q => q.eq("userId", userId))
      .collect();
  }
});


export const upsertFromPolar = mutation({
  args: {
    userId: v.id("users"),
    polarCustomerId: v.string(),
    polarSubscriptionId: v.string(),
    productId: v.optional(v.string()),
    priceId: v.optional(v.string()),
    planCode: v.optional(v.string()),
    status: v.string(),
    currentPeriodEnd: v.optional(v.number()),
    trialEndsAt: v.optional(v.number()),
    cancelAt: v.optional(v.number()),
    canceledAt: v.optional(v.number()),
    seats: v.optional(v.number()),
    metadata: v.optional(v.any()),
    creditsGrantPerPeriod: v.optional(v.number()),
    creditsRolloverLimit: v.optional(v.number())
  },

  handler: async (ctx, args) => {
    console.log("[Convex] Starting upsertFromPolar for:", {
      userId: args.userId,
      polarSubscriptionId: args.polarSubscriptionId,
      status: args.status
    });

    const existingByPolar = await ctx.db
      .query("subscriptions")
      .withIndex("by_polarSubscriptionId", q =>
        q.eq("polarSubscriptionId", args.polarSubscriptionId)
      )
      .first();

    const existingByUser = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", q => q.eq("userId", args.userId))
      .first();

    const base = {
      userId: args.userId,
      polarCustomerId: args.polarCustomerId,
      polarSubscriptionId: args.polarSubscriptionId,
      productId: args.productId,
      priceId: args.priceId,
      planCode: args.planCode,
      status: args.status,
      currentPeriodEnd: args.currentPeriodEnd,
      trialEndsAt: args.trialEndsAt,
      cancelAt: args.cancelAt,
      canceledAt: args.canceledAt,
      seats: args.seats,
      metadata: args.metadata,

      creditsGrantPerPeriod:
        args.creditsGrantPerPeriod ??
        existingByPolar?.creditsGrantPerPeriod ??
        existingByUser?.creditsGrantPerPeriod ??
        DEFAULT_GRANT,

      creditsRolloverLimit:
        args.creditsRolloverLimit ??
        existingByPolar?.creditsRolloverLimit ??
        existingByUser?.creditsRolloverLimit ??
        DEFAULT_ROLLOVER_LIMIT
    };

    // Case 1: subscription exists via Polar ID
    if (existingByPolar) {
      if (existingByPolar.userId === args.userId) {
        await ctx.db.patch(existingByPolar._id, base);
        return existingByPolar._id;
      }

      // Polar subscription belongs to different user
      if (existingByUser) {
        const preservedData = {
          creditsBalance: existingByUser.creditsBalance,
          lastGrantCursor: existingByUser.lastGrantCursor
        };

        await ctx.db.patch(existingByUser._id, {
          ...base,
          ...preservedData
        });

        return existingByUser._id;
      }

      // User doesn't have any subscription yet
      const newId = await ctx.db.insert("subscriptions", {
        ...base,
        creditsBalance: 0,
        lastGrantCursor: undefined
      });
      console.log("[Convex] New subscription created:", newId);
      return newId;
    }

    // Case 2: no Polar match, but user already has a subscription
    if (existingByUser) {
      const preservedData = {
        creditsBalance: existingByUser.creditsBalance,
        lastGrantCursor: existingByUser.lastGrantCursor
      };

      await ctx.db.patch(existingByUser._id, {
        ...base,
        ...preservedData
      });
      return existingByUser._id;
    }

    // Case 3: completely new subscription
    const newId = await ctx.db.insert("subscriptions", {
      ...base,
      creditsBalance: 0,
      lastGrantCursor: undefined
    });

    return newId;
  }
});

export const grantCreditsIfNeeded = mutation({
  args: {
    subscriptionId: v.id("subscriptions"),
    idempotencyKey: v.string(), // `${subId}:${periodEndMs || "first"}`
    amount: v.optional(v.number()), // defaults to sub.creditsGrantPerPeriod
    reason: v.optional(v.string())
  },

  handler: async (
    ctx,
    { subscriptionId, idempotencyKey, amount, reason }
  ) => {
    // Check ledger for duplicate idempotency key
    const dupe = await ctx.db
      .query("credits_ledger")
      .withIndex("by_idempotencyKey", q =>
        q.eq("idempotencyKey", idempotencyKey)
      )
      .first();

    if (dupe) {
      return { ok: true, skipped: true, reason: "duplicate-ledger" };
    }

    const sub = await ctx.db.get(subscriptionId);
    if (!sub) {
      return { ok: false, error: "subscription-not-found" };
    }

    // Cursor match: already granted for this idempotency key
    if (sub.lastGrantCursor === idempotencyKey) {
      return { ok: true, skipped: true, reason: "cursor-match" };
    }

    // Entitlement check
    if (!ENTITLED.has(sub.status)) {
      return { ok: true, skipped: true, reason: "not-entitled" };
    }

    const grant =
      amount ?? sub.creditsGrantPerPeriod ?? DEFAULT_GRANT;

    if (grant <= 0) {
      return { ok: true, skipped: true, reason: "zero-grant" };
    }

    const next = Math.min(
      sub.creditsBalance + grant,
      sub.creditsRolloverLimit ?? DEFAULT_ROLLOVER_LIMIT
    );

    await ctx.db.patch(subscriptionId, {
      creditsBalance: next,
      lastGrantCursor: idempotencyKey
    });

    await ctx.db.insert("credits_ledger", {
      userId: sub.userId,
      subscriptionId,
      amount: grant,
      type: "grant",
      reason: reason ?? "periodic-grant",
      idempotencyKey,
      meta: { prev: sub.creditsBalance, next }
    });

    return { ok: true, granted: grant, balance: next };
  }
});


export const getCreditsBalance = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, { userId }) => {
    try {
      // Query the database for the subscription using the userId
      const sub = await ctx.db
        .query('subscriptions') // Querying the 'subscriptions' table
        .withIndex('by_userId', (q) => q.eq('userId', userId)) // Searching by 'userId'
        .first(); // Only fetching the first result (assuming one subscription per user)

      // Return the 'creditsBalance' from the subscription
      return sub?.creditsBalance ?? 0; // Default to 0 if no subscription or creditsBalance is not available
    } catch (error) {
      console.error('Error fetching credits balance:', error);
      throw new Error('Failed to fetch credits balance'); // You might want to handle the error more gracefully
    }
  },
});

export const consumeCredits = mutation({
  args: {
    userId: v.id('users'),
    amount: v.number(),
    reason: v.optional(v.string()),
    idempotencyKey: v.optional(v.string()),
  },

  handler: async (ctx, { userId, amount, reason, idempotencyKey }) => {
    // Ensure the amount is valid
    if (amount <= 0) {
      return { ok: false, error: 'invalid-amount' };
    }

    // Handle idempotency to avoid processing the same request multiple times
    if (idempotencyKey) {
      const dupe = await ctx.db
        .query('credits_ledger')
        .withIndex('by_idempotencyKey', (q) => q.eq('idempotencyKey', idempotencyKey))
        .first();
      if (dupe) {
        return { ok: true, idempotent: true }; // Return success if the same request was processed before
      }
    }

    // Fetch the user's subscription
    const sub = await ctx.db
      .query('subscriptions')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .first();

    // Ensure the subscription exists
    if (!sub) {
      return { ok: false, error: 'no-subscription' };
    }

    // Ensure the user is entitled to consume credits
    if (!ENTITLED.has(sub.status)) {
      return { ok: false, error: 'not-entitled' };
    }

    // Ensure the user has enough credits
    if (sub.creditsBalance < amount) {
      return {
        ok: false,
        error: 'insufficient-credits',
        balance: sub.creditsBalance,
      };
    }

    // Deduct the credits from the user's balance
    const next = sub.creditsBalance - amount;
    await ctx.db.patch(sub._id, { creditsBalance: next });

    // Log the transaction in the credits ledger
    await ctx.db.insert('credits_ledger', {
      userId,
      subscriptionId: sub._id,
      amount,
      type: 'consume',
      reason: reason ?? 'usage', // Default to 'usage' if no reason is provided
      idempotencyKey,
      meta: { prev: sub.creditsBalance, next },
    });

    // Return the result with the updated balance
    return { ok: true, balance: next };
  },
});
