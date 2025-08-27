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

        const systemPrompt = `You are an expert at extracting and organizing information into clear, hierarchical bullet points.
Your task is to convert weekly update text into well-organized markdown bullet points.

Guidelines:
- Create logical groupings based on the CONTENT, not based on which question it came from
- Use parent bullets (-) for major themes/projects/areas
- Use nested bullets (  -) for specific details, metrics, and sub-tasks (2 spaces indent)
- Each bullet should be self-contained and specific
- Include relevant metrics, numbers, or quantifiable data when mentioned
- Start bullets with action verbs when possible
- Ensure no redundancy - merge related information from different sections
- Organize by logical relationships (e.g., group all product features together, all metrics together, all technical tasks together)

Return ONLY clean markdown bullet points, no JSON wrapper. Use this format:
- Main topic or theme
  - Specific detail or sub-task
  - Another detail with metrics (25% increase)
- Another main topic
  - Sub-detail here
- Flat bullet point (if no hierarchy needed)

Do not include any other text, headers, or explanations - just the markdown bullets.`;

        const userPrompt = `Extract and organize the following weekly update into hierarchical markdown bullet points. 
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
Return as clean markdown bullets only.`;

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
            // Return the markdown content directly
            const responseData = { markdown: content.trim() };
            console.log('Sending response:', responseData);
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