import AnthropicClient from '../../lib/anthropic-client.js';
import { convertBulletDataToText } from '../../lib/data-converter.js';

// Configure route for long-running requests
export const runtime = 'nodejs';
export const maxDuration = 120; // 2 minutes timeout
export const dynamic = 'force-dynamic';

export async function POST(request) {
    console.log('API: Generate formatted update');
    try {
        const { bulletData, updateType } = await request.json();
        
        console.log(`Generating ${updateType} formatted update`);
        console.log('Bullet data:', bulletData);
        
        if (!bulletData || !updateType) {
            return Response.json({ 
                error: 'Missing bulletData or updateType' 
            }, { status: 400 });
        }
        
        // Convert bullet data to text for the specified type
        const bulletText = convertBulletDataToText(bulletData, updateType);
        
        if (!bulletText.trim()) {
            return Response.json({ 
                error: `No ${updateType} content found in bullet data` 
            }, { status: 400 });
        }
        
        console.log(`${updateType} bullet text:`, bulletText);
        
        const anthropicClient = new AnthropicClient();
        const response = await anthropicClient.generateFormattedUpdate(bulletText, updateType);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return Response.json({ 
                error: errorData.error?.message || `API request failed: ${response.status}` 
            }, { status: response.status });
        }

        const data = await response.json();
        const content = data.content[0].text;
        
        // Try to parse as structured response
        try {
            const parsedContent = JSON.parse(content);
            // Return in the format the client expects
            return Response.json({
                format: 'editorjs',
                editorBlocks: parsedContent,
                formattedUpdate: content
            });
        } catch (jsonError) {
            // Return as plain text response
            return Response.json({
                format: 'text',
                formattedUpdate: content
            });
        }
        
    } catch (error) {
        console.error('Error generating formatted update:', error);
        return Response.json({ 
            error: 'Failed to generate formatted update',
            details: error.message 
        }, { status: 500 });
    }
}