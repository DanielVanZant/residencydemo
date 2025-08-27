const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { AbortController } = require('abort-controller');
const path = require('path');
const Database = require('./database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
const db = new Database();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('..'));

// Helper function to convert markdown checklist to Editor.js format
function convertMarkdownChecklistToEditorJS(markdown) {
    const lines = markdown.trim().split('\n');
    const items = [];
    const stack = [{ items, level: -1 }];
    
    lines.forEach(line => {
        const match = line.match(/^(\s*)- \[([ x])\] (.+)$/);
        if (match) {
            const [, indent, checked, content] = match;
            const level = Math.floor(indent.length / 2);
            const isChecked = checked === 'x';
            
            // Find the right parent level
            while (stack.length > 1 && stack[stack.length - 1].level >= level) {
                stack.pop();
            }
            
            const parent = stack[stack.length - 1];
            const item = {
                content: content.trim(),
                meta: { checked: isChecked },
                items: []
            };
            
            parent.items.push(item);
            stack.push({ items: item.items, level });
        }
    });
    
    return {
        type: 'list',
        data: {
            style: 'checklist',
            items: items
        }
    };
}

// Helper function to convert bullet data to text
function convertBulletDataToText(bulletData, filterType = 'all', indent = 0) {
    if (!bulletData || !bulletData.data || !bulletData.data.items) {
        return '';
    }
    
    let text = '';
    const indentStr = '  '.repeat(indent);
    
    bulletData.data.items.forEach(item => {
        let includeItem = false;
        
        const isChecked = (item.meta && item.meta.checked) || item.checked;
        
        if (filterType === 'published') {
            // Only include checked items for published update
            includeItem = isChecked;
        } else if (filterType === 'internal') {
            // Only include unchecked items for internal notes
            includeItem = !isChecked;
        } else {
            // Include everything
            includeItem = true;
        }
        
        if (includeItem) {
            const checkbox = isChecked ? '[x]' : '[ ]';
            text += `${indentStr}- ${checkbox} ${item.content}\n`;
            
            // Process nested items
            if (item.items && item.items.length > 0) {
                const nestedData = { data: { items: item.items } };
                text += convertBulletDataToText(nestedData, filterType, indent + 1);
            }
        } else if (item.items && item.items.length > 0) {
            // Even if parent is filtered out, check children
            const nestedData = { data: { items: item.items } };
            text += convertBulletDataToText(nestedData, filterType, indent);
        }
    });
    
    return text;
}

// Helper function for API calls with retry logic
async function callAnthropicWithRetry(apiKey, requestBody, maxRetries = 3, baseDelay = 3000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Attempting Claude API call (attempt ${attempt}/${maxRetries})`);
            
            // Add timeout to prevent hanging requests
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout
            
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            // If successful or non-retryable error, return immediately
            if (response.ok || (response.status !== 429 && response.status !== 503 && response.status !== 500)) {
                return response;
            }
            
            // Check if this is an overload/rate limit error
            const errorData = await response.json().catch(() => ({}));
            const isOverloadError = errorData.error?.message?.includes('overloaded') || 
                                  errorData.error?.message?.includes('Overloaded') ||
                                  response.status === 429 || 
                                  response.status === 503;
            
            if (!isOverloadError || attempt === maxRetries) {
                // Not a retryable error or final attempt, return the response
                return response;
            }
            
            // Wait before retrying (exponential backoff)
            const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
            console.log(`API overloaded, retrying in ${Math.round(delay)}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            
        } catch (error) {
            console.error(`Network error on attempt ${attempt}:`, error.message);
            
            if (attempt === maxRetries) {
                throw error;
            }
            
            // Wait before retrying network errors too
            const delay = baseDelay * Math.pow(2, attempt - 1);
            console.log(`Network error, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

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
Your task is to convert weekly update text into well-organized markdown checklist format.

Goal: Help the user avoid sharing sensitive personal details publicly while making their professional accomplishments visible.

Guidelines:
- Create logical groupings based on the CONTENT
- Use parent bullets for major themes/projects/areas
- Use nested bullets for specific details, metrics, and sub-tasks
- Each bullet should be self-contained and specific
- Include relevant metrics, numbers, or quantifiable data when mentioned
- Ensure no redundancy - merge related information from different sections
- Organize by logical relationships

Return ONLY markdown checklist format using this syntax:
- [x] Checked item (suitable for public sharing)
- [ ] Unchecked item (should remain internal)
  - [x] Nested checked item
  - [ ] Nested unchecked item

Use your judgment to pre-check items that seem appropriate for public sharing while protecting sensitive personal information.`;

        const userPrompt = `Extract and organize the following weekly update into hierarchical bullet points with publication recommendations. 
Group related information logically and indicate which items are suitable for public sharing:

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
Use your best judgment to pre-check items that seem appropriate for public sharing while protecting sensitive personal details.
Return as markdown checklist format.`;

        const response = await callAnthropicWithRetry(apiKey, {
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
            
            // Convert markdown checklist to Editor.js format
            const editorBlock = convertMarkdownChecklistToEditorJS(content);
            if (editorBlock && editorBlock.data.items.length > 0) {
                const responseData = { editorBlock: editorBlock, format: 'editorjs' };
                console.log('Sending converted checklist response:', responseData);
                res.json(responseData);
                return;
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

// API endpoint for generating formatted updates
app.post('/api/generate-formatted-update', async (req, res) => {
    console.log('Received generate-formatted-update request');
    try {
        const { bulletData, updateType } = req.body;
        console.log('Update type:', updateType);
        console.log('Bullet data items:', bulletData?.data?.items?.length || 0);
        
        // Get API key from environment or request
        const apiKey = process.env.ANTHROPIC_API_KEY || req.headers['x-api-key'];
        
        if (!apiKey) {
            return res.status(401).json({ error: 'API key required' });
        }

        const systemPrompt = updateType === 'internal' 
            ? `You are creating internal notes from organized bullet points. Include all information provided in a clear, comprehensive format. Write in first person as appropriate for personal reflection and notes.`
            : `You are creating a publishable weekly update from selected bullet points. Write in professional prose suitable for sharing with colleagues, managers, or external audiences. Focus on achievements, learnings, and progress.`;

        const bulletText = convertBulletDataToText(bulletData, updateType);
        const userPrompt = `Transform the following markdown checklist into a well-written ${updateType === 'internal' ? 'internal notes document' : 'publishable weekly update'}:

${bulletText}

Format this content into clear prose, maintaining all the information provided but presenting it in a more readable narrative form.`;

        const enhancedSystemPrompt = `${systemPrompt}

Return ONLY a raw JSON object in Editor.js format with structured blocks (do NOT wrap in markdown code blocks):
{
  "blocks": [
    {
      "type": "header",
      "data": {
        "text": "${updateType === 'internal' ? 'Internal Notes' : 'Weekly Update'}",
        "level": 2
      }
    },
    {
      "type": "paragraph",
      "data": {
        "text": "Content here..."
      }
    },
    {
      "type": "list",
      "data": {
        "style": "unordered",
        "items": ["Item 1", "Item 2"]
      }
    }
  ]
}

Use these block types: header (levels 2-3), paragraph, and list (unordered).`;

        const response = await callAnthropicWithRetry(apiKey, {
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2000,
            temperature: 0.3,
            system: enhancedSystemPrompt,
            messages: [
                {
                    role: 'user',
                    content: userPrompt
                }
            ]
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return res.status(response.status).json({ 
                error: errorData.error?.message || `API request failed: ${response.status}` 
            });
        }

        const data = await response.json();
        console.log('Claude API response received for formatted update');
        
        const rawContent = data.content[0].text;
        console.log(`Generated ${updateType} update (${rawContent.length} chars)`);
        
        // Try to parse as structured Editor.js format
        let formattedUpdate = rawContent;
        let editorBlocks = null;
        
        try {
            let cleanContent = rawContent.trim();
            
            // Handle markdown code block wrapping
            if (cleanContent.startsWith('```json') && cleanContent.endsWith('```')) {
                cleanContent = cleanContent.replace(/^```json\s*\n?/, '').replace(/\n?```$/, '').trim();
            } else if (cleanContent.startsWith('```') && cleanContent.endsWith('```')) {
                cleanContent = cleanContent.replace(/^```\s*\n?/, '').replace(/\n?```$/, '').trim();
            }
            
            // Check if JSON appears truncated
            if (cleanContent.trim().startsWith('{') && !cleanContent.trim().endsWith('}')) {
                console.log(`Detected incomplete JSON for ${updateType}, skipping JSON parse`);
                throw new Error('Incomplete JSON response');
            }
            
            const parsed = JSON.parse(cleanContent);
            if (parsed.blocks && Array.isArray(parsed.blocks)) {
                editorBlocks = parsed;
                console.log(`Parsed structured blocks for ${updateType}: ${parsed.blocks.length} blocks`);
            }
        } catch (parseError) {
            console.log(`Could not parse as structured format for ${updateType}, using raw text:`, parseError.message);
        }
        
        res.json({ 
            formattedUpdate: formattedUpdate,
            editorBlocks: editorBlocks,
            format: editorBlocks ? 'editorjs' : 'text',
            updateType: updateType
        });
        
    } catch (error) {
        console.error('Server error in formatted update generation:', error);
        res.status(500).json({ error: error.message });
    }
});

// Database API endpoints

// Save weekly update with formatted versions
app.post('/api/save-weekly-update', async (req, res) => {
    console.log('Received save-weekly-update request');
    try {
        const { username, weekDate, bulletPointsJson, formattedUpdates } = req.body;
        
        if (!username || !weekDate || !bulletPointsJson) {
            return res.status(400).json({ error: 'Missing required fields: username, weekDate, bulletPointsJson' });
        }
        
        console.log(`Saving update for user: ${username}, week: ${weekDate}`);
        
        const result = await db.saveWeeklyUpdate(username, weekDate, bulletPointsJson, formattedUpdates || {});
        
        console.log('Weekly update saved successfully:', result);
        res.json(result);
        
    } catch (error) {
        console.error('Error saving weekly update:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all updates for a user
app.get('/api/user-updates/:username', async (req, res) => {
    console.log('Received get user updates request');
    try {
        const { username } = req.params;
        
        if (!username) {
            return res.status(400).json({ error: 'Username required' });
        }
        
        console.log(`Getting updates for user: ${username}`);
        
        const updates = await db.getUserUpdates(username);
        
        console.log(`Found ${updates.length} updates for user ${username}`);
        res.json({ updates });
        
    } catch (error) {
        console.error('Error getting user updates:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get specific weekly update
app.get('/api/weekly-update/:username/:weekDate', async (req, res) => {
    console.log('Received get specific weekly update request');
    try {
        const { username, weekDate } = req.params;
        
        if (!username || !weekDate) {
            return res.status(400).json({ error: 'Username and weekDate required' });
        }
        
        console.log(`Getting update for user: ${username}, week: ${weekDate}`);
        
        const update = await db.getWeeklyUpdate(username, weekDate);
        
        if (update) {
            console.log('Weekly update found');
            res.json({ update });
        } else {
            console.log('Weekly update not found');
            res.status(404).json({ error: 'Weekly update not found' });
        }
        
    } catch (error) {
        console.error('Error getting weekly update:', error);
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