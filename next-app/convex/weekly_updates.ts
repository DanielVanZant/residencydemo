import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Save weekly update with formatted versions
export const saveWeeklyUpdate = mutation({
  args: {
    username: v.string(),
    weekDate: v.string(),
    bulletPointsJson: v.string(),
    formattedUpdates: v.optional(v.any()),
    northStarValue: v.optional(v.string()),
    northStarNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get or create user
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
    
    let userId;
    if (existingUser) {
      userId = existingUser._id;
    } else {
      userId = await ctx.db.insert("users", {
        username: args.username,
        created_at: new Date().toISOString(),
      });
    }
    
    const now = new Date().toISOString();
    
    // Check if update already exists
    const existingUpdate = await ctx.db
      .query("weekly_updates")
      .withIndex("by_user_and_date", (q) => 
        q.eq("user_id", userId).eq("week_date", args.weekDate)
      )
      .first();
    
    let weeklyUpdateId: Id<"weekly_updates">;
    if (existingUpdate) {
      // Update existing
      await ctx.db.patch(existingUpdate._id, {
        bullet_points_json: args.bulletPointsJson,
        north_star_value: args.northStarValue,
        north_star_note: args.northStarNote,
        updated_at: now,
      });
      weeklyUpdateId = existingUpdate._id;
      
      // Delete existing formatted updates
      const existingFormatted = await ctx.db
        .query("formatted_updates")
        .withIndex("by_weekly_update", (q) => q.eq("weekly_update_id", weeklyUpdateId))
        .collect();
      
      for (const formatted of existingFormatted) {
        await ctx.db.delete(formatted._id);
      }
    } else {
      // Insert new
      weeklyUpdateId = await ctx.db.insert("weekly_updates", {
        user_id: userId,
        week_date: args.weekDate,
        bullet_points_json: args.bulletPointsJson,
        north_star_value: args.northStarValue,
        north_star_note: args.northStarNote,
        created_at: now,
        updated_at: now,
      });
    }
    
    // Insert formatted updates
    if (args.formattedUpdates) {
      for (const [privacyLevel, content] of Object.entries(args.formattedUpdates)) {
        await ctx.db.insert("formatted_updates", {
          weekly_update_id: weeklyUpdateId,
          privacy_level: privacyLevel as any,
          content_json: JSON.stringify(content),
          created_at: now,
        });
      }
    }
    
    return { weeklyUpdateId, message: "Update saved successfully" };
  },
});

// Get all weekly updates for a user
export const getUserUpdates = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
    
    if (!user) {
      return [];
    }
    
    const updates = await ctx.db
      .query("weekly_updates")
      .withIndex("by_user_id", (q) => q.eq("user_id", user._id))
      .collect();
    
    // Sort by week_date in descending order (most recent first)
    updates.sort((a, b) => new Date(b.week_date).getTime() - new Date(a.week_date).getTime());
    
    const result = [];
    for (const update of updates) {
      const formattedUpdates = await ctx.db
        .query("formatted_updates")
        .withIndex("by_weekly_update", (q) => q.eq("weekly_update_id", update._id))
        .collect();
      
      const formattedObj: Record<string, any> = {};
      for (const formatted of formattedUpdates) {
        try {
          formattedObj[formatted.privacy_level] = JSON.parse(formatted.content_json);
        } catch (e) {
          console.error("Error parsing formatted update:", e);
        }
      }
      
      result.push({
        id: update._id,
        weekDate: update.week_date,
        bulletPoints: JSON.parse(update.bullet_points_json),
        formattedUpdates: formattedObj,
        northStarValue: update.north_star_value,
        northStarNote: update.north_star_note,
        northStarMetric: user.north_star_metric,
        createdAt: update.created_at,
        updatedAt: update.updated_at,
      });
    }
    
    return result;
  },
});

// Get specific weekly update
export const getWeeklyUpdate = query({
  args: {
    username: v.string(),
    weekDate: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
    
    if (!user) {
      return null;
    }
    
    const update = await ctx.db
      .query("weekly_updates")
      .withIndex("by_user_and_date", (q) => 
        q.eq("user_id", user._id).eq("week_date", args.weekDate)
      )
      .first();
    
    if (!update) {
      return null;
    }
    
    const formattedUpdates = await ctx.db
      .query("formatted_updates")
      .withIndex("by_weekly_update", (q) => q.eq("weekly_update_id", update._id))
      .collect();
    
    const formattedObj: Record<string, any> = {};
    for (const formatted of formattedUpdates) {
      try {
        formattedObj[formatted.privacy_level] = JSON.parse(formatted.content_json);
      } catch (e) {
        console.error("Error parsing formatted update:", e);
      }
    }
    
    return {
      id: update._id,
      weekDate: update.week_date,
      bulletPoints: JSON.parse(update.bullet_points_json),
      formattedUpdates: formattedObj,
      northStarValue: update.north_star_value,
      northStarNote: update.north_star_note,
      createdAt: update.created_at,
      updatedAt: update.updated_at,
    };
  },
});

// Import weekly update data
export const importUpdate = mutation({
  args: {
    username: v.string(),
    week_date: v.string(),
    bullet_points_json: v.string(),
    north_star_value: v.optional(v.string()),
    north_star_note: v.optional(v.string()),
    created_at: v.string(),
    updated_at: v.string(),
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
    
    // Check if update already exists
    const existing = await ctx.db
      .query("weekly_updates")
      .withIndex("by_user_and_date", (q) => 
        q.eq("user_id", user._id).eq("week_date", args.week_date)
      )
      .first();
    
    if (existing) {
      return { id: existing._id, existing: true };
    }
    
    const updateId = await ctx.db.insert("weekly_updates", {
      user_id: user._id,
      week_date: args.week_date,
      bullet_points_json: args.bullet_points_json,
      north_star_value: args.north_star_value,
      north_star_note: args.north_star_note,
      created_at: args.created_at,
      updated_at: args.updated_at,
    });
    
    return { id: updateId, existing: false };
  },
});

// Delete weekly update
export const deleteWeeklyUpdate = mutation({
  args: {
    username: v.string(),
    weekDate: v.string(),
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
    
    // Find the weekly update
    const update = await ctx.db
      .query("weekly_updates")
      .withIndex("by_user_and_date", (q) => 
        q.eq("user_id", user._id).eq("week_date", args.weekDate)
      )
      .first();
    
    if (!update) {
      return { deleted: false, message: `No update found for ${args.username} on ${args.weekDate}` };
    }
    
    // Delete associated formatted updates first
    const formattedUpdates = await ctx.db
      .query("formatted_updates")
      .withIndex("by_weekly_update", (q) => q.eq("weekly_update_id", update._id))
      .collect();
    
    for (const formatted of formattedUpdates) {
      await ctx.db.delete(formatted._id);
    }
    
    // Delete the weekly update
    await ctx.db.delete(update._id);
    
    return { deleted: true, message: `Deleted update for ${args.username} on ${args.weekDate}` };
  },
});