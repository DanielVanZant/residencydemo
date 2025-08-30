import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/convex/_generated/api';
import { fetchMutation } from 'convex/nextjs';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  try {
    const { draftId } = await params;
    const { formattedUpdates } = await request.json();
    
    console.log('Saving formatted updates for draft:', draftId);
    console.log('Updates data type:', typeof formattedUpdates);
    console.log('Updates data size (approx):', JSON.stringify(formattedUpdates).length, 'characters');
    
    // Save the formatted updates to the draft
    await fetchMutation(api.draft_updates.updateDraftFormattedUpdates, {
      draftId,
      formattedUpdates: typeof formattedUpdates === 'string' ? formattedUpdates : JSON.stringify(formattedUpdates),
    });
    
    return NextResponse.json({ 
      message: 'Formatted updates saved successfully',
      draftId 
    });
    
  } catch (error) {
    console.error('Error saving formatted updates to draft:', error);
    return NextResponse.json(
      { error: 'Failed to save formatted updates to draft' }, 
      { status: 500 }
    );
  }
}