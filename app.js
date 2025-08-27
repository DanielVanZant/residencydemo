// Set today's date as default
document.getElementById('weekDate').valueAsDate = new Date();

// Auto-save to localStorage
const form = document.getElementById('updateForm');
const inputs = form.querySelectorAll('textarea');

// Load saved data
inputs.forEach(input => {
    const saved = localStorage.getItem(`weekly-${input.name}`);
    if (saved) input.value = saved;
});

// Save on input
inputs.forEach(input => {
    input.addEventListener('input', () => {
        localStorage.setItem(`weekly-${input.name}`, input.value);
    });
});

// Handle form submission
form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const data = {
        date: document.getElementById('weekDate').value,
        accomplishments: form.accomplishments.value,
        priorities: form.priorities.value,
        challenges: form.challenges.value,
        metrics: form.metrics.value,
        learnings: form.learnings.value,
        wins: form.wins.value,
        support: form.support.value
    };
    
    // Save to localStorage with timestamp
    const updates = JSON.parse(localStorage.getItem('weeklyUpdates') || '[]');
    updates.push({
        ...data,
        timestamp: new Date().toISOString()
    });
    localStorage.setItem('weeklyUpdates', JSON.stringify(updates));
    
    alert('Weekly update saved successfully!');
});

function clearForm() {
    if (confirm('Are you sure you want to clear all fields?')) {
        inputs.forEach(input => {
            input.value = '';
            localStorage.removeItem(`weekly-${input.name}`);
        });
    }
}

// Initialize modules
const editorUtils = new EditorUtils();
const apiClient = new ApiClient();
const updateGenerator = new UpdateGenerator();

// Make available globally for button callbacks
window.editorUtils = editorUtils;
window.updateGenerator = updateGenerator;

// Bullet extraction functionality
async function extractBullets() {
    console.log('Extract bullets called...');
    
    try {
        // Check API configuration
        apiClient.checkApiConfig();
        console.log('API config check passed');

        // Get all form values
        const formData = {
            accomplishments: form.accomplishments.value || '',
            priorities: form.priorities.value || '',
            challenges: form.challenges.value || '',
            metrics: form.metrics.value || '',
            learnings: form.learnings.value || '',
            wins: form.wins.value || '',
            support: form.support.value || ''
        };

        console.log('Form data collected:', formData);

        // Validate form has content
        if (!apiClient.validateFormData(formData)) {
            showError('Please fill in at least one field before extracting bullet points');
            return;
        }

        console.log('Content validation passed');

        // Show loading state
        showLoading(true);
        hideError();
        hideBullets();

        console.log('Calling Claude API...');
        const bullets = await apiClient.callClaudeAPI(formData);
        console.log('API response received:', bullets);
        
        await editorUtils.displayBullets(bullets);
        showLoading(false);
        console.log('Bullets displayed successfully');
    } catch (error) {
        console.error('Error in extractBullets:', error);
        showLoading(false);
        showError('Failed to extract bullet points: ' + error.message);
    }
}



function showLoading(show) {
    document.getElementById('loadingSpinner').classList.toggle('active', show);
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.classList.add('active');
}

function hideError() {
    document.getElementById('errorMessage').classList.remove('active');
}

function hideBullets() {
    document.getElementById('bulletsSection').classList.remove('active');
}

// Clear all bullets function
async function clearBullets() {
    await editorUtils.clearBullets();
}

// Test function to debug with sample data
async function testBulletDisplay() {
    await editorUtils.testBulletDisplay();
}

// Add test button temporarily (can be removed later)
window.testBulletDisplay = testBulletDisplay;

// Fill form with test data for debugging
function fillTestData() {
    form.accomplishments.value = "Completed user authentication system with JWT tokens. Fixed critical database connection issues that were causing timeouts. Launched beta version with 150 active users.";
    form.priorities.value = "Implement dashboard analytics. Optimize database queries for better performance. Conduct user interviews for product feedback.";
    form.challenges.value = "Integration with third-party payment API is proving difficult. Need more frontend development resources. Database scaling concerns.";
    form.metrics.value = "150 active users (+25% from last week). $2,500 MRR. 68% user retention rate. Average session time: 12 minutes.";
    form.learnings.value = "Users prefer mobile-first design. Onboarding flow needs simplification. Performance optimization has big impact on retention.";
    form.wins.value = "First paying customer signed up! Team delivered ahead of schedule. Positive feedback from early beta users.";
    form.support.value = "Introduction to potential design advisor. Feedback on pricing strategy. Technical expertise in database optimization.";
}

// Regenerate formatted updates from current bullet points
async function regenerateUpdates() {
    console.log('Regenerating formatted updates from current bullet points...');
    
    try {
        // Get the current Editor.js data
        const bulletEditor = window.bulletEditor;
        if (!bulletEditor) {
            showError('No bullet points available to regenerate updates from. Please extract bullet points first.');
            return;
        }
        
        // Show loading state
        showLoading(false); // Don't show main loading spinner
        editorUtils.showUpdatesLoading(true);
        editorUtils.hideUpdatesError();
        
        // Hide submit button while regenerating
        editorUtils.showSubmitSection(false);
        
        console.log('Getting current bullet point data...');
        const savedData = await bulletEditor.save();
        console.log('Current bullet data:', savedData);
        
        // Find the list block
        const listBlock = savedData.blocks.find(block => block.type === 'list');
        if (!listBlock || !listBlock.data || !listBlock.data.items || listBlock.data.items.length === 0) {
            throw new Error('No bullet points found to regenerate updates from');
        }
        
        // Create the bullet data structure expected by the update generator
        const bulletData = {
            type: 'list',
            data: {
                style: 'unordered',
                items: listBlock.data.items
            }
        };
        
        console.log('Generating both published and internal updates with current bullet data...');
        const updates = await updateGenerator.generateBothUpdates(bulletData);
        console.log('Both updates generated successfully');
        
        // Clear existing updates and display new ones
        const updatesContainer = document.getElementById('formattedUpdates');
        if (updatesContainer) {
            updatesContainer.innerHTML = '';
        }
        
        updateGenerator.displayUpdates(updates);
        editorUtils.showUpdatesLoading(false);
        
        // Show submit button since updates are ready
        editorUtils.showSubmitSection(true);
        
        console.log('Updates regenerated successfully');
        
    } catch (error) {
        console.error('Error regenerating updates:', error);
        editorUtils.showUpdatesLoading(false);
        editorUtils.showUpdatesError(true);
        showError('Failed to regenerate updates: ' + error.message);
    }
}

// Save changes to database
async function saveChanges() {
    console.log('Save changes called...');
    
    try {
        // Get username and week date
        const username = document.getElementById('username').value.trim();
        const weekDate = document.getElementById('weekDate').value;
        
        if (!username) {
            showError('Please enter a username before saving');
            return;
        }
        
        if (!weekDate) {
            showError('Please select a week date before saving');
            return;
        }
        
        // Get current bullet points from Editor.js
        const bulletEditor = window.bulletEditor;
        if (!bulletEditor) {
            showError('No bullet points available to save. Please extract bullet points first.');
            return;
        }
        
        console.log('Getting current bullet point data...');
        const savedData = await bulletEditor.save();
        console.log('Bullet point data:', savedData);
        
        // Find the list block
        const listBlock = savedData.blocks.find(block => block.type === 'list');
        if (!listBlock || !listBlock.data || !listBlock.data.items || listBlock.data.items.length === 0) {
            showError('No bullet points found to save. Please extract bullet points first.');
            return;
        }
        
        // Get formatted updates from both update editors
        const formattedUpdates = {};
        const updateEditors = window.updateGenerator?.updateEditors || {};
        
        console.log('Available update editors:', Object.keys(updateEditors));
        
        for (const [updateType, editor] of Object.entries(updateEditors)) {
            if (editor && editor.save) {
                try {
                    const updateData = await editor.save();
                    formattedUpdates[updateType] = updateData;
                    console.log(`Saved ${updateType} update data`);
                } catch (error) {
                    console.error(`Error saving ${updateType} update:`, error);
                    // Continue with other updates even if one fails
                }
            }
        }
        
        console.log('Collected formatted updates:', Object.keys(formattedUpdates));
        
        // Prepare data for API
        const saveData = {
            username: username,
            weekDate: weekDate,
            bulletPointsJson: JSON.stringify(listBlock.data),
            formattedUpdates: formattedUpdates
        };
        
        console.log('Saving to database...');
        showLoading(true);
        hideError();
        
        // Call save API
        const response = await fetch('/api/save-weekly-update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(saveData)
        });
        
        showLoading(false);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Save failed: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Save successful:', result);
        
        // Show success feedback
        showSuccessMessage('Weekly update saved successfully!');
        
    } catch (error) {
        console.error('Error saving changes:', error);
        showLoading(false);
        showError('Failed to save changes: ' + error.message);
    }
}

// Show success message near the submit button
function showSuccessMessage(message) {
    // Create or reuse success message element in submit section
    let successDiv = document.getElementById('submitSuccessMessage');
    if (!successDiv) {
        successDiv = document.createElement('div');
        successDiv.id = 'submitSuccessMessage';
        successDiv.className = 'submit-success-message';
        
        // Insert in the submit container, after the button
        const submitContainer = document.querySelector('.submit-container');
        const submitButton = submitContainer.querySelector('button');
        submitContainer.insertBefore(successDiv, submitButton.nextSibling);
    }
    
    successDiv.textContent = message;
    successDiv.classList.add('active');
    
    // Auto-hide after 5 seconds (longer for submit confirmation)
    setTimeout(() => {
        successDiv.classList.remove('active');
    }, 5000);
}

window.fillTestData = fillTestData;
window.regenerateUpdates = regenerateUpdates;
window.saveChanges = saveChanges;