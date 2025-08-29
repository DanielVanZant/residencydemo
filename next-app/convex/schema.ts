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