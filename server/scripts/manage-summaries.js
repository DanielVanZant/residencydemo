#!/usr/bin/env node

// Unified summary management script combining regenerate, generate-all, and trigger functionality

require('dotenv').config({ path: '../../.env' });
const AnthropicClient = require('../lib/anthropic-client');
const Database = require('../database');
const fetch = require('node-fetch');

// Target users for operations
const TARGET_USERS = ['ada-lovelace', 'leonardo-davinci', 'marie-curie', 'steve-wozniak'];

class SummaryManager {
    constructor() {
        this.db = new Database();
    }

    // Generate summaries directly using the database (most reliable method)
    async generateDirect(users = null) {
        const targetUsers = users || TARGET_USERS;
        console.log('🔄 Generating summaries directly via database...\n');
        
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            throw new Error('ANTHROPIC_API_KEY not found in environment variables');
        }
        
        const anthropicClient = new AnthropicClient(apiKey);
        
        for (const username of targetUsers) {
            console.log(`Processing ${username}...`);
            
            // Get all updates for this user
            const user = await this.db.getOrCreateUser(username);
            const updates = await this.db.getUserUpdates(username);
            
            if (updates.length === 0) {
                console.log(`  No updates found for ${username}, skipping`);
                continue;
            }
            
            console.log(`  Found ${updates.length} updates`);
            
            // Prepare data for summary generation
            const userData = {
                username: user.username,
                northStarMetric: user.north_star_metric,
                updates: updates
            };
            
            // Generate public summary first
            console.log('  Generating public summary...');
            const publicResponse = await anthropicClient.generateUserSummary(userData, 'public');
            
            if (!publicResponse.ok) {
                const error = await publicResponse.json().catch(() => ({}));
                console.error(`  Failed to generate public summary: ${error?.error?.message || 'Unknown error'}`);
                continue;
            }
            
            const publicData = await publicResponse.json();
            const publicSummary = publicData.content[0].text;
            console.log('  Public summary generated successfully');
            
            // Generate personal summary (additional content only)
            console.log('  Generating personal summary...');
            const personalResponse = await anthropicClient.generateUserSummary(userData, 'personal', publicSummary);
            
            if (!personalResponse.ok) {
                const error = await personalResponse.json().catch(() => ({}));
                console.error(`  Failed to generate personal summary: ${error?.error?.message || 'Unknown error'}`);
                continue;
            }
            
            const personalData = await personalResponse.json();
            const personalSummary = personalData.content[0].text;
            console.log('  Personal summary generated successfully');
            
            // Save summaries to database
            await this.db.saveUserSummaries(user.username, publicSummary, personalSummary);
            console.log(`  ✅ Summaries saved for ${username}\n`);
        }
        
        console.log('🎉 All summaries generated successfully!');
    }

    // Generate summaries via API endpoint (requires running server)
    async generateViaAPI(users = null, serverUrl = 'http://localhost:3000') {
        const targetUsers = users || TARGET_USERS;
        console.log('🚀 Triggering summary generation via API...\n');
        
        for (const username of targetUsers) {
            try {
                console.log(`🔄 Generating summaries for ${username}...`);
                
                const response = await fetch(`${serverUrl}/api/generate-user-summaries`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username: username })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log(`✅ Successfully generated summaries for ${username}`);
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    console.error(`❌ Failed to generate summaries for ${username}: ${errorData.error || response.statusText}`);
                }
            } catch (error) {
                console.error(`❌ Error generating summaries for ${username}:`, error.message);
            }
        }
        
        console.log('\n🎉 API summary generation complete!');
    }

    // Show usage information
    showUsage() {
        console.log(`
Summary Management Tool

Usage: node scripts/manage-summaries.js [command] [options]

Commands:
  direct     Generate summaries directly via database (default)
  api        Generate summaries via API endpoint (server must be running)
  help       Show this help message

Options:
  --users    Comma-separated list of usernames (default: all users)

Examples:
  node scripts/manage-summaries.js
  node scripts/manage-summaries.js direct
  node scripts/manage-summaries.js api
  node scripts/manage-summaries.js direct --users ada-lovelace,marie-curie
        `);
    }

    close() {
        this.db.close();
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'direct';
    
    // Parse users option
    let users = null;
    const usersIndex = args.indexOf('--users');
    if (usersIndex !== -1 && args[usersIndex + 1]) {
        users = args[usersIndex + 1].split(',').map(u => u.trim());
    }

    const manager = new SummaryManager();
    
    try {
        switch (command) {
            case 'direct':
                await manager.generateDirect(users);
                break;
            case 'api':
                await manager.generateViaAPI(users);
                break;
            case 'help':
                manager.showUsage();
                break;
            default:
                console.error(`Unknown command: ${command}`);
                manager.showUsage();
                process.exit(1);
        }
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    } finally {
        manager.close();
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = SummaryManager;