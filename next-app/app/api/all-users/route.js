import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function GET(request) {
    try {
        console.log('API: Getting all users with their latest updates');
        
        const allUsers = await convex.query(api.weekly_updates.getAllUsersWithLatestUpdates);
        console.log(`Found ${allUsers?.length || 0} users`);
        
        // Filter out sensitive information, keeping only public data
        const publicUsers = allUsers?.map(user => ({
            username: user.username,
            totalUpdates: user.totalUpdates,
            latestUpdate: user.latestUpdate ? {
                weekDate: user.latestUpdate.weekDate,
                northStarValue: user.latestUpdate.northStarValue,
                northStarMetric: user.latestUpdate.northStarMetric,
                formattedUpdates: {
                    // Only include published updates, not internal notes
                    published: user.latestUpdate.formattedUpdates?.published
                }
            } : null
        })) || [];
        
        return Response.json({ 
            users: publicUsers
        });
    } catch (error) {
        console.error('Error fetching all users:', error);
        return Response.json({ 
            error: 'Failed to fetch users',
            details: error.message 
        }, { status: 500 });
    }
}