// Update generator module for checkbox-based publishing
class UpdateGenerator {
    constructor() {
        // Store editor instances for access by save functionality
        this.updateEditors = {};
        console.log('UpdateGenerator v2.1 initialized - 5-Second Sequential Processing with Retry Logic');
    }

    // Generate both published and internal updates from checkbox data
    async generateBothUpdates(bulletData) {
        console.log('🔄 NEW SEQUENTIAL LOGIC: Starting sequential update generation with 5-second delay');
        
        // Show loading state in the formatted updates area
        this.showUpdatesLoading();
        
        const updates = {};
        
        // Always generate published first, then internal - never concurrent
        try {
            console.log('Generating published update...');
            this.showUpdateProgress('published', 1, 2);
            updates.published = await this.generateFormattedUpdateWithRetry(bulletData, 'published');
            console.log('Published update generated successfully');
        } catch (error) {
            console.error('Failed to generate published update:', error);
            updates.published = {
                type: 'text',
                text: 'Unable to generate published update due to server error. Please try again.'
            };
        }
        
        // Wait 5 seconds between API calls for server recovery (minimum safe delay)
        console.log('Waiting 5 seconds before generating internal notes to ensure server stability...');
        this.showUpdateProgress('internal', 2, 2, true);
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        try {
            console.log('Generating internal notes...');
            this.showUpdateProgress('internal', 2, 2);
            updates.internal = await this.generateFormattedUpdateWithRetry(bulletData, 'internal');
            console.log('Internal notes generated successfully');
        } catch (error) {
            console.error('Failed to generate internal notes:', error);
            updates.internal = {
                type: 'text',
                text: 'Unable to generate internal notes due to server error. Please try again.'
            };
        }
        
        return updates;
    }

    // Generate formatted update with specific retry logic for server errors
    async generateFormattedUpdateWithRetry(bulletData, updateType, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Attempt ${attempt}/${maxRetries} to generate ${updateType} update`);
                
                if (attempt > 1) {
                    // Show retry status
                    const delay = 5000 * attempt; // 5s, 10s, 15s delays
                    this.showRetryMessage(updateType, attempt, maxRetries, Math.round(delay / 1000));
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
                
                return await this.generateFormattedUpdate(bulletData, updateType);
                
            } catch (error) {
                console.error(`Attempt ${attempt} failed for ${updateType}:`, error);
                
                // Check if it's a server overload (529) or network error
                const isServerOverload = error.message.includes('529') || 
                                       error.message.includes('Service Temporarily Unavailable') ||
                                       error.message.includes('Failed to fetch');
                
                if (!isServerOverload || attempt === maxRetries) {
                    throw error; // Not retryable or final attempt
                }
                
                console.log(`Server overload detected for ${updateType}, will retry...`);
            }
        }
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
                        'Content-Type': 'application/json'
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
                
                // Update UI to show retry status
                this.showRetryMessage(updateType, attempt, maxRetries, Math.round(delay / 1000));
                
                await new Promise(resolve => setTimeout(resolve, delay));
                
            } catch (error) {
                console.error(`Network error on attempt ${attempt} for ${updateType}:`, error);
                
                if (attempt === maxRetries) {
                    throw error;
                }
                
                // Wait before retrying network errors too
                const delay = baseDelay * Math.pow(2, attempt - 1);
                console.log(`Network error for ${updateType}, retrying in ${delay}ms...`);
                
                // Update UI to show retry status for network errors
                this.showRetryMessage(updateType, attempt, maxRetries, Math.round(delay / 1000));
                
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
        return '/api/generate-formatted-update';
    }


    // Show loading state in formatted updates area
    showUpdatesLoading() {
        const container = document.getElementById('formattedUpdates');
        if (!container) return;
        
        container.innerHTML = `
            <div class="updates-loading">
                <div class="spinner"></div>
                <p>Generating formatted updates...</p>
            </div>
        `;
    }

    // Show retry message during API overload retries
    showRetryMessage(updateType, attempt, maxRetries, delaySeconds) {
        const container = document.getElementById('formattedUpdates');
        if (!container) return;
        
        container.innerHTML = `
            <div class="updates-loading">
                <div class="spinner"></div>
                <p>API temporarily overloaded. Retrying ${updateType} update...</p>
                <p class="retry-details">Attempt ${attempt}/${maxRetries} • Waiting ${delaySeconds}s</p>
            </div>
        `;
    }

    // Show progress during sequential update generation
    showUpdateProgress(updateType, current, total, isWaiting = false) {
        const container = document.getElementById('formattedUpdates');
        if (!container) return;
        
        const waitingText = isWaiting ? 
            `<p class="retry-details">Waiting 5 seconds to ensure server stability...</p>` : 
            '';
        
        container.innerHTML = `
            <div class="updates-loading">
                <div class="spinner"></div>
                <p>Generating ${updateType} update... (${current}/${total})</p>
                ${waitingText}
            </div>
        `;
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
            // Check if the DOM element exists first
            const holderElement = document.getElementById(editorId);
            if (!holderElement) {
                console.error(`Element with ID '${editorId}' not found in DOM. Skipping editor initialization.`);
                return;
            }
            
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
            if (typeof updateData === 'object' && updateData.type === 'editorjs') {
                console.log(`Processing editorjs type update for ${updateType}`);
                
                // First check if we have proper blocks structure
                if (updateData.blocks) {
                    console.log(`Found blocks property for ${updateType}`, updateData.blocks);
                    // Check if updateData.blocks is already in the correct format
                    if (updateData.blocks && updateData.blocks.blocks && Array.isArray(updateData.blocks.blocks)) {
                        // updateData.blocks is already { blocks: [...] }
                        editorData = updateData.blocks;
                    } else if (Array.isArray(updateData.blocks)) {
                        // updateData.blocks is just the array
                        editorData = { blocks: updateData.blocks };
                    } else {
                        console.error('Unexpected blocks structure:', updateData.blocks);
                        editorData = { blocks: [] };
                    }
                } 
                // If we have text field that looks like JSON, parse it
                else if (updateData.text && typeof updateData.text === 'string' && updateData.text.trim().startsWith('{')) {
                    console.log(`Attempting to parse text field as JSON for ${updateType}`);
                    try {
                        const parsed = JSON.parse(updateData.text.trim());
                        if (parsed.blocks && Array.isArray(parsed.blocks)) {
                            console.log(`Successfully parsed JSON from text field for ${updateType}`);
                            editorData = parsed;
                        } else {
                            console.error('Parsed JSON does not have blocks array');
                            editorData = { blocks: [] };
                        }
                    } catch (parseError) {
                        console.error(`Failed to parse text as JSON for ${updateType}:`, parseError);
                        // Fallback to showing raw text
                        editorData = {
                            blocks: [{
                                type: 'paragraph',
                                data: { text: updateData.text }
                            }]
                        };
                    }
                } else {
                    console.error('EditorJS type but no valid blocks or text found');
                    editorData = { blocks: [] };
                }
            } else {
                // Convert text to simple paragraph blocks
                const text = typeof updateData === 'string' ? updateData : updateData?.text || 'No content available.';
                console.log(`Converting text to blocks for ${updateType}`);
                
                // Try to parse text as JSON first (in case LLM returned raw JSON as text)
                try {
                    if (text.trim().startsWith('{') && (text.includes('"blocks"') || text.includes('"type":'))) {
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
                    console.log('JSON parse error:', jsonParseError);
                    console.log('Text being parsed:', text.substring(0, 200) + '...');
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