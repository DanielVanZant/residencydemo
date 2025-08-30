// Draft Editor System - populates existing form with draft data
console.log('Draft Editor JavaScript loading...');

class DraftEditor {
    constructor() {
        console.log('DraftEditor constructor called');
        this.draftId = null;
        this.draftData = null;
        this.initialize();
    }

    async initialize() {
        console.log('Initializing draft editor...');
        
        // Get draft ID from page
        const draftElement = document.getElementById('draftId');
        if (!draftElement) {
            this.showError('Draft ID not found');
            return;
        }
        
        this.draftId = draftElement.dataset.draftId;
        console.log('Draft ID:', this.draftId);
        
        // Load draft data
        await this.loadDraft();
    }

    async loadDraft() {
        try {
            console.log('Loading draft:', this.draftId);
            
            const response = await fetch(`/api/drafts/${this.draftId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.draftData = await response.json();
            console.log('Draft loaded:', this.draftData);
            
            // Populate the draft display
            this.displayDraft();
            
        } catch (error) {
            console.error('Error loading draft:', error);
            this.showError(`Failed to load draft: ${error.message}`);
        }
    }

    displayDraft() {
        console.log('Displaying draft data');
        
        // Add visible feedback that JavaScript is working
        const loadingSection = document.getElementById('loadingSection');
        if (loadingSection) {
            loadingSection.innerHTML = '<div class="container"><div class="simple-loading active"><div class="spinner"></div><p>JavaScript is working! Processing draft data...</p></div></div>';
        }
        
        // Small delay to show the message
        setTimeout(() => {
            // Hide loading, show main content
            const loadingSection = document.getElementById('loadingSection');
            const mainContent = document.getElementById('mainContent');
            
            if (loadingSection) loadingSection.style.display = 'none';
            if (mainContent) {
                mainContent.style.display = 'block';
                console.log('Main content section displayed');
            } else {
                console.error('Main content section not found!');
            }
            
            // Make sure bullets section is visible
            const bulletsSection = document.getElementById('bulletsSection');
            if (bulletsSection) {
                bulletsSection.style.display = 'block';
                console.log('Bullets section displayed');
            } else {
                console.error('Bullets section not found!');
            }
            
            // Check if regenerate button exists
            const regenerateBtn = document.getElementById('regenerateBullets');
            if (regenerateBtn) {
                console.log('Regenerate Bullets button found and should be visible');
            } else {
                console.error('Regenerate Bullets button not found!');
            }
        
            // Populate draft info
            document.getElementById('draftUsername').textContent = this.draftData.username || '';
            document.getElementById('draftDate').textContent = this.draftData.weekDate || '';
            document.getElementById('draftCreated').textContent = new Date(this.draftData.createdAt).toLocaleDateString();
            
            // Display question responses
            this.displayQuestionResponses();
            
            // Create a hidden form with the draft data so the existing WeeklyUpdateApp can work with it
            this.populateHiddenForm();
            
            // Setup the regenerate buttons to use existing functionality
            this.setupEventListeners();
            
            // Load saved bullets if they exist
            this.loadSavedBullets();
            
            // Initialize UpdateGenerator for formatted updates
            this.initializeUpdateGenerator();
            
            // Load saved formatted updates if they exist
            this.loadSavedFormattedUpdates();
            
            // Check if we need to generate initial content
            this.checkAndGenerateInitialContent();
            
            // Show the submit section since we're in the editing stage
            this.showSubmitSection(true);
        }, 1000);
    }
    
    // Show/hide submit section
    showSubmitSection(show) {
        const submitEl = document.getElementById('submitSection');
        if (submitEl) {
            console.log(`${show ? 'Showing' : 'Hiding'} submit section`);
            if (show) {
                submitEl.classList.add('active');
            } else {
                submitEl.classList.remove('active');
            }
        } else {
            console.error('Submit section element not found');
        }
    }
    
    initializeUpdateGenerator() {
        if (window.UpdateGenerator && !window.updateGenerator) {
            window.updateGenerator = new window.UpdateGenerator();
            console.log('UpdateGenerator initialized for draft editor');
            
            // Hook into the UpdateGenerator to save formatted updates to draft
            this.hookUpdateGeneratorSaving();
        } else if (window.updateGenerator) {
            console.log('UpdateGenerator already available');
            // Hook into existing UpdateGenerator
            this.hookUpdateGeneratorSaving();
        } else {
            console.error('UpdateGenerator class not available');
        }
    }
    
    hookUpdateGeneratorSaving() {
        if (!window.updateGenerator) return;
        
        // Store original generateBothUpdates method
        const originalGenerateBothUpdates = window.updateGenerator.generateBothUpdates.bind(window.updateGenerator);
        
        // Override to add saving functionality
        window.updateGenerator.generateBothUpdates = async (bulletData) => {
            console.log('Hooked generateBothUpdates - will save to draft after generation');
            
            try {
                // Call original method
                const result = await originalGenerateBothUpdates(bulletData);
                
                // Save the generated updates to draft
                if (result && (result.published || result.internal)) {
                    console.log('Saving generated formatted updates to draft...');
                    await this.saveFormattedUpdatesToDraft(result);
                }
                
                return result;
            } catch (error) {
                console.error('Error in hooked generateBothUpdates:', error);
                throw error;
            }
        };
        
        console.log('UpdateGenerator saving hook installed');
    }
    
    async saveFormattedUpdatesToDraft(formattedUpdates) {
        try {
            console.log('Saving formatted updates to draft:', this.draftId);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
            
            const response = await fetch(`/api/drafts/${this.draftId}/formatted-updates`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    formattedUpdates: formattedUpdates
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`Failed to save formatted updates: ${response.status}`);
            }
            
            console.log('Formatted updates saved to draft successfully');
            
        } catch (error) {
            console.error('Error saving formatted updates to draft:', error);
            // Don't throw - this is background saving, shouldn't break the UI
            this.showMessage('Generated updates displayed but failed to save to draft', 'info');
        }
    }

    displayQuestionResponses() {
        const container = document.getElementById('questionsSummary');
        const responses = this.draftData.questionResponses || {};
        
        const questions = [
            { key: 'accomplishments', label: 'What did you accomplish this week?' },
            { key: 'challenges-priorities', label: 'What\'s blocking you and what will you focus on next week?' },
            { key: 'dynamic-followup-detail', label: this.draftData.dynamicQuestion4 || 'Follow-up Detail Question' },
            { key: 'dynamic-followup-previous', label: this.draftData.dynamicQuestion5 || 'Follow-up on Previous Updates' },
        ];

        // North Star section
        let html = `
            <div class="response-item" style="margin-bottom: 20px; padding: 15px; border: 1px solid #eee; border-radius: 5px;">
                <h4>North Star Progress</h4>
                <div class="response-content"><strong>Value:</strong> ${this.draftData.northStarValue || 'Not set'}</div>
                <div class="response-content" style="margin-top: 10px; white-space: pre-wrap;"><strong>Note:</strong> ${(this.draftData.northStarNote || '').substring(0, 300)}${(this.draftData.northStarNote || '').length > 300 ? '...' : ''}</div>
            </div>
        `;

        // Question responses
        questions.forEach(q => {
            const value = responses[q.key] || '';
            if (value) {
                html += `
                    <div class="response-item" style="margin-bottom: 20px; padding: 15px; border: 1px solid #eee; border-radius: 5px;">
                        <h4>${q.label}</h4>
                        <div class="response-content" style="white-space: pre-wrap; max-height: 300px; overflow-y: auto;">${value}</div>
                    </div>
                `;
            }
        });

        container.innerHTML = html;
    }

    populateHiddenForm() {
        // Create or populate a hidden form with the draft data so existing code can work with it
        let form = document.getElementById('hiddenUpdateForm');
        if (!form) {
            form = document.createElement('form');
            form.id = 'hiddenUpdateForm';
            form.style.display = 'none';
            document.body.appendChild(form);
        }

        const responses = this.draftData.questionResponses || {};
        
        // Create/update form fields with draft data
        const formData = {
            username: this.draftData.username,
            weekDate: this.draftData.weekDate,
            accomplishments: responses.accomplishments || '',
            'challenges-priorities': responses['challenges-priorities'] || '',
            'dynamic-followup-detail': responses['dynamic-followup-detail'] || '',
            'dynamic-followup-previous': responses['dynamic-followup-previous'] || '',
            northStarValue: this.draftData.northStarValue || '',
            northStarNote: this.draftData.northStarNote || ''
        };

        Object.entries(formData).forEach(([key, value]) => {
            let input = form.querySelector(`[name="${key}"]`);
            if (!input) {
                input = document.createElement('textarea');
                input.name = key;
                form.appendChild(input);
            }
            input.value = value;
        });

        console.log('Hidden form populated with draft data');
    }

    setupEventListeners() {
        console.log('Setting up event listeners');
        
        // Regenerate bullets button - use same pattern as working system
        document.getElementById('regenerateBullets')?.addEventListener('click', async () => {
            console.log('Regenerate bullets clicked');
            try {
                // Show loading states for both bullets and formatted updates
                this.showBulletsGenerating();
                this.showFormattedUpdatesGenerating();
                
                // Prepare request data exactly like the working system
                const formData = this.getFormDataForAPI();
                const requestData = {
                    formData: {
                        username: formData.username,
                        accomplishments: formData.accomplishments || '',
                        'challenges-priorities': formData['challenges-priorities'] || '',
                        metrics: formData.metrics || '',
                        learnings: formData.learnings || '',
                        wins: formData.wins || '',
                        support: formData.support || ''
                    }
                };
                
                console.log('Sending extract request:', requestData);
                
                // Call API directly like the working system
                const response = await fetch('/api/extract-bullets', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestData)
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || `API request failed: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('Extract response:', data);
                
                // Display the results using existing editor utils
                if (window.EditorUtils) {
                    const editorUtils = new window.EditorUtils();
                    
                    if (data.editorBlock) {
                        await editorUtils.displayBullets(data.editorBlock, window.privacyManager);
                        // Save the extracted bullets to the draft
                        await this.saveBulletsToDraft(data.editorBlock);
                        this.showMessage('Bullets extracted and saved to draft!', 'success');
                    } else if (data.markdown) {
                        await editorUtils.displayBullets(data.markdown, window.privacyManager);
                        // Save the markdown as bullets to the draft
                        await this.saveBulletsToDraft(data.markdown);
                        this.showMessage('Bullets extracted and saved to draft!', 'success');
                    } else {
                        this.showMessage('No bullets extracted from response', 'error');
                    }
                } else {
                    this.showMessage('EditorUtils not available', 'error');
                }
                
            } catch (error) {
                console.error('Error generating bullets:', error);
                this.showMessage(`Failed to generate bullets: ${error.message}`, 'error');
            }
        });

        // Other buttons
        document.getElementById('saveDraft')?.addEventListener('click', () => {
            this.showMessage('Draft functionality coming soon...', 'info');
        });

        document.getElementById('submitUpdate')?.addEventListener('click', () => {
            this.submitDraft();
        });

        document.getElementById('deleteDraft')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this draft?')) {
                this.showMessage('Delete functionality coming soon...', 'info');
            }
        });

        // Regenerate updates button
        document.getElementById('regenerateUpdates')?.addEventListener('click', () => {
            console.log('Regenerate updates clicked');
            this.regenerateUpdatesFromBullets();
        });

        // Try again button
        document.getElementById('tryAgainBtn')?.addEventListener('click', () => {
            window.location.reload();
        });
    }

    getFormDataForAPI() {
        const responses = this.draftData.questionResponses || {};
        
        // Format the data exactly as the existing API expects
        return {
            username: this.draftData.username,
            accomplishments: responses.accomplishments || '',
            'challenges-priorities': responses['challenges-priorities'] || '',
            metrics: `${this.draftData.northStarValue || ''} - ${this.draftData.northStarNote || ''}`,
            learnings: responses['dynamic-followup-detail'] || '',
            wins: responses.accomplishments || '',
            support: responses['dynamic-followup-previous'] || ''
        };
    }

    showError(message) {
        console.error('Showing error:', message);
        document.getElementById('loadingSection').style.display = 'none';
        document.getElementById('errorSection').style.display = 'block';
        document.getElementById('errorMessage').textContent = message;
    }

    async saveBulletsToDraft(bulletsData) {
        try {
            console.log('Saving bullets to draft:', this.draftId);
            
            // Add longer timeout for large data
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
            
            const response = await fetch(`/api/drafts/${this.draftId}/bullets`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    extractedBullets: bulletsData
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`Failed to save bullets: ${response.status}`);
            }
            
            console.log('Bullets saved to draft successfully');
            
        } catch (error) {
            console.error('Error saving bullets to draft:', error);
            throw error; // Re-throw to properly handle the error
        }
    }

    async loadSavedBullets() {
        try {
            if (this.draftData.extractedBullets) {
                console.log('Loading saved bullets from draft');
                
                // Use EditorUtils to display the saved bullets (skip auto-generation since these are saved)
                if (window.EditorUtils) {
                    const editorUtils = new window.EditorUtils();
                    await editorUtils.displayBullets(this.draftData.extractedBullets, window.privacyManager, true);
                    
                    // Update bullets container message
                    const bulletsContainer = document.getElementById('bulletsContainer');
                    if (bulletsContainer) {
                        const infoDiv = bulletsContainer.querySelector('.info-message');
                        if (infoDiv) {
                            infoDiv.innerHTML = `
                                <div class="info-message" style="padding: 20px; border: 1px solid #ddd; border-radius: 5px; margin: 10px 0;">
                                    <h4>Previously Generated Bullet Points Loaded</h4>
                                    <p>Your saved bullet points have been restored. Click "Regenerate Bullets" to create new ones from your current responses.</p>
                                    <p><strong>Bullet data:</strong> Previously saved</p>
                                </div>
                            `;
                        }
                    }
                    
                    console.log('Saved bullets loaded successfully');
                } else {
                    console.error('EditorUtils not available for loading saved bullets');
                }
            } else {
                console.log('No saved bullets found in draft');
            }
        } catch (error) {
            console.error('Error loading saved bullets:', error);
        }
    }

    async loadSavedFormattedUpdates() {
        try {
            if (this.draftData.formattedUpdates && this.draftData.formattedUpdates !== null) {
                console.log('Loading saved formatted updates from draft');
                console.log('Raw formattedUpdates data:', this.draftData.formattedUpdates);
                console.log('Type of formattedUpdates:', typeof this.draftData.formattedUpdates);
                
                let formattedUpdates;
                try {
                    // Try to parse as JSON if it's a string
                    if (typeof this.draftData.formattedUpdates === 'string') {
                        formattedUpdates = JSON.parse(this.draftData.formattedUpdates);
                    } else {
                        // Already an object
                        formattedUpdates = this.draftData.formattedUpdates;
                    }
                } catch (parseError) {
                    console.error('Failed to parse formatted updates JSON:', parseError);
                    console.log('Invalid JSON content:', this.draftData.formattedUpdates);
                    return;
                }
                
                // Validate that we have actual update data
                if (!formattedUpdates || (!formattedUpdates.published && !formattedUpdates.internal)) {
                    console.log('No valid formatted updates data found');
                    return;
                }
                
                // Show the formatted updates section
                const formattedSection = document.getElementById('formattedUpdatesSection');
                if (formattedSection) {
                    formattedSection.classList.add('active');
                }
                
                // Wait for DOM to be ready before displaying
                setTimeout(() => {
                    // Use UpdateGenerator to display the saved formatted updates
                    if (window.updateGenerator && window.updateGenerator.displayUpdates) {
                        window.updateGenerator.displayUpdates(formattedUpdates);
                        console.log('Saved formatted updates loaded successfully');
                    } else if (window.UpdateGenerator) {
                        // Fallback: create temporary instance just for display
                        const tempGenerator = new window.UpdateGenerator();
                        if (tempGenerator.displayUpdates) {
                            tempGenerator.displayUpdates(formattedUpdates);
                            console.log('Saved formatted updates loaded successfully (fallback)');
                        } else {
                            console.error('UpdateGenerator displayUpdates method not found');
                        }
                    } else {
                        console.error('UpdateGenerator not available for loading saved formatted updates');
                    }
                }, 500); // Give DOM time to render
                
            } else {
                console.log('No saved formatted updates found in draft (null or missing)');
            }
        } catch (error) {
            console.error('Error loading saved formatted updates:', error);
        }
    }

    // Regenerate formatted updates from existing bullets
    async regenerateUpdatesFromBullets() {
        try {
            console.log('Regenerating formatted updates from existing bullets...');
            
            // Get current bullet data from the editor
            if (!window.bulletEditor) {
                this.showMessage('No bullet points available. Please extract bullets first.', 'error');
                return;
            }
            
            const bulletData = await window.bulletEditor.save();
            
            if (!bulletData || !bulletData.blocks || bulletData.blocks.length === 0) {
                this.showMessage('No bullet points found. Please extract bullets first.', 'error');
                return;
            }
            
            // Find the list block with the bullet data
            const listBlock = bulletData.blocks.find(block => block.type === 'list');
            if (!listBlock) {
                this.showMessage('No bullet list found. Please extract bullets first.', 'error');
                return;
            }
            
            console.log('Found bullet data for regeneration:', listBlock);
            
            // Clear existing formatted updates
            this.clearFormattedUpdatesOnly();
            
            // Generate formatted updates from existing bullets
            if (window.EditorUtils) {
                const editorUtils = new window.EditorUtils();
                await editorUtils.generateFormattedUpdates(listBlock); // Pass the full listBlock with type and data
                this.showMessage('Formatted updates regenerated successfully!', 'success');
            } else {
                this.showMessage('Editor utilities not available', 'error');
            }
            
        } catch (error) {
            console.error('Error regenerating updates:', error);
            this.showMessage(`Error regenerating updates: ${error.message}`, 'error');
        }
    }

    // Clear only formatted updates (keep bullets intact for regeneration)
    clearFormattedUpdatesOnly() {
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

        console.log('Formatted updates cleared, bullets preserved');
    }

    // Submit draft as final weekly update
    async submitDraft() {
        try {
            console.log('Submitting draft as final weekly update...');
            
            // Confirm with user
            if (!confirm('Are you ready to submit this as your final weekly update? This action cannot be undone.')) {
                return;
            }
            
            // Show loading state
            if (window.uiUtils) {
                window.uiUtils.setFormDisabled(true);
                window.uiUtils.showLoading(true);
                window.uiUtils.hideError();
            }
            
            // First, ensure all current data is saved to draft
            await this.saveAllCurrentData();
            
            // Submit the draft using Convex API
            console.log('Calling draft submit API for draft:', this.draftId);
            const response = await fetch(`/api/drafts/${this.draftId}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to submit draft: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Draft submitted successfully:', result);
            
            // Generate updated summaries in the background (same as original)
            try {
                console.log('Generating updated user summaries...');
                const summaryResponse = await fetch('/api/generate-user-summaries', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username: this.draftData.username })
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
            
            // Show success message and redirect to dashboard
            if (window.uiUtils && window.uiUtils.showSuccessMessage) {
                window.uiUtils.showSuccessMessage(
                    'Update submitted successfully! Redirecting to dashboard...',
                    `/dashboard?user=${encodeURIComponent(this.draftData.username)}`,
                    2000
                );
            } else {
                this.showMessage('Update submitted successfully! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = `/dashboard?user=${encodeURIComponent(this.draftData.username)}`;
                }, 2000);
            }
            
        } catch (error) {
            console.error('Error submitting draft:', error);
            if (window.uiUtils) {
                window.uiUtils.showError(`Error submitting update: ${error.message}`);
            } else {
                this.showMessage(`Error submitting update: ${error.message}`, 'error');
            }
        } finally {
            if (window.uiUtils) {
                window.uiUtils.setFormDisabled(false);
                window.uiUtils.showLoading(false);
            }
        }
    }
    
    // Save all current editor data to draft before submitting
    async saveAllCurrentData() {
        try {
            console.log('Saving all current data before submission...');
            
            // Save current bullets if editor exists
            if (window.bulletEditor) {
                const bulletData = await window.bulletEditor.save();
                if (bulletData && bulletData.blocks && bulletData.blocks.length > 0) {
                    const listBlock = bulletData.blocks.find(block => block.type === 'list');
                    if (listBlock) {
                        await this.saveBulletsToDraft(listBlock);
                    }
                }
            }
            
            // Save current formatted updates if they exist
            if (window.updateGenerator && window.updateGenerator.updateEditors) {
                const formattedUpdates = {};
                
                if (window.updateGenerator.updateEditors.published) {
                    const publishedData = await window.updateGenerator.updateEditors.published.save();
                    formattedUpdates.published = publishedData;  // Direct assignment like the original!
                }
                
                if (window.updateGenerator.updateEditors.internal) {
                    const internalData = await window.updateGenerator.updateEditors.internal.save();
                    formattedUpdates.internal = internalData;   // Direct assignment like the original!
                }
                
                if (formattedUpdates.published || formattedUpdates.internal) {
                    await this.saveFormattedUpdatesToDraft(formattedUpdates);
                }
            }
            
            console.log('All current data saved to draft');
            
        } catch (error) {
            console.error('Error saving current data:', error);
            // Continue with submission even if save fails
        }
    }

    // Check if initial content needs to be generated and trigger it
    async checkAndGenerateInitialContent() {
        try {
            // Check if bullets already exist
            if (this.draftData.extractedBullets) {
                console.log('Bullets already exist, skipping initial generation');
                return;
            }
            
            console.log('No bullets found, triggering initial content generation...');
            
            // Show loading states for both bullets and formatted updates
            this.showBulletsGenerating();
            this.showFormattedUpdatesGenerating();
            
            // Call the API to generate initial content
            const response = await fetch(`/api/drafts/${this.draftId}/generate-initial`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('Initial content generated:', result);
                
                // Reload the draft data to get the new content
                await this.loadDraft();
                
                // Reload the saved content to display it properly
                this.loadSavedBullets();
                this.loadSavedFormattedUpdates();
                
                // Show success message
                this.showMessage('Initial bullets and updates generated successfully!', 'success');
            } else {
                console.warn('Initial content generation failed, user can manually regenerate');
                
                // Show ready state for manual generation
                this.showBulletsReady();
                this.hideFormattedUpdatesGenerating();
            }
            
        } catch (error) {
            console.error('Error checking/generating initial content:', error);
            // Don't show error to user - they can manually regenerate
        }
    }

    // Show bullets are being generated
    showBulletsGenerating() {
        const bulletsSection = document.getElementById('bulletsSection');
        if (bulletsSection) {
            bulletsSection.style.display = 'block';
        }
        
        const editorContainer = document.getElementById('editorjs');
        if (editorContainer) {
            editorContainer.innerHTML = `
                <div class="generation-loading" style="padding: 30px; text-align: center; border: 2px dashed #e0e0e0; border-radius: 8px; background: #f9f9f9;">
                    <div class="spinner" style="margin: 0 auto 20px;"></div>
                    <h3 style="color: #333; margin-bottom: 10px;">🔄 Extracting Bullet Points...</h3>
                    <p style="color: #666;">Analyzing your question responses and identifying key accomplishments, challenges, and priorities.</p>
                    <p style="color: #999; font-size: 0.9em; margin-top: 10px;">This usually takes 10-15 seconds</p>
                </div>
            `;
        }
    }
    
    // Show bullets are ready for manual generation
    showBulletsReady() {
        const editorContainer = document.getElementById('editorjs');
        if (editorContainer) {
            editorContainer.innerHTML = `
                <div class="ready-message" style="padding: 30px; text-align: center; border: 2px dashed #e0e0e0; border-radius: 8px; background: #f9f9f9;">
                    <h3 style="color: #333; margin-bottom: 10px;">Ready to Generate Bullets</h3>
                    <p style="color: #666;">Click "Regenerate Bullets" above to extract bullet points from your question responses.</p>
                </div>
            `;
        }
    }
    
    // Show formatted updates are being generated
    showFormattedUpdatesGenerating() {
        const formattedSection = document.getElementById('formattedUpdatesSection');
        if (formattedSection) {
            formattedSection.classList.add('active');
        }
        
        const formattedContainer = document.getElementById('formattedUpdates');
        if (formattedContainer) {
            formattedContainer.innerHTML = `
                <div class="generation-loading" style="padding: 30px; text-align: center; border: 2px dashed #e0e0e0; border-radius: 8px; background: #f9f9f9;">
                    <div class="spinner" style="margin: 0 auto 20px;"></div>
                    <h3 style="color: #333; margin-bottom: 10px;">✨ Generating Formatted Updates...</h3>
                    <p style="color: #666;">Creating professional summaries from your bullet points for both public and internal use.</p>
                    <p style="color: #999; font-size: 0.9em; margin-top: 10px;">This usually takes 20-30 seconds</p>
                </div>
            `;
        }
    }
    
    // Hide formatted updates generating state
    hideFormattedUpdatesGenerating() {
        const formattedSection = document.getElementById('formattedUpdatesSection');
        if (formattedSection) {
            formattedSection.classList.remove('active');
        }
    }

    showMessage(message, type = 'info') {
        console.log('Showing message:', message, type);
        
        // Create a temporary message element
        const messageEl = document.createElement('div');
        messageEl.className = `message-toast ${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 4px;
            color: white;
            font-weight: 500;
            z-index: 1000;
        `;
        
        if (type === 'success') {
            messageEl.style.backgroundColor = '#059669';
        } else if (type === 'error') {
            messageEl.style.backgroundColor = '#dc2626';
        } else {
            messageEl.style.backgroundColor = '#0f172a';
        }
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.remove();
        }, 3000);
    }
}

// Initialize when page loads - multiple approaches for reliability
console.log('Setting up DOM ready listener...');

function initializeDraftEditor() {
    console.log('Initializing DraftEditor');
    try {
        new DraftEditor();
    } catch (error) {
        console.error('Error initializing DraftEditor:', error);
    }
}

// Try multiple initialization methods
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded fired');
    setTimeout(() => {
        console.log('Initializing DraftEditor after DOMContentLoaded timeout');
        initializeDraftEditor();
    }, 500);
});

// Backup initialization - check if DOM is already ready
if (document.readyState === 'loading') {
    console.log('Document is still loading, waiting for DOMContentLoaded');
} else {
    console.log('Document already loaded, initializing immediately');
    setTimeout(() => {
        console.log('Initializing DraftEditor after immediate timeout');
        initializeDraftEditor();
    }, 1000);
}

// Third backup - window.onload
window.addEventListener('load', () => {
    console.log('Window load event fired');
    setTimeout(() => {
        console.log('Initializing DraftEditor after window load');
        initializeDraftEditor();
    }, 1500);
});

console.log('Draft editor setup complete');