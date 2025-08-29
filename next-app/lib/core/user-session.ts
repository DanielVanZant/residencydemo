// User session management utility with TypeScript
interface User {
  id?: number;
  username: string;
  north_star_metric?: string;
  north_star_description?: string;
}

interface UsersResponse {
  users: User[];
}

type UserChangeCallback = (username: string) => void | Promise<void>;

export class UserSession {
  private storageKey: string = 'selectedUser';

  // Save selected user to localStorage
  setUser(username: string | null): void {
    if (typeof window === 'undefined') return;
    
    if (username) {
      localStorage.setItem(this.storageKey, username);
      console.log(`User session set to: ${username}`);
    } else {
      this.clearUser();
    }
  }

  // Get selected user from localStorage
  getUser(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.storageKey);
  }

  // Clear selected user
  clearUser(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.storageKey);
    console.log('User session cleared');
  }

  // Check if user is logged in
  hasUser(): boolean {
    return !!this.getUser();
  }

  // Restore user selection in dropdown
  restoreUserSelection(selectElement: HTMLSelectElement | null): string | null {
    const savedUser = this.getUser();
    if (savedUser && selectElement) {
      // Check if the option exists in the dropdown
      const option = selectElement.querySelector(`option[value="${savedUser}"]`) as HTMLOptionElement | null;
      if (option) {
        selectElement.value = savedUser;
        console.log(`Restored user selection: ${savedUser}`);
        return savedUser;
      } else {
        console.warn(`Saved user "${savedUser}" not found in dropdown options`);
        this.clearUser(); // Clear invalid user
        return null;
      }
    }
    return null;
  }

  // Set up user change handler for dropdown
  setupUserChangeHandler(selectElement: HTMLSelectElement | null, callback?: UserChangeCallback): void {
    if (selectElement) {
      selectElement.addEventListener('change', (event) => {
        const target = event.target as HTMLSelectElement;
        const selectedUser = target.value;
        this.setUser(selectedUser);
        if (callback) {
          callback(selectedUser);
        }
      });
    }
  }

  // Populate user dropdown from API
  async populateUserDropdown(selectElementId: string, callback?: UserChangeCallback): Promise<string | null> {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: UsersResponse = await response.json();
      const userSelect = document.getElementById(selectElementId) as HTMLSelectElement | null;
      
      if (!userSelect) {
        throw new Error(`Element with id "${selectElementId}" not found`);
      }
      
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

// Create singleton instance
let userSessionInstance: UserSession | null = null;

export function getUserSession(): UserSession {
  if (!userSessionInstance) {
    userSessionInstance = new UserSession();
  }
  return userSessionInstance;
}

// For backward compatibility with window.userSession
if (typeof window !== 'undefined') {
  (window as any).userSession = getUserSession();
}