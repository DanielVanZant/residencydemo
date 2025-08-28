// Privacy management module
class PrivacyManager {
    constructor() {
        this.privacyData = null;
        this.privacyModeEnabled = true;
    }

    // Extract privacy data from items recursively with inheritance
    extractPrivacyData(items, path = [], parentPrivacy = 'public') {
        const privacyMap = [];
        
        items.forEach((item, index) => {
            const currentPath = [...path, index];
            
            // Use item's privacy if set, otherwise inherit from parent
            const privacy = (item.meta && item.meta.privacy) ? item.meta.privacy : parentPrivacy;
            
            privacyMap.push({
                path: currentPath,
                privacy: privacy,
                content: item.content,
                hasOwnPrivacy: !!(item.meta && item.meta.privacy)
            });
            
            // Recursively process children with current privacy as parent
            if (item.items && item.items.length > 0) {
                privacyMap.push(...this.extractPrivacyData(item.items, currentPath, privacy));
            }
        });
        
        return privacyMap;
    }

    // Store privacy data
    setPrivacyData(data) {
        this.privacyData = data;
    }

    // Apply privacy from stored data
    applyPrivacyFromStoredData() {
        console.log('=== APPLYING PRIVACY FROM STORED DATA ===');
        
        if (!this.privacyData || this.privacyData.length === 0) {
            console.warn('No privacy data stored');
            return;
        }
        
        console.log('Privacy data to apply:', this.privacyData);
        
        // Find all list items in the editor
        const mainList = document.querySelector('#editorjs .cdx-list');
        
        if (!mainList) {
            console.error('Could not find main list');
            return;
        }
        
        // Apply privacy to each item based on stored data
        this.privacyData.forEach(({ path, privacy, content, hasOwnPrivacy }) => {
            const element = this.findElementByPath(mainList, path);
            if (element) {
                const inheritedNote = hasOwnPrivacy ? '' : ' (inherited)';
                console.log(`Setting privacy "${privacy}"${inheritedNote} for: "${content.substring(0, 50)}..."`);
                element.setAttribute('data-privacy', privacy);
            } else {
                console.warn(`Could not find element for path ${path.join('.')}`);
            }
        });
        
        // Check results
        const itemsWithPrivacy = document.querySelectorAll('.cdx-list__item[data-privacy]');
        console.log(`Successfully set privacy on ${itemsWithPrivacy.length} items`);
    }

    // Find element by path in nested lists
    findElementByPath(rootList, path) {
        let currentList = rootList;
        let element = null;
        
        for (let i = 0; i < path.length; i++) {
            const index = path[i];
            const items = currentList.children;
            
            if (index >= items.length) {
                console.warn(`Path index ${index} exceeds children count ${items.length}`);
                return null;
            }
            
            element = items[index];
            
            // If not the last index, find nested list
            if (i < path.length - 1) {
                currentList = element.querySelector('.cdx-list');
                if (!currentList) {
                    console.warn(`No nested list found at path index ${i}`);
                    return null;
                }
            }
        }
        
        return element;
    }

    // Add privacy legend to the bullets section
    addPrivacyLegend() {
        const bulletsSection = document.getElementById('bulletsSection');
        const existingLegend = bulletsSection.querySelector('.privacy-legend');
        
        if (existingLegend) {
            existingLegend.remove();
        }
        
        const legend = document.createElement('div');
        legend.className = 'privacy-legend';
        legend.innerHTML = `
            <div class="privacy-legend-item private">
                <span>🔒</span>
                <span>Only me</span>
            </div>
            <div class="privacy-legend-item residency">
                <span>👥</span>
                <span>Within residency</span>
            </div>
            <div class="privacy-legend-item public">
                <span>🌍</span>
                <span>Public</span>
            </div>
        `;
        
        const editorContainer = document.getElementById('editorjs');
        editorContainer.parentNode.insertBefore(legend, editorContainer);
    }

    // Privacy mode toggle
    togglePrivacyMode() {
        this.privacyModeEnabled = !this.privacyModeEnabled;
        const editorContainer = document.getElementById('editorjs');
        const toggleButton = document.querySelector('button[onclick="togglePrivacyMode()"]');
        
        if (this.privacyModeEnabled) {
            editorContainer.classList.remove('privacy-disabled');
            toggleButton.textContent = 'Hide Privacy Indicators';
            console.log('Privacy mode enabled');
        } else {
            editorContainer.classList.add('privacy-disabled');
            toggleButton.textContent = 'Show Privacy Indicators';
            console.log('Privacy mode disabled');
        }
    }

    // Add click handler for privacy level adjustment
    addPrivacyClickHandlers() {
        const editorContainer = document.getElementById('editorjs');
        
        // Add context menu for privacy adjustment
        editorContainer.addEventListener('contextmenu', (e) => {
            const listItem = e.target.closest('.cdx-list__item');
            if (listItem && this.privacyModeEnabled) {
                e.preventDefault();
                this.showPrivacyContextMenu(e, listItem);
            }
        });
    }

    // Show context menu for privacy adjustment
    showPrivacyContextMenu(event, listItem) {
        // Remove existing context menus
        const existingMenu = document.querySelector('.privacy-context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }
        
        const menu = document.createElement('div');
        menu.className = 'privacy-context-menu';
        menu.style.position = 'fixed';
        menu.style.left = event.clientX + 'px';
        menu.style.top = event.clientY + 'px';
        menu.style.zIndex = '1000';
        menu.style.background = 'white';
        menu.style.border = '1px solid var(--border-medium)';
        menu.style.borderRadius = 'var(--radius-sm)';
        menu.style.boxShadow = 'var(--shadow-md)';
        menu.style.padding = '8px';
        menu.style.minWidth = '140px';
        
        const currentPrivacy = listItem.getAttribute('data-privacy') || 'public';
        
        menu.innerHTML = `
            <div class="privacy-menu-item ${currentPrivacy === 'public' ? 'active' : ''}" data-privacy="public">
                <span>🌍</span> Public
            </div>
            <div class="privacy-menu-item ${currentPrivacy === 'residency' ? 'active' : ''}" data-privacy="residency">
                <span>👥</span> Within Residency
            </div>
            <div class="privacy-menu-item ${currentPrivacy === 'private' ? 'active' : ''}" data-privacy="private">
                <span>🔒</span> Only Me
            </div>
        `;
        
        // Add click handlers
        menu.querySelectorAll('.privacy-menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const newPrivacy = item.getAttribute('data-privacy');
                listItem.setAttribute('data-privacy', newPrivacy);
                this.updateEditorItemPrivacy(listItem, newPrivacy);
                menu.remove();
            });
        });
        
        document.body.appendChild(menu);
        
        // Close menu when clicking elsewhere
        setTimeout(() => {
            const closeHandler = (e) => {
                if (!menu.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeHandler);
                }
            };
            document.addEventListener('click', closeHandler);
        }, 10);
    }

    // Update privacy in Editor.js data
    updateEditorItemPrivacy(listItem, newPrivacy) {
        // This is complex to implement without Editor.js API support
        // For now, just log the change
        console.log(`Privacy updated to ${newPrivacy} for item:`, listItem.textContent);
        
        // TODO: Update the actual Editor.js data structure
        // This would require deeper integration with Editor.js internals
    }
}

// Export for use in other modules
window.PrivacyManager = PrivacyManager;