// Simple homepage functionality for displaying user list  
class Homepage {
    constructor() {
        this.users = [];
        this.init();
    }

    async init() {
        await this.loadAllUsers();
    }

    async loadAllUsers() {
        this.showLoading(true);
        this.hideError();
        this.hideEmpty();

        try {
            console.log('Loading all users...');
            const response = await fetch('/api/users');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.users = data.users.filter(user => user.north_star_metric) || [];
            
            console.log(`Loaded ${this.users.length} users`);
            
            if (this.users.length === 0) {
                this.showEmpty(true);
            } else {
                this.displayUsers();
            }
            
        } catch (error) {
            console.error('Error loading users:', error);
            this.showError('Failed to load users');
        } finally {
            this.showLoading(false);
        }
    }

    displayUsers() {
        const container = document.getElementById('summariesContainer');
        container.innerHTML = '';

        this.users.forEach((user, index) => {
            const userElement = this.createUserElement(user, index);
            container.appendChild(userElement);
        });

        // Show the container
        container.style.display = 'block';
    }

    createUserElement(user, index) {
        const userDiv = document.createElement('div');
        userDiv.className = 'user-card';
        
        userDiv.innerHTML = `
            <div class="user-header">
                <div class="user-info">
                    <h2 class="username">${this.escapeHtml(user.username)}</h2>
                    <div class="user-metric">
                        <span class="metric-label">${this.escapeHtml(user.north_star_metric.toLowerCase())}</span>
                        <span class="metric-description">${this.escapeHtml(user.north_star_description || '')}</span>
                    </div>
                </div>
                <div class="user-actions">
                    <a href="/dashboard.html?user=${encodeURIComponent(user.username)}" class="btn btn-primary">View Dashboard</a>
                    <a href="/weekly-update.html" class="btn btn-secondary">New Update</a>
                </div>
            </div>
        `;
        
        return userDiv;
    }

    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showLoading(show) {
        const loadingEl = document.getElementById('homeLoading');
        loadingEl.style.display = show ? 'block' : 'none';
    }

    showError(message) {
        const errorEl = document.getElementById('homeError');
        if (message) {
            errorEl.querySelector('p').textContent = message;
        }
        errorEl.style.display = 'block';
    }

    hideError() {
        const errorEl = document.getElementById('homeError');
        errorEl.style.display = 'none';
    }

    showEmpty(show) {
        const emptyEl = document.getElementById('homeEmpty');
        emptyEl.style.display = show ? 'block' : 'none';
    }

    hideEmpty() {
        this.showEmpty(false);
    }
}

// Initialize homepage when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.homepage = new Homepage();
});