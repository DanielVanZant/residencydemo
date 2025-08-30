// Simple Draft Editor - minimal dependencies
console.log('Simple Draft Editor loading...');

class SimpleDraftEditor {
    constructor() {
        console.log('SimpleDraftEditor constructor called');
        this.draftId = null;
        this.draftData = null;
        this.initialize();
    }

    async initialize() {
        console.log('Initializing simple draft editor...');
        
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
        
        // Setup event listeners
        this.setupEventListeners();
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
            
            this.displayDraft();
            
        } catch (error) {
            console.error('Error loading draft:', error);
            this.showError(`Failed to load draft: ${error.message}`);
        }
    }

    displayDraft() {
        console.log('Displaying draft data');
        
        // Hide loading, show main content
        document.getElementById('loadingSection').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        
        // Populate draft info
        document.getElementById('draftUsername').textContent = this.draftData.username;
        document.getElementById('draftDate').textContent = this.draftData.weekDate;
        document.getElementById('draftCreated').textContent = new Date(this.draftData.createdAt).toLocaleDateString();
        
        // Display question responses
        this.displayQuestionResponses();
        
        // Show formatted updates section
        document.getElementById('formattedUpdatesSection').classList.add('active');
        
        // Show helpful message for bullet generation
        const bulletsContainer = document.getElementById('bulletsContainer');
        if (bulletsContainer) {
            bulletsContainer.innerHTML = `
                <div class="info-message" style="padding: 20px; border: 1px solid #ddd; border-radius: 5px; margin: 10px 0;">
                    <h4>Ready to Generate Bullet Points</h4>
                    <p>Your question responses have been saved. Click "Regenerate Bullets" above to extract bullet points from your answers.</p>
                    <p><strong>Responses loaded:</strong> ${Object.keys(this.draftData.questionResponses || {}).length} questions</p>
                </div>
            `;
        }
    }

    displayQuestionResponses() {
        const container = document.getElementById('questionsSummary');
        const responses = this.draftData.questionResponses || {};
        
        const questions = [
            { key: 'accomplishments', label: 'What did you accomplish this week?' },
            { key: 'challenges-priorities', label: 'What\'s blocking you and what will you focus on next week?' },
            { key: 'dynamic-followup-detail', label: 'Follow-up Detail Question' },
            { key: 'dynamic-followup-previous', label: 'Follow-up on Previous Updates' },
        ];

        // Also include north star
        const northStarHtml = `
            <div class="response-item" style="margin-bottom: 20px; padding: 15px; border: 1px solid #eee; border-radius: 5px;">
                <h4>North Star Progress</h4>
                <div class="response-content"><strong>Value:</strong> ${this.draftData.northStarValue || 'Not set'}</div>
                <div class="response-content" style="margin-top: 10px;"><strong>Note:</strong> ${(this.draftData.northStarNote || '').substring(0, 200)}${(this.draftData.northStarNote || '').length > 200 ? '...' : ''}</div>
            </div>
        `;

        const responsesHtml = questions.map(q => {
            const value = responses[q.key] || '';
            if (!value) return '';
            
            return `
                <div class="response-item" style="margin-bottom: 20px; padding: 15px; border: 1px solid #eee; border-radius: 5px;">
                    <h4>${q.label}</h4>
                    <div class="response-content" style="white-space: pre-wrap; max-height: 200px; overflow-y: auto;">${value}</div>
                </div>
            `;
        }).filter(Boolean).join('');

        container.innerHTML = northStarHtml + responsesHtml;
    }

    setupEventListeners() {
        console.log('Setting up event listeners');
        
        // Save draft button
        document.getElementById('saveDraft')?.addEventListener('click', () => {
            console.log('Save draft clicked');
            this.showMessage('Draft save functionality coming soon...', 'info');
        });

        // Submit update button
        document.getElementById('submitUpdate')?.addEventListener('click', () => {
            console.log('Submit update clicked');
            this.showMessage('Submit functionality coming soon...', 'info');
        });

        // Delete draft button
        document.getElementById('deleteDraft')?.addEventListener('click', () => {
            console.log('Delete draft clicked');
            if (confirm('Are you sure you want to delete this draft?')) {
                this.showMessage('Delete functionality coming soon...', 'info');
            }
        });

        // Regenerate bullets button
        document.getElementById('regenerateBullets')?.addEventListener('click', () => {
            console.log('Regenerate bullets clicked');
            this.showMessage('Bullet generation functionality coming soon...', 'info');
        });

        // Try again button (for error state)
        document.getElementById('tryAgainBtn')?.addEventListener('click', () => {
            console.log('Try again clicked');
            window.location.reload();
        });
    }

    showError(message) {
        console.error('Showing error:', message);
        document.getElementById('loadingSection').style.display = 'none';
        document.getElementById('errorSection').style.display = 'block';
        document.getElementById('errorMessage').textContent = message;
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
            animation: slideIn 0.3s ease-out;
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

// Initialize when page loads - simplified approach
console.log('Setting up DOM ready listener...');

function initializeWhenReady() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('DOMContentLoaded fired, initializing...');
            new SimpleDraftEditor();
        });
    } else {
        console.log('DOM already ready, initializing immediately...');
        new SimpleDraftEditor();
    }
}

initializeWhenReady();