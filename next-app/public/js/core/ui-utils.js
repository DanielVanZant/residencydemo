// UI utility functions for loading states, errors, and messages
class UIUtils {
    constructor() {
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.errorMessage = document.getElementById('errorMessage');
        this.bulletsSection = document.getElementById('bulletsSection');
    }

    // Show/hide loading spinner
    showLoading(show) {
        if (this.loadingSpinner) {
            this.loadingSpinner.classList.toggle('active', show);
        }
    }

    // Show error message
    showError(message) {
        if (this.errorMessage) {
            this.errorMessage.textContent = message;
            this.errorMessage.classList.add('active');
        }
    }

    // Hide error message
    hideError() {
        if (this.errorMessage) {
            this.errorMessage.classList.remove('active');
        }
    }

    // Hide bullets section
    hideBullets() {
        if (this.bulletsSection) {
            this.bulletsSection.classList.remove('active');
        }
    }

    // Show success message near the submit button
    showSuccessMessage(message, redirectUrl = null, redirectDelay = 3000) {
        // Create or reuse success message element in submit section
        let successDiv = document.getElementById('submitSuccessMessage');
        if (!successDiv) {
            successDiv = document.createElement('div');
            successDiv.id = 'submitSuccessMessage';
            successDiv.className = 'submit-success-message';
            
            // Insert in the submit container
            const submitContainer = document.querySelector('.submit-container');
            if (submitContainer) {
                // Simply append to the container
                submitContainer.appendChild(successDiv);
            } else {
                // Fallback: append to body if container not found
                document.body.appendChild(successDiv);
            }
        }
        
        successDiv.textContent = message;
        successDiv.classList.add('active');
        
        // Auto-hide and optionally redirect
        setTimeout(() => {
            successDiv.classList.remove('active');
            
            if (redirectUrl) {
                window.location.href = redirectUrl;
            }
        }, redirectDelay);
    }

    // Show temporary notification
    showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 16px',
            borderRadius: '4px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500',
            zIndex: '1000',
            maxWidth: '300px',
            wordWrap: 'break-word'
        });

        // Set background color based on type
        const colors = {
            success: '#10B981',
            error: '#EF4444',
            warning: '#F59E0B',
            info: '#3B82F6'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        // Auto-remove
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, duration);
        
        return notification;
    }

    // Validate that form has content before processing
    validateFormContent(formData) {
        const hasContent = Object.values(formData).some(value => 
            value && value.toString().trim().length > 0
        );
        
        if (!hasContent) {
            this.showError('Please fill in at least one field before processing');
            return false;
        }
        
        return true;
    }

    // Disable/enable form during processing
    setFormDisabled(disabled) {
        const form = document.getElementById('updateForm');
        if (form) {
            const formElements = form.querySelectorAll('input, textarea, button, select');
            formElements.forEach(element => {
                element.disabled = disabled;
            });
        }
    }

    // Show confirmation dialog
    confirm(message, title = 'Confirm') {
        return window.confirm(`${title}\n\n${message}`);
    }

    // Get element safely (returns null if not found)
    getElement(id) {
        return document.getElementById(id);
    }

    // Check if element exists and is visible
    isElementVisible(id) {
        const element = document.getElementById(id);
        return element && element.offsetParent !== null;
    }

    // Dashboard-specific UI state management
    showDashboardLoading(show) {
        const loadingEl = document.getElementById('dashboardLoading');
        if (loadingEl) {
            loadingEl.style.display = show ? 'block' : 'none';
        }
    }

    showDashboardError(message) {
        const errorEl = document.getElementById('dashboardError');
        if (errorEl) {
            if (message) {
                const messageEl = errorEl.querySelector('p');
                if (messageEl) {
                    messageEl.textContent = message;
                }
            }
            errorEl.style.display = 'block';
        }
    }

    hideDashboardError() {
        const errorEl = document.getElementById('dashboardError');
        if (errorEl) {
            errorEl.style.display = 'none';
        }
    }

    showDashboardEmpty(show) {
        const emptyEl = document.getElementById('dashboardEmpty');
        if (emptyEl) {
            emptyEl.style.display = show ? 'block' : 'none';
        }
    }

    hideDashboardEmpty() {
        this.showDashboardEmpty(false);
    }

    showDashboardTabs() {
        const tabsContainer = document.getElementById('dashboardTabs');
        if (tabsContainer) {
            tabsContainer.style.display = 'flex';
        }
    }

    hideDashboardTabs() {
        const tabsContainer = document.getElementById('dashboardTabs');
        if (tabsContainer) {
            tabsContainer.style.display = 'none';
        }
    }

    // Users page UI state management
    showUsersLoading(show) {
        const loadingEl = document.getElementById('usersLoading');
        if (loadingEl) {
            loadingEl.style.display = show ? 'block' : 'none';
        }
    }

    showUsersError(message) {
        const errorEl = document.getElementById('usersError');
        if (errorEl) {
            if (message) {
                const messageEl = errorEl.querySelector('p');
                if (messageEl) {
                    messageEl.textContent = message;
                }
            }
            errorEl.style.display = 'block';
        }
    }

    hideUsersError() {
        const errorEl = document.getElementById('usersError');
        if (errorEl) {
            errorEl.style.display = 'none';
        }
    }

    showUsersEmpty(show) {
        const emptyEl = document.getElementById('usersEmpty');
        if (emptyEl) {
            emptyEl.style.display = show ? 'block' : 'none';
        }
    }

    hideUsersEmpty() {
        this.showUsersEmpty(false);
    }

    showUsersGrid() {
        const gridEl = document.getElementById('usersGrid');
        if (gridEl) {
            gridEl.style.display = 'block';
        }
    }

    hideUsersGrid() {
        const gridEl = document.getElementById('usersGrid');
        if (gridEl) {
            gridEl.style.display = 'none';
        }
    }
}

// Export for global use
window.UIUtils = UIUtils;

// Create global instance
window.uiUtils = new UIUtils();