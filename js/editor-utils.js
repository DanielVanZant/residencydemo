// Editor.js utilities and content parsing
class EditorUtils {
    constructor() {
        this.bulletEditor = null;
    }

    // Initialize Editor.js when bullets are first displayed
    initializeBulletEditor() {
        if (this.bulletEditor) return this.bulletEditor;
        
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
                    defaultStyle: 'checklist',
                    maxLevel: 5 // Allow deep nesting like Roam
                }
            };
        }
        
        // Add Checklist tool if available (try multiple possible names)
        const ChecklistTool = window.Checklist || window.EditorjsChecklist || window.CheckList;
        if (ChecklistTool) {
            tools.checklist = {
                class: ChecklistTool,
                inlineToolbar: true
            };
        }
        
        // Add Header tool if available
        if (window.Header) {
            tools.header = {
                class: window.Header,
                inlineToolbar: false,
                config: {
                    levels: [2, 3, 4],
                    defaultLevel: 2
                }
            };
        }
        
        this.bulletEditor = new EditorJS({
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
        
        // Make editor accessible globally for regeneration
        window.bulletEditor = this.bulletEditor;
        
        return this.bulletEditor;
    }

    // Display bullets from API response
    async displayBullets(markdownOrHierarchy, privacyManager) {
        console.log('Raw response:', markdownOrHierarchy);
        
        // Check if we can use Editor.js with List tool
        if (window.EditorjsList) {
            console.log('Using Editor.js with List tool');
            
            const editor = this.initializeBulletEditor();
            
            // Convert response to Editor.js blocks format
            let blocks = [];
            
            if (typeof markdownOrHierarchy === 'object' && markdownOrHierarchy.type === 'list' && markdownOrHierarchy.data) {
                console.log('Processing as Editor.js checklist block');
                console.log('RECEIVED DATA STRUCTURE:', JSON.stringify(markdownOrHierarchy, null, 2));
                blocks = [markdownOrHierarchy]; // Already in correct format
            } else if (typeof markdownOrHierarchy === 'string') {
                console.log('Processing as markdown:', markdownOrHierarchy);
                blocks = this.parseMarkdownToBlocks(markdownOrHierarchy);
            } else {
                console.log('Processing as hierarchy:', markdownOrHierarchy);
                blocks = this.convertHierarchyToBlocks(markdownOrHierarchy);
            }
            
            console.log('Generated blocks:', JSON.stringify(blocks, null, 2));
            
            // Wait for editor to be ready then render
            await editor.isReady;
            
            // Clear existing content and add new blocks
            await editor.render({
                blocks: blocks
            });
            
            // Generate formatted updates after rendering
            setTimeout(() => {
                console.log('About to generate formatted updates with data:', markdownOrHierarchy);
                console.log('Editor rendered, calling generateFormattedUpdates...');
                this.generateFormattedUpdates(markdownOrHierarchy);
            }, 500); // Wait for Editor.js to fully render
            
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

    // Generate formatted updates after bullets are displayed
    async generateFormattedUpdates(bulletData) {
        console.log('generateFormattedUpdates called with:', bulletData);
        
        // Only generate if we have structured data
        if (typeof bulletData !== 'object' || !bulletData.type || !bulletData.data) {
            console.log('No structured bullet data available for formatted updates');
            return;
        }
        
        console.log('Bullet data validation passed, proceeding with update generation...');

        try {
            // Show the formatted updates section first
            document.getElementById('formattedUpdatesSection').classList.add('active');
            
            // Show loading state
            this.showUpdatesLoading(true);
            this.hideUpdatesError();
            
            // Hide submit button while generating
            this.showSubmitSection(false);
            
            console.log('Generating formatted updates...');
            console.log('Looking for updateGenerator...');
            const updateGenerator = window.updateGenerator;
            
            if (!updateGenerator) {
                console.error('UpdateGenerator not available!');
                throw new Error('UpdateGenerator not available');
            }
            
            console.log('UpdateGenerator found, calling generateBothUpdates...');
            
            const updates = await updateGenerator.generateBothUpdates(bulletData);
            console.log('All formatted updates generated');
            
            // Display the updates
            updateGenerator.displayUpdates(updates);
            this.showUpdatesLoading(false);
            
            // Show submit button now that everything is ready
            this.showSubmitSection(true);
            
        } catch (error) {
            console.error('Error generating formatted updates:', error);
            this.showUpdatesLoading(false);
            this.showUpdatesError(true);
        }
    }

    // Show/hide loading state for formatted updates
    showUpdatesLoading(show) {
        const loadingEl = document.getElementById('updatesLoading');
        if (loadingEl) {
            console.log(`${show ? 'Showing' : 'Hiding'} updates loading indicator`);
            loadingEl.classList.toggle('active', show);
        } else {
            console.error('Updates loading element not found');
        }
    }

    // Show/hide error state for formatted updates
    showUpdatesError(show) {
        const errorEl = document.getElementById('updatesError');
        if (errorEl) {
            errorEl.classList.toggle('active', show);
        }
    }

    // Hide error state for formatted updates
    hideUpdatesError() {
        this.showUpdatesError(false);
    }

    // Show/hide submit section
    showSubmitSection(show) {
        const submitEl = document.getElementById('submitSection');
        if (submitEl) {
            console.log(`${show ? 'Showing' : 'Hiding'} submit section`);
            submitEl.classList.toggle('active', show);
        } else {
            console.error('Submit section element not found');
        }
    }

    // Convert checklist items to individual checklist blocks
    convertChecklistToBlocks(items, blocks = []) {
        items.forEach(item => {
            // Create a checklist block for each item
            blocks.push({
                type: 'checklist',
                data: {
                    items: [
                        {
                            text: item.content,
                            checked: item.checked || false
                        }
                    ]
                }
            });
            
            // Handle nested items
            if (item.items && item.items.length > 0) {
                this.convertChecklistToBlocks(item.items, blocks);
            }
        });
        
        return blocks;
    }
    
    parseMarkdownToBlocks(markdown) {
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

    convertHierarchyToBlocks(hierarchy) {
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

    // Clear all bullets function
    async clearBullets() {
        if (confirm('Are you sure you want to clear all bullet points?')) {
            if (window.EditorjsList && this.bulletEditor) {
                // Use Editor.js if available
                await this.bulletEditor.isReady;
                await this.bulletEditor.render({
                    blocks: []
                });
            } else {
                // Clear the container if using fallback
                document.getElementById('editorjs').innerHTML = '';
            }
        }
    }

    // Test function to debug with sample data
    async testBulletDisplay() {
        const sampleMarkdown = `- Completed user authentication system
  - Added login and signup forms
  - Implemented JWT token handling
- Fixed database connection issues
- Started work on dashboard UI
  - Created wireframes
  - Set up component structure`;
        
        console.log('Testing with sample markdown...');
        await this.displayBullets(sampleMarkdown, window.privacyManager);
    }
}

// Export for use in other modules
window.EditorUtils = EditorUtils;