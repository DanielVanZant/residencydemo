// Dashboard functionality
class Dashboard {
    constructor() {
        this.currentUser = null;
        this.updates = [];
        this.chart = null;
        this.init();
    }

    async init() {
        await this.populateUserDropdown();
        this.setupEventListeners();
        
        // Restore saved user session or check URL params
        const userSelect = document.getElementById('dashboardUser');
        const savedUser = window.userSession.restoreUserSelection(userSelect);
        
        if (savedUser) {
            await this.loadUserUpdates(window.userSession.getUser());
        } else {
            // Check for user in URL params as fallback
            const urlParams = new URLSearchParams(window.location.search);
            const user = urlParams.get('user');
            if (user) {
                userSelect.value = user;
                window.userSession.setUser(user);
                await this.loadUserUpdates(user);
            }
        }
    }

    async populateUserDropdown() {
        try {
            const response = await fetch('/api/users');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            const userSelect = document.getElementById('dashboardUser');
            
            // Clear existing options (except the placeholder)
            while (userSelect.children.length > 1) {
                userSelect.removeChild(userSelect.lastChild);
            }
            
            // Add user options
            data.users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.username;
                option.textContent = user.username;
                userSelect.appendChild(option);
            });
            
            console.log(`Populated dropdown with ${data.users.length} users`);
        } catch (error) {
            console.error('Error loading users:', error);
            this.showError('Failed to load users');
        }
    }

    setupEventListeners() {
        const userSelect = document.getElementById('dashboardUser');
        
        // Set up user session change handler
        window.userSession.setupUserChangeHandler(userSelect, async (selectedUser) => {
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
        });
    }

    async loadUserUpdates(username) {
        this.currentUser = username;
        this.showLoading(true);
        this.hideError();
        this.hideEmpty();

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
                this.showEmpty(true);
                this.hideChart();
            } else {
                this.displayUpdates();
                this.displayChart();
            }
            
        } catch (error) {
            console.error('Error loading updates:', error);
            this.showError('Failed to load updates for this user');
        } finally {
            this.showLoading(false);
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
                <h3 class="update-date">Week of ${this.formatDate(update.weekDate)}</h3>
                ${this.renderNorthStar(update.northStarValue, update.northStarMetric)}
                <div class="update-meta">
                    <span class="update-created">Created: ${this.formatDateTime(update.createdAt)}</span>
                    ${update.updatedAt !== update.createdAt ? `<span class="update-modified">Modified: ${this.formatDateTime(update.updatedAt)}</span>` : ''}
                </div>
            </div>
            
            <div class="update-content">
                ${this.renderFormattedUpdate(update.formattedUpdates.published, 'Published Update', 'published', publishedId)}
                ${this.renderFormattedUpdate(update.formattedUpdates.internal, 'Internal Notes', 'internal', internalId)}
            </div>
        `;
        
        // Render the content after adding to DOM
        setTimeout(() => {
            this.renderUpdateContent(update.formattedUpdates.published, publishedId);
            this.renderUpdateContent(update.formattedUpdates.internal, internalId);
        }, 0);
        
        return updateDiv;
    }

    renderFormattedUpdate(updateData, title, type, contentId) {
        if (!updateData) {
            return `<div class="formatted-update ${type}">
                <h4 class="update-type-title">${title}</h4>
                <p class="no-content">No ${type} update available</p>
            </div>`;
        }
        
        return `
            <div class="formatted-update ${type}">
                <h4 class="update-type-title">${title}</h4>
                <div class="update-content-rendered" id="${contentId}"></div>
            </div>
        `;
    }

    renderUpdateContent(updateData, contentId) {
        const container = document.getElementById(contentId);
        if (!container || !updateData) return;

        if (updateData.blocks && Array.isArray(updateData.blocks)) {
            // Render Editor.js blocks as HTML
            let html = '';
            updateData.blocks.forEach(block => {
                html += this.renderBlock(block);
            });
            container.innerHTML = html;
        } else if (typeof updateData === 'string') {
            // Render as simple text with paragraph wrapping
            const paragraphs = updateData.split('\n\n').filter(p => p.trim());
            container.innerHTML = paragraphs.map(p => `<p>${p.trim()}</p>`).join('');
        } else {
            // Fallback to JSON string
            container.innerHTML = `<pre>${JSON.stringify(updateData, null, 2)}</pre>`;
        }
    }


    renderBlock(block) {
        switch (block.type) {
            case 'header':
                const level = block.data.level || 2;
                return `<h${level}>${block.data.text || ''}</h${level}>`;
            
            case 'paragraph':
                return `<p>${block.data.text || ''}</p>`;
            
            case 'list':
                const listType = block.data.style === 'ordered' ? 'ol' : 'ul';
                const items = block.data.items || [];
                const listItems = items.map(item => {
                    // Handle both string items and object items with content property
                    const text = typeof item === 'string' ? item : (item.content || '');
                    // Handle nested items if they exist
                    if (item.items && item.items.length > 0) {
                        const nestedItems = item.items.map(nested => {
                            const nestedText = typeof nested === 'string' ? nested : (nested.content || '');
                            return `<li>${nestedText}</li>`;
                        }).join('');
                        return `<li>${text}<ul>${nestedItems}</ul></li>`;
                    }
                    return `<li>${text}</li>`;
                }).join('');
                return `<${listType}>${listItems}</${listType}>`;
            
            default:
                return `<div class="unknown-block">${JSON.stringify(block.data)}</div>`;
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    formatDateTime(dateTimeString) {
        const date = new Date(dateTimeString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    renderNorthStar(value, metric) {
        // Only display the value with metric name, not the note (note is integrated into published/internal updates)
        if (!value) {
            return '';
        }
        
        const metricLabel = metric ? metric.toLowerCase() : 'metric';
        
        return `
            <div class="north-star-display">
                <div class="north-star-label">${this.escapeHtml(metricLabel)}</div>
                <div class="north-star-value">${this.escapeHtml(String(value))}</div>
            </div>
        `;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showLoading(show) {
        const loadingEl = document.getElementById('dashboardLoading');
        loadingEl.style.display = show ? 'block' : 'none';
    }

    showError(message) {
        const errorEl = document.getElementById('dashboardError');
        if (message) {
            errorEl.querySelector('p').textContent = message;
        }
        errorEl.style.display = 'block';
    }

    hideError() {
        const errorEl = document.getElementById('dashboardError');
        errorEl.style.display = 'none';
    }

    showEmpty(show) {
        const emptyEl = document.getElementById('dashboardEmpty');
        emptyEl.style.display = show ? 'block' : 'none';
    }

    hideEmpty() {
        this.showEmpty(false);
    }

    clearDashboard() {
        const updatesContainer = document.getElementById('dashboardUpdates');
        updatesContainer.innerHTML = '';
        updatesContainer.style.display = 'none';
        this.hideError();
        this.hideEmpty();
        this.showLoading(false);
        this.hideChart();
    }

    displayChart() {
        // Filter updates with north star values and sort by date
        const updatesWithNorthStar = this.updates
            .filter(update => update.northStarValue !== null && update.northStarValue !== undefined)
            .sort((a, b) => new Date(a.weekDate) - new Date(b.weekDate));

        if (updatesWithNorthStar.length === 0) {
            this.hideChart();
            return;
        }

        // Get the metric name from the first update
        const metricName = updatesWithNorthStar[0].northStarMetric || 'North Star Metric';

        // Prepare data for the chart
        const labels = updatesWithNorthStar.map(update => {
            const date = new Date(update.weekDate);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        const data = updatesWithNorthStar.map(update => parseFloat(update.northStarValue));

        // Show chart container
        const chartContainer = document.getElementById('northStarChartContainer');
        chartContainer.style.display = 'block';

        // Update chart title with metric name
        const chartTitle = chartContainer.querySelector('.chart-title');
        chartTitle.innerHTML = `<em>${metricName.toLowerCase()}</em> progress`;

        // Get canvas context
        const ctx = document.getElementById('northStarChart').getContext('2d');

        // Destroy existing chart if it exists
        if (this.chart) {
            this.chart.destroy();
        }

        // Create new chart
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: metricName,
                    data: data,
                    borderColor: '#4A5568',
                    backgroundColor: 'rgba(74, 85, 104, 0.1)',
                    borderWidth: 2,
                    pointBackgroundColor: '#4A5568',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: {
                            size: 14
                        },
                        bodyFont: {
                            size: 16
                        },
                        callbacks: {
                            title: function(context) {
                                const index = context[0].dataIndex;
                                const date = new Date(updatesWithNorthStar[index].weekDate);
                                return date.toLocaleDateString('en-US', { 
                                    weekday: 'short',
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                });
                            },
                            label: function(context) {
                                return `${metricName}: ${context.parsed.y}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 12
                            },
                            color: '#718096'
                        }
                    },
                    y: {
                        beginAtZero: false,
                        grid: {
                            borderDash: [3, 3],
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            font: {
                                size: 12
                            },
                            color: '#718096',
                            callback: function(value) {
                                // Format based on metric type
                                if (metricName.toLowerCase().includes('yield') && value < 1) {
                                    return value.toFixed(3); // Show 3 decimals for small values
                                }
                                return value;
                            }
                        }
                    }
                }
            }
        });
    }

    hideChart() {
        const chartContainer = document.getElementById('northStarChartContainer');
        chartContainer.style.display = 'none';
        
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});