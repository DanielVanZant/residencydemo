import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Save or update user summaries
export const saveUserSummaries = mutation({
  args: {
    username: v.string(),
    publicSummary: v.string(),
    personalSummary: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
    
    if (!user) {
      throw new Error(`User ${args.username} not found`);
    }
    
    const now = new Date().toISOString();
    
    // Check if summaries already exist
    const existingSummaries = await ctx.db
      .query("user_summaries")
      .withIndex("by_user_id", (q) => q.eq("user_id", user._id))
      .first();
    
    if (existingSummaries) {
      // Update existing
      await ctx.db.patch(existingSummaries._id, {
        public_summary: args.publicSummary,
        personal_summary: args.personalSummary,
        last_updated: now,
      });
      return { id: existingSummaries._id, changes: 1 };
    } else {
      // Create new
      const summaryId = await ctx.db.insert("user_summaries", {
        user_id: user._id,
        public_summary: args.publicSummary,
        personal_summary: args.personalSummary,
        last_updated: now,
        created_at: now,
      });
      return { id: summaryId, changes: 1 };
    }
  },
});

// Get user summaries
export const getUserSummaries = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
    
    if (!user) {
      return {
        public_summary: null,
        personal_summary: null,
        last_updated: null,
        created_at: null,
      };
    }
    
    const summaries = await ctx.db
      .query("user_summaries")
      .withIndex("by_user_id", (q) => q.eq("user_id", user._id))
      .first();
    
    if (!summaries) {
      return {
        public_summary: null,
        personal_summary: null,
        last_updated: null,
        created_at: null,
      };
    }
    
    return {
      public_summary: summaries.public_summary,
      personal_summary: summaries.personal_summary,
      last_updated: summaries.last_updated,
      created_at: summaries.created_at,
    };
  },
});

// Get all users with summaries for homepage
export const getAllUserSummaries = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const result = [];
    
    for (const user of users) {
      const summaries = await ctx.db
        .query("user_summaries")
        .withIndex("by_user_id", (q) => q.eq("user_id", user._id))
        .first();
      
      if (summaries && summaries.public_summary) {
        result.push({
          username: user.username,
          north_star_metric: user.north_star_metric,
          north_star_description: user.north_star_description,
          public_summary: summaries.public_summary,
          // NEVER include personal_summary in getAllUserSummaries - privacy protection
          last_updated: summaries.last_updated,
        });
      }
    }
    
    // Sort by last_updated descending
    result.sort((a, b) => {
      if (!a.last_updated && !b.last_updated) return 0;
      if (!a.last_updated) return 1;
      if (!b.last_updated) return -1;
      return new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime();
    });
    
    return result;
  },
});

// Import summary data
export const importSummary = mutation({
  args: {
    username: v.string(),
    public_summary: v.string(),
    personal_summary: v.string(),
    last_updated: v.string(),
    created_at: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
    
    if (!user) {
      throw new Error(`User not found: ${args.username}`);
    }
    
    // Check if summary already exists
    const existing = await ctx.db
      .query("user_summaries")
      .withIndex("by_user_id", (q) => q.eq("user_id", user._id))
      .first();
    
    if (existing) {
      return { id: existing._id, existing: true };
    }
    
    const summaryId = await ctx.db.insert("user_summaries", {
      user_id: user._id,
      public_summary: args.public_summary,
      personal_summary: args.personal_summary,
      last_updated: args.last_updated,
      created_at: args.created_at,
    });
    
    return { id: summaryId, existing: false };
  },
});