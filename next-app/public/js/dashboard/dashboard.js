// Refactored Dashboard functionality using modular components
class Dashboard {
    constructor() {
        this.currentUser = null;
        this.updates = [];
        
        // Initialize modular components
        this.chartManager = new ChartManager();
        this.contentRenderer = new ContentRenderer();
        this.summaryManager = new DashboardSummaryManager(this.contentRenderer);
        this.ui = window.uiUtils; // Use global ui utils instance
        
        this.init();
    }

    async init() {
        // Use existing user session functionality instead of duplicating
        const savedUser = await window.userSession.populateUserDropdown('dashboardUser', async (selectedUser) => {
            await this.handleUserChange(selectedUser);
        });

        this.setupEventListeners();
        
        // Load data for saved user or URL param user
        if (savedUser) {
            await this.loadUserUpdates(savedUser);
        } else {
            // Check for user in URL params as fallback
            const urlParams = new URLSearchParams(window.location.search);
            const user = urlParams.get('user');
            if (user) {
                const userSelect = document.getElementById('dashboardUser');
                userSelect.value = user;
                window.userSession.setUser(user);
                await this.loadUserUpdates(user);
            }
        }
    }

    setupEventListeners() {
        // Set up tab event listeners
        this.setupTabEventListeners();
    }

    async handleUserChange(selectedUser) {
        if (selectedUser) {
            // Update URL without page reload
            const url = new URL(window.location);
            url.searchParams.set('user', selectedUser);
            window.history.pushState({}, '', url);
            
            await this.loadUserUpdates(selectedUser);
        } else {
            this.clearDashboard();
            // Clear URL param when no user selected
            const url = new URL(window.location);
            url.searchParams.delete('user');
            window.history.pushState({}, '', url);
        }
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
        if (tabName === 'summary' && this.currentUser) {
            // Always reload summaries to ensure we get the right user's data
            this.summaryManager.loadUserSummaries(this.currentUser);
        }
    }

    async loadUserUpdates(username) {
        this.currentUser = username;
        this.summaryManager.clearSummaries(); // Clear cached summaries when switching users
        
        this.ui.showDashboardLoading(true);
        this.ui.hideDashboardError();
        this.ui.hideDashboardEmpty();

        try {
            console.log(`Loading updates for user: ${username}`);
            const response = await fetch(`/api/user-updates/${username}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.updates = data.updates || [];
            
            console.log(`Loaded ${this.updates.length} updates`);
            
            if (this.updates.length === 0) {
                this.ui.showDashboardEmpty(true);
                this.chartManager.hideChart();
                this.ui.hideDashboardTabs();
            } else {
                await this.displayUpdates();
                this.chartManager.displayChart(this.updates);
                this.ui.showDashboardTabs();
                
                // If Summary tab is active, reload summaries for the new user
                const activeSummaryTab = document.querySelector('.tab-button.active[data-tab="summary"]');
                if (activeSummaryTab) {
                    await this.summaryManager.loadUserSummaries(username);
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
        updateDiv.className = 'dashboard-update';
        
        const publishedId = `update-published-${index}`;
        const internalId = `update-internal-${index}`;
        
        updateDiv.innerHTML = `
            <div class="update-header">
                <h3 class="update-date">Week of ${this.contentRenderer.formatDate(update.weekDate)}</h3>
                ${this.contentRenderer.renderNorthStar(update.northStarValue, update.northStarMetric)}
                <div class="update-meta">
                    <span class="update-created">Created: ${this.contentRenderer.formatDateTime(update.createdAt)}</span>
                    ${update.updatedAt !== update.createdAt ? `<span class="update-modified">Modified: ${this.contentRenderer.formatDateTime(update.updatedAt)}</span>` : ''}
                </div>
            </div>
            
            <div class="update-content">
                ${this.contentRenderer.renderFormattedUpdate(update.formattedUpdates.published, 'Published Update', 'published', publishedId)}
                ${this.contentRenderer.renderFormattedUpdate(update.formattedUpdates.internal, 'Internal Notes', 'internal', internalId)}
            </div>
        `;
        
        // Render the content after adding to DOM
        setTimeout(() => {
            this.contentRenderer.renderUpdateContent(update.formattedUpdates.published, publishedId);
            this.contentRenderer.renderUpdateContent(update.formattedUpdates.internal, internalId);
        }, 0);
        
        return updateDiv;
    }

    clearDashboard() {
        const updatesContainer = document.getElementById('dashboardUpdates');
        updatesContainer.innerHTML = '';
        updatesContainer.style.display = 'none';
        
        this.ui.hideDashboardError();
        this.ui.hideDashboardEmpty();
        this.ui.showDashboardLoading(false);
        
        this.chartManager.hideChart();
        this.ui.hideDashboardTabs();
        
        this.summaryManager.clearSummaries();
        
        // Reset to updates tab
        this.switchTab('updates');
    }
}

// Export Dashboard class for use in other modules
window.Dashboard = Dashboard;

// Initialize dashboard when page loads (if not already done)
document.addEventListener('DOMContentLoaded', () => {
    if (!window.dashboardApp) {
        window.dashboardApp = new Dashboard();
        console.log('Dashboard initialized via DOMContentLoaded');
    }
});