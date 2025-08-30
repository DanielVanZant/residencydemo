import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table for user management
  users: defineTable({
    username: v.string(),
    north_star_metric: v.optional(v.string()),
    north_star_description: v.optional(v.string()),
    created_at: v.string(), // ISO date string
  })
    .index("by_username", ["username"]),

  // Main weekly updates table
  weekly_updates: defineTable({
    user_id: v.id("users"),
    week_date: v.string(), // Date in YYYY-MM-DD format
    bullet_points_json: v.string(), // JSON string of bullet points
    north_star_value: v.optional(v.string()),
    north_star_note: v.optional(v.string()),
    created_at: v.string(), // ISO date string
    updated_at: v.string(), // ISO date string
  })
    .index("by_user_id", ["user_id"])
    .index("by_user_and_date", ["user_id", "week_date"]),

  // Formatted updates for different privacy levels
  formatted_updates: defineTable({
    weekly_update_id: v.id("weekly_updates"),
    privacy_level: v.union(
      v.literal("private"),
      v.literal("residency"), 
      v.literal("public"),
      v.literal("published"),
      v.literal("internal")
    ),
    content_json: v.string(), // JSON string of formatted content
    created_at: v.string(), // ISO date string
  })
    .index("by_weekly_update", ["weekly_update_id"])
    .index("by_weekly_update_and_privacy", ["weekly_update_id", "privacy_level"]),

  // Draft weekly updates - temporary storage before final submission
  draft_weekly_updates: defineTable({
    draft_id: v.string(), // Unique ID for the draft
    user_id: v.id("users"),
    username: v.string(), // Denormalized for easier lookups
    week_date: v.string(), // Date in YYYY-MM-DD format
    // Question responses
    question_responses: v.string(), // JSON string of all question responses
    // Generated dynamic questions
    dynamic_question_4: v.optional(v.string()),
    dynamic_question_5: v.optional(v.string()),
    // Generated bullets and formatted updates
    extracted_bullets: v.optional(v.string()), // JSON string of EditorJS bullets data
    formatted_updates: v.optional(v.string()), // JSON string of formatted content
    // North star data
    north_star_value: v.optional(v.string()),
    north_star_note: v.optional(v.string()),
    // Status tracking
    stage: v.union(v.literal("questions"), v.literal("editing")), // Current stage
    is_submitted: v.boolean(), // Whether this draft has been submitted
    created_at: v.string(), // ISO date string
    updated_at: v.string(), // ISO date string
  })
    .index("by_draft_id", ["draft_id"])
    .index("by_user_id", ["user_id"])
    .index("by_username", ["username"])
    .index("by_user_and_date", ["user_id", "week_date"]),

  // User summaries table for comprehensive overviews
  user_summaries: defineTable({
    user_id: v.id("users"),
    public_summary: v.string(),
    personal_summary: v.string(),
    last_updated: v.string(), // ISO date string
    created_at: v.string(), // ISO date string
  })
    .index("by_user_id", ["user_id"]),
});