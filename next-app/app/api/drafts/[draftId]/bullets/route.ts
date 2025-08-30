import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/convex/_generated/api';
import { fetchMutation } from 'convex/nextjs';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  try {
    const { draftId } = await params;
    const { extractedBullets } = await request.json();
    
    console.log('Saving bullets for draft:', draftId);
    console.log('Bullets data type:', typeof extractedBullets);
    console.log('Bullets data size (approx):', JSON.stringify(extractedBullets).length, 'characters');
    
    // Save the bullets to the draft - extractedBullets is already an object, just stringify it once
    await fetchMutation(api.draft_updates.updateDraftBullets, {
      draftId,
      extractedBullets: typeof extractedBullets === 'string' ? extractedBullets : JSON.stringify(extractedBullets),
    });
    
    return NextResponse.json({ 
      message: 'Bullets saved successfully',
      draftId 
    });
    
  } catch (error) {
    console.error('Error saving bullets to draft:', error);
    return NextResponse.json(
      { error: 'Failed to save bullets to draft' }, 
      { status: 500 }
    );
  }
}