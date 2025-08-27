# Server

This folder contains the backend server and configuration files for the Weekly Update Dashboard.

## Files

- **server.js** (137 lines) - Express.js server with Claude API integration
  - Serves static files from parent directory
  - Provides `/api/extract-bullets` endpoint for AI-powered bullet point extraction
  - Uses Claude Sonnet 4 model for natural language processing

- **config.js** (6 lines) - API configuration
  - Contains Anthropic API key and model settings
  - Used by frontend for direct API calls (fallback)

- **package.json** (18 lines) - Node.js dependencies
  - Express.js for server framework
  - CORS for cross-origin requests
  - node-fetch for HTTP requests to Claude API

- **package-lock.json** (1,287 lines) - Dependency lock file

## Usage

```bash
# Install dependencies
npm install

# Start server
node server.js

# Server runs on http://localhost:3000
```

## API Endpoints

- `GET /` - Serves the main HTML application
- `POST /api/extract-bullets` - Converts natural language weekly updates into hierarchical bullet points