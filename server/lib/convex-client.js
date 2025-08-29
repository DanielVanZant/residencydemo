const { ConvexClient } = require("convex/browser");

/**
 * Convex client for Express server
 * This replaces the SQLite database with Convex cloud database
 */
class ConvexDatabase {
    constructor() {
        // Use the same Convex URL from the Next.js app
        this.convexUrl = "https://cool-parakeet-618.convex.cloud";
        this.client = new ConvexClient(this.convexUrl);
        console.log('Connected to Convex database');
    }

    // Get or create user by username
    async getOrCreateUser(username) {
        try {
            return await this.client.mutation("users:getOrCreateUser", { username });
        } catch (error) {
            console.error('Error in getOrCreateUser:', error);
            throw error;
        }
    }

    // Save weekly update with formatted versions
    async saveWeeklyUpdate(username, weekDate, bulletPointsJson, formattedUpdates, northStarValue, northStarNote) {
        try {
            return await this.client.mutation("weekly_updates:saveWeeklyUpdate", {
                username,
                weekDate,
                bulletPointsJson,
                formattedUpdates,
                northStarValue,
                northStarNote,
            });
        } catch (error) {
            console.error('Error in saveWeeklyUpdate:', error);
            throw error;
        }
    }

    // Get all weekly updates for a user
    async getUserUpdates(username) {
        try {
            return await this.client.query("weekly_updates:getUserUpdates", { username });
        } catch (error) {
            console.error('Error in getUserUpdates:', error);
            throw error;
        }
    }

    // Get specific weekly update
    async getWeeklyUpdate(username, weekDate) {
        try {
            return await this.client.query("weekly_updates:getWeeklyUpdate", { username, weekDate });
        } catch (error) {
            console.error('Error in getWeeklyUpdate:', error);
            throw error;
        }
    }

    // Get all users for dropdown
    async getAllUsers() {
        try {
            const users = await this.client.query("users:getAllUsers", {});
            return users;
        } catch (error) {
            console.error('Error in getAllUsers:', error);
            throw error;
        }
    }

    // Update user's north star metric
    async updateUserNorthStar(username, metric, description) {
        try {
            return await this.client.mutation("users:updateUserNorthStar", {
                username,
                metric,
                description,
            });
        } catch (error) {
            console.error('Error in updateUserNorthStar:', error);
            throw error;
        }
    }

    // Get user's most recent north star value
    async getMostRecentNorthStarValue(username) {
        try {
            const result = await this.client.query("users:getUserNorthStar", { username });
            return {
                north_star_value: result.mostRecentValue,
                north_star_note: result.mostRecentNote,
                week_date: result.mostRecentDate,
            };
        } catch (error) {
            console.error('Error in getMostRecentNorthStarValue:', error);
            throw error;
        }
    }

    // Save or update user summaries
    async saveUserSummaries(username, publicSummary, personalSummary) {
        try {
            return await this.client.mutation("summaries:saveUserSummaries", {
                username,
                publicSummary,
                personalSummary,
            });
        } catch (error) {
            console.error('Error in saveUserSummaries:', error);
            throw error;
        }
    }

    // Get user summaries
    async getUserSummaries(username) {
        try {
            return await this.client.query("summaries:getUserSummaries", { username });
        } catch (error) {
            console.error('Error in getUserSummaries:', error);
            throw error;
        }
    }

    // Get all users with summaries for homepage
    async getAllUserSummaries() {
        try {
            return await this.client.query("summaries:getAllUserSummaries", {});
        } catch (error) {
            console.error('Error in getAllUserSummaries:', error);
            throw error;
        }
    }

    // Close connection (no-op for Convex)
    close() {
        console.log('Convex database connection closed');
    }
}

module.exports = ConvexDatabase;