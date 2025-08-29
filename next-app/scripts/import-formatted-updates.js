#!/usr/bin/env node

const { ConvexClient } = require("convex/browser");
const { api } = require("../convex/_generated/api");
const fs = require('fs');

// Initialize Convex client with the URL from env
const CONVEX_URL = "https://cool-parakeet-618.convex.cloud";
const client = new ConvexClient(CONVEX_URL);

async function importFormattedUpdates() {
  try {
    console.log("Starting formatted updates import...");

    // Load exported data
    const formattedUpdatesData = JSON.parse(fs.readFileSync('../server/formatted_updates_export.json', 'utf-8'));
    const weeklyUpdatesData = JSON.parse(fs.readFileSync('../server/weekly_updates_export.json', 'utf-8'));
    const usersData = JSON.parse(fs.readFileSync('../server/users_export.json', 'utf-8'));

    console.log(`Found ${formattedUpdatesData.length} formatted updates to import`);

    // Create mapping of SQLite weekly_update IDs to user/date
    const updateMap = new Map();
    const userIdMap = new Map();
    
    // Map user IDs to usernames
    for (const user of usersData) {
      userIdMap.set(user.id, user.username);
    }
    
    // Map weekly update IDs to user/date combinations
    for (const update of weeklyUpdatesData) {
      const username = userIdMap.get(update.user_id);
      if (username) {
        updateMap.set(update.id, {
          username: username,
          week_date: update.week_date
        });
      }
    }

    // Import formatted updates by matching them to their weekly updates
    let successCount = 0;
    let skipCount = 0;
    
    for (const formatted of formattedUpdatesData) {
      const updateInfo = updateMap.get(formatted.weekly_update_id);
      
      if (!updateInfo) {
        console.log(`⚠ Skipping formatted update ${formatted.id} - no matching weekly update`);
        skipCount++;
        continue;
      }

      try {
        // Get the weekly update from Convex
        const existingUpdate = await client.query(api.weekly_updates.getWeeklyUpdate, {
          username: updateInfo.username,
          weekDate: updateInfo.week_date
        });

        if (!existingUpdate) {
          console.log(`⚠ Skipping - no Convex update for ${updateInfo.username} on ${updateInfo.week_date}`);
          skipCount++;
          continue;
        }

        // Prepare formatted updates object
        const currentFormatted = existingUpdate.formattedUpdates || {};
        
        // Parse the content_json and add to the formatted updates
        try {
          const content = JSON.parse(formatted.content_json);
          currentFormatted[formatted.privacy_level] = content;
        } catch (e) {
          console.error(`Failed to parse content for ${formatted.id}:`, e);
          continue;
        }

        // Update the weekly update with the formatted content
        await client.mutation(api.weekly_updates.saveWeeklyUpdate, {
          username: updateInfo.username,
          weekDate: updateInfo.week_date,
          bulletPointsJson: existingUpdate.bulletPoints ? JSON.stringify(existingUpdate.bulletPoints) : "{}",
          formattedUpdates: currentFormatted,
          northStarValue: existingUpdate.northStarValue,
          northStarNote: existingUpdate.northStarNote
        });

        successCount++;
        console.log(`✓ Imported ${formatted.privacy_level} update for ${updateInfo.username} - ${updateInfo.week_date}`);
        
      } catch (error) {
        console.error(`✗ Error importing formatted update ${formatted.id}:`, error.message);
      }
    }

    console.log(`\n✅ Import completed!`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Skipped: ${skipCount}`);
    console.log(`   Total: ${formattedUpdatesData.length}`);

  } catch (error) {
    console.error("❌ Import failed:", error);
    process.exit(1);
  }
}

// Run import
importFormattedUpdates().then(() => {
  console.log("Import process finished");
  process.exit(0);
}).catch((error) => {
  console.error("Import process failed:", error);
  process.exit(1);
});