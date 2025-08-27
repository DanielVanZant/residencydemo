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
const privacyManager = new PrivacyManager();
const editorUtils = new EditorUtils();
const apiClient = new ApiClient();

// Make available globally for button callbacks
window.privacyManager = privacyManager;
window.editorUtils = editorUtils;

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
        
        await editorUtils.displayBullets(bullets, privacyManager);
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

window.fillTestData = fillTestData;
window.togglePrivacyMode = () => privacyManager.togglePrivacyMode();
window.applyPrivacyAttributes = () => privacyManager.applyPrivacyFromStoredData();