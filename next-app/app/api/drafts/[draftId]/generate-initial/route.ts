import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/convex/_generated/api';
import { fetchMutation, fetchQuery } from 'convex/nextjs';
import AnthropicClient from '@/app/lib/anthropic-client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  try {
    const { draftId } = await params;
    
    console.log('API: Generate initial bullets and formatted updates for draft:', draftId);
    
    // Get the draft data
    const draft = await fetchQuery(api.draft_updates.getDraft, { draftId });
    
    if (!draft) {
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      );
    }
    
    console.log('Draft found, generating initial content for:', draft.username);
    
    // Parse question responses
    const questionResponses = draft.questionResponses || {};
    
    // Prepare form data for bullet extraction (matching the format expected by the API)
    const formData = {
      accomplishments: questionResponses.accomplishments || '',
      'challenges-priorities': questionResponses['challenges-priorities'] || '',
      'dynamic-followup-detail': questionResponses['dynamic-followup-detail'] || '',
      'dynamic-followup-previous': questionResponses['dynamic-followup-previous'] || '',
    };
    
    const anthropicClient = new AnthropicClient();
    
    try {
      // Step 1: Extract bullets from the question responses
      console.log('Extracting bullets from question responses...');
      const bulletResponse = await anthropicClient.extractBullets(formData);
      
      if (!bulletResponse?.ok) {
        throw new Error(`Failed to extract bullets: ${bulletResponse?.status}`);
      }
      
      const bulletResult = await bulletResponse?.json();
      const bulletContent = bulletResult.content[0].text;
      
      // Parse the markdown into Editor.js format
      const editorBlock: any = {
        type: 'list',
        data: {
          style: 'checklist',
          items: []
        }
      };
      
      // Parse markdown checklist into items
      const lines = bulletContent.split('\n');
      let currentItems = editorBlock.data.items;
      let indentStack = [editorBlock.data.items];
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('- [')) {
          const checked = trimmed.startsWith('- [x]');
          const content = trimmed.substring(checked ? 6 : 4).trim();
          const indentLevel = Math.floor((line.length - trimmed.length) / 2);
          
          const item: any = {
            content: content,
            checked: checked,
            items: []
          };
          
          // Handle indentation
          while (indentStack.length > indentLevel + 1) {
            indentStack.pop();
          }
          
          if (indentLevel > 0 && indentStack[indentLevel - 1]) {
            const parent = indentStack[indentLevel - 1];
            if (parent.length > 0) {
              const lastItem: any = parent[parent.length - 1];
              if (!lastItem.items) lastItem.items = [];
              lastItem.items.push(item);
              indentStack[indentLevel] = lastItem.items;
            }
          } else {
            editorBlock.data.items.push(item);
            indentStack[0] = editorBlock.data.items;
          }
        }
      }
      
      // Save bullets to draft
      console.log('Saving extracted bullets to draft...');
      await fetchMutation(api.draft_updates.updateDraftBullets, {
        draftId,
        extractedBullets: JSON.stringify(editorBlock)
      });
      
      // Step 2: Generate formatted updates from bullets
      console.log('Generating formatted updates from bullets...');
      
      // Filter checked and unchecked items for different privacy levels
      const checkedItems: any[] = [];
      const uncheckedItems: any[] = [];
      
      const categorizeItems = (items: any[]) => {
        for (const item of items) {
          if (item.checked) {
            checkedItems.push(item);
          } else {
            uncheckedItems.push(item);
          }
          if (item.items && item.items.length > 0) {
            categorizeItems(item.items);
          }
        }
      };
      
      categorizeItems(editorBlock.data.items);
      
      // Generate published update from checked items
      let publishedUpdate = null;
      if (checkedItems.length > 0) {
        const publishedBulletText = checkedItems.map((item: any) => `- ${item.content}`).join('\n');
        const publishedResponse = await anthropicClient.generateFormattedUpdate(publishedBulletText, 'published');
        
        if (publishedResponse?.ok) {
          const publishedResult = await publishedResponse?.json();
          const publishedContent = publishedResult.content[0].text;
          
          // Try to parse as JSON - store exactly like the original
          try {
            const parsed = JSON.parse(publishedContent);
            publishedUpdate = parsed;  // Direct assignment like the original!
          } catch {
            publishedUpdate = publishedContent;
          }
        }
      }
      
      // Generate internal update from all items
      let internalUpdate = null;
      const allBulletText = editorBlock.data.items.map((item: any) => `- ${item.content}`).join('\n');
      const internalResponse = await anthropicClient.generateFormattedUpdate(allBulletText, 'internal');
      
      if (internalResponse?.ok) {
        const internalResult = await internalResponse?.json();
        const internalContent = internalResult.content[0].text;
        
        // Try to parse as JSON - store exactly like the original
        try {
          const parsed = JSON.parse(internalContent);
          internalUpdate = parsed;  // Direct assignment like the original!
        } catch {
          internalUpdate = internalContent;
        }
      }
      
      // Save formatted updates if we have them
      if (publishedUpdate || internalUpdate) {
        const formattedUpdates: any = {};
        if (publishedUpdate) formattedUpdates.published = publishedUpdate;
        if (internalUpdate) formattedUpdates.internal = internalUpdate;
        
        console.log('Saving formatted updates to draft...');
        await fetchMutation(api.draft_updates.updateDraftFormattedUpdates, {
          draftId,
          formattedUpdates: JSON.stringify(formattedUpdates)
        });
      }
      
      return NextResponse.json({
        success: true,
        message: 'Initial content generated successfully',
        bullets: editorBlock,
        formattedUpdates: {
          published: publishedUpdate,
          internal: internalUpdate
        }
      });
      
    } catch (error) {
      console.error('Error generating initial content:', error);
      // Don't fail the whole draft creation, just log the error
      return NextResponse.json({
        success: false,
        message: 'Failed to generate initial content, but draft was created',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
  } catch (error) {
    console.error('Error in generate-initial route:', error);
    return NextResponse.json(
      { error: 'Failed to generate initial content' },
      { status: 500 }
    );
  }
}