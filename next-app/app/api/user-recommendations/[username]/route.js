import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function GET(request, { params }) {
    let username;
    try {
        const result = await params;
        username = result.username;
        const url = new URL(request.url);
        const includePrivate = url.searchParams.get('includePrivate') === 'true';
        
        console.log(`API: Getting recommendations for user: ${username} (private: ${includePrivate})`);
        
        // Get the main user's summaries (both public and private if requested)
        const mainUserSummaries = await convex.query(api.summaries.getUserSummaries, { username });
        
        if (!mainUserSummaries || !mainUserSummaries.public_summary) {
            return Response.json({ 
                recommendations: [],
                message: "No public summary available for this user"
            });
        }
        
        // Get all other users' public summaries
        const allUserSummaries = await convex.query(api.summaries.getAllUserSummaries);
        
        // Filter out the main user and users without public summaries
        const otherUsers = allUserSummaries.filter(user => 
            user.username !== username && user.public_summary
        );
        
        if (otherUsers.length === 0) {
            return Response.json({ 
                recommendations: [],
                message: "No other users with summaries found"
            });
        }
        
        // Prepare data for Claude analysis
        const mainUserData = {
            username: username,
            public_summary: mainUserSummaries.public_summary,
            personal_summary: includePrivate ? mainUserSummaries.personal_summary : null
        };
        
        // CRITICAL: Only use PUBLIC summaries for other users - never personal/private data
        const otherUsersData = otherUsers.map(user => ({
            username: user.username,
            public_summary: user.public_summary,
            north_star_metric: user.north_star_metric
            // NEVER include personal_summary for other users - privacy protection
        }));
        
        // Call Claude Sonnet 4 for recommendations
        const recommendations = await generateRecommendations(mainUserData, otherUsersData);
        
        return Response.json({ 
            recommendations: recommendations || [],
            mainUser: username,
            analyzedUsers: otherUsersData.length
        });
        
    } catch (error) {
        console.error(`Error generating recommendations for ${username || 'unknown'}:`, error);
        return Response.json({ 
            error: 'Failed to generate recommendations',
            details: error.message 
        }, { status: 500 });
    }
}

async function generateRecommendations(mainUser, otherUsers) {
    try {
        const prompt = `Analyze these user profiles and recommend ONE person ${mainUser.username} should have a conversation with.

MAIN USER (${mainUser.username}):
Public Summary: ${mainUser.public_summary}
${mainUser.personal_summary ? `Private Summary: ${mainUser.personal_summary}` : ''}

OTHER USERS:
${otherUsers.map(user => `
${user.username}:
- Public Summary: ${user.public_summary}
- North Star Metric: ${user.north_star_metric || 'Not specified'}
`).join('\n')}

INSTRUCTIONS:
- Choose someone ${mainUser.username} would genuinely be excited to talk with
- Write in SECOND PERSON addressing ${mainUser.username} as "you"
- Focus on what makes their work/approach fascinating or valuable to discuss
- Include why their perspective would be particularly interesting to you
- Suggest a meaty topic or question that could spark great discussion
- Make it feel like a conversation you'd be eager to have
- 4-5 sentences maximum

WHAT MAKES AN ENTICING CONVERSATION:
- They're grappling with the same big questions from a different vantage point
- Their approach to problems would make you think differently
- You're both obsessed with similar challenges but taking different paths
- They've had insights you'd want to dig into
- There's intellectual chemistry in how you both think about the work

TONE:
- Intellectually curious, not transactional
- Focus on the work but keep it human
- Avoid demographics/identity as main connection
- Make them genuinely want to schedule that coffee

Return ONLY this JSON structure:
{
  "username": "recommended-user",
  "detailedRecommendation": "Explanation in second person about why you'd find this conversation fascinating. Focus on their approach/insights and include a meaty question or topic worth exploring together."
}

No other text.`;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 1000,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`Anthropic API error: ${response.status}`);
        }

        const data = await response.json();
        const recommendationText = data.content[0].text;
        
        // Parse JSON response
        try {
            const recommendation = JSON.parse(recommendationText);
            return recommendation && recommendation.username ? [recommendation] : [];
        } catch (parseError) {
            console.error('Failed to parse Claude response as JSON:', recommendationText);
            return [];
        }
        
    } catch (error) {
        console.error('Error calling Claude API:', error);
        return [];
    }
}