// Update generator module for checkbox-based publishing
class UpdateGenerator {
    constructor() {
        // Store editor instances for access by save functionality
        this.updateEditors = {};
    }

    // Generate both published and internal updates from checkbox data
    async generateBothUpdates(bulletData) {
        const updates = {};
        
        try {
            console.log('Generating published update...');
            updates.published = await this.generateFormattedUpdate(bulletData, 'published');
            console.log('Published update generated successfully');
        } catch (error) {
            console.error('Failed to generate published update:', error);
            updates.published = {
                type: 'text',
                text: 'Unable to generate published update due to API error. Please try again.'
            };
        }
        
        try {
            console.log('Generating internal notes...');
            updates.internal = await this.generateFormattedUpdate(bulletData, 'internal');
            console.log('Internal notes generated successfully');
        } catch (error) {
            console.error('Failed to generate internal notes:', error);
            updates.internal = {
                type: 'text',
                text: 'Unable to generate internal notes due to API error. Please try again.'
            };
        }
        
        return updates;
    }

    // API call with retry logic for overload errors
    async callAPIWithRetry(updateType, requestData, maxRetries = 3, baseDelay = 3000) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Attempting to generate ${updateType} update (attempt ${attempt}/${maxRetries})`);
                
                // Add timeout to prevent hanging requests
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout
                
                const response = await fetch(this.getEndpoint(), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': API_CONFIG?.ANTHROPIC_API_KEY || ''
                    },
                    body: JSON.stringify(requestData),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);

                // If successful or non-retryable error, return immediately
                if (response.ok || (response.status !== 429 && response.status !== 503 && response.status !== 500)) {
                    return response;
                }

                // Check if this is an overload/rate limit error
                const errorData = await response.json().catch(() => ({}));
                const isOverloadError = errorData.error?.includes('overloaded') || 
                                      errorData.error?.includes('Overloaded') ||
                                      response.status === 429 || 
                                      response.status === 503;

                if (!isOverloadError || attempt === maxRetries) {
                    // Not a retryable error or final attempt, return the response
                    return response;
                }

                // Wait before retrying (exponential backoff)
                const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
                console.log(`${updateType} update overloaded, retrying in ${Math.round(delay)}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                
            } catch (error) {
                console.error(`Network error on attempt ${attempt} for ${updateType}:`, error);
                
                if (attempt === maxRetries) {
                    throw error;
                }
                
                // Wait before retrying network errors too
                const delay = baseDelay * Math.pow(2, attempt - 1);
                console.log(`Network error for ${updateType}, retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }


    // Generate formatted update for specific type (published or internal)
    async generateFormattedUpdate(bulletData, updateType) {
        try {
            // Call API to format the content
            const response = await this.callAPIWithRetry(updateType, {
                bulletData: bulletData,
                updateType: updateType
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to generate ${updateType} update: ${response.status}`);
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
                text: data.formattedUpdate || `Error generating ${updateType} update.`
            };
            
        } catch (error) {
            console.error(`Error generating ${updateType} update:`, error);
            return `Error generating ${updateType} update: ${error.message}`;
        }
    }


    // Get API endpoint
    getEndpoint() {
        return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? '/api/generate-formatted-update'
            : 'http://localhost:3000/api/generate-formatted-update';
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
        const sections = [
            { key: 'published', title: 'Published Update', icon: '📝', description: 'Ready for sharing with colleagues, managers, or external audiences' },
            { key: 'internal', title: 'Internal Notes', icon: '📋', description: 'Private notes and reflections not included in the published update' }
        ];

        sections.forEach((section, index) => {
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'formatted-update-section';
            
            const updateData = updates[section.key];
            const editorId = `editor-${section.key}`;
            
            sectionDiv.innerHTML = `
                <div class="update-header">
                    <h3><span class="update-icon">${section.icon}</span> ${section.title}</h3>
                    <p class="update-description">${section.description}</p>
                </div>
                <div id="${editorId}" class="update-editor"></div>
            `;
            container.appendChild(sectionDiv);
            
            // Initialize Editor.js for this update
            setTimeout(() => {
                this.initializeUpdateEditor(editorId, updateData, section.key);
            }, 100 * index); // Stagger initialization
        });

        // Ensure the formatted updates section is visible (should already be active)
        document.getElementById('formattedUpdatesSection').classList.add('active');
    }

    // Initialize Editor.js instance for a specific update
    async initializeUpdateEditor(editorId, updateData, updateType) {
        console.log(`Initializing editor for ${updateType}:`, updateData);
        
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
                
                // Add checklist tool for task management
                if (window.EditorjsChecklist) {
                    tools.checklist = {
                        class: window.EditorjsChecklist,
                        inlineToolbar: true
                    };
                }
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
                console.log(`Using structured Editor.js blocks for ${updateType}`);
                editorData = updateData.blocks;
            } else {
                // Convert text to simple paragraph blocks
                const text = typeof updateData === 'string' ? updateData : updateData?.text || 'No content available.';
                console.log(`Converting text to blocks for ${updateType}`);
                
                // Try to parse text as JSON first (in case LLM returned raw JSON as text)
                try {
                    if (text.trim().startsWith('{') && text.includes('"blocks"')) {
                        console.log(`Attempting to parse raw JSON text for ${updateType}`);
                        const parsed = JSON.parse(text.trim());
                        if (parsed.blocks && Array.isArray(parsed.blocks)) {
                            console.log(`Successfully parsed JSON from text for ${updateType}`);
                            editorData = parsed;
                        } else {
                            throw new Error('Invalid JSON structure');
                        }
                    }
                } catch (jsonParseError) {
                    console.log(`Raw JSON parsing failed for ${updateType}, continuing with text conversion`);
                }
                
                // Split text into paragraphs and create blocks
                if (!editorData.blocks || editorData.blocks.length === 0) {
                    const paragraphs = text.split('\n\n').filter(p => p.trim());
                    editorData.blocks = paragraphs.map(paragraph => ({
                        type: 'paragraph',
                        data: {
                            text: paragraph.trim()
                        }
                    }));
                }
            }
            
            console.log(`Creating editor for ${updateType} with data:`, editorData);
            
            const editor = new EditorJS({
                holder: editorId,
                tools: tools,
                data: editorData,
                placeholder: `Edit your ${updateType} update...`,
                minHeight: 100,
                onChange: (api, event) => {
                    console.log(`${updateType} update modified`);
                }
            });
            
            // Store editor instance for save functionality
            this.updateEditors[updateType] = editor;
            
            console.log(`Editor initialized for ${updateType}`);
            
        } catch (error) {
            console.error(`Error initializing editor for ${updateType}:`, error);
            // Fallback to plain text
            const container = document.getElementById(editorId);
            const text = typeof updateData === 'string' ? updateData : updateData?.text || 'No content available.';
            container.innerHTML = `<div class="fallback-content">${text}</div>`;
        }
    }

}


// Export for use in other modules
window.UpdateGenerator = UpdateGenerator;