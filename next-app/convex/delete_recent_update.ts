import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Delete the most recent weekly update for a user
export const deleteMostRecentUpdate = mutation({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    // Get the user
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
    
    if (!user) {
      throw new Error(`User ${args.username} not found`);
    }
    
    // Get the most recent weekly update
    const mostRecentUpdate = await ctx.db
      .query("weekly_updates")
      .withIndex("by_user_and_date", (q) => q.eq("user_id", user._id))
      .order("desc")
      .first();
    
    if (!mostRecentUpdate) {
      throw new Error(`No weekly updates found for ${args.username}`);
    }
    
    console.log(`Deleting weekly update for ${args.username} from ${mostRecentUpdate.week_date}`);
    
    // Delete associated formatted updates
    const formattedUpdates = await ctx.db
      .query("formatted_updates")
      .withIndex("by_weekly_update", (q) => q.eq("weekly_update_id", mostRecentUpdate._id))
      .collect();
    
    for (const formatted of formattedUpdates) {
      await ctx.db.delete(formatted._id);
      console.log(`Deleted formatted update: ${formatted.privacy_level}`);
    }
    
    // Delete the weekly update
    await ctx.db.delete(mostRecentUpdate._id);
    
    return { 
      message: `Successfully deleted weekly update from ${mostRecentUpdate.week_date} for ${args.username}`,
      deletedUpdateId: mostRecentUpdate._id,
      deletedFormattedUpdates: formattedUpdates.length
    };
  },
});