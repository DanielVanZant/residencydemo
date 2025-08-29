import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(request) {
    console.log('API: Save weekly update');
    try {
        const updateData = await request.json();
        console.log('Received update data for save:', updateData);
        
        // Save to Convex using the existing function
        const result = await convex.mutation(api.weekly_updates.saveWeeklyUpdate, updateData);
        console.log('Update saved to Convex:', result);
        
        return Response.json({ 
            success: true, 
            updateId: result 
        });
    } catch (error) {
        console.error('Error saving weekly update:', error);
        return Response.json({ 
            error: 'Failed to save weekly update',
            details: error.message 
        }, { status: 500 });
    }
}