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
}

// Global user session instance
window.userSession = new UserSession();