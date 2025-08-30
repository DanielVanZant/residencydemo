// Comprehensive Weekly Update Form System
// Combines form management, north star handling, and main app controller

// Form Manager - handles form state, auto-save, and data collection
class FormManager {
    constructor(formId) {
        this.formId = formId;
        this.form = document.getElementById(formId);
        this.autoSaveInterval = null;
        this.setupAutoSave();
    }

    // Setup auto-save functionality
    setupAutoSave() {
        if (!this.form) return;
        
        const inputs = this.form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            // Restore saved values on page load
            const savedValue = localStorage.getItem(`weekly-${input.name}`);
            if (savedValue && input.value === '') {
                input.value = savedValue;
                console.log(`Restored ${input.name}: ${savedValue}`);
            }
            
            // Save on input change
            input.addEventListener('input', () => {
                localStorage.setItem(`weekly-${input.name}`, input.value);
                console.log(`Saved ${input.name}: ${input.value}`);
            });
        });
    }

    // Get all form data
    getFormData() {
        if (!this.form) return {};
        
        const formData = new FormData(this.form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        return data;
    }

    // Get save metadata (username and date validation)
    getSaveMetadata() {
        const username = window.userSession?.getUser();
        if (!username) {
            throw new Error('Please select a user first');
        }
        
        const weekDate = document.getElementById('weekDate')?.value;
        if (!weekDate) {
            throw new Error('Week date is required');
        }
        
        return { username, weekDate };
    }

    // Clear auto-saved form data
    clearAutoSavedData() {
        if (!this.form) return;
        
        const inputs = this.form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            localStorage.removeItem(`weekly-${input.name}`);
        });
        console.log('Cleared auto-saved form data');
    }

    // Reset form to initial state
    resetForm() {
        if (this.form) {
            this.form.reset();
            this.clearAutoSavedData();
        }
    }
}

// North Star Manager - handles north star metric display and input
class NorthStarManager {
    constructor() {
        this.hintElement = document.getElementById('northStarHint');
        this.labelElement = document.getElementById('northStarValueLabel');
        this.inputElement = document.getElementById('northStarValue');
    }

    // Load user's north star metric information
    async loadUserNorthStar(username) {
        try {
            console.log(`Loading north star info for user: ${username}`);
            const response = await fetch(`/api/user/${username}/north-star`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('North star data received:', data);
            
            this.updateDisplay(data.northStarMetric, data.northStarDescription, data.mostRecentValue, data.mostRecentDate);
            
        } catch (error) {
            console.error('Error loading north star info:', error);
            this.clearDisplay();
        }
    }

    // Update the north star display with user's specific metric
    updateDisplay(metric, description, mostRecentValue, mostRecentDate) {
        if (metric && description) {
            this.hintElement.textContent = `${metric}: ${description}`;
            
            // If we have a most recent value, show it and update label
            if (mostRecentValue !== null && mostRecentValue !== undefined) {
                this.inputElement.value = mostRecentValue;
                this.labelElement.textContent = `current ${metric.toLowerCase()} (last: ${mostRecentValue} on ${this.formatDateShort(mostRecentDate)})`;
                
                // Don't save the pre-filled value to localStorage
                localStorage.removeItem(`weekly-${this.inputElement.name}`);
            } else {
                this.labelElement.textContent = `current ${metric.toLowerCase()}`;
                this.inputElement.value = '';
            }
            
            // Update placeholder to be more specific
            this.inputElement.placeholder = this.getPlaceholderForMetric(metric);
        } else {
            this.clearDisplay();
        }
    }

    // Format date for display
    formatDateShort(dateString) {
        if (!dateString) return 'never';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    // Get appropriate placeholder based on metric type
    getPlaceholderForMetric(metric) {
        const metricLower = metric.toLowerCase();
        
        if (metricLower.includes('revenue') || metricLower.includes('cost') || metricLower.includes('mrr')) {
            return '5000.00';
        } else if (metricLower.includes('users') || metricLower.includes('commits')) {
            return '150.0';
        } else if (metricLower.includes('score') || metricLower.includes('rating')) {
            return '8.5';
        } else if (metricLower.includes('percent') || metricLower.includes('rate')) {
            return '75.5';
        } else if (metricLower.includes('mg') || metricLower.includes('yield')) {
            return '0.5';
        } else {
            return '0.0';
        }
    }

    // Clear north star display to defaults
    clearDisplay() {
        this.hintElement.textContent = 'track the single most important number that represents your core focus and progress during the residency';
        this.labelElement.textContent = 'current value';
        this.inputElement.placeholder = '0.0';
        this.inputElement.value = '';
    }

    // Get current north star values
    getCurrentValues() {
        return {
            value: this.inputElement.value.trim(),
            note: document.getElementById('northStarNote').value.trim()
        };
    }
}

// Weekly Update App - main controller coordinating all functionality
class WeeklyUpdateApp {
    constructor() {
        this.formManager = new FormManager('updateForm');
        this.northStarManager = new NorthStarManager();
        this.editor = null;
        
        this.init();
    }

    async init() {
        // Initialize user session and populate dropdown
        const savedUser = await window.userSession.populateUserDropdown('username', async (selectedUser) => {
            if (selectedUser) {
                await this.northStarManager.loadUserNorthStar(selectedUser);
            } else {
                this.northStarManager.clearDisplay();
            }
        });

        // Load north star for saved user
        if (savedUser) {
            await this.northStarManager.loadUserNorthStar(savedUser);
        }

        this.setupEventListeners();
        this.initializeEditor();
    }

    setupEventListeners() {
        // Extract bullets button
        const extractButton = document.getElementById('extractBullets');
        if (extractButton) {
            extractButton.addEventListener('click', () => this.extractBullets());
        }

        // Save changes button
        const saveButton = document.getElementById('saveChanges');
        if (saveButton) {
            saveButton.addEventListener('click', () => this.saveChanges());
        }

        // Regenerate updates button
        const regenerateButton = document.getElementById('regenerateUpdates');
        if (regenerateButton) {
            regenerateButton.addEventListener('click', () => this.regenerateUpdates());
        }
    }

    // Initialize Editor.js
    initializeEditor() {
        console.log('Initializing Editor.js...');
        console.log('EditorJS available:', typeof EditorJS !== 'undefined');
        
        if (typeof EditorJS !== 'undefined') {
            // Check for Editor.js plugins with their actual global names
            const tools = {};
            
            console.log('Checking for Editor.js tools:');
            console.log('- window.Header:', typeof window.Header !== 'undefined');
            console.log('- window.List:', typeof window.List !== 'undefined');
            console.log('- window.EditorjsList:', typeof window.EditorjsList !== 'undefined');
            console.log('- window.Checklist:', typeof window.Checklist !== 'undefined');
            console.log('- window.EditorjsChecklist:', typeof window.EditorjsChecklist !== 'undefined');
            
            if (typeof window.Header !== 'undefined') {
                tools.header = window.Header;
                console.log('Added Header tool');
            }
            
            if (typeof window.List !== 'undefined') {
                tools.list = window.List;
                console.log('Added List tool (window.List)');
            } else if (typeof window.EditorjsList !== 'undefined') {
                tools.list = window.EditorjsList;
                console.log('Added List tool (window.EditorjsList)');
            }
            
            if (typeof window.Checklist !== 'undefined') {
                tools.checklist = window.Checklist;
                console.log('Added Checklist tool (window.Checklist)');
            } else if (typeof window.EditorjsChecklist !== 'undefined') {
                tools.checklist = window.EditorjsChecklist;
                console.log('Added Checklist tool (window.EditorjsChecklist)');
            }
            
            console.log('Final tools object:', tools);
            
            // Editor.js handles paragraphs by default, but let's ensure tools are properly configured
            const editorConfig = {
                holder: 'editorjs',
                placeholder: 'Start writing your weekly update...',
                onReady: () => {
                    console.log('Editor.js is ready!');
                },
                onChange: () => {
                    console.log('Editor content changed');
                },
                data: {
                    blocks: []
                }
            };
            
            // Only add tools if we have them
            if (Object.keys(tools).length > 0) {
                editorConfig.tools = tools;
            }
            
            console.log('Editor config:', editorConfig);
            
            this.editor = new EditorJS(editorConfig);
        } else {
            console.error('EditorJS not available!');
        }
    }

    // Extract bullets from editor content with retry logic
    async extractBullets() {
        try {
            window.uiUtils.showLoading(true);
            window.uiUtils.hideError();

            const { username } = this.formManager.getSaveMetadata();
            const formData = this.formManager.getFormData();
            
            if (!window.uiUtils.validateFormContent(formData)) {
                return;
            }

            // Get editor content
            let editorData = null;
            if (this.editor) {
                editorData = await this.editor.save();
            }

            // Prepare request data (server expects formData wrapper)
            const requestData = {
                formData: {
                    rawUpdate: formData.rawUpdate || '',
                    editorData: editorData,
                    northStar: this.northStarManager.getCurrentValues(),
                    username: username,
                    accomplishments: formData.accomplishments || '',
                    priorities: formData.priorities || '',
                    challenges: formData.challenges || '',
                    metrics: formData.metrics || '',
                    learnings: formData.learnings || '',
                    wins: formData.wins || '',
                    support: formData.support || ''
                }
            };

            console.log('Sending extract request:', requestData);

            // Call extract with retry logic
            const data = await this.extractBulletsWithRetry(requestData);
            console.log('Extract response:', data);
            
            // Use the existing EditorUtils displayBullets function
            if (window.EditorUtils) {
                const editorUtils = new window.EditorUtils();
                
                if (data.editorBlock) {
                    await editorUtils.displayBullets(data.editorBlock, window.privacyManager);
                } else if (data.markdown) {
                    await editorUtils.displayBullets(data.markdown, window.privacyManager);
                } else if (data.bullets) {
                    // Convert bullet array to markdown for compatibility
                    const markdown = data.bullets.join('\n');
                    await editorUtils.displayBullets(markdown, window.privacyManager);
                } else {
                    console.error('Unknown response format:', data);
                    window.uiUtils.showError('Unexpected response format from server');
                }
                
                // Show the bullets section and submit section
                document.getElementById('bulletsSection').classList.add('active');
                const submitSection = document.querySelector('.submit-section');
                if (submitSection) {
                    submitSection.classList.add('active');
                }
            } else {
                console.error('EditorUtils not available');
                window.uiUtils.showError('Editor utilities not loaded');
            }
            
        } catch (error) {
            console.error('Error extracting bullets:', error);
            window.uiUtils.showError(`Error extracting bullets: ${error.message}`);
        } finally {
            window.uiUtils.showLoading(false);
        }
    }

    // Extract bullets API call with server overload retry logic  
    async extractBulletsWithRetry(requestData, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Extract bullets attempt ${attempt}/${maxRetries}`);
                
                if (attempt > 1) {
                    // Show retry message
                    const delay = 3000 * attempt; // 3s, 6s, 9s delays
                    window.uiUtils.showError(`Server overloaded. Retrying in ${Math.round(delay / 1000)} seconds... (${attempt}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    window.uiUtils.hideError();
                    window.uiUtils.showLoading(true);
                }

                const response = await fetch('/api/extract-bullets', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestData)
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    
                    // Check if this is a server overload (529) or rate limit (503)
                    const isServerOverload = response.status === 529 || response.status === 503;
                    
                    if (!isServerOverload || attempt === maxRetries) {
                        // Not retryable or final attempt
                        if (response.status === 503) {
                            throw new Error(errorData.error || 'The AI service is temporarily unavailable. Please wait a moment and try again.');
                        }
                        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                    }
                    
                    console.log(`Server overload (${response.status}) on attempt ${attempt}, will retry...`);
                    continue; // Retry this attempt
                }

                return await response.json();
                
            } catch (error) {
                console.error(`Extract attempt ${attempt} failed:`, error);
                
                // Check if it's a network error that should be retried
                const isNetworkError = error.message.includes('Failed to fetch') || 
                                     error.message.includes('NetworkError');
                
                if (!isNetworkError || attempt === maxRetries) {
                    throw error; // Not retryable or final attempt
                }
                
                console.log(`Network error on attempt ${attempt}, will retry...`);
            }
        }
    }


    // Save changes to database
    async saveChanges() {
        try {
            window.uiUtils.setFormDisabled(true);
            window.uiUtils.showLoading(true);
            window.uiUtils.hideError();

            const { username, weekDate } = this.formManager.getSaveMetadata();
            const northStarValues = this.northStarManager.getCurrentValues();

            // Get bullet editor data from EditorUtils
            let bulletPointsJson = null;
            if (window.bulletEditor) {
                const bulletData = await window.bulletEditor.save();
                // The server expects the list block data as a JSON string
                if (bulletData && bulletData.blocks && bulletData.blocks.length > 0) {
                    const listBlock = bulletData.blocks.find(block => block.type === 'list');
                    if (listBlock && listBlock.data) {
                        bulletPointsJson = JSON.stringify(listBlock.data);
                    }
                }
            }

            if (!bulletPointsJson) {
                throw new Error('No bullet points to save. Please extract bullets first.');
            }

            // Get formatted updates from UpdateGenerator if available
            let formattedUpdates = {};
            if (window.updateGenerator && window.updateGenerator.updateEditors) {
                try {
                    if (window.updateGenerator.updateEditors.published) {
                        const publishedData = await window.updateGenerator.updateEditors.published.save();
                        formattedUpdates.published = publishedData;
                    }
                    if (window.updateGenerator.updateEditors.internal) {
                        const internalData = await window.updateGenerator.updateEditors.internal.save();
                        formattedUpdates.internal = internalData;
                    }
                } catch (err) {
                    console.warn('Could not get formatted updates:', err);
                }
            }

            // Prepare save data matching server expectations
            const saveData = {
                username: username,
                weekDate: weekDate,
                bulletPointsJson: bulletPointsJson,
                formattedUpdates: formattedUpdates,
                northStarValue: northStarValues.value,
                northStarNote: northStarValues.note
            };

            console.log('Saving update:', saveData);

            const response = await fetch('/api/save-weekly-update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(saveData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Save result:', result);

            // Clear auto-saved data after successful save
            this.formManager.clearAutoSavedData();
            
            // Generate updated summaries in the background
            try {
                console.log('Generating updated user summaries...');
                const summaryResponse = await fetch('/api/generate-user-summaries', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username: username })
                });
                
                if (summaryResponse.ok) {
                    console.log('User summaries updated successfully');
                } else {
                    console.warn('Failed to generate summaries, but update was saved');
                }
            } catch (summaryError) {
                console.warn('Error generating summaries:', summaryError);
                // Don't fail the whole save if summary generation fails
            }
            
            // Show success message and redirect
            window.uiUtils.showSuccessMessage(
                'Update saved successfully! Redirecting to dashboard...',
                `/dashboard?user=${encodeURIComponent(username)}`,
                2000
            );
            
        } catch (error) {
            console.error('Error saving update:', error);
            window.uiUtils.showError(`Error saving update: ${error.message}`);
        } finally {
            window.uiUtils.setFormDisabled(false);
            window.uiUtils.showLoading(false);
        }
    }

    // Regenerate the formatted updates from current bullet points
    async regenerateUpdates() {
        try {
            console.log('Regenerating formatted updates from current bullet points...');
            
            // Don't clear bullets! Only clear formatted updates
            await this.clearFormattedUpdatesOnly();
            
            // Get current bullet data from the editor (don't re-extract from form)
            if (!window.bulletEditor) {
                throw new Error('No bullet points available. Please extract bullets first.');
            }
            
            const bulletData = await window.bulletEditor.save();
            
            if (!bulletData || !bulletData.blocks || bulletData.blocks.length === 0) {
                throw new Error('No bullet points found. Please extract bullets first.');
            }
            
            // Find the list block with the bullet data
            const listBlock = bulletData.blocks.find(block => block.type === 'list');
            if (!listBlock) {
                throw new Error('No bullet list found. Please extract bullets first.');
            }
            
            console.log('Found bullet data for regeneration:', listBlock.data);
            
            // Generate formatted updates from existing bullets
            if (window.EditorUtils) {
                const editorUtils = new window.EditorUtils();
                await editorUtils.generateFormattedUpdates(listBlock.data);
            } else {
                throw new Error('Editor utilities not available');
            }
            
        } catch (error) {
            console.error('Error regenerating updates:', error);
            window.uiUtils.showError(`Error regenerating updates: ${error.message}`);
        }
    }

    // Clear existing bullets and formatted updates before regenerating
    async clearExistingContent() {
        // Hide bullets section
        const bulletsSection = document.getElementById('bulletsSection');
        if (bulletsSection) {
            bulletsSection.classList.remove('active');
        }

        // Clear bullet editor if it exists
        if (window.bulletEditor) {
            try {
                // Clear the editor completely and wait for it
                await window.bulletEditor.clear();
                console.log('Bullet editor cleared successfully');
            } catch (error) {
                console.log('Error clearing bullet editor, attempting to destroy and recreate');
                try {
                    window.bulletEditor.destroy();
                    window.bulletEditor = null;
                } catch (destroyError) {
                    console.error('Error destroying bullet editor:', destroyError);
                }
            }
        }
        
        // Also clear the DOM container directly as backup
        const editorContainer = document.getElementById('editorjs');
        if (editorContainer) {
            editorContainer.innerHTML = '';
        }

        // Clear formatted updates section
        const formattedSection = document.getElementById('formattedUpdatesSection');
        if (formattedSection) {
            formattedSection.classList.remove('active');
        }

        const formattedContainer = document.getElementById('formattedUpdates');
        if (formattedContainer) {
            formattedContainer.innerHTML = '';
        }

        // Clear update generator editors
        if (window.updateGenerator && window.updateGenerator.updateEditors) {
            window.updateGenerator.updateEditors = {};
        }

        // Hide submit section
        const submitSection = document.getElementById('submitSection');
        if (submitSection) {
            submitSection.classList.remove('active');
        }

        console.log('Cleared existing content for regeneration');
    }

    // Clear only formatted updates (keep bullets intact for regeneration)
    async clearFormattedUpdatesOnly() {
        console.log('Clearing formatted updates only (preserving bullets)...');
        
        // Clear formatted updates section
        const formattedSection = document.getElementById('formattedUpdatesSection');
        if (formattedSection) {
            formattedSection.classList.remove('active');
        }

        const formattedContainer = document.getElementById('formattedUpdates');
        if (formattedContainer) {
            formattedContainer.innerHTML = '';
        }

        // Clear update generator editors
        if (window.updateGenerator && window.updateGenerator.updateEditors) {
            window.updateGenerator.updateEditors = {};
        }

        // Don't hide submit section - user might want to save current bullets
        console.log('Formatted updates cleared, bullets preserved');
    }
}

// Export classes for global use
window.FormManager = FormManager;
window.NorthStarManager = NorthStarManager;
window.WeeklyUpdateApp = WeeklyUpdateApp;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('WeeklyUpdateApp v2.1 - Smart Regenerate (Preserves Bullets)');
    window.weeklyUpdateApp = new WeeklyUpdateApp();
    
    // Initialize UpdateGenerator for formatted updates
    if (window.UpdateGenerator) {
        window.updateGenerator = new window.UpdateGenerator();
        console.log('UpdateGenerator initialized');
    } else {
        console.error('UpdateGenerator class not available');
    }
});