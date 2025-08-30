import AnthropicClient from '../../lib/anthropic-client.js';

// Configure route for long-running requests
export const runtime = 'nodejs';
export const maxDuration = 180; // 3 minute timeout to allow for AI processing
export const dynamic = 'force-dynamic';

export async function POST(request) {
    console.log('API: Generate dynamic question');
    try {
        const { type, data } = await request.json();
        
        console.log(`Generating dynamic question type: ${type}`);
        
        if (!type || !data) {
            return Response.json({ 
                error: 'Missing type or data parameters' 
            }, { status: 400 });
        }
        
        const anthropicClient = new AnthropicClient();
        
        let question, hint, placeholder;
        
        if (type === 'detail-followup') {
            // Question 4: Followup on current responses for richer detail
            const result = await anthropicClient.generateDetailFollowupQuestion(data);
            
            if (!result.ok) {
                const errorData = await result.json().catch(() => ({}));
                console.error(`Anthropic API returned status ${result.status}:`, errorData);
                console.error('Response headers:', Object.fromEntries(result.headers));
                return Response.json({ 
                    error: errorData.error?.message || `API request failed: ${result.status}`,
                    anthropic_status: result.status,
                    anthropic_error: errorData
                }, { status: result.status });
            }
            
            const responseData = await result.json();
            const content = responseData.content[0].text.trim();
            
            // Simple text response - no JSON parsing needed
            question = content;
            hint = 'Please provide more details about this topic.';
            placeholder = 'Share more context, specifics, or background...';
            
        } else if (type === 'previous-followup') {
            // Question 5: Followup from previous summaries
            const result = await anthropicClient.generatePreviousFollowupQuestion(data);
            
            if (!result.ok) {
                const errorData = await result.json().catch(() => ({}));
                console.error(`Anthropic API returned status ${result.status}:`, errorData);
                console.error('Response headers:', Object.fromEntries(result.headers));
                return Response.json({ 
                    error: errorData.error?.message || `API request failed: ${result.status}`,
                    anthropic_status: result.status,
                    anthropic_error: errorData
                }, { status: result.status });
            }
            
            const responseData = await result.json();
            const content = responseData.content[0].text.trim();
            console.log('Question 5 response:', content);
            
            // Simple text response - no JSON parsing needed
            question = content;
            hint = 'Please provide an update on this topic.';
            placeholder = 'Share your progress, changes, or current status...';
            
        } else {
            return Response.json({ 
                error: 'Invalid question type. Must be "detail-followup" or "previous-followup"' 
            }, { status: 400 });
        }
        
        return Response.json({
            question: question || 'Please elaborate on one of your previous responses.',
            hint: hint || 'Choose something that would benefit from more detail.',
            placeholder: placeholder || 'Provide additional context or information...'
        });
        
    } catch (error) {
        console.error('Error generating dynamic question:', error);
        console.error('Error stack:', error.stack);
        return Response.json({ 
            error: 'Failed to generate dynamic question',
            details: error.message 
        }, { status: 500 });
    }
}