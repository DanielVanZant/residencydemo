import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(request) {
    console.log('API: Save draft weekly update');
    try {
        const body = await request.json();
        console.log('Save draft request body:', body);
        
        const result = await convex.mutation(api.draft_updates.saveDraft, body);
        console.log('Draft saved:', result);
        
        return Response.json(result);
    } catch (error) {
        console.error('Error saving draft:', error);
        return Response.json({ 
            error: 'Failed to save draft',
            details: error.message 
        }, { status: 500 });
    }
}