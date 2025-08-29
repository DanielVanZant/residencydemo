// Helper functions for converting between different data formats

// Convert markdown checklist to Editor.js format
function convertMarkdownChecklistToEditorJS(markdown) {
    const lines = markdown.trim().split('\n');
    const items = [];
    const stack = [{ items, level: -1 }];
    
    lines.forEach(line => {
        const match = line.match(/^(\s*)- \[([ x])\] (.+)$/);
        if (match) {
            const [, indent, checked, content] = match;
            const level = Math.floor(indent.length / 2);
            const isChecked = checked === 'x';
            
            // Find the right parent level
            while (stack.length > 1 && stack[stack.length - 1].level >= level) {
                stack.pop();
            }
            
            const parent = stack[stack.length - 1];
            const item = {
                content: content.trim(),
                meta: { checked: isChecked },
                items: []
            };
            
            parent.items.push(item);
            stack.push({ items: item.items, level });
        }
    });
    
    return {
        type: 'list',
        data: {
            style: 'checklist',
            items: items
        }
    };
}

// Convert bullet data to text
function convertBulletDataToText(bulletData, filterType = 'all', indent = 0) {
    if (!bulletData || !bulletData.data || !bulletData.data.items) {
        return '';
    }
    
    let text = '';
    const indentStr = '  '.repeat(indent);
    
    bulletData.data.items.forEach(item => {
        let includeItem = false;
        
        const isChecked = (item.meta && item.meta.checked) || item.checked;
        
        if (filterType === 'published') {
            // Only include checked items for published update
            includeItem = isChecked;
        } else if (filterType === 'internal') {
            // Only include unchecked items for internal notes
            includeItem = !isChecked;
        } else {
            // Include everything
            includeItem = true;
        }
        
        if (includeItem) {
            const checkbox = isChecked ? '[x]' : '[ ]';
            text += `${indentStr}- ${checkbox} ${item.content}\n`;
            
            // Process nested items
            if (item.items && item.items.length > 0) {
                const nestedData = { data: { items: item.items } };
                text += convertBulletDataToText(nestedData, filterType, indent + 1);
            }
        } else if (item.items && item.items.length > 0) {
            // Even if parent is filtered out, check children
            const nestedData = { data: { items: item.items } };
            text += convertBulletDataToText(nestedData, filterType, indent);
        }
    });
    
    return text;
}

export {
    convertMarkdownChecklistToEditorJS,
    convertBulletDataToText
};