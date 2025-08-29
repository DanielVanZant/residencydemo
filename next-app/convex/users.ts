import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get or create user by username
export const getOrCreateUser = mutation({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    // First try to find existing user
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
    
    if (existingUser) {
      return existingUser;
    }
    
    // Create new user
    const userId = await ctx.db.insert("users", {
      username: args.username,
      created_at: new Date().toISOString(),
    });
    
    return await ctx.db.get(userId);
  },
});

// Get all users
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.map(user => ({
      username: user.username,
      north_star_metric: user.north_star_metric,
      north_star_description: user.north_star_description,
    }));
  },
});

// Update user's north star metric
export const updateUserNorthStar = mutation({
  args: {
    username: v.string(),
    metric: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
    
    if (!user) {
      throw new Error(`User ${args.username} not found`);
    }
    
    await ctx.db.patch(user._id, {
      north_star_metric: args.metric,
      north_star_description: args.description,
    });
    
    return { changes: 1 };
  },
});

// Get user's north star info with most recent value
export const getUserNorthStar = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
    
    if (!user) {
      return {
        northStarMetric: null,
        northStarDescription: null,
        mostRecentValue: null,
        mostRecentNote: null,
        mostRecentDate: null,
      };
    }
    
    // Get most recent north star value
    const recentUpdate = await ctx.db
      .query("weekly_updates")
      .withIndex("by_user_id", (q) => q.eq("user_id", user._id))
      .filter((q) => q.neq(q.field("north_star_value"), undefined))
      .order("desc")
      .first();
    
    return {
      northStarMetric: user.north_star_metric,
      northStarDescription: user.north_star_description,
      mostRecentValue: recentUpdate?.north_star_value,
      mostRecentNote: recentUpdate?.north_star_note,
      mostRecentDate: recentUpdate?.week_date,
    };
  },
});

// Import user data
export const importUser = mutation({
  args: {
    username: v.string(),
    north_star_metric: v.optional(v.string()),
    north_star_description: v.optional(v.string()),
    created_at: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
    
    if (existing) {
      return { id: existing._id, existing: true };
    }
    
    const userId = await ctx.db.insert("users", {
      username: args.username,
      north_star_metric: args.north_star_metric,
      north_star_description: args.north_star_description,
      created_at: args.created_at,
    });
    
    return { id: userId, existing: false };
  },
});