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

        const anthropicClient = new AnthropicClient();
        
        // Get user's north star metric (assuming from first update)
        const userData = {
            username: username,
            northStarMetric: updates[0]?.northStarMetric || 'Progress Metric',
            updates: updates
        };

        // Generate public summary
        const publicResponse = await anthropicClient.generateUserSummary(userData, 'public');
        const publicData = await publicResponse.json();
        const publicSummary = publicData.content[0].text;
        
        // Generate personal summary
        const personalResponse = await anthropicClient.generateUserSummary(userData, 'personal', publicSummary);
        const personalData = await personalResponse.json();
        const personalSummary = personalData.content[0].text;

        // Save summaries to Convex
        await convex.mutation(api.summaries.saveUserSummaries, {
            username: username,
            publicSummary: publicSummary,
            personalSummary: personalSummary
        });
        
        console.log('Summaries generated and saved for user:', username);
        return Response.json({ 
            success: true, 
            message: 'User summaries generated and saved successfully',
            summaries: {
                publicSummary: publicSummary,
                personalSummary: personalSummary
            }
        });
        
    } catch (error) {
        console.error('Error generating user summaries:', error);
        return Response.json({ 
            error: 'Failed to generate user summaries',
            details: error.message 
        }, { status: 500 });
    }
}