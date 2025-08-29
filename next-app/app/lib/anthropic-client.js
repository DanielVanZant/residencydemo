// Using native fetch and AbortController available in Next.js runtime

class AnthropicClient {
    constructor(apiKey = process.env.ANTHROPIC_API_KEY) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.anthropic.com/v1/messages';
        this.defaultModel = 'claude-sonnet-4-20250514';
        this.maxRetries = 3;
        this.baseDelay = 3000;
    }

    // Helper function for API calls with retry logic
    async callWithRetry(requestBody, maxRetries = this.maxRetries, baseDelay = this.baseDelay) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Attempting Claude API call (attempt ${attempt}/${maxRetries})`);
                
                // Add timeout to prevent hanging requests
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout
                
                const response = await fetch(this.baseUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': this.apiKey,
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

    // Extract bullet points from form data
    async extractBullets(formData) {
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

        const requestBody = {
            model: this.defaultModel,
            max_tokens: 2000,
            temperature: 0,
            system: systemPrompt,
            messages: [
                {
                    role: 'user',
                    content: userPrompt
                }
            ]
        };

        return await this.callWithRetry(requestBody);
    }

    // Generate comprehensive user summary from all updates
    async generateUserSummary(userData, summaryType, publicSummary = null) {
        const { username, northStarMetric, updates } = userData;
        const isPersonal = summaryType === 'personal';
        
        // Prepare update text for summary generation
        const publicUpdateTexts = updates.map(update => {
            const weekText = `Week of ${new Date(update.weekDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}:\n`;
            
            let content = '';
            if (update.formattedUpdates.published) {
                content += this.extractTextFromEditorBlocks(update.formattedUpdates.published) + '\n';
            }
            
            // Add north star progress
            if (update.northStarValue) {
                content += `${northStarMetric}: ${update.northStarValue}\n`;
            }
            
            return weekText + content;
        }).join('\n---\n\n');

        // For personal summary, gather only internal/private content
        const internalUpdateTexts = isPersonal ? updates.map(update => {
            const weekText = `Week of ${new Date(update.weekDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}:\n`;
            
            let content = '';
            if (update.formattedUpdates.internal) {
                content += this.extractTextFromEditorBlocks(update.formattedUpdates.internal) + '\n';
            }
            
            return content.trim() ? weekText + content : '';
        }).filter(text => text).join('\n---\n\n') : '';

        let prompt;
        
        if (isPersonal && publicSummary) {
            // Personal summary: only add what wasn't in public
            prompt = `You are adding personal notes to supplement a public summary for ${username}.

CONTEXT:
- User: ${username}  
- North Star Metric: ${northStarMetric}
- Time Period: ${updates.length} weekly updates SO FAR
- Audience: Personal reflection and mentors

PUBLIC SUMMARY ALREADY WRITTEN:
${publicSummary}

INTERNAL/PRIVATE NOTES FROM WEEKLY UPDATES (USE ONLY THIS):
${internalUpdateTexts}

STRICT INSTRUCTIONS:
- Write ONLY additional personal information from the internal notes above (200-400 words)
- Use ONLY information explicitly stated in the internal/private notes
- DO NOT invent or assume any information not directly stated
- Frame as mid-residency personal reflections on work so far

CRITICAL: Use a "ZOOMING IN" structure for personal content too:

1. **Most important personal challenge** - The biggest personal issue (1-2 sentences)
2. **Key personal impacts** - How the work is affecting me personally (1 paragraph)
3. **Specific challenges** - Detailed personal struggles from the notes (1-2 paragraphs)
4. **What I need** - Support or changes needed going forward (if mentioned)

Focus on actual private content from the updates:
- Personal challenges mentioned
- Internal thoughts or doubts stated  
- Health or personal issues noted
- Team dynamics or conflicts described

Write in first person. Use markdown formatting.
Start directly with content - no introduction.
If there's limited private content, keep it brief rather than inventing details.`;
        } else {
            // Public summary
            prompt = `You are writing a mid-residency summary for ${username} based ONLY on information explicitly stated in their weekly updates.

CONTEXT:
- User: ${username}
- North Star Metric: ${northStarMetric}
- Time Period: ${updates.length} weekly updates SO FAR
- Audience: Public/professional audience (colleagues, managers, external readers)

WEEKLY UPDATES (USE ONLY THIS INFORMATION):
${publicUpdateTexts}

STRICT INSTRUCTIONS:
- Write a professional summary (400-600 words) of the work completed SO FAR
- Use ONLY information explicitly mentioned in the weekly updates above
- DO NOT invent, extrapolate, or assume any information not directly stated
- Write in first person as a mid-residency reflection on progress to date
- Frame as "work so far" and "progress to date" - this is NOT a final summary

CRITICAL: Use a "ZOOMING IN" structure - start with the highest-level summary and gradually add more detail:

1. **One-sentence summary** - The absolute core of what I'm doing (1 sentence)
2. **High-level overview** - Main focus and key metric progress (2-3 sentences)
3. **Major achievements** - Top 2-3 accomplishments so far (1 paragraph)
4. **Expanding detail** - More specific work, methods, and results (2-3 paragraphs)
5. **Current status** - Where things stand now and immediate next steps (1 paragraph)

This structure ensures someone reading only the first paragraph gets the essential information, while those reading further get progressively more detail.

${northStarMetric} progress: Include the metric progression prominently early in the summary.

Use markdown formatting. Stick strictly to facts from the updates provided.`;
        }

        const requestBody = {
            model: this.defaultModel,
            max_tokens: 4000,
            temperature: 0.4,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ]
        };

        return await this.callWithRetry(requestBody);
    }

    // Extract text content from Editor.js blocks
    extractTextFromEditorBlocks(editorData) {
        if (typeof editorData === 'string') {
            return editorData;
        }
        
        if (!editorData || !editorData.blocks) {
            return '';
        }
        
        return editorData.blocks.map(block => {
            switch (block.type) {
                case 'header':
                    return block.data.text || '';
                case 'paragraph':
                    return block.data.text || '';
                case 'list':
                    return (block.data.items || []).map(item => {
                        const text = typeof item === 'string' ? item : (item.content || '');
                        return `• ${text}`;
                    }).join('\n');
                default:
                    return '';
            }
        }).filter(text => text.trim()).join('\n\n');
    }

    // Generate formatted update from bullet data
    async generateFormattedUpdate(bulletText, updateType) {
        const systemPrompt = updateType === 'internal' 
            ? `You are creating internal notes from organized bullet points. Include all information provided in a clear, comprehensive format. Write in first person as appropriate for personal reflection and notes.`
            : `You are creating a publishable weekly update from selected bullet points. Write in professional prose suitable for sharing with colleagues, managers, or external audiences. Focus on achievements, learnings, and progress.`;

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

        const requestBody = {
            model: this.defaultModel,
            max_tokens: 2000,
            temperature: 0.3,
            system: enhancedSystemPrompt,
            messages: [
                {
                    role: 'user',
                    content: userPrompt
                }
            ]
        };

        return await this.callWithRetry(requestBody);
    }
}

export default AnthropicClient;