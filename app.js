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
    console.log('Extract bullets called...');
    
    // Check if config is loaded
    if (typeof API_CONFIG === 'undefined' || !API_CONFIG.ANTHROPIC_API_KEY || API_CONFIG.ANTHROPIC_API_KEY === 'your-anthropic-api-key-here') {
        showError('Please configure your Anthropic API key in config.js');
        return;
    }

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

    // Check if there's any content to process
    const hasContent = Object.values(formData).some(value => value.trim() !== '');
    if (!hasContent) {
        showError('Please fill in at least one field before extracting bullet points');
        return;
    }

    console.log('Content validation passed');

    // Show loading state
    showLoading(true);
    hideError();
    hideBullets();

    try {
        console.log('Calling Claude API...');
        const bullets = await callClaudeAPI(formData);
        console.log('API response received:', bullets);
        
        await displayBullets(bullets);
        showLoading(false);
        console.log('Bullets displayed successfully');
    } catch (error) {
        console.error('Error in extractBullets:', error);
        showLoading(false);
        showError('Failed to extract bullet points: ' + error.message);
    }
}

async function callClaudeAPI(formData) {
    console.log('callClaudeAPI called with:', formData);
    
    // Try to use local server first, fallback to config if available
    const endpoint = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? '/api/extract-bullets'
        : 'http://localhost:3000/api/extract-bullets';

    console.log('Using endpoint:', endpoint);

    try {
        // Try server endpoint first
        console.log('Making fetch request...');
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Send API key in header if using config
                'x-api-key': API_CONFIG?.ANTHROPIC_API_KEY || ''
            },
            body: JSON.stringify({ formData })
        });

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('API error response:', errorData);
            throw new Error(errorData.error || `API request failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('API response data:', data);
        console.log('Type of data:', typeof data);
        console.log('data.markdown:', data.markdown);
        console.log('Type of data.markdown:', typeof data.markdown);
        
        // Return markdown if it exists, otherwise return the raw data
        if (data.markdown) {
            console.log('Returning markdown from response');
            return data.markdown;
        }
        
        console.log('No markdown found, returning raw data');
        return data;
    } catch (error) {
        console.error('callClaudeAPI error:', error);
        // If server is not running, provide helpful error
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            throw new Error('Server not running. Please run: npm install && npm start');
        }
        throw error;
    }
}

// Editor.js instance
let bulletEditor = null;

// Initialize Editor.js when bullets are first displayed
function initializeBulletEditor() {
    if (bulletEditor) return bulletEditor;
    
    // Check if Editor.js is loaded
    if (typeof EditorJS === 'undefined') {
        throw new Error('EditorJS is not loaded. Please check the CDN import.');
    }
    
    // When using CDN, the List class is available as window.EditorjsList
    const ListTool = window.EditorjsList;
    
    if (!ListTool) {
        console.warn('List tool not found, using basic paragraph mode');
    }
    
    const tools = {};
    
    // Add List tool if available
    if (ListTool) {
        tools.list = {
            class: ListTool,
            inlineToolbar: true,
            config: {
                defaultStyle: 'unordered',
                maxLevel: 5 // Allow deep nesting like Roam
            }
        };
    }
    
    bulletEditor = new EditorJS({
        holder: 'editorjs',
        tools: tools,
        data: {
            blocks: []
        },
        placeholder: 'Click to start typing or press Tab to create a sublist...',
        onChange: (api, event) => {
            console.log('Editor content changed');
        }
    });
    
    console.log('Editor initialized with tools:', Object.keys(tools));
    
    return bulletEditor;
}

// Display bullets from API response
async function displayBullets(markdownOrHierarchy) {
    console.log('Raw response:', markdownOrHierarchy);
    
    // Check if we can use Editor.js with List tool
    if (window.EditorjsList) {
        console.log('Using Editor.js with List tool');
        
        const editor = initializeBulletEditor();
        
        // Convert response to Editor.js blocks format
        let blocks = [];
        
        if (typeof markdownOrHierarchy === 'string') {
            console.log('Processing as markdown:', markdownOrHierarchy);
            blocks = parseMarkdownToBlocks(markdownOrHierarchy);
        } else {
            console.log('Processing as hierarchy:', markdownOrHierarchy);
            blocks = convertHierarchyToBlocks(markdownOrHierarchy);
        }
        
        console.log('Generated blocks:', JSON.stringify(blocks, null, 2));
        
        // Wait for editor to be ready then render
        await editor.isReady;
        
        // Clear existing content and add new blocks
        await editor.render({
            blocks: blocks
        });
        
    } else {
        console.log('List tool not available, using fallback contenteditable');
        
        // Fallback: Simple markdown to HTML conversion
        const container = document.getElementById('editorjs');
        
        if (typeof markdownOrHierarchy === 'string') {
            const html = markdownOrHierarchy
                .split('\n')
                .filter(line => line.trim())
                .map(line => {
                    const trimmed = line.trim();
                    if (trimmed.startsWith('- ')) {
                        const content = trimmed.substring(2);
                        const indent = Math.floor((line.match(/^ */)[0].length) / 2);
                        const margin = indent * 20;
                        return `<div style="margin-left: ${margin}px; margin-bottom: 8px; cursor: text; padding: 4px; border-radius: 4px;" contenteditable="true">• ${content}</div>`;
                    }
                    return '';
                })
                .join('');
            
            container.innerHTML = html || '<p style="color: var(--text-muted);">No bullet points extracted.</p>';
        }
    }
    
    document.getElementById('bulletsSection').classList.add('active');
}

function parseMarkdownToBlocks(markdown) {
    if (!markdown || markdown.trim() === '') {
        return [];
    }
    
    const lines = markdown.trim().split('\n');
    const items = [];
    const stack = []; // Stack to track parent items at each level
    
    lines.forEach(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine || !trimmedLine.startsWith('-')) return;
        
        const content = trimmedLine.substring(1).trim();
        const indentLevel = Math.floor((line.match(/^ */)[0].length) / 2);
        
        // Create new list item
        const listItem = {
            content: content,
            meta: {},
            items: []
        };
        
        if (indentLevel === 0) {
            // Top-level item
            items.push(listItem);
            stack[0] = listItem;
            stack.length = 1; // Clear deeper levels
        } else if (indentLevel > 0 && stack[indentLevel - 1]) {
            // Nested item - add to parent's items array
            const parentItem = stack[indentLevel - 1];
            parentItem.items.push(listItem);
            stack[indentLevel] = listItem;
            stack.length = indentLevel + 1; // Clear deeper levels
        }
    });
    
    // Return Editor.js list block format
    if (items.length > 0) {
        return [{
            type: 'list',
            data: {
                style: 'unordered',
                meta: {},
                items: items
            }
        }];
    }
    
    return [];
}

function convertHierarchyToBlocks(hierarchy) {
    // Handle different response formats
    let items = [];
    
    if (Array.isArray(hierarchy)) {
        items = hierarchy;
    } else if (hierarchy.hierarchy && Array.isArray(hierarchy.hierarchy)) {
        items = hierarchy.hierarchy;
    } else if (hierarchy.bullets && Array.isArray(hierarchy.bullets)) {
        items = hierarchy.bullets.map(text => ({ text }));
    }
    
    if (items.length === 0) return [];
    
    // Convert to Editor.js format with correct structure
    const listItems = items.map(item => ({
        content: item.text || item,
        meta: {},
        items: (item.children || []).map(child => ({
            content: child.text || child,
            meta: {},
            items: []
        }))
    }));
    
    return [{
        type: 'list',
        data: {
            style: 'unordered',
            meta: {},
            items: listItems
        }
    }];
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
    if (confirm('Are you sure you want to clear all bullet points?')) {
        if (window.EditorjsList && bulletEditor) {
            // Use Editor.js if available
            await bulletEditor.isReady;
            await bulletEditor.render({
                blocks: []
            });
        } else {
            // Clear the container if using fallback
            document.getElementById('editorjs').innerHTML = '';
        }
    }
}

// Test function to debug with sample data
async function testBulletDisplay() {
    const sampleMarkdown = `- Completed user authentication system
  - Added login and signup forms
  - Implemented JWT token handling
- Fixed database connection issues
- Started work on dashboard UI
  - Created wireframes
  - Set up component structure`;
    
    console.log('Testing with sample markdown...');
    await displayBullets(sampleMarkdown);
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