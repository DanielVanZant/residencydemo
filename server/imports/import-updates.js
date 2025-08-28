#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const Database = require('./database');

class UpdateImporter {
    constructor() {
        this.db = new Database();
    }

    /**
     * Import updates from JSON files in the specified directory
     * @param {string} importDir - Directory containing JSON files (one per user)
     */
    async importFromDirectory(importDir) {
        console.log(`Starting import from directory: ${importDir}`);
        
        try {
            const files = await fs.readdir(importDir);
            const jsonFiles = files.filter(file => 
                file.endsWith('.json') && 
                !file.includes('package') && 
                !file.includes('config') &&
                !file.includes('lock')
            );
            
            if (jsonFiles.length === 0) {
                console.log('No JSON files found in directory');
                return;
            }

            console.log(`Found ${jsonFiles.length} JSON files to import`);
            
            for (const filename of jsonFiles) {
                const filePath = path.join(importDir, filename);
                console.log(`\nProcessing: ${filename}`);
                
                try {
                    await this.importUserFile(filePath);
                    console.log(`✅ Successfully imported ${filename}`);
                } catch (error) {
                    console.error(`❌ Error importing ${filename}:`, error.message);
                }
            }
            
            console.log('\n🎉 Import process completed');
            
        } catch (error) {
            console.error('Error reading import directory:', error);
        }
    }

    /**
     * Import a single user's updates from a JSON file
     * @param {string} filePath - Path to the JSON file
     */
    async importUserFile(filePath) {
        const fileContent = await fs.readFile(filePath, 'utf8');
        const userData = JSON.parse(fileContent);
        
        // Validate required fields
        if (!userData.username) {
            throw new Error('Missing required field: username');
        }
        
        if (!userData.updates || !Array.isArray(userData.updates)) {
            throw new Error('Missing or invalid updates array');
        }

        console.log(`Importing ${userData.updates.length} updates for user: ${userData.username}`);

        // Process each update
        for (const update of userData.updates) {
            await this.importSingleUpdate(userData.username, update);
        }
    }

    /**
     * Import a single weekly update
     * @param {string} username - Username
     * @param {Object} update - Update data
     */
    async importSingleUpdate(username, update) {
        // Validate required fields
        if (!update.weekDate) {
            throw new Error('Missing required field: weekDate');
        }
        
        if (!update.bulletPoints) {
            throw new Error('Missing required field: bulletPoints');
        }

        // Convert bullet points to the expected format if needed
        let bulletPointsJson;
        if (typeof update.bulletPoints === 'string') {
            // If it's markdown, convert to checklist format
            bulletPointsJson = JSON.stringify(this.convertMarkdownToChecklist(update.bulletPoints));
        } else if (typeof update.bulletPoints === 'object') {
            // If it's already an object, use as-is
            bulletPointsJson = JSON.stringify(update.bulletPoints);
        } else {
            throw new Error('Invalid bulletPoints format - must be string (markdown) or object');
        }

        // Prepare formatted updates
        const formattedUpdates = {};
        if (update.publishedUpdate) {
            formattedUpdates.published = this.formatUpdate(update.publishedUpdate);
        }
        if (update.internalUpdate) {
            formattedUpdates.internal = this.formatUpdate(update.internalUpdate);
        }

        try {
            await this.db.saveWeeklyUpdate(username, update.weekDate, bulletPointsJson, formattedUpdates);
            console.log(`  ✓ Imported update for week: ${update.weekDate}`);
        } catch (error) {
            if (error.message.includes('UNIQUE constraint failed')) {
                console.log(`  ⚠ Update for week ${update.weekDate} already exists, skipping`);
            } else {
                throw error;
            }
        }
    }

    /**
     * Convert markdown checklist to Editor.js format
     * @param {string} markdown - Markdown checklist
     * @returns {Object} Editor.js checklist format
     */
    convertMarkdownToChecklist(markdown) {
        const lines = markdown.trim().split('\n');
        const items = [];
        const stack = [{ items, level: -1 }];
        
        lines.forEach(line => {
            const match = line.match(/^(\s*)- \[([ x])\] (.+)$/);
            if (match) {
                const [, indent, checked, content] = match;
                const level = Math.floor(indent.length / 2);
                const isChecked = checked === 'x';
                
                // Find the right parent level
                while (stack.length > 1 && stack[stack.length - 1].level >= level) {
                    stack.pop();
                }
                
                const parent = stack[stack.length - 1];
                const item = {
                    content: content.trim(),
                    meta: { checked: isChecked },
                    items: []
                };
                
                parent.items.push(item);
                stack.push({ items: item.items, level });
            }
        });
        
        return {
            style: 'checklist',
            meta: {},
            items: items
        };
    }

    /**
     * Format update content for storage
     * @param {string|Object} update - Update content
     * @returns {Object} Formatted update for database
     */
    formatUpdate(update) {
        if (typeof update === 'string') {
            // Simple text update
            return {
                blocks: [{
                    type: 'paragraph',
                    data: {
                        text: update
                    }
                }]
            };
        } else if (typeof update === 'object' && update.blocks) {
            // Already in Editor.js format
            return update;
        } else {
            // Convert object to paragraph
            return {
                blocks: [{
                    type: 'paragraph',
                    data: {
                        text: JSON.stringify(update)
                    }
                }]
            };
        }
    }

    /**
     * Close database connection
     */
    close() {
        this.db.close();
    }
}

// CLI usage
if (require.main === module) {
    const importDir = process.argv[2];
    
    if (!importDir) {
        console.log('Usage: node import-updates.js <import-directory>');
        console.log('');
        console.log('Example: node import-updates.js ./import-data');
        console.log('');
        console.log('The import directory should contain JSON files (one per user)');
        console.log('See example-import-format.json for the expected format');
        process.exit(1);
    }

    const importer = new UpdateImporter();
    
    importer.importFromDirectory(importDir)
        .then(() => {
            importer.close();
        })
        .catch((error) => {
            console.error('Import failed:', error);
            importer.close();
            process.exit(1);
        });
}

module.exports = UpdateImporter;