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
        
        // Automatically regenerate user summaries after saving update
        try {
            console.log('Regenerating user summaries for:', updateData.username);
            const summariesResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/api/generate-user-summaries`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username: updateData.username })
            });
            
            if (summariesResponse.ok) {
                console.log('User summaries regenerated successfully');
            } else {
                console.warn('Failed to regenerate user summaries:', summariesResponse.status);
            }
        } catch (summaryError) {
            console.warn('Error regenerating user summaries (non-blocking):', summaryError.message);
        }
        
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