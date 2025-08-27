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
app.use(express.static('.'));

// API endpoint for Claude
app.post('/api/extract-bullets', async (req, res) => {
    try {
        const { formData } = req.body;
        
        // Get API key from environment or request
        const apiKey = process.env.ANTHROPIC_API_KEY || req.headers['x-api-key'];
        
        if (!apiKey) {
            return res.status(401).json({ error: 'API key required' });
        }

        const systemPrompt = `You are an expert at extracting and organizing information into clear, hierarchical bullet points.
Your task is to convert weekly update text into a well-organized hierarchical structure.

Guidelines:
- Create logical groupings based on the CONTENT, not based on which question it came from
- Use parent bullets for major themes/projects/areas
- Use child bullets for specific details, metrics, and sub-tasks
- Each bullet should be self-contained and specific
- Include relevant metrics, numbers, or quantifiable data when mentioned
- Start bullets with action verbs when possible
- Ensure no redundancy - merge related information from different sections
- Organize by logical relationships (e.g., group all product features together, all metrics together, all technical tasks together)

Return a JSON object with a "hierarchy" key containing an array of parent bullets, each with optional "children" arrays.
Format: 
{
  "hierarchy": [
    {
      "text": "Parent bullet text",
      "children": [
        {"text": "Child bullet text"},
        {"text": "Another child bullet"}
      ]
    },
    {
      "text": "Another parent bullet without children"
    }
  ]
}`;

        const userPrompt = `Extract and organize the following weekly update into hierarchical bullet points. 
Group related information logically regardless of which section it came from.
Create smart groupings based on themes, projects, or areas of work:

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
Group related items together even if they appeared in different sections.
Return as JSON with the structure specified.`;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-opus-20240229',
                max_tokens: 2000,
                temperature: 0.3,
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
        
        // Parse the response content
        try {
            const content = data.content[0].text;
            // Extract JSON from the response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                // Send back the hierarchy
                res.json({ hierarchy: parsed.hierarchy || parsed });
            } else {
                throw new Error('Invalid response format');
            }
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
    res.sendFile(path.join(__dirname, 'weekly-update.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Open http://localhost:${PORT}/weekly-update.html to use the app`);
});