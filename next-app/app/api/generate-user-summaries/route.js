import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import AnthropicClient from '@/app/lib/anthropic-client';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(request) {
    console.log('API: Generate user summaries');
    try {
        const { username } = await request.json();
        
        // Get API key from environment or request headers
        const apiKey = process.env.ANTHROPIC_API_KEY || request.headers.get('x-api-key');
        
        if (!apiKey) {
            return Response.json({ error: 'API key required' }, { status: 401 });
        }

        // Get user's updates from Convex
        const updates = await convex.query(api.weekly_updates.getUserUpdates, { username });
        
        if (!updates || updates.length === 0) {
            console.log('No updates found for user:', username);
            return Response.json({ success: true, message: 'No updates to summarize' });
        }

        const anthropicClient = new AnthropicClient(apiKey);
        const response = await anthropicClient.generateUserSummaries(updates, username);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return Response.json({ 
                error: errorData.error?.message || `API request failed: ${response.status}` 
            }, { status: response.status });
        }

        const data = await response.json();
        const content = data.content[0].text;
        
        try {
            const summaryData = JSON.parse(content);
            
            // Save summaries to Convex
            await convex.mutation(api.summaries.saveUserSummaries, {
                username,
                summaries: summaryData
            });
            
            console.log('Summaries generated and saved for user:', username);
            return Response.json({ 
                success: true, 
                summaries: summaryData 
            });
            
        } catch (jsonError) {
            console.error('Failed to parse summary JSON:', jsonError);
            return Response.json({ 
                error: 'Failed to parse generated summaries',
                details: jsonError.message 
            }, { status: 500 });
        }
        
    } catch (error) {
        console.error('Error generating user summaries:', error);
        return Response.json({ 
            error: 'Failed to generate user summaries',
            details: error.message 
        }, { status: 500 });
    }
}