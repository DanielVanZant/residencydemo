import AnthropicClient from '../../lib/anthropic-client.js';

// Configure route for long-running requests
export const runtime = 'nodejs';
export const maxDuration = 60; // 1 minute timeout
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
                console.error('Failed to generate detail followup question:', errorData);
                return Response.json({ 
                    error: errorData.error?.message || `API request failed: ${result.status}` 
                }, { status: result.status });
            }
            
            const responseData = await result.json();
            const content = responseData.content[0].text;
            
            // Try to parse as JSON, handling markdown code blocks
            try {
                let cleanContent = content;
                // Remove markdown code block wrapper if present
                if (content.startsWith('```json') && content.endsWith('```')) {
                    cleanContent = content.slice(7, -3).trim(); // Remove ```json and ```
                } else if (content.startsWith('```') && content.endsWith('```')) {
                    cleanContent = content.slice(3, -3).trim(); // Remove ``` and ```
                }
                
                const parsed = JSON.parse(cleanContent);
                question = parsed.question;
                hint = parsed.hint;
                placeholder = parsed.placeholder;
            } catch (e) {
                console.log('Question 4 JSON parse failed:', e.message);
                console.log('Raw content was:', content);
                // Fallback if not JSON
                question = content;
                hint = 'Please provide more details about this topic.';
                placeholder = 'Share more context, specifics, or background...';
            }
            
        } else if (type === 'previous-followup') {
            // Question 5: Followup from previous summaries
            const result = await anthropicClient.generatePreviousFollowupQuestion(data);
            
            if (!result.ok) {
                const errorData = await result.json().catch(() => ({}));
                return Response.json({ 
                    error: errorData.error?.message || `API request failed: ${result.status}` 
                }, { status: result.status });
            }
            
            const responseData = await result.json();
            const content = responseData.content[0].text;
            console.log('Question 5 raw Claude response:', content);
            
            // Try to parse as JSON, handling markdown code blocks
            try {
                let cleanContent = content;
                // Remove markdown code block wrapper if present
                if (content.startsWith('```json') && content.endsWith('```')) {
                    cleanContent = content.slice(7, -3).trim(); // Remove ```json and ```
                } else if (content.startsWith('```') && content.endsWith('```')) {
                    cleanContent = content.slice(3, -3).trim(); // Remove ``` and ```
                }
                
                const parsed = JSON.parse(cleanContent);
                console.log('Question 5 parsed JSON:', parsed);
                question = parsed.question;
                hint = parsed.hint;
                placeholder = parsed.placeholder;
            } catch (e) {
                console.log('Question 5 JSON parse failed:', e.message);
                console.log('Raw content was:', content);
                // Fallback if not JSON
                question = content;
                hint = 'Please provide an update on this topic.';
                placeholder = 'Share your progress, changes, or current status...';
            }
            
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