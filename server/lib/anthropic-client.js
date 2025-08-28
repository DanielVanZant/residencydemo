const fetch = require('node-fetch');
const { AbortController } = require('abort-controller');

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

module.exports = AnthropicClient;