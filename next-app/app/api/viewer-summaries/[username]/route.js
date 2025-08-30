import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function GET(request, { params }) {
    let username;
    try {
        const result = await params;
        username = result.username;
        const url = new URL(request.url);
        const viewer = url.searchParams.get('viewer');
        
        console.log(`API: Viewer ${viewer} getting public summaries for user: ${username}`);
        
        const summaries = await convex.query(api.summaries.getUserSummaries, { username });
        
        if (!summaries) {
            return Response.json({ 
                public_summary: null,
                personal_summary: null
            });
        }
        
        // Return only public summary, filter out personal summary
        return Response.json({
            public_summary: summaries.public_summary || null,
            personal_summary: null // Never return personal summary in viewer mode
        });
        
    } catch (error) {
        console.error(`Error fetching viewer summaries for ${username || 'unknown'}:`, error);
        return Response.json({ 
            error: 'Failed to fetch user summaries',
            details: error.message 
        }, { status: 500 });
    }
}