import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Import users data
export const importUsers = mutation({
  args: {
    users: v.array(
      v.object({
        username: v.string(),
        north_star_metric: v.optional(v.string()),
        north_star_description: v.optional(v.string()),
        created_at: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const imported = [];
    
    for (const userData of args.users) {
      // Check if user already exists
      const existing = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", userData.username))
        .first();
      
      if (!existing) {
        const userId = await ctx.db.insert("users", {
          username: userData.username,
          north_star_metric: userData.north_star_metric || undefined,
          north_star_description: userData.north_star_description || undefined,
          created_at: userData.created_at,
        });
        imported.push({ username: userData.username, id: userId });
      } else {
        imported.push({ username: userData.username, id: existing._id, existing: true });
      }
    }
    
    return { imported: imported.length, details: imported };
  },
});

// Import weekly updates data  
export const importWeeklyUpdates = mutation({
  args: {
    updates: v.array(
      v.object({
        username: v.string(),
        week_date: v.string(),
        bullet_points_json: v.string(),
        north_star_value: v.optional(v.string()),
        north_star_note: v.optional(v.string()),
        created_at: v.string(),
        updated_at: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const imported = [];
    
    for (const updateData of args.updates) {
      // Find user
      const user = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", updateData.username))
        .first();
      
      if (!user) {
        console.error(`User not found: ${updateData.username}`);
        continue;
      }
      
      // Check if update already exists
      const existing = await ctx.db
        .query("weekly_updates")
        .withIndex("by_user_and_date", (q) => 
          q.eq("user_id", user._id).eq("week_date", updateData.week_date)
        )
        .first();
      
      if (!existing) {
        const updateId = await ctx.db.insert("weekly_updates", {
          user_id: user._id,
          week_date: updateData.week_date,
          bullet_points_json: updateData.bullet_points_json,
          north_star_value: updateData.north_star_value || undefined,
          north_star_note: updateData.north_star_note || undefined,
          created_at: updateData.created_at,
          updated_at: updateData.updated_at,
        });
        imported.push({ 
          username: updateData.username, 
          week_date: updateData.week_date, 
          id: updateId 
        });
      } else {
        imported.push({ 
          username: updateData.username, 
          week_date: updateData.week_date, 
          id: existing._id, 
          existing: true 
        });
      }
    }
    
    return { imported: imported.length, details: imported };
  },
});

// Clear all data (for testing)
export const clearAllData = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete in reverse dependency order
    const formattedUpdates = await ctx.db.query("formatted_updates").collect();
    for (const item of formattedUpdates) {
      await ctx.db.delete(item._id);
    }
    
    const summaries = await ctx.db.query("user_summaries").collect();
    for (const item of summaries) {
      await ctx.db.delete(item._id);
    }
    
    const updates = await ctx.db.query("weekly_updates").collect();
    for (const item of updates) {
      await ctx.db.delete(item._id);
    }
    
    const users = await ctx.db.query("users").collect();
    for (const item of users) {
      await ctx.db.delete(item._id);
    }
    
    return { 
      deleted: {
        formatted_updates: formattedUpdates.length,
        summaries: summaries.length,
        updates: updates.length,
        users: users.length,
      }
    };
  },
});