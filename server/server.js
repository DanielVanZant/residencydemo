const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('..'));

// API endpoint for Claude
app.post('/api/extract-bullets', async (req, res) => {
    console.log('Received extract-bullets request');
    try {
        const { formData } = req.body;
        console.log('Form data received:', formData);
        
        // Get API key from environment or request
        const apiKey = process.env.ANTHROPIC_API_KEY || req.headers['x-api-key'];
        
        if (!apiKey) {
            return res.status(401).json({ error: 'API key required' });
        }

        const systemPrompt = `You are an expert at extracting and organizing information into clear, hierarchical bullet points with privacy analysis.
Your task is to convert weekly update text into well-organized bullet points with appropriate privacy levels.

Privacy Levels:
- "private" (Only me): Things you'd only write in a personal journal. Information that feels vulnerable, too raw, or too personal to share with anyone yet. Thoughts still being processed.
- "residency" (Within residency): Things you'd share with trusted peers who understand the context. Information that benefits from group discussion but isn't polished for the outside world. Honest reflections about work and challenges.
- "public" (Public): Things you'd be comfortable posting on LinkedIn or telling at a conference. Achievements and learnings that could inspire or help others. Professional insights worth sharing broadly.

CRITICAL Privacy Assignment Rules:
1. EVERY bullet point at EVERY level MUST have a privacy assignment in meta.privacy
2. Parent bullets set the DEFAULT privacy for their children
3. Child bullets INHERIT parent privacy UNLESS the content requires different privacy:
   - Children can be MORE private than parents (e.g., public parent, private health detail child)
   - Children should rarely be LESS private than parents (only if explicitly shareable)
4. When in doubt, err on the side of more privacy, not less
5. Examples of privacy granularity:
   - Parent: "Algorithm Development" (public) 
     - Child: "Spent 3 all-nighters working" (private - health/personal)
   - Parent: "Team Collaboration" (residency)
     - Child: "Published blog post about findings" (public - explicitly shareable)

Guidelines:
- Create logical groupings based on the CONTENT, not based on which question it came from
- Use parent bullets for major themes/projects/areas
- Use nested bullets for specific details, metrics, and sub-tasks
- Each bullet should be self-contained and specific
- Include relevant metrics, numbers, or quantifiable data when mentioned
- Start bullets with action verbs when possible
- Ensure no redundancy - merge related information from different sections
- Organize by logical relationships

Return ONLY a raw JSON object in Editor.js List block format (do NOT wrap in markdown code blocks):
{
  "type": "list",
  "data": {
    "style": "unordered",
    "items": [
      {
        "content": "Main topic or theme",
        "meta": {
          "privacy": "public"
        },
        "items": [
          {
            "content": "Specific detail or sub-task", 
            "meta": {
              "privacy": "residency"
            },
            "items": []
          }
        ]
      }
    ]
  }
}

Analyze each bullet point's content to determine the most appropriate privacy level and store it in the meta.privacy field.`;

        const userPrompt = `Extract and organize the following weekly update into hierarchical bullet points with privacy analysis. 
Group related information logically and assign appropriate privacy levels to each bullet point:

Accomplishments:
${formData.accomplishments || ''}

Priorities for next week:
${formData.priorities || ''}

Challenges:
${formData.challenges || ''}

Metrics:
${formData.metrics || ''}

Learnings:
${formData.learnings || ''}

Wins:
${formData.wins || ''}

Support needed:
${formData.support || ''}

Organize this information hierarchically based on logical relationships and themes. 
Assign privacy levels ("private", "residency", "public") based on content sensitivity.
Return as JSON with the exact structure specified.`;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 2000,
                temperature: 0,
                system: systemPrompt,
                messages: [
                    {
                        role: 'user',
                        content: userPrompt
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return res.status(response.status).json({ 
                error: errorData.error?.message || `API request failed: ${response.status}` 
            });
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
                // Extract JSON from markdown code block
                cleanContent = cleanContent.replace(/^```json\s*\n?/, '').replace(/\n?```$/, '').trim();
            } else if (cleanContent.startsWith('```') && cleanContent.endsWith('```')) {
                console.log('Detected content wrapped in markdown code blocks');
                // Extract content from generic markdown code block
                cleanContent = cleanContent.replace(/^```\s*\n?/, '').replace(/\n?```$/, '').trim();
            }
            
            try {
                parsedContent = JSON.parse(cleanContent);
                if (parsedContent.type === 'list' && parsedContent.data && parsedContent.data.items) {
                    // Return Editor.js List block format with privacy information
                    const responseData = { editorBlock: parsedContent, format: 'editorjs' };
                    console.log('Sending Editor.js block response with privacy:', responseData);
                    res.json(responseData);
                    return;
                }
            } catch (jsonError) {
                console.log('Not JSON format, treating as markdown fallback:', jsonError.message);
            }
            
            // Fallback to markdown format for backward compatibility
            const responseData = { markdown: content.trim(), format: 'markdown' };
            console.log('Sending markdown response:', responseData);
            res.json(responseData);
        } catch (parseError) {
            console.error('Parse error:', parseError);
            res.status(500).json({ error: 'Failed to parse API response' });
        }
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'weekly-update.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Open http://localhost:${PORT}/weekly-update.html to use the app`);
});