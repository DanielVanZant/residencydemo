// Comprehensive Weekly Update Form System
// Combines form management, north star handling, and main app controller

// Form Manager - handles form state, auto-save, and data collection
class FormManager {
    constructor(formId) {
        this.formId = formId;
        this.form = document.getElementById(formId);
        this.autoSaveInterval = null;
        this.setupAutoSave();
    }

    // Setup auto-save functionality
    setupAutoSave() {
        if (!this.form) return;
        
        const inputs = this.form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            // Restore saved values on page load
            const savedValue = localStorage.getItem(`weekly-${input.name}`);
            if (savedValue && input.value === '') {
                input.value = savedValue;
                console.log(`Restored ${input.name}: ${savedValue}`);
            }
            
            // Save on input change
            input.addEventListener('input', () => {
                localStorage.setItem(`weekly-${input.name}`, input.value);
                console.log(`Saved ${input.name}: ${input.value}`);
            });
        });
    }

    // Get all form data
    getFormData() {
        if (!this.form) return {};
        
        const formData = new FormData(this.form);
        const data = {};
        
        for (let [key, value] = formData.entries()) {
            data[key] = value;
        }
        
        return data;
    }

    // Get save metadata (username and date validation)
    getSaveMetadata() {
        const username = window.userSession?.getUser();
        if (!username) {
            throw new Error('Please select a user first');
        }
        
        const weekDate = document.getElementById('weekDate')?.value;
        if (!weekDate) {
            throw new Error('Week date is required');
        }
        
        return { username, weekDate };
    }

    // Clear auto-saved form data
    clearAutoSavedData() {
        if (!this.form) return;
        
        const inputs = this.form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            localStorage.removeItem(`weekly-${input.name}`);
        });
        console.log('Cleared auto-saved form data');
    }

    // Reset form to initial state
    resetForm() {
        if (this.form) {
            this.form.reset();
            this.clearAutoSavedData();
        }
    }
}

// North Star Manager - handles north star metric display and input
class NorthStarManager {
    constructor() {
        this.hintElement = document.getElementById('northStarHint');
        this.labelElement = document.getElementById('northStarValueLabel');
        this.inputElement = document.getElementById('northStarValue');
    }

    // Load user's north star metric information
    async loadUserNorthStar(username) {
        try {
            console.log(`Loading north star info for user: ${username}`);
            const response = await fetch(`/api/user/${username}/north-star`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('North star data received:', data);
            
            this.updateDisplay(data.northStarMetric, data.northStarDescription, data.mostRecentValue, data.mostRecentDate);
            
        } catch (error) {
            console.error('Error loading north star info:', error);
            this.clearDisplay();
        }
    }

    // Update the north star display with user's specific metric
    updateDisplay(metric, description, mostRecentValue, mostRecentDate) {
        if (metric && description) {
            this.hintElement.textContent = `${metric}: ${description}`;
            
            // If we have a most recent value, show it and update label
            if (mostRecentValue !== null && mostRecentValue !== undefined) {
                this.inputElement.value = mostRecentValue;
                this.labelElement.textContent = `current ${metric.toLowerCase()} (last: ${mostRecentValue} on ${this.formatDateShort(mostRecentDate)})`;
                
                // Don't save the pre-filled value to localStorage
                localStorage.removeItem(`weekly-${this.inputElement.name}`);
            } else {
                this.labelElement.textContent = `current ${metric.toLowerCase()}`;
                this.inputElement.value = '';
            }
            
            // Update placeholder to be more specific
            this.inputElement.placeholder = this.getPlaceholderForMetric(metric);
        } else {
            this.clearDisplay();
        }
    }

    // Format date for display
    formatDateShort(dateString) {
        if (!dateString) return 'never';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    // Get appropriate placeholder based on metric type
    getPlaceholderForMetric(metric) {
        const metricLower = metric.toLowerCase();
        
        if (metricLower.includes('revenue') || metricLower.includes('cost') || metricLower.includes('mrr')) {
            return '5000.00';
        } else if (metricLower.includes('users') || metricLower.includes('commits')) {
            return '150.0';
        } else if (metricLower.includes('score') || metricLower.includes('rating')) {
            return '8.5';
        } else if (metricLower.includes('percent') || metricLower.includes('rate')) {
            return '75.5';
        } else if (metricLower.includes('mg') || metricLower.includes('yield')) {
            return '0.5';
        } else {
            return '0.0';
        }
    }

    // Clear north star display to defaults
    clearDisplay() {
        this.hintElement.textContent = 'track the single most important number that represents your core focus and progress during the residency';
        this.labelElement.textContent = 'current value';
        this.inputElement.placeholder = '0.0';
        this.inputElement.value = '';
    }

    // Get current north star values
    getCurrentValues() {
        return {
            value: this.inputElement.value.trim(),
            note: document.getElementById('northStarNote').value.trim()
        };
    }
}

// Weekly Update App - main controller coordinating all functionality
class WeeklyUpdateApp {
    constructor() {
        this.formManager = new FormManager('updateForm');
        this.northStarManager = new NorthStarManager();
        this.editor = null;
        
        this.init();
    }

    async init() {
        // Initialize user session and populate dropdown
        const savedUser = await window.userSession.populateUserDropdown('userSelect', async (selectedUser) => {
            if (selectedUser) {
                await this.northStarManager.loadUserNorthStar(selectedUser);
            } else {
                this.northStarManager.clearDisplay();
            }
        });

        // Load north star for saved user
        if (savedUser) {
            await this.northStarManager.loadUserNorthStar(savedUser);
        }

        this.setupEventListeners();
        this.initializeEditor();
    }

    setupEventListeners() {
        // Extract bullets button
        const extractButton = document.getElementById('extractBullets');
        if (extractButton) {
            extractButton.addEventListener('click', () => this.extractBullets());
        }

        // Save changes button
        const saveButton = document.getElementById('saveChanges');
        if (saveButton) {
            saveButton.addEventListener('click', () => this.saveChanges());
        }
    }

    // Initialize Editor.js
    initializeEditor() {
        if (typeof EditorJS !== 'undefined') {
            this.editor = new EditorJS({
                holder: 'editorjs',
                tools: {
                    header: Header,
                    list: List,
                    checklist: Checklist
                },
                placeholder: 'Start writing your weekly update...'
            });
        }
    }

    // Extract bullets from editor content
    async extractBullets() {
        try {
            window.uiUtils.showLoading(true);
            window.uiUtils.hideError();

            const { username } = this.formManager.getSaveMetadata();
            const formData = this.formManager.getFormData();
            
            if (!window.uiUtils.validateFormContent(formData)) {
                return;
            }

            // Get editor content
            let editorData = null;
            if (this.editor) {
                editorData = await this.editor.save();
            }

            // Prepare request data
            const requestData = {
                rawUpdate: formData.rawUpdate || '',
                editorData: editorData,
                northStar: this.northStarManager.getCurrentValues()
            };

            console.log('Sending extract request:', requestData);

            const response = await fetch(`/api/extract-bullets/${username}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Extract response:', data);
            
            this.displayBullets(data.bullets);
            
        } catch (error) {
            console.error('Error extracting bullets:', error);
            window.uiUtils.showError(`Error extracting bullets: ${error.message}`);
        } finally {
            window.uiUtils.showLoading(false);
        }
    }

    // Display extracted bullets
    displayBullets(bullets) {
        const bulletsSection = document.getElementById('bulletsSection');
        const bulletsContainer = document.getElementById('bulletsContainer');
        
        if (!bullets || !bullets.length) {
            window.uiUtils.showError('No bullets were extracted. Please add more content to your update.');
            return;
        }

        bulletsContainer.innerHTML = bullets.map(bullet => 
            `<div class="bullet-item">${bullet}</div>`
        ).join('');
        
        bulletsSection.classList.add('active');
        
        // Show submit section
        const submitSection = document.querySelector('.submit-section');
        if (submitSection) {
            submitSection.classList.add('active');
        }
    }

    // Save changes to database
    async saveChanges() {
        try {
            window.uiUtils.setFormDisabled(true);
            window.uiUtils.showLoading(true);
            window.uiUtils.hideError();

            const { username, weekDate } = this.formManager.getSaveMetadata();
            const formData = this.formManager.getFormData();

            // Get editor content
            let editorData = null;
            if (this.editor) {
                editorData = await this.editor.save();
            }

            // Get extracted bullets from the display
            const bulletElements = document.querySelectorAll('.bullet-item');
            const bullets = Array.from(bulletElements).map(el => el.textContent);

            // Prepare save data
            const saveData = {
                weekDate,
                rawUpdate: formData.rawUpdate || '',
                editorData: editorData,
                bullets: bullets,
                northStar: this.northStarManager.getCurrentValues()
            };

            console.log('Saving update:', saveData);

            const response = await fetch(`/api/save-update/${username}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(saveData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Save result:', result);

            // Clear auto-saved data after successful save
            this.formManager.clearAutoSavedData();
            
            // Show success message and redirect
            window.uiUtils.showSuccessMessage(
                'Update saved successfully! Redirecting to dashboard...',
                `dashboard.html?user=${encodeURIComponent(username)}`,
                2000
            );
            
        } catch (error) {
            console.error('Error saving update:', error);
            window.uiUtils.showError(`Error saving update: ${error.message}`);
        } finally {
            window.uiUtils.setFormDisabled(false);
            window.uiUtils.showLoading(false);
        }
    }
}

// Export classes for global use
window.FormManager = FormManager;
window.NorthStarManager = NorthStarManager;
window.WeeklyUpdateApp = WeeklyUpdateApp;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.weeklyUpdateApp = new WeeklyUpdateApp();
});