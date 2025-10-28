import { query } from './_generated/server';
import { v } from 'convex/values';

export const hasEntitlement = query({
  args: { userId: v.id('users') }, // Correct argument definition for userId
  handler: async (ctx, { userId }) => {
    const now = Date.now();
    
    // Loop through all subscriptions for the given userId
    for await (const sub of ctx.db
      .query('subscriptions')
      .withIndex('by_userId', (q) => q.eq('userId', userId))) {

      // Get the status of the subscription and normalize it to lowercase
      const status = String(sub.status || '').toLowerCase();
      
      // Check if the current subscription period is still valid
      const periodOk = sub.currentPeriodEnd == null || sub.currentPeriodEnd > now;

      // If the subscription is active and the period is still valid, return true
      if (status === 'active' && periodOk) {
        return true;
      }
    }

    // If no valid active subscription is found, return false
    return false;
  },
});
