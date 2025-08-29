// API communication module with TypeScript
interface APIConfig {
  ANTHROPIC_API_KEY?: string;
}

interface FormData {
  [key: string]: any;
}

interface EditorBlock {
  type: string;
  data: any;
}

interface APIResponse {
  format?: string;
  editorBlock?: EditorBlock;
  markdown?: string;
  error?: string;
  [key: string]: any;
}

declare global {
  interface Window {
    API_CONFIG?: APIConfig;
  }
}

export class ApiClient {
  // API configuration check
  hasValidConfig(): boolean {
    if (typeof window === 'undefined') return false;
    
    return typeof window.API_CONFIG !== 'undefined' && 
           !!window.API_CONFIG.ANTHROPIC_API_KEY && 
           window.API_CONFIG.ANTHROPIC_API_KEY !== 'your-anthropic-api-key-here';
  }

  async callClaudeAPI(formData: FormData): Promise<any> {
    console.log('callClaudeAPI called with:', formData);
    
    if (typeof window === 'undefined') {
      throw new Error('Cannot call API from server side');
    }
    
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
          'x-api-key': window.API_CONFIG?.ANTHROPIC_API_KEY || ''
        },
        body: JSON.stringify({ formData })
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorData: APIResponse = await response.json().catch(() => ({}));
        console.error('API error response:', errorData);
        throw new Error(errorData.error || `API request failed: ${response.status}`);
      }

      const data: APIResponse = await response.json();
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
    } catch (error: any) {
      console.error('callClaudeAPI error:', error);
      // If server is not running, provide helpful error
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        throw new Error('Server not running. Please run: npm install && npm start');
      }
      throw error;
    }
  }

  // Validate form data has content
  validateFormData(formData: FormData): boolean {
    return Object.values(formData).some(value => 
      value && typeof value === 'string' && value.trim() !== ''
    );
  }

  // Check if API configuration is valid
  checkApiConfig(): void {
    if (!this.hasValidConfig()) {
      throw new Error('Please configure your Anthropic API key in config.js');
    }
  }
}

// Create singleton instance
let apiClientInstance: ApiClient | null = null;

export function getApiClient(): ApiClient {
  if (!apiClientInstance) {
    apiClientInstance = new ApiClient();
  }
  return apiClientInstance;
}

// For backward compatibility with window.ApiClient
if (typeof window !== 'undefined') {
  (window as any).ApiClient = ApiClient;
}