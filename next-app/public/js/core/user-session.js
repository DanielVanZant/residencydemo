// User session management utility
class UserSession {
    constructor() {
        this.storageKey = 'selectedUser';
    }

    // Save selected user to localStorage
    setUser(username) {
        if (username) {
            localStorage.setItem(this.storageKey, username);
            console.log(`User session set to: ${username}`);
        } else {
            this.clearUser();
        }
    }

    // Get selected user from localStorage
    getUser() {
        return localStorage.getItem(this.storageKey);
    }

    // Clear selected user
    clearUser() {
        localStorage.removeItem(this.storageKey);
        console.log('User session cleared');
    }

    // Check if user is logged in
    hasUser() {
        return !!this.getUser();
    }

    // Restore user selection in dropdown
    restoreUserSelection(selectElement) {
        const savedUser = this.getUser();
        if (savedUser && selectElement) {
            // Check if the option exists in the dropdown
            const option = selectElement.querySelector(`option[value="${savedUser}"]`);
            if (option) {
                selectElement.value = savedUser;
                console.log(`Restored user selection: ${savedUser}`);
                return savedUser;  // Return the username instead of true
            } else {
                console.warn(`Saved user "${savedUser}" not found in dropdown options`);
                this.clearUser(); // Clear invalid user
                return null;
            }
        }
        return null;
    }

    // Set up user change handler for dropdown
    setupUserChangeHandler(selectElement, callback) {
        if (selectElement) {
            selectElement.addEventListener('change', (event) => {
                const selectedUser = event.target.value;
                this.setUser(selectedUser);
                if (callback) {
                    callback(selectedUser);
                }
            });
        }
    }

    // Populate user dropdown from API
    async populateUserDropdown(selectElementId, callback = null) {
        try {
            const apiUrl = (typeof API_CONFIG !== 'undefined' && API_CONFIG.API_BASE_URL) 
                ? `${API_CONFIG.API_BASE_URL}/api/users`
                : '/api/users';
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            const userSelect = document.getElementById(selectElementId);
            
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
            
            // Restore saved user selection after dropdown is populated
            const savedUser = this.restoreUserSelection(userSelect);
            
            // Set up change handler
            this.setupUserChangeHandler(userSelect, callback);
            
            // Return saved user for initial callback
            return savedUser;
            
        } catch (error) {
            console.error('Error loading users:', error);
            throw error;
        }
    }
}

// Global user session instance
window.userSession = new UserSession();