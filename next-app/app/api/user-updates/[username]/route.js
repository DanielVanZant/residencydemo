import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function GET(request, { params }) {
    try {
        const { username } = params;
        console.log(`API: Getting updates for user: ${username}`);
        
        const updates = await convex.query(api.weekly_updates.getUserUpdates, { username });
        console.log(`Found ${updates?.length || 0} updates for ${username}`);
        
        return Response.json({ 
            updates: updates || []
        });
    } catch (error) {
        console.error(`Error fetching updates for ${params.username}:`, error);
        return Response.json({ 
            error: 'Failed to fetch user updates',
            details: error.message 
        }, { status: 500 });
    }
}