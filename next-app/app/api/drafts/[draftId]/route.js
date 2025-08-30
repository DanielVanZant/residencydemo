import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function GET(request, { params }) {
    console.log('API: Get draft weekly update');
    try {
        const { draftId } = await params;
        console.log(`Getting draft: ${draftId}`);
        
        const result = await convex.query(api.draft_updates.getDraft, { draftId });
        console.log('Draft retrieved:', result);
        
        if (!result) {
            return Response.json({ 
                error: 'Draft not found' 
            }, { status: 404 });
        }
        
        return Response.json(result);
    } catch (error) {
        console.error('Error retrieving draft:', error);
        return Response.json({ 
            error: 'Failed to retrieve draft',
            details: error.message 
        }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    console.log('API: Delete draft weekly update');
    try {
        const { draftId } = await params;
        console.log(`Deleting draft: ${draftId}`);
        
        const result = await convex.mutation(api.draft_updates.deleteDraft, { draftId });
        console.log('Draft deleted:', result);
        
        return Response.json(result);
    } catch (error) {
        console.error('Error deleting draft:', error);
        return Response.json({ 
            error: 'Failed to delete draft',
            details: error.message 
        }, { status: 500 });
    }
}