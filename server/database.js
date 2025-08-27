const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        this.dbPath = path.join(__dirname, 'weekly_updates.db');
        this.db = null;
        this.init();
    }

    init() {
        this.db = new sqlite3.Database(this.dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err);
            } else {
                console.log('Connected to SQLite database');
                this.createTables();
            }
        });
    }

    createTables() {
        // Users table for simple user management
        this.db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Main weekly updates table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS weekly_updates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                week_date DATE NOT NULL,
                bullet_points_json TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                UNIQUE(user_id, week_date)
            )
        `);

        // Formatted updates for each privacy level
        this.db.run(`
            CREATE TABLE IF NOT EXISTS formatted_updates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                weekly_update_id INTEGER,
                privacy_level TEXT NOT NULL CHECK(privacy_level IN ('private', 'residency', 'public', 'published', 'internal')),
                content_json TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (weekly_update_id) REFERENCES weekly_updates (id) ON DELETE CASCADE,
                UNIQUE(weekly_update_id, privacy_level)
            )
        `);

        console.log('Database tables created/verified');
    }

    // Get or create user by username
    async getOrCreateUser(username) {
        return new Promise((resolve, reject) => {
            // First try to find existing user
            this.db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                if (row) {
                    resolve(row);
                } else {
                    // Create new user
                    this.db.run('INSERT INTO users (username) VALUES (?)', [username], function(err) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve({ id: this.lastID, username: username });
                    });
                }
            });
        });
    }

    // Save weekly update with formatted versions
    async saveWeeklyUpdate(username, weekDate, bulletPointsJson, formattedUpdates) {
        try {
            const user = await this.getOrCreateUser(username);
            const db = this.db; // Store reference to avoid context issues
            
            return new Promise((resolve, reject) => {
                db.serialize(() => {
                    db.run('BEGIN TRANSACTION');
                    
                    // Insert or update weekly update
                    db.run(`
                        INSERT OR REPLACE INTO weekly_updates (user_id, week_date, bullet_points_json, updated_at)
                        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                    `, [user.id, weekDate, bulletPointsJson], function(err) {
                        if (err) {
                            db.run('ROLLBACK');
                            reject(err);
                            return;
                        }
                        
                        const weeklyUpdateId = this.lastID;
                        
                        // Delete existing formatted updates for this weekly update
                        db.run('DELETE FROM formatted_updates WHERE weekly_update_id = ?', [weeklyUpdateId], (err) => {
                            if (err) {
                                db.run('ROLLBACK');
                                reject(err);
                                return;
                            }
                            
                            // Insert new formatted updates
                            const insertPromises = Object.keys(formattedUpdates).map(privacyLevel => {
                                return new Promise((resolveInsert, rejectInsert) => {
                                    db.run(`
                                        INSERT INTO formatted_updates (weekly_update_id, privacy_level, content_json)
                                        VALUES (?, ?, ?)
                                    `, [weeklyUpdateId, privacyLevel, JSON.stringify(formattedUpdates[privacyLevel])], (err) => {
                                        if (err) rejectInsert(err);
                                        else resolveInsert();
                                    });
                                });
                            });
                            
                            Promise.all(insertPromises)
                                .then(() => {
                                    db.run('COMMIT');
                                    resolve({ weeklyUpdateId, message: 'Update saved successfully' });
                                })
                                .catch((err) => {
                                    db.run('ROLLBACK');
                                    reject(err);
                                });
                        });
                    });
                });
            });
        } catch (error) {
            throw error;
        }
    }

    // Get all weekly updates for a user
    async getUserUpdates(username) {
        const user = await this.getOrCreateUser(username);
        
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT wu.*, 
                       GROUP_CONCAT(fu.privacy_level || ':' || fu.content_json, '|||') as formatted_updates
                FROM weekly_updates wu
                LEFT JOIN formatted_updates fu ON wu.id = fu.weekly_update_id
                WHERE wu.user_id = ?
                GROUP BY wu.id
                ORDER BY wu.week_date DESC
            `, [user.id], (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                // Parse the formatted updates back into objects
                const updates = rows.map(row => ({
                    id: row.id,
                    weekDate: row.week_date,
                    bulletPoints: JSON.parse(row.bullet_points_json),
                    formattedUpdates: this.parseFormattedUpdates(row.formatted_updates),
                    createdAt: row.created_at,
                    updatedAt: row.updated_at
                }));
                
                resolve(updates);
            });
        });
    }

    // Helper to parse formatted updates string back to object
    parseFormattedUpdates(formattedUpdatesString) {
        if (!formattedUpdatesString) return {};
        
        const updates = {};
        const parts = formattedUpdatesString.split('|||');
        
        parts.forEach(part => {
            const [privacyLevel, contentJson] = part.split(':', 2);
            if (privacyLevel && contentJson) {
                try {
                    updates[privacyLevel] = JSON.parse(contentJson);
                } catch (e) {
                    console.error('Error parsing formatted update:', e);
                }
            }
        });
        
        return updates;
    }

    // Get specific weekly update
    async getWeeklyUpdate(username, weekDate) {
        const user = await this.getOrCreateUser(username);
        
        return new Promise((resolve, reject) => {
            this.db.get(`
                SELECT wu.*, 
                       GROUP_CONCAT(fu.privacy_level || ':' || fu.content_json, '|||') as formatted_updates
                FROM weekly_updates wu
                LEFT JOIN formatted_updates fu ON wu.id = fu.weekly_update_id
                WHERE wu.user_id = ? AND wu.week_date = ?
                GROUP BY wu.id
            `, [user.id, weekDate], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                if (!row) {
                    resolve(null);
                    return;
                }
                
                resolve({
                    id: row.id,
                    weekDate: row.week_date,
                    bulletPoints: JSON.parse(row.bullet_points_json),
                    formattedUpdates: this.parseFormattedUpdates(row.formatted_updates),
                    createdAt: row.created_at,
                    updatedAt: row.updated_at
                });
            });
        });
    }

    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err);
                } else {
                    console.log('Database connection closed');
                }
            });
        }
    }
}

module.exports = Database;