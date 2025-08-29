import AnthropicClient from '@/app/lib/anthropic-client';
import { convertMarkdownChecklistToEditorJS } from '@/app/lib/data-converter';

export async function POST(request) {
    console.log('Received extract-bullets request');
    try {
        const { formData } = await request.json();
        console.log('Form data received:', formData);
        
        // Get API key from environment or request headers
        const apiKey = process.env.ANTHROPIC_API_KEY || request.headers.get('x-api-key');
        
        console.log('API key available:', !!apiKey);
        
        if (!apiKey) {
            console.log('ERROR: No API key found');
            return Response.json({ error: 'API key required' }, { status: 401 });
        }

        const anthropicClient = new AnthropicClient(apiKey);
        console.log('Calling Anthropic API...');
        const response = await anthropicClient.extractBullets(formData);
        console.log('Anthropic API response received');

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return Response.json({ 
                error: errorData.error?.message || `API request failed: ${response.status}` 
            }, { status: response.status });
        }

        const data = await response.json();
        console.log('Claude API response received');
        
        // Parse the response content
        try {
            const content = data.content[0].text;
            console.log('Extracted content:', content);
            
            // Try to parse as JSON first (new privacy system)
            let parsedContent;
            let cleanContent = content.trim();
            
            // Check if the content is wrapped in markdown code blocks
            if (cleanContent.startsWith('```json') && cleanContent.endsWith('```')) {
                console.log('Detected JSON wrapped in markdown code blocks');
                cleanContent = cleanContent.slice(7, -3).trim(); // Remove ```json and ```
            }
            
            try {
                parsedContent = JSON.parse(cleanContent);
                console.log('Successfully parsed content as JSON');
                return Response.json({
                    success: true,
                    bullets: parsedContent.items || parsedContent,
                    style: parsedContent.style || 'checklist',
                    meta: parsedContent.meta || {}
                });
            } catch (jsonError) {
                console.log('Content is not JSON, treating as plain text');
                console.log('JSON parse error:', jsonError.message);
                
                // Use original logic: try to convert markdown to EditorJS format
                const editorBlock = convertMarkdownChecklistToEditorJS(content);
                if (editorBlock && editorBlock.data.items.length > 0) {
                    console.log('Sending converted checklist response');
                    return Response.json({ 
                        success: true,
                        editorBlock: editorBlock, 
                        format: 'editorjs' 
                    });
                }
                
                // Fallback to markdown format for backward compatibility
                console.log('Sending markdown response');
                return Response.json({ 
                    success: true,
                    markdown: content.trim(), 
                    format: 'markdown' 
                });
            }
            
        } catch (parseError) {
            console.error('Error parsing Claude response:', parseError);
            return Response.json({ 
                error: 'Failed to parse AI response',
                details: parseError.message 
            }, { status: 500 });
        }
        
    } catch (error) {
        console.error('Error in extract-bullets:', error);
        return Response.json({ 
            error: 'Internal server error',
            details: error.message 
        }, { status: 500 });
    }
}