// Viewer functionality - same as dashboard but filters private content
class Viewer {
    constructor() {
        this.targetUser = null;
        this.viewerUser = null;
        this.updates = [];
        
        // Initialize modular components (reuse existing ones)
        this.chartManager = new ChartManager();
        this.contentRenderer = new ContentRenderer();
        this.summaryManager = new DashboardSummaryManager(this.contentRenderer);
        this.recommendationsManager = new RecommendationsManager();
        this.ui = window.uiUtils;
        
        this.init();
    }

    async init() {
        // Get target username from URL path
        const pathParts = window.location.pathname.split('/');
        this.targetUser = decodeURIComponent(pathParts[pathParts.length - 1]);
        
        // Get viewer username from URL params
        const urlParams = new URLSearchParams(window.location.search);
        this.viewerUser = urlParams.get('user');
        
        console.log(`Viewer: ${this.viewerUser} viewing ${this.targetUser}`);
        
        // Update UI with usernames
        this.updateUserDisplay();
        
        this.setupEventListeners();
        
        // Load target user's data (filtered)
        if (this.targetUser) {
            await this.loadUserUpdates(this.targetUser);
            // Default to summary tab in viewer mode
            await this.summaryManager.loadUserSummaries(this.targetUser, true);
        }
    }

    updateUserDisplay() {
        const targetUsernameElements = document.querySelectorAll('#targetUsername, #heroTargetUsername');
        targetUsernameElements.forEach(el => {
            if (el) el.textContent = this.targetUser || 'Unknown User';
        });
    }

    setupEventListeners() {
        // Set up tab event listeners (same as dashboard)
        this.setupTabEventListeners();
    }

    setupTabEventListeners() {
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    switchTab(tabName) {
        // Update button states
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            }
        });

        // Update tab content visibility
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            content.classList.remove('active');
        });

        const activeTab = document.getElementById(`${tabName}Tab`);
        if (activeTab) {
            activeTab.classList.add('active');
        }

        // Load summary data if switching to summary tab
        if (tabName === 'summary' && this.targetUser) {
            // Load summaries for target user (filtered)
            this.summaryManager.loadUserSummaries(this.targetUser, true); // true = public mode
        }

        // Load recommendations if switching to recommendations tab
        if (tabName === 'recommendations' && this.targetUser) {
            // Load recommendations for target user (public data only)
            this.recommendationsManager.loadUserRecommendations(this.targetUser, false);
        }
    }

    async loadUserUpdates(username) {
        this.ui.showDashboardLoading(true);
        this.ui.hideDashboardError();
        this.ui.hideDashboardEmpty();

        try {
            console.log(`Loading updates for user: ${username} (viewer mode)`);
            
            // Use public viewer API endpoint
            const response = await fetch(`/api/viewer-updates/${username}?viewer=${encodeURIComponent(this.viewerUser || 'anonymous')}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.updates = data.updates || [];
            
            console.log(`Loaded ${this.updates.length} filtered updates`);
            
            if (this.updates.length === 0) {
                this.ui.showDashboardEmpty(true);
                this.chartManager.hideChart();
                this.ui.hideDashboardTabs();
            } else {
                await this.displayUpdates();
                this.chartManager.displayChart(this.updates);
                this.ui.showDashboardTabs();
                
                // If Summary tab is active, reload summaries for the target user
                const activeSummaryTab = document.querySelector('.tab-button.active[data-tab="summary"]');
                if (activeSummaryTab) {
                    await this.summaryManager.loadUserSummaries(username, true); // true = public mode
                }
            }
            
        } catch (error) {
            console.error('Error loading updates:', error);
            this.ui.showDashboardError('Failed to load updates for this user');
        } finally {
            this.ui.showDashboardLoading(false);
        }
    }

    async displayUpdates() {
        const container = document.getElementById('dashboardUpdates');
        container.innerHTML = '';

        for (let i = 0; i < this.updates.length; i++) {
            const update = this.updates[i];
            const updateElement = await this.createUpdateElement(update, i);
            container.appendChild(updateElement);
        }

        // Show the updates container
        container.style.display = 'block';
    }

    async createUpdateElement(update, index) {
        const updateDiv = document.createElement('div');
        updateDiv.className = 'dashboard-update viewer-single-update';
        
        const publishedId = `update-published-${index}`;
        
        // Only show published updates, never internal notes
        updateDiv.innerHTML = `
            <div class="update-header">
                <h3 class="update-date">Week of ${this.contentRenderer.formatDate(update.weekDate)}</h3>
                ${this.contentRenderer.renderNorthStar(update.northStarValue, update.northStarMetric)}
                <div class="update-meta">
                    <span class="update-created">Created: ${this.contentRenderer.formatDateTime(update.createdAt)}</span>
                    ${update.updatedAt !== update.createdAt ? `<span class="update-modified">Modified: ${this.contentRenderer.formatDateTime(update.updatedAt)}</span>` : ''}
                </div>
            </div>
            
            <div class="update-content viewer-single-column">
                ${this.contentRenderer.renderFormattedUpdate(update.formattedUpdates.published, 'Published Update', 'published', publishedId)}
            </div>
        `;
        
        // Render the content after adding to DOM
        setTimeout(() => {
            this.contentRenderer.renderUpdateContent(update.formattedUpdates.published, publishedId);
            
            // Force single column layout for viewer
            const updateContent = updateDiv.querySelector('.update-content');
            if (updateContent) {
                updateContent.style.display = 'block';
                updateContent.style.gridTemplateColumns = 'none';
                updateContent.style.width = '100%';
                
                const formattedUpdate = updateContent.querySelector('.formatted-update');
                if (formattedUpdate) {
                    formattedUpdate.style.width = '100%';
                    formattedUpdate.style.maxWidth = '100%';
                    formattedUpdate.style.margin = '0';
                }
            }
        }, 0);
        
        return updateDiv;
    }
}

// Export Viewer class for use in other modules
window.Viewer = Viewer;

// Initialize viewer when page loads (if not already done)
document.addEventListener('DOMContentLoaded', () => {
    if (!window.viewerApp) {
        window.viewerApp = new Viewer();
        console.log('Viewer initialized via DOMContentLoaded');
    }
});