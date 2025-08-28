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
        // Add north star columns to existing tables if they don't exist
        this.db.run(`ALTER TABLE users ADD COLUMN north_star_metric TEXT`, (err) => {
            if (err && !err.message.includes('duplicate column')) {
                console.error('Error adding north_star_metric column:', err);
            }
        });
        
        this.db.run(`ALTER TABLE users ADD COLUMN north_star_description TEXT`, (err) => {
            if (err && !err.message.includes('duplicate column')) {
                console.error('Error adding north_star_description column:', err);
            }
        });
        
        this.db.run(`ALTER TABLE weekly_updates ADD COLUMN north_star_value TEXT`, (err) => {
            if (err && !err.message.includes('duplicate column')) {
                console.error('Error adding north_star_value column:', err);
            }
        });
        
        this.db.run(`ALTER TABLE weekly_updates ADD COLUMN north_star_note TEXT`, (err) => {
            if (err && !err.message.includes('duplicate column')) {
                console.error('Error adding north_star_note column:', err);
            }
        });

        // Users table for simple user management
        this.db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                north_star_metric TEXT,
                north_star_description TEXT,
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
                north_star_value TEXT,
                north_star_note TEXT,
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

        // User summaries table for comprehensive overviews
        this.db.run(`
            CREATE TABLE IF NOT EXISTS user_summaries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                public_summary TEXT NOT NULL,
                personal_summary TEXT NOT NULL,
                last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                UNIQUE(user_id)
            )
        `);

        console.log('Database tables created/verified');
        
        // Initialize example north star metrics
        setTimeout(() => {
            this.initializeExampleNorthStars().catch(err => {
                console.error('Error initializing north star metrics:', err);
            });
        }, 100);
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
    async saveWeeklyUpdate(username, weekDate, bulletPointsJson, formattedUpdates, northStarValue, northStarNote) {
        try {
            const user = await this.getOrCreateUser(username);
            const db = this.db; // Store reference to avoid context issues
            
            return new Promise((resolve, reject) => {
                db.serialize(() => {
                    db.run('BEGIN TRANSACTION');
                    
                    // Insert or update weekly update
                    db.run(`
                        INSERT OR REPLACE INTO weekly_updates (user_id, week_date, bullet_points_json, north_star_value, north_star_note, updated_at)
                        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    `, [user.id, weekDate, bulletPointsJson, northStarValue, northStarNote], function(err) {
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
                       u.north_star_metric,
                       GROUP_CONCAT(fu.privacy_level || '::JSON::' || fu.content_json, '|||SEPARATOR|||') as formatted_updates
                FROM weekly_updates wu
                LEFT JOIN formatted_updates fu ON wu.id = fu.weekly_update_id
                LEFT JOIN users u ON wu.user_id = u.id
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
                    northStarValue: row.north_star_value,
                    northStarNote: row.north_star_note,
                    northStarMetric: row.north_star_metric,
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
        const parts = formattedUpdatesString.split('|||SEPARATOR|||');
        
        parts.forEach(part => {
            const separatorIndex = part.indexOf('::JSON::');
            if (separatorIndex !== -1) {
                const privacyLevel = part.substring(0, separatorIndex);
                const contentJson = part.substring(separatorIndex + 8); // 8 = length of '::JSON::'
                
                if (privacyLevel && contentJson) {
                    try {
                        updates[privacyLevel] = JSON.parse(contentJson);
                    } catch (e) {
                        console.error('Error parsing formatted update:', e, 'Part:', part);
                    }
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
                       GROUP_CONCAT(fu.privacy_level || '::JSON::' || fu.content_json, '|||SEPARATOR|||') as formatted_updates
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

    // Get all users for dropdown
    async getAllUsers() {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT username, north_star_metric, north_star_description FROM users ORDER BY username', [], (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(rows);
            });
        });
    }

    // Update user's north star metric
    async updateUserNorthStar(username, metric, description) {
        return new Promise((resolve, reject) => {
            this.db.run(`
                UPDATE users 
                SET north_star_metric = ?, north_star_description = ? 
                WHERE username = ?
            `, [metric, description, username], function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve({ changes: this.changes });
            });
        });
    }

    // Get user's most recent north star value
    async getMostRecentNorthStarValue(username) {
        const user = await this.getOrCreateUser(username);
        
        return new Promise((resolve, reject) => {
            this.db.get(`
                SELECT north_star_value, north_star_note, week_date
                FROM weekly_updates 
                WHERE user_id = ? AND north_star_value IS NOT NULL
                ORDER BY week_date DESC
                LIMIT 1
            `, [user.id], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(row || { north_star_value: null, north_star_note: null, week_date: null });
            });
        });
    }

    // Initialize example north star metrics for existing users
    async initializeExampleNorthStars() {
        const exampleMetrics = [
            { username: 'ada-lovelace', metric: 'Algorithms Documented', description: 'Number of computational algorithms fully documented and proven' },
            { username: 'leonardo-davinci', metric: 'Inventions Prototyped', description: 'Number of mechanical inventions designed and prototyped' },
            { username: 'steve-wozniak', metric: 'Circuit Boards Completed', description: 'Number of working circuit board designs completed and tested' },
            { username: 'marie-curie', metric: 'Radium Yield (mg)', description: 'Milligrams of radium successfully isolated from ore' }
        ];

        for (const { username, metric, description } of exampleMetrics) {
            try {
                // Create user if they don't exist, then update north star
                await this.getOrCreateUser(username);
                await this.updateUserNorthStar(username, metric, description);
                console.log(`Set north star for ${username}: ${metric}`);
            } catch (error) {
                console.error(`Error setting north star for ${username}:`, error);
            }
        }
    }

    // Save or update user summaries
    async saveUserSummaries(username, publicSummary, personalSummary) {
        const user = await this.getOrCreateUser(username);
        
        return new Promise((resolve, reject) => {
            this.db.run(`
                INSERT OR REPLACE INTO user_summaries (user_id, public_summary, personal_summary, last_updated)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            `, [user.id, publicSummary, personalSummary], function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve({ id: this.lastID || user.id, changes: this.changes });
            });
        });
    }

    // Get user summaries
    async getUserSummaries(username) {
        const user = await this.getOrCreateUser(username);
        
        return new Promise((resolve, reject) => {
            this.db.get(`
                SELECT public_summary, personal_summary, last_updated, created_at
                FROM user_summaries
                WHERE user_id = ?
            `, [user.id], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(row || { public_summary: null, personal_summary: null, last_updated: null, created_at: null });
            });
        });
    }

    // Get all users with summaries for homepage
    async getAllUserSummaries() {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT u.username, u.north_star_metric, u.north_star_description,
                       us.public_summary, us.personal_summary, us.last_updated
                FROM users u
                LEFT JOIN user_summaries us ON u.id = us.user_id
                WHERE us.public_summary IS NOT NULL
                ORDER BY us.last_updated DESC
            `, [], (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(rows);
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