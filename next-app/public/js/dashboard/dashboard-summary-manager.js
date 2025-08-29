// Dashboard summary management utility
class DashboardSummaryManager {
    constructor(contentRenderer) {
        this.contentRenderer = contentRenderer || new ContentRenderer();
        this.summaries = null;
        this.container = document.getElementById('userSummaryContainer');
    }

    // Load user summaries from API
    async loadUserSummaries(username) {
        try {
            console.log(`Loading summaries for user: ${username}`);
            const response = await fetch(`/api/user-summaries/${username}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.summaries = data;
            
            console.log('User summaries loaded:', data);
            this.displaySummaries();
            
        } catch (error) {
            console.error('Error loading user summaries:', error);
            this.displaySummaryError();
        }
    }

    // Display loaded summaries
    displaySummaries() {
        if (!this.summaries || (!this.summaries.public_summary && !this.summaries.personal_summary)) {
            this.displaySummaryError();
            return;
        }

        if (!this.container) {
            console.error('Summary container not found');
            return;
        }

        this.container.innerHTML = '';

        // Public Summary
        if (this.summaries.public_summary) {
            const publicCard = this.createSummaryCard('Public Summary', this.summaries.public_summary, 'public');
            this.container.appendChild(publicCard);
        }

        // Personal Summary
        if (this.summaries.personal_summary) {
            const personalCard = this.createSummaryCard('Personal Summary', this.summaries.personal_summary, 'personal');
            this.container.appendChild(personalCard);
        }
    }

    // Create individual summary card
    createSummaryCard(title, content, type) {
        const card = document.createElement('div');
        card.className = 'summary-card';
        
        card.innerHTML = `
            <div class="summary-header">
                <h3 class="summary-type-title">${title}</h3>
                <span class="summary-badge ${type}">${type}</span>
            </div>
            <div class="summary-content" id="${type}-summary-content"></div>
        `;
        
        // Render markdown content after adding to DOM
        setTimeout(() => {
            this.contentRenderer.renderMarkdown(content, `${type}-summary-content`);
        }, 0);
        
        return card;
    }

    // Display error when summaries can't be loaded
    displaySummaryError() {
        if (!this.container) {
            console.error('Summary container not found');
            return;
        }

        this.container.innerHTML = `
            <div class="summary-card">
                <div class="summary-header">
                    <h3 class="summary-type-title">No Summaries Available</h3>
                </div>
                <div class="summary-content">
                    <p>Summaries have not been generated for this user yet. Summaries are automatically created when weekly updates are submitted.</p>
                </div>
            </div>
        `;
    }

    // Clear summary container
    clearSummaries() {
        if (this.container) {
            this.container.innerHTML = '';
        }
        this.summaries = null;
    }

    // Get current summaries data
    getCurrentSummaries() {
        return this.summaries;
    }
}

// Export for global use
window.DashboardSummaryManager = DashboardSummaryManager;