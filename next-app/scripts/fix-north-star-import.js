#!/usr/bin/env node

const { ConvexClient } = require("convex/browser");
const { api } = require("../convex/_generated/api");
const fs = require('fs');

// Initialize Convex client with the URL from env
const CONVEX_URL = "https://cool-parakeet-618.convex.cloud";
const client = new ConvexClient(CONVEX_URL);

async function fixNorthStarImport() {
  try {
    console.log("Starting North Star data fix...");

    // Load exported data
    const weeklyUpdatesData = JSON.parse(fs.readFileSync('../server/weekly_updates_export.json', 'utf-8'));
    const usersData = JSON.parse(fs.readFileSync('../server/users_export.json', 'utf-8'));

    console.log(`Found ${weeklyUpdatesData.length} weekly updates to re-import`);

    // Create mapping of SQLite user IDs to usernames
    const userIdMap = new Map();
    for (const user of usersData) {
      userIdMap.set(user.id, user.username);
    }

    let deletedCount = 0;
    let importedCount = 0;

    // Get all users and delete all their weekly updates
    for (const user of usersData) {
      console.log(`\n🗑️ Deleting all updates for ${user.username}...`);
      
      // Get all updates for this user
      const userUpdates = await client.query(api.weekly_updates.getUserUpdates, { username: user.username });
      
      // Delete each update
      for (const update of userUpdates) {
        try {
          await client.mutation(api.weekly_updates.deleteWeeklyUpdate, {
            username: user.username,
            weekDate: update.weekDate
          });
          deletedCount++;
        } catch (error) {
          console.error(`Failed to delete ${user.username} ${update.weekDate}:`, error.message);
        }
      }
      
      console.log(`   Deleted ${userUpdates.length} updates for ${user.username}`);
    }

    console.log(`\n📥 Re-importing ${weeklyUpdatesData.length} weekly updates with North Star data...`);

    // Re-import all weekly updates
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
          
          if (update.north_star_value) {
            console.log(`✓ Imported ${username} - ${update.week_date} (North Star: ${update.north_star_value})`);
          } else {
            console.log(`✓ Imported ${username} - ${update.week_date} (no North Star)`);
          }
          importedCount++;
        } catch (error) {
          console.error(`✗ Error importing ${username} - ${update.week_date}:`, error.message);
        }
      }
    }

    console.log(`\n✅ North Star fix completed!`);
    console.log(`   Deleted: ${deletedCount} updates`);
    console.log(`   Re-imported: ${importedCount} updates`);

  } catch (error) {
    console.error("❌ Fix failed:", error);
    process.exit(1);
  }
}

// Run fix
fixNorthStarImport().then(() => {
  console.log("Fix process finished");
  process.exit(0);
}).catch((error) => {
  console.error("Fix process failed:", error);
  process.exit(1);
});