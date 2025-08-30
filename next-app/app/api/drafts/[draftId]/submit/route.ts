import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/convex/_generated/api';
import { fetchMutation } from 'convex/nextjs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  try {
    const { draftId } = await params;
    
    console.log('API: Submit draft as final weekly update');
    console.log('Submitting draft:', draftId);
    
    // Submit the draft using Convex mutation
    const result = await fetchMutation(api.draft_updates.submitDraft, {
      draftId,
    });
    
    console.log('Draft submitted successfully:', result);
    
    return NextResponse.json({ 
      success: true,
      message: 'Draft submitted successfully',
      weeklyUpdateId: result.weeklyUpdateId,
      draftId: result.draftId
    });
    
  } catch (error) {
    console.error('Error submitting draft:', error);
    
    // Handle specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Draft not found')) {
        return NextResponse.json(
          { error: 'Draft not found' }, 
          { status: 404 }
        );
      }
      if (error.message.includes('already submitted')) {
        return NextResponse.json(
          { error: 'Draft has already been submitted' }, 
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to submit draft' }, 
      { status: 500 }
    );
  }
}