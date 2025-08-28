const express = require('express');
const router = express.Router();
const AnthropicClient = require('./anthropic-client');
const { convertMarkdownChecklistToEditorJS, convertBulletDataToText } = require('./data-converter');

// API endpoint for Claude bullet extraction
router.post('/extract-bullets', async (req, res) => {
    console.log('Received extract-bullets request');
    try {
        const { formData } = req.body;
        console.log('Form data received:', formData);
        
        // Get API key from environment or request
        const apiKey = process.env.ANTHROPIC_API_KEY || req.headers['x-api-key'];
        
        if (!apiKey) {
            return res.status(401).json({ error: 'API key required' });
        }

        const anthropicClient = new AnthropicClient(apiKey);
        const response = await anthropicClient.extractBullets(formData);

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
router.post('/generate-formatted-update', async (req, res) => {
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

        const anthropicClient = new AnthropicClient(apiKey);
        const bulletText = convertBulletDataToText(bulletData, updateType);
        const response = await anthropicClient.generateFormattedUpdate(bulletText, updateType);

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

// Save weekly update with formatted versions
router.post('/save-weekly-update', async (req, res) => {
    console.log('Received save-weekly-update request');
    try {
        const { username, weekDate, bulletPointsJson, formattedUpdates, northStarValue, northStarNote } = req.body;
        
        if (!username || !weekDate || !bulletPointsJson) {
            return res.status(400).json({ error: 'Missing required fields: username, weekDate, bulletPointsJson' });
        }
        
        console.log(`Saving update for user: ${username}, week: ${weekDate}`);
        
        // Get database instance from app locals
        const db = req.app.locals.db;
        const result = await db.saveWeeklyUpdate(username, weekDate, bulletPointsJson, formattedUpdates || {}, northStarValue, northStarNote);
        
        console.log('Weekly update saved successfully:', result);
        res.json(result);
        
    } catch (error) {
        console.error('Error saving weekly update:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all updates for a user
router.get('/user-updates/:username', async (req, res) => {
    console.log('Received get user updates request');
    try {
        const { username } = req.params;
        
        if (!username) {
            return res.status(400).json({ error: 'Username required' });
        }
        
        console.log(`Getting updates for user: ${username}`);
        
        // Get database instance from app locals
        const db = req.app.locals.db;
        const updates = await db.getUserUpdates(username);
        
        console.log(`Found ${updates.length} updates for user ${username}`);
        res.json({ updates });
        
    } catch (error) {
        console.error('Error getting user updates:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get specific weekly update
router.get('/weekly-update/:username/:weekDate', async (req, res) => {
    console.log('Received get specific weekly update request');
    try {
        const { username, weekDate } = req.params;
        
        if (!username || !weekDate) {
            return res.status(400).json({ error: 'Username and weekDate required' });
        }
        
        console.log(`Getting update for user: ${username}, week: ${weekDate}`);
        
        // Get database instance from app locals
        const db = req.app.locals.db;
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

// Get all users for dropdown
router.get('/users', async (req, res) => {
    console.log('Received get users request');
    try {
        // Get database instance from app locals
        const db = req.app.locals.db;
        const users = await db.getAllUsers();
        console.log(`Found ${users.length} users`);
        res.json({ users });
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get specific user's north star metric info
router.get('/user/:username/north-star', async (req, res) => {
    console.log('Received get user north star request');
    try {
        const { username } = req.params;
        
        if (!username) {
            return res.status(400).json({ error: 'Username required' });
        }
        
        console.log(`Getting north star info for user: ${username}`);
        
        // Get database instance from app locals
        const db = req.app.locals.db;
        const user = await db.getOrCreateUser(username);
        
        // Also get the most recent north star value
        const recentValue = await db.getMostRecentNorthStarValue(username);
        
        res.json({ 
            northStarMetric: user.north_star_metric,
            northStarDescription: user.north_star_description,
            mostRecentValue: recentValue.north_star_value,
            mostRecentNote: recentValue.north_star_note,
            mostRecentDate: recentValue.week_date
        });
        
    } catch (error) {
        console.error('Error getting user north star:', error);
        res.status(500).json({ error: error.message });
    }
});

// Generate user summaries
router.post('/generate-user-summaries', async (req, res) => {
    console.log('Received generate user summaries request');
    try {
        const { username } = req.body;
        
        if (!username) {
            return res.status(400).json({ error: 'Username required' });
        }
        
        // Get API key from environment or request
        const apiKey = process.env.ANTHROPIC_API_KEY || req.headers['x-api-key'];
        
        if (!apiKey) {
            return res.status(401).json({ error: 'API key required' });
        }
        
        console.log(`Generating summaries for user: ${username}`);
        
        // Get database instance from app locals
        const db = req.app.locals.db;
        
        // Get user and their north star metric
        const user = await db.getOrCreateUser(username);
        const updates = await db.getUserUpdates(username);
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No updates found for user' });
        }
        
        // Prepare data for summary generation
        const userData = {
            username: username,
            northStarMetric: user.north_star_metric || 'Progress Metric',
            updates: updates
        };
        
        const anthropicClient = new AnthropicClient(apiKey);
        
        // Generate public summary first
        console.log('Generating public summary...');
        const publicResponse = await anthropicClient.generateUserSummary(userData, 'public');
        
        if (!publicResponse.ok) {
            const publicError = await publicResponse.json().catch(() => ({}));
            return res.status(500).json({ 
                error: 'Failed to generate public summary',
                publicError: publicError?.error?.message
            });
        }
        
        const publicData = await publicResponse.json();
        const publicSummary = publicData.content[0].text;
        
        // Generate personal summary, passing the public summary
        console.log('Generating personal summary (additional private content only)...');
        const personalResponse = await anthropicClient.generateUserSummary(userData, 'personal', publicSummary);
        
        if (!personalResponse.ok) {
            const personalError = await personalResponse.json().catch(() => ({}));
            return res.status(500).json({ 
                error: 'Failed to generate personal summary',
                personalError: personalError?.error?.message
            });
        }
        
        const personalData = await personalResponse.json();
        const personalSummary = personalData.content[0].text;
        
        // Save summaries to database
        await db.saveUserSummaries(username, publicSummary, personalSummary);
        
        console.log('User summaries generated and saved successfully');
        res.json({ 
            publicSummary,
            personalSummary,
            updatesCount: updates.length
        });
        
    } catch (error) {
        console.error('Error generating user summaries:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get user summaries
router.get('/user-summaries/:username', async (req, res) => {
    console.log('Received get user summaries request');
    try {
        const { username } = req.params;
        
        if (!username) {
            return res.status(400).json({ error: 'Username required' });
        }
        
        console.log(`Getting summaries for user: ${username}`);
        
        // Get database instance from app locals
        const db = req.app.locals.db;
        const summaries = await db.getUserSummaries(username);
        
        res.json(summaries);
        
    } catch (error) {
        console.error('Error getting user summaries:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all user summaries for homepage
router.get('/all-user-summaries', async (req, res) => {
    console.log('Received get all user summaries request');
    try {
        // Get database instance from app locals
        const db = req.app.locals.db;
        const allSummaries = await db.getAllUserSummaries();
        
        console.log(`Found ${allSummaries.length} user summaries`);
        res.json({ summaries: allSummaries });
        
    } catch (error) {
        console.error('Error getting all user summaries:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;