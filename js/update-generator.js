// Update generator module for privacy-filtered content
class UpdateGenerator {
    constructor() {
        this.privacyLevels = {
            'private': ['private', 'residency', 'public'],
            'residency': ['residency', 'public'],
            'public': ['public']
        };
    }

    // Extract bullet content recursively, filtering by privacy level
    extractBulletContent(items, targetLevel, parentPrivacy = 'public') {
        const allowedPrivacies = this.privacyLevels[targetLevel];
        const filteredContent = [];

        items.forEach(item => {
            // Determine effective privacy (item's own or inherited from parent)
            const effectivePrivacy = (item.meta && item.meta.privacy) ? item.meta.privacy : parentPrivacy;
            
            // Include item if its privacy level is allowed for this target level
            if (allowedPrivacies.includes(effectivePrivacy)) {
                const filteredItem = {
                    content: item.content,
                    meta: { privacy: effectivePrivacy },
                    items: []
                };

                // Recursively process children with current privacy as parent
                if (item.items && item.items.length > 0) {
                    filteredItem.items = this.extractBulletContent(item.items, targetLevel, effectivePrivacy);
                }

                filteredContent.push(filteredItem);
            }
        });

        return filteredContent;
    }

    // Convert filtered bullet data to formatted text
    bulletDataToText(items, indent = 0) {
        let text = '';
        const indentStr = '  '.repeat(indent);

        items.forEach(item => {
            text += `${indentStr}- ${item.content}\n`;
            
            if (item.items && item.items.length > 0) {
                text += this.bulletDataToText(item.items, indent + 1);
            }
        });

        return text;
    }

    // Generate formatted update for specific privacy level
    async generateFormattedUpdate(bulletData, privacyLevel) {
        // Filter content based on privacy level
        const filteredContent = this.extractBulletContent(bulletData.data.items, privacyLevel);
        
        if (filteredContent.length === 0) {
            return `No content available at ${privacyLevel} level.`;
        }

        // Convert filtered content to text format
        const contentText = this.bulletDataToText(filteredContent);
        
        // Create LLM prompt for formatting
        const systemPrompt = this.getFormattingPrompt(privacyLevel);
        const userPrompt = `Transform the following bullet points into a well-formatted, narrative weekly update for ${privacyLevel} sharing:

${contentText}

Create a flowing, professional update that groups related items naturally and uses appropriate tone for ${privacyLevel} audience.`;

        try {
            // Call LLM to format the filtered content
            const response = await fetch(this.getEndpoint(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': API_CONFIG?.ANTHROPIC_API_KEY || ''
                },
                body: JSON.stringify({
                    formData: { filteredContent: contentText },
                    privacyLevel: privacyLevel,
                    systemPrompt: systemPrompt,
                    userPrompt: userPrompt
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to generate ${privacyLevel} update: ${response.status}`);
            }

            const data = await response.json();
            
            // Return structured data if available, otherwise fallback to text
            if (data.format === 'editorjs' && data.editorBlocks) {
                return {
                    type: 'editorjs',
                    blocks: data.editorBlocks,
                    text: data.formattedUpdate
                };
            }
            
            return {
                type: 'text',
                text: data.formattedUpdate || `Error generating ${privacyLevel} update.`
            };
            
        } catch (error) {
            console.error(`Error generating ${privacyLevel} update:`, error);
            return `Error generating ${privacyLevel} update: ${error.message}`;
        }
    }

    // Get appropriate formatting prompt for privacy level
    getFormattingPrompt(privacyLevel) {
        const prompts = {
            'private': `You are creating a personal weekly update for private reflection. Write in a conversational, introspective tone that captures both achievements and honest self-reflection. Include personal struggles, detailed thoughts, and vulnerable insights. This is for personal use only.`,
            
            'residency': `You are creating a weekly update for trusted colleagues within a residency program. Write in a professional but honest tone that encourages peer discussion and feedback. Include challenges, learning processes, and reflections that would benefit from group input. This is for trusted peers who understand the context.`,
            
            'public': `You are creating a polished weekly update for public sharing (LinkedIn, blog, etc.). Write in a professional, inspiring tone that highlights achievements and learnings that could help others. Focus on completed work, insights gained, and positive outcomes. This should be polished and ready for external audiences.`
        };

        return prompts[privacyLevel] || prompts['public'];
    }

    // Get API endpoint
    getEndpoint() {
        return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? '/api/generate-formatted-update'
            : 'http://localhost:3000/api/generate-formatted-update';
    }

    // Generate all three privacy level updates
    async generateAllUpdates(bulletData) {
        const updates = {};
        
        for (const level of ['public', 'residency', 'private']) {
            try {
                console.log(`Generating ${level} update...`);
                updates[level] = await this.generateFormattedUpdate(bulletData, level);
            } catch (error) {
                console.error(`Failed to generate ${level} update:`, error);
                updates[level] = `Failed to generate ${level} update.`;
            }
        }
        
        return updates;
    }

    // Display updates in UI
    displayUpdates(updates) {
        console.log('DisplayUpdates called with:', updates);
        const container = document.getElementById('formattedUpdates');
        
        if (!container) {
            console.error('Formatted updates container not found');
            return;
        }
        
        console.log('Found updates container, proceeding to display...');

        // Clear existing content
        container.innerHTML = '';

        // Create update sections
        const levels = [
            { key: 'public', title: 'Public Update', icon: '🌍', description: 'Ready for LinkedIn, blog posts, or external sharing' },
            { key: 'residency', title: 'Within Residency', icon: '👥', description: 'For trusted colleagues and peer discussion' },
            { key: 'private', title: 'Private Update', icon: '🔒', description: 'Personal reflection with full context' }
        ];

        levels.forEach((level, index) => {
            const section = document.createElement('div');
            section.className = 'formatted-update-section';
            
            const updateData = updates[level.key];
            const editorId = `editor-${level.key}`;
            
            section.innerHTML = `
                <div class="update-header">
                    <h3><span class="update-icon">${level.icon}</span> ${level.title}</h3>
                    <p class="update-description">${level.description}</p>
                </div>
                <div id="${editorId}" class="update-editor"></div>
            `;
            container.appendChild(section);
            
            // Initialize Editor.js for this update
            setTimeout(() => {
                this.initializeUpdateEditor(editorId, updateData, level.key);
            }, 100 * index); // Stagger initialization
        });

        // Ensure the formatted updates section is visible (should already be active)
        document.getElementById('formattedUpdatesSection').classList.add('active');
    }

    // Initialize Editor.js instance for a specific update
    async initializeUpdateEditor(editorId, updateData, level) {
        console.log(`Initializing editor for ${level}:`, updateData);
        
        try {
            // Check if Editor.js and tools are available
            if (typeof EditorJS === 'undefined') {
                throw new Error('EditorJS not loaded');
            }
            
            const tools = {};
            
            // Add available tools
            if (window.EditorjsList) {
                tools.list = {
                    class: window.EditorjsList,
                    inlineToolbar: true
                };
            }
            
            if (window.Header) {
                tools.header = {
                    class: window.Header,
                    inlineToolbar: false,
                    config: {
                        levels: [2, 3, 4],
                        defaultLevel: 2
                    }
                };
            }
            
            let editorData = { blocks: [] };
            
            // Handle different update data formats
            if (typeof updateData === 'object' && updateData.type === 'editorjs' && updateData.blocks) {
                console.log(`Using structured Editor.js blocks for ${level}`);
                editorData = updateData.blocks;
            } else {
                // Convert text to simple paragraph blocks
                const text = typeof updateData === 'string' ? updateData : updateData?.text || 'No content available.';
                console.log(`Converting text to blocks for ${level}`);
                
                // Try to parse text as JSON first (in case LLM returned raw JSON as text)
                try {
                    if (text.trim().startsWith('{') && text.includes('"blocks"')) {
                        console.log(`Attempting to parse raw JSON text for ${level}`);
                        const parsed = JSON.parse(text.trim());
                        if (parsed.blocks && Array.isArray(parsed.blocks)) {
                            console.log(`Successfully parsed JSON from text for ${level}`);
                            editorData = parsed;
                        } else {
                            throw new Error('Invalid JSON structure');
                        }
                    }
                } catch (jsonParseError) {
                    console.log(`Raw JSON parsing failed for ${level}, continuing with text conversion`);
                }
                
                // Split text into paragraphs and create blocks
                const paragraphs = text.split('\n\n').filter(p => p.trim());
                editorData.blocks = paragraphs.map(paragraph => ({
                    type: 'paragraph',
                    data: {
                        text: paragraph.trim()
                    }
                }));
            }
            
            console.log(`Creating editor for ${level} with data:`, editorData);
            
            const editor = new EditorJS({
                holder: editorId,
                tools: tools,
                data: editorData,
                placeholder: `Edit your ${level} update...`,
                minHeight: 100,
                onChange: (api, event) => {
                    console.log(`${level} update modified`);
                }
            });
            
            console.log(`Editor initialized for ${level}`);
            
        } catch (error) {
            console.error(`Error initializing editor for ${level}:`, error);
            // Fallback to plain text
            const container = document.getElementById(editorId);
            const text = typeof updateData === 'string' ? updateData : updateData?.text || 'No content available.';
            container.innerHTML = `<div class="fallback-content">${text}</div>`;
        }
    }

    // Copy update text to clipboard
    copyUpdate(level) {
        const updateContent = document.querySelector(`[data-level="${level}"] .update-content`);
        if (updateContent) {
            navigator.clipboard.writeText(updateContent.textContent).then(() => {
                // Show temporary success feedback
                const button = document.querySelector(`[onclick="copyUpdate('${level}')"]`);
                const originalText = button.textContent;
                button.textContent = 'Copied!';
                setTimeout(() => {
                    button.textContent = originalText;
                }, 2000);
            });
        }
    }
}


// Export for use in other modules
window.UpdateGenerator = UpdateGenerator;