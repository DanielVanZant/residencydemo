// Users Directory functionality based on dashboard but showing all users
class Users {
    constructor() {
        this.allUsers = [];
        this.userUpdates = new Map();
        
        // Initialize modular components (reuse existing ones)
        this.chartManager = new ChartManager();
        this.contentRenderer = new ContentRenderer();
        this.ui = window.uiUtils;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadAllUsers();
    }

    setupEventListeners() {
        // No special event listeners needed for now
    }

    async loadAllUsers() {
        this.ui.showUsersLoading(true);
        this.ui.hideUsersError();
        this.ui.hideUsersEmpty();

        try {
            console.log('Loading all users...');
            const response = await fetch('/api/all-users');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.allUsers = data.users || [];
            
            console.log(`Loaded ${this.allUsers.length} users`);
            
            if (this.allUsers.length === 0) {
                this.ui.showUsersEmpty(true);
            } else {
                await this.displayUsers();
                this.ui.showUsersGrid();
            }
            
        } catch (error) {
            console.error('Error loading users:', error);
            this.ui.showUsersError('Failed to load users');
        } finally {
            this.ui.showUsersLoading(false);
        }
    }

    async displayUsers() {
        const container = document.getElementById('usersGrid');
        container.innerHTML = '';

        for (let i = 0; i < this.allUsers.length; i++) {
            const user = this.allUsers[i];
            const userElement = await this.createUserElement(user, i);
            container.appendChild(userElement);
        }
    }

    async createUserElement(user, index) {
        const userDiv = document.createElement('div');
        userDiv.className = 'dashboard-update user-card';
        
        // Get latest update (public info only)
        const latestUpdate = user.latestUpdate;
        
        userDiv.innerHTML = `
            <div class="update-header">
                <h3 class="user-name">${user.username}</h3>
                ${latestUpdate ? this.contentRenderer.renderNorthStar(latestUpdate.northStarValue, latestUpdate.northStarMetric) : ''}
                <div class="update-meta">
                    ${latestUpdate ? `<span class="update-created">Last Update: ${this.contentRenderer.formatDate(latestUpdate.weekDate)}</span>` : '<span class="no-updates">No updates yet</span>'}
                    <span class="total-updates">${user.totalUpdates} total update${user.totalUpdates !== 1 ? 's' : ''}</span>
                </div>
            </div>
            
            ${latestUpdate ? `
            <div class="update-content">
                ${this.contentRenderer.renderFormattedUpdate(latestUpdate.formattedUpdates.published, 'Latest Public Update', 'published', `user-update-${index}`)}
            </div>
            ` : '<div class="no-content"><p>No public updates available</p></div>'}
            
            <div class="user-actions">
                <a href="/viewer/${encodeURIComponent(user.username)}?user=me" class="btn btn-secondary btn-small">View Dashboard</a>
            </div>
        `;
        
        // Render the content after adding to DOM (only if there's content)
        if (latestUpdate && latestUpdate.formattedUpdates.published) {
            setTimeout(() => {
                this.contentRenderer.renderUpdateContent(latestUpdate.formattedUpdates.published, `user-update-${index}`);
            }, 0);
        }
        
        return userDiv;
    }
}

// Export Users class for use in other modules
window.Users = Users;

// Initialize users when page loads (if not already done)
document.addEventListener('DOMContentLoaded', () => {
    if (!window.usersApp) {
        window.usersApp = new Users();
        console.log('Users initialized via DOMContentLoaded');
    }
});