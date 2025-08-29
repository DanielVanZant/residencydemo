#!/usr/bin/env node

const { ConvexClient } = require("convex/browser");
const { api } = require("../convex/_generated/api");
const fs = require('fs');
const path = require('path');

// Initialize Convex client with the URL from env
const CONVEX_URL = "https://cool-parakeet-618.convex.cloud";
const client = new ConvexClient(CONVEX_URL);

async function importData() {
  try {
    console.log("Starting data import...");

    // Load exported data
    const usersData = JSON.parse(fs.readFileSync('../server/users_export.json', 'utf-8'));
    const weeklyUpdatesData = JSON.parse(fs.readFileSync('../server/weekly_updates_export.json', 'utf-8'));
    const summariesData = JSON.parse(fs.readFileSync('../server/user_summaries_export.json', 'utf-8'));

    console.log(`Found ${usersData.length} users to import`);
    console.log(`Found ${weeklyUpdatesData.length} weekly updates to import`);
    console.log(`Found ${summariesData.length} summaries to import`);

    // Import users first
    console.log("Importing users...");
    for (const user of usersData) {
      try {
        const result = await client.mutation(api.users.importUser, {
          username: user.username,
          north_star_metric: user.north_star_metric || undefined,
          north_star_description: user.north_star_description || undefined,
          created_at: user.created_at,
        });
        console.log(`✓ Imported user: ${user.username} (${result.existing ? 'existing' : 'new'})`);
      } catch (error) {
        console.error(`✗ Error importing user ${user.username}:`, error);
      }
    }

    // Import weekly updates
    console.log("Importing weekly updates...");
    const userIdMap = new Map();
    
    // Create mapping of SQLite user IDs to usernames
    for (const user of usersData) {
      userIdMap.set(user.id, user.username);
    }

    for (const update of weeklyUpdatesData) {
      const username = userIdMap.get(update.user_id);
      if (username) {
        try {
          const result = await client.mutation(api.weekly_updates.importUpdate, {
            username: username,
            week_date: update.week_date,
            bullet_points_json: update.bullet_points_json,
            north_star_value: update.north_star_value || undefined,
            north_star_note: update.north_star_note || undefined,
            created_at: update.created_at,
            updated_at: update.updated_at,
          });
          console.log(`✓ Imported update for ${username} - ${update.week_date} (${result.existing ? 'existing' : 'new'})`);
        } catch (error) {
          console.error(`✗ Error importing update for ${username}:`, error);
        }
      }
    }

    // Import summaries
    console.log("Importing summaries...");
    for (const summary of summariesData) {
      const username = userIdMap.get(summary.user_id);
      if (username && summary.public_summary) {
        try {
          const result = await client.mutation(api.summaries.importSummary, {
            username: username,
            public_summary: summary.public_summary,
            personal_summary: summary.personal_summary,
            last_updated: summary.last_updated,
            created_at: summary.created_at,
          });
          console.log(`✓ Imported summary for ${username} (${result.existing ? 'existing' : 'new'})`);
        } catch (error) {
          console.error(`✗ Error importing summary for ${username}:`, error);
        }
      }
    }

    console.log("✅ Data import completed!");

  } catch (error) {
    console.error("❌ Import failed:", error);
    process.exit(1);
  }
}

// Run import
importData().then(() => {
  console.log("Import process finished");
  process.exit(0);
}).catch((error) => {
  console.error("Import process failed:", error);
  process.exit(1);
});