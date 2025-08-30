import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function GET(request, { params }) {
    try {
        const { username } = await params;
        const url = new URL(request.url);
        const viewer = url.searchParams.get('viewer');
        
        console.log(`API: Viewer ${viewer} getting public updates for user: ${username}`);
        
        const updates = await convex.query(api.weekly_updates.getUserUpdates, { username });
        console.log(`Found ${updates?.length || 0} updates for ${username}`);
        
        // Filter out private content - only keep published updates
        const publicUpdates = updates?.map(update => ({
            ...update,
            formattedUpdates: {
                // Only include published updates, remove internal notes
                published: update.formattedUpdates?.published || null
            }
        })) || [];
        
        return Response.json({ 
            updates: publicUpdates
        });
    } catch (error) {
        console.error(`Error fetching viewer updates for ${params.username}:`, error);
        return Response.json({ 
            error: 'Failed to fetch user updates',
            details: error.message 
        }, { status: 500 });
    }
}