import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Create or update a draft weekly update
export const saveDraft = mutation({
  args: {
    draftId: v.optional(v.string()),
    username: v.string(),
    weekDate: v.string(),
    questionResponses: v.optional(v.string()),
    dynamicQuestion4: v.optional(v.string()),
    dynamicQuestion5: v.optional(v.string()),
    extractedBullets: v.optional(v.string()),
    formattedUpdates: v.optional(v.string()),
    northStarValue: v.optional(v.string()),
    northStarNote: v.optional(v.string()),
    stage: v.union(v.literal("questions"), v.literal("editing")),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
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
        created_at: now,
      });
    }
    
    // If draftId is provided, try to update existing draft
    if (args.draftId) {
      const existingDraft = await ctx.db
        .query("draft_weekly_updates")
        .withIndex("by_draft_id", (q) => q.eq("draft_id", args.draftId!))
        .first();
      
      if (existingDraft) {
        await ctx.db.patch(existingDraft._id, {
          question_responses: args.questionResponses || existingDraft.question_responses,
          dynamic_question_4: args.dynamicQuestion4 || existingDraft.dynamic_question_4,
          dynamic_question_5: args.dynamicQuestion5 || existingDraft.dynamic_question_5,
          formatted_updates: args.formattedUpdates || existingDraft.formatted_updates,
          north_star_value: args.northStarValue || existingDraft.north_star_value,
          north_star_note: args.northStarNote || existingDraft.north_star_note,
          stage: args.stage,
          updated_at: now,
        });
        
        return { draftId: args.draftId, message: "Draft updated successfully" };
      }
    }
    
    // Create new draft
    const newDraftId = crypto.randomUUID();
    await ctx.db.insert("draft_weekly_updates", {
      draft_id: newDraftId,
      user_id: userId,
      username: args.username,
      week_date: args.weekDate,
      question_responses: args.questionResponses || "{}",
      dynamic_question_4: args.dynamicQuestion4,
      dynamic_question_5: args.dynamicQuestion5,
      extracted_bullets: args.extractedBullets,
      formatted_updates: args.formattedUpdates,
      north_star_value: args.northStarValue,
      north_star_note: args.northStarNote,
      stage: args.stage,
      is_submitted: false,
      created_at: now,
      updated_at: now,
    });
    
    return { draftId: newDraftId, message: "Draft created successfully" };
  },
});

// Get draft by ID
export const getDraft = query({
  args: { draftId: v.string() },
  handler: async (ctx, args) => {
    const draft = await ctx.db
      .query("draft_weekly_updates")
      .withIndex("by_draft_id", (q) => q.eq("draft_id", args.draftId))
      .first();
    
    if (!draft) {
      return null;
    }
    
    // Parse JSON fields
    const questionResponses = JSON.parse(draft.question_responses || "{}");
    const extractedBullets = draft.extracted_bullets ? JSON.parse(draft.extracted_bullets) : null;
    const formattedUpdates = draft.formatted_updates ? JSON.parse(draft.formatted_updates) : null;
    
    return {
      draftId: draft.draft_id,
      username: draft.username,
      weekDate: draft.week_date,
      questionResponses,
      dynamicQuestion4: draft.dynamic_question_4,
      dynamicQuestion5: draft.dynamic_question_5,
      extractedBullets,
      formattedUpdates,
      northStarValue: draft.north_star_value,
      northStarNote: draft.north_star_note,
      stage: draft.stage,
      isSubmitted: draft.is_submitted,
      createdAt: draft.created_at,
      updatedAt: draft.updated_at,
    };
  },
});

// Update just the extracted bullets for a draft
export const updateDraftBullets = mutation({
  args: { 
    draftId: v.string(),
    extractedBullets: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("updateDraftBullets called for draft:", args.draftId);
    console.log("Bullets data size:", args.extractedBullets.length, "characters");
    
    const now = new Date().toISOString();
    
    // Find the existing draft
    const existing = await ctx.db
      .query("draft_weekly_updates")
      .withIndex("by_draft_id", (q) => q.eq("draft_id", args.draftId))
      .first();
      
    if (!existing) {
      console.error("Draft not found:", args.draftId);
      throw new Error("Draft not found");
    }
    
    console.log("Found existing draft, updating bullets field...");
    
    // Update just the bullets field
    try {
      await ctx.db.patch(existing._id, {
        extracted_bullets: args.extractedBullets,
        updated_at: now,
      });
      
      console.log("Bullets updated successfully for draft:", args.draftId);
      return { message: "Bullets updated successfully" };
    } catch (error) {
      console.error("Error updating bullets:", error);
      throw error;
    }
  },
});

// Update just the formatted updates for a draft
export const updateDraftFormattedUpdates = mutation({
  args: { 
    draftId: v.string(),
    formattedUpdates: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("updateDraftFormattedUpdates called for draft:", args.draftId);
    console.log("Formatted updates data size:", args.formattedUpdates.length, "characters");
    
    const now = new Date().toISOString();
    
    // Find the existing draft
    const existing = await ctx.db
      .query("draft_weekly_updates")
      .withIndex("by_draft_id", (q) => q.eq("draft_id", args.draftId))
      .first();
      
    if (!existing) {
      console.error("Draft not found:", args.draftId);
      throw new Error("Draft not found");
    }
    
    console.log("Found existing draft, updating formatted updates field...");
    
    // Update just the formatted updates field
    try {
      await ctx.db.patch(existing._id, {
        formatted_updates: args.formattedUpdates,
        updated_at: now,
      });
      
      console.log("Formatted updates updated successfully for draft:", args.draftId);
      return { message: "Formatted updates updated successfully" };
    } catch (error) {
      console.error("Error updating formatted updates:", error);
      throw error;
    }
  },
});

// Convert draft to final weekly update
export const submitDraft = mutation({
  args: { draftId: v.string() },
  handler: async (ctx, args) => {
    const draft = await ctx.db
      .query("draft_weekly_updates")
      .withIndex("by_draft_id", (q) => q.eq("draft_id", args.draftId))
      .first();
    
    if (!draft) {
      throw new Error("Draft not found");
    }
    
    if (draft.is_submitted) {
      throw new Error("Draft already submitted");
    }
    
    const now = new Date().toISOString();
    
    // Check if a weekly update already exists for this user/date
    const existingUpdate = await ctx.db
      .query("weekly_updates")
      .withIndex("by_user_and_date", (q) => 
        q.eq("user_id", draft.user_id).eq("week_date", draft.week_date)
      )
      .first();
    
    let weeklyUpdateId: Id<"weekly_updates">;
    
    if (existingUpdate) {
      // Update existing
      await ctx.db.patch(existingUpdate._id, {
        bullet_points_json: draft.question_responses,
        north_star_value: draft.north_star_value,
        north_star_note: draft.north_star_note,
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
        user_id: draft.user_id,
        week_date: draft.week_date,
        bullet_points_json: draft.question_responses,
        north_star_value: draft.north_star_value,
        north_star_note: draft.north_star_note,
        created_at: now,
        updated_at: now,
      });
    }
    
    // Insert formatted updates if they exist
    if (draft.formatted_updates) {
      const formattedUpdates = JSON.parse(draft.formatted_updates);
      for (const [privacyLevel, content] of Object.entries(formattedUpdates)) {
        // Store the content exactly as the original one-pager does
        const contentToStore = content;
        
        await ctx.db.insert("formatted_updates", {
          weekly_update_id: weeklyUpdateId,
          privacy_level: privacyLevel as any,
          content_json: JSON.stringify(contentToStore),
          created_at: now,
        });
      }
    }
    
    // Mark draft as submitted
    await ctx.db.patch(draft._id, {
      is_submitted: true,
      updated_at: now,
    });
    
    return { 
      weeklyUpdateId, 
      message: "Draft submitted successfully",
      draftId: args.draftId 
    };
  },
});

// Delete a draft
export const deleteDraft = mutation({
  args: { draftId: v.string() },
  handler: async (ctx, args) => {
    const draft = await ctx.db
      .query("draft_weekly_updates")
      .withIndex("by_draft_id", (q) => q.eq("draft_id", args.draftId))
      .first();
    
    if (!draft) {
      throw new Error("Draft not found");
    }
    
    await ctx.db.delete(draft._id);
    
    return { message: "Draft deleted successfully" };
  },
});

// Reset draft submitted status (for testing)
export const resetDraftStatus = mutation({
  args: { draftId: v.string() },
  handler: async (ctx, args) => {
    console.log("Resetting draft status for:", args.draftId);
    
    const draft = await ctx.db
      .query("draft_weekly_updates")
      .withIndex("by_draft_id", (q) => q.eq("draft_id", args.draftId))
      .first();
    
    if (!draft) {
      console.error("Draft not found:", args.draftId);
      throw new Error("Draft not found");
    }
    
    console.log("Found draft, current submitted status:", draft.is_submitted);
    
    const now = new Date().toISOString();
    
    // Reset the submitted status
    await ctx.db.patch(draft._id, {
      is_submitted: false,
      updated_at: now,
    });
    
    console.log("Draft status reset successfully for:", args.draftId);
    
    return { 
      message: "Draft status reset successfully",
      draftId: args.draftId,
      wasSubmitted: draft.is_submitted,
      isSubmitted: false
    };
  },
});

// Get user's drafts
export const getUserDrafts = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const drafts = await ctx.db
      .query("draft_weekly_updates")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .filter(q => q.eq(q.field("is_submitted"), false))
      .collect();
    
    return drafts.map(draft => ({
      draftId: draft.draft_id,
      weekDate: draft.week_date,
      stage: draft.stage,
      createdAt: draft.created_at,
      updatedAt: draft.updated_at,
    }));
  },
});