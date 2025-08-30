import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Reset a draft's submitted status for testing
export const resetDraftStatus = mutation({
  args: { draftId: v.string() },
  handler: async (ctx, args) => {
    const draft = await ctx.db
      .query("draft_weekly_updates")
      .withIndex("by_draft_id", (q) => q.eq("draft_id", args.draftId))
      .first();
    
    if (!draft) {
      throw new Error("Draft not found");
    }
    
    const now = new Date().toISOString();
    
    // Reset the submitted status
    await ctx.db.patch(draft._id, {
      is_submitted: false,
      updated_at: now,
    });
    
    return { 
      message: "Draft status reset successfully",
      draftId: args.draftId,
      wasSubmitted: draft.is_submitted,
      isSubmitted: false
    };
  },
});