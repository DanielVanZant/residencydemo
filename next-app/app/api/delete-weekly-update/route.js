import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(request) {
    console.log('API: Delete weekly update');
    try {
        const { username, weekDate } = await request.json();
        console.log(`Deleting update for ${username} on ${weekDate}`);
        
        // Delete from Convex using the existing function
        const result = await convex.mutation(api.weekly_updates.deleteWeeklyUpdate, {
            username,
            weekDate
        });
        
        console.log('Delete result:', result);
        
        if (result.deleted) {
            // Automatically regenerate user summaries after deleting update
            try {
                console.log('Regenerating user summaries after deletion for:', username);
                const summariesResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/api/generate-user-summaries`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username })
                });
                
                if (summariesResponse.ok) {
                    console.log('User summaries regenerated successfully after deletion');
                } else {
                    console.warn('Failed to regenerate user summaries after deletion:', summariesResponse.status);
                }
            } catch (summaryError) {
                console.warn('Error regenerating user summaries after deletion (non-blocking):', summaryError.message);
            }
        }
        
        return Response.json({ 
            success: result.deleted, 
            message: result.message 
        });
    } catch (error) {
        console.error('Error deleting weekly update:', error);
        return Response.json({ 
            error: 'Failed to delete weekly update',
            details: error.message 
        }, { status: 500 });
    }
}