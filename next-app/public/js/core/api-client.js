// API communication module
class ApiClient {
    constructor() {
        // No API configuration needed - using Next.js API routes
    }

    async callClaudeAPI(formData) {
        console.log('callClaudeAPI called with:', formData);
        
        // Use Next.js API route
        const endpoint = '/api/extract-bullets';

        console.log('Using endpoint:', endpoint);

        try {
            // Try server endpoint first
            console.log('Making fetch request...');
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
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
            
            // Handle new Editor.js block format with privacy info
            if (data.format === 'editorjs' && data.editorBlock) {
                console.log('Returning Editor.js block format with privacy');
                console.log('FULL EDITORBLOCK DATA:', JSON.stringify(data.editorBlock, null, 2));
                return data.editorBlock;
            }
            
            // Return markdown if it exists (fallback)
            if (data.markdown) {
                console.log('Returning markdown from response');
                return data.markdown;
            }
            
            console.log('No structured format found, returning raw data');
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

    // Validate form data has content
    validateFormData(formData) {
        return Object.values(formData).some(value => value.trim() !== '');
    }

    // API configuration check no longer needed
    checkApiConfig() {
        // API key is handled by Next.js environment variables
        return true;
    }
}

// Export for use in other modules
window.ApiClient = ApiClient;