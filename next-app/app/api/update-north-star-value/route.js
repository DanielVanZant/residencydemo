import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(request) {
    console.log('API: Update north star value');
    try {
        const { username, weekDate, northStarValue, northStarNote } = await request.json();
        console.log(`Updating north star value for ${username} on ${weekDate} to ${northStarValue}`);
        
        // Get user first
        const users = await convex.query(api.users.getAllUsers);
        const user = users.find(u => u.username === username);
        if (!user) {
            return Response.json({ 
                error: `User ${username} not found` 
            }, { status: 404 });
        }
        
        // Find the specific update to modify
        const updates = await convex.query(api.weekly_updates.getUserUpdates, { username });
        const targetUpdate = updates.find(u => u.weekDate === weekDate);
        
        if (!targetUpdate) {
            return Response.json({ 
                error: `No update found for ${username} on ${weekDate}` 
            }, { status: 404 });
        }
        
        // Use the existing save function to update the north star values
        const updateData = {
            username,
            weekDate,
            bulletPointsJson: JSON.stringify(targetUpdate.bulletPoints),
            formattedUpdates: targetUpdate.formattedUpdates,
            northStarValue: northStarValue,
            northStarNote: northStarNote || targetUpdate.northStarNote
        };
        
        const result = await convex.mutation(api.weekly_updates.saveWeeklyUpdate, updateData);
        console.log('North star value updated:', result);
        
        return Response.json({ 
            success: true, 
            message: `Updated north star value to ${northStarValue} for ${username} on ${weekDate}`,
            updateId: result
        });
    } catch (error) {
        console.error('Error updating north star value:', error);
        return Response.json({ 
            error: 'Failed to update north star value',
            details: error.message 
        }, { status: 500 });
    }
}