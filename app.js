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

// Bullet extraction functionality
async function extractBullets() {
    // Check if config is loaded
    if (typeof API_CONFIG === 'undefined' || !API_CONFIG.ANTHROPIC_API_KEY || API_CONFIG.ANTHROPIC_API_KEY === 'your-anthropic-api-key-here') {
        showError('Please configure your Anthropic API key in config.js');
        return;
    }

    // Get all form values
    const formData = {
        accomplishments: form.accomplishments.value,
        priorities: form.priorities.value,
        challenges: form.challenges.value,
        metrics: form.metrics.value,
        learnings: form.learnings.value,
        wins: form.wins.value,
        support: form.support.value
    };

    // Check if there's any content to process
    const hasContent = Object.values(formData).some(value => value.trim() !== '');
    if (!hasContent) {
        showError('Please fill in at least one field before extracting bullet points');
        return;
    }

    // Show loading state
    showLoading(true);
    hideError();
    hideBullets();

    try {
        const bullets = await callClaudeAPI(formData);
        displayBullets(bullets);
        showLoading(false);
    } catch (error) {
        showLoading(false);
        showError('Failed to extract bullet points: ' + error.message);
    }
}

async function callClaudeAPI(formData) {
    // Try to use local server first, fallback to config if available
    const endpoint = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? '/api/extract-bullets'
        : 'http://localhost:3000/api/extract-bullets';

    try {
        // Try server endpoint first
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Send API key in header if using config
                'x-api-key': API_CONFIG?.ANTHROPIC_API_KEY || ''
            },
            body: JSON.stringify({ formData })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `API request failed: ${response.status}`);
        }

        const data = await response.json();
        return data.hierarchy || data.bullets || data;
    } catch (error) {
        // If server is not running, provide helpful error
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            throw new Error('Server not running. Please run: npm install && npm start');
        }
        throw error;
    }
}

function displayBullets(hierarchy) {
    const container = document.getElementById('bulletsContainer');
    container.innerHTML = '';

    // Handle different response formats
    let items = [];
    
    if (Array.isArray(hierarchy)) {
        items = hierarchy;
    } else if (hierarchy.hierarchy && Array.isArray(hierarchy.hierarchy)) {
        items = hierarchy.hierarchy;
    } else if (hierarchy.bullets && Array.isArray(hierarchy.bullets)) {
        // Fallback to flat list if server returns old format
        items = hierarchy.bullets.map(text => ({ text }));
    }

    if (items.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted);">No bullet points extracted.</p>';
        return;
    }

    // Create hierarchical display
    const listContainer = document.createElement('div');
    listContainer.className = 'bullet-container';
    
    const list = document.createElement('ul');
    list.className = 'bullet-list';

    let totalBullets = 0;

    items.forEach(item => {
        // Parent bullet
        const li = document.createElement('li');
        li.className = item.children && item.children.length > 0 ? 'bullet-item parent' : 'bullet-item';
        li.textContent = item.text;
        list.appendChild(li);
        totalBullets++;

        // Child bullets if they exist
        if (item.children && item.children.length > 0) {
            const childList = document.createElement('ul');
            childList.className = 'bullet-children';
            
            item.children.forEach(child => {
                const childLi = document.createElement('li');
                childLi.className = 'bullet-child';
                childLi.textContent = child.text || child;
                childList.appendChild(childLi);
                totalBullets++;
            });
            
            list.appendChild(childList);
        }
    });

    listContainer.appendChild(list);
    container.appendChild(listContainer);

    // Show bullet count
    const countDiv = document.createElement('div');
    countDiv.style.cssText = 'margin-top: var(--space-md); color: var(--text-muted); font-size: var(--text-sm); text-align: right;';
    countDiv.textContent = `${totalBullets} bullet points extracted (${items.length} main topics)`;
    container.appendChild(countDiv);

    document.getElementById('bulletsSection').classList.add('active');
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