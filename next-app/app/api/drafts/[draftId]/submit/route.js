import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(request, { params }) {
    console.log('API: Submit draft weekly update');
    try {
        const { draftId } = await params;
        console.log(`Submitting draft: ${draftId}`);
        
        const result = await convex.mutation(api.draft_updates.submitDraft, { draftId });
        console.log('Draft submitted:', result);
        
        // Auto-regenerate summaries after submission
        const draft = await convex.query(api.draft_updates.getDraft, { draftId });
        if (draft && draft.username) {
            try {
                const summariesResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/api/generate-user-summaries`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: draft.username })
                });
                
                if (summariesResponse.ok) {
                    console.log('Summaries regenerated after draft submission');
                } else {
                    console.warn('Failed to regenerate summaries after draft submission');
                }
            } catch (summaryError) {
                console.warn('Error regenerating summaries:', summaryError);
            }
        }
        
        return Response.json(result);
    } catch (error) {
        console.error('Error submitting draft:', error);
        return Response.json({ 
            error: 'Failed to submit draft',
            details: error.message 
        }, { status: 500 });
    }
}