import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function GET(request, { params }) {
    try {
        const { username } = await params;
        console.log(`API: Getting summaries for user: ${username}`);
        
        const summaries = await convex.query(api.summaries.getUserSummaries, { username });
        console.log(`Found summaries for ${username}:`, !!summaries);
        
        return Response.json(summaries || {});
    } catch (error) {
        console.error(`Error fetching summaries for ${params.username}:`, error);
        return Response.json({ 
            error: 'Failed to fetch user summaries',
            details: error.message 
        }, { status: 500 });
    }
}