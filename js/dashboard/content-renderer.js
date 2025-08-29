// Content rendering utility for Editor.js blocks and markdown
class ContentRenderer {
    constructor() {
        // Utility for rendering various content formats
    }

    // Render update content to a container
    renderUpdateContent(updateData, contentId) {
        const container = document.getElementById(contentId);
        if (!container || !updateData) return;

        if (updateData.blocks && Array.isArray(updateData.blocks)) {
            // Render Editor.js blocks as HTML
            let html = '';
            updateData.blocks.forEach(block => {
                html += this.renderBlock(block);
            });
            container.innerHTML = html;
        } else if (typeof updateData === 'string') {
            // Render as simple text with paragraph wrapping
            const paragraphs = updateData.split('\n\n').filter(p => p.trim());
            container.innerHTML = paragraphs.map(p => `<p>${p.trim()}</p>`).join('');
        } else {
            // Fallback to JSON string
            container.innerHTML = `<pre>${JSON.stringify(updateData, null, 2)}</pre>`;
        }
    }

    // Render individual Editor.js blocks
    renderBlock(block) {
        switch (block.type) {
            case 'header':
                const level = block.data.level || 2;
                return `<h${level}>${block.data.text || ''}</h${level}>`;
            
            case 'paragraph':
                return `<p>${block.data.text || ''}</p>`;
            
            case 'list':
                const listType = block.data.style === 'ordered' ? 'ol' : 'ul';
                const items = block.data.items || [];
                const listItems = items.map(item => {
                    // Handle both string items and object items with content property
                    const text = typeof item === 'string' ? item : (item.content || '');
                    // Handle nested items if they exist
                    if (item.items && item.items.length > 0) {
                        const nestedItems = item.items.map(nested => {
                            const nestedText = typeof nested === 'string' ? nested : (nested.content || '');
                            return `<li>${nestedText}</li>`;
                        }).join('');
                        return `<li>${text}<ul>${nestedItems}</ul></li>`;
                    }
                    return `<li>${text}</li>`;
                }).join('');
                return `<${listType}>${listItems}</${listType}>`;
            
            default:
                return `<div class="unknown-block">${JSON.stringify(block.data)}</div>`;
        }
    }

    // Render markdown content to HTML
    renderMarkdown(markdownText, containerId) {
        const container = document.getElementById(containerId);
        if (!container || !markdownText) return;

        // Simple markdown-to-HTML conversion
        let html = markdownText
            // Headers
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            // Bold and italic
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Line breaks and paragraphs
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');
        
        // Wrap in paragraphs
        html = '<p>' + html + '</p>';
        
        // Clean up empty paragraphs
        html = html.replace(/<p><\/p>/g, '').replace(/<p><br>/g, '<p>');
        
        container.innerHTML = html;
    }

    // Render formatted update section
    renderFormattedUpdate(updateData, title, type, contentId) {
        if (!updateData) {
            return `<div class="formatted-update ${type}">
                <h4 class="update-type-title">${title}</h4>
                <p class="no-content">No ${type} update available</p>
            </div>`;
        }
        
        return `
            <div class="formatted-update ${type}">
                <h4 class="update-type-title">${title}</h4>
                <div class="update-content-rendered" id="${contentId}"></div>
            </div>
        `;
    }

    // Render North Star display
    renderNorthStar(value, metric) {
        // Only display the value with metric name, not the note (note is integrated into published/internal updates)
        if (!value) {
            return '';
        }
        
        const metricLabel = metric ? metric.toLowerCase() : 'metric';
        
        return `
            <div class="north-star-display">
                <div class="north-star-label">${this.escapeHtml(metricLabel)}</div>
                <div class="north-star-value">${this.escapeHtml(String(value))}</div>
            </div>
        `;
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Format date for display
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    // Format date and time for display
    formatDateTime(dateTimeString) {
        const date = new Date(dateTimeString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Export for global use
window.ContentRenderer = ContentRenderer;