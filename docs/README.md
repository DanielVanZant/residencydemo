# Weekly Update Dashboard with Bullet Extraction

A clean, modern weekly update form with AI-powered bullet point extraction using Claude Opus.

## Features

- 📝 **Weekly Update Form**: Track accomplishments, priorities, challenges, metrics, learnings, wins, and support needs
- 💾 **Auto-Save**: Form data automatically saves to browser localStorage as you type
- 🎯 **Bullet Extraction**: Uses Claude Opus to convert natural language entries into atomic bullet points
- 🎨 **Modern Design**: Clean gradient interface following the unified design system
- 📱 **Responsive**: Works on desktop and mobile devices

## Setup Instructions

### 1. Get Your Anthropic API Key

1. Sign up for an Anthropic account at [console.anthropic.com](https://console.anthropic.com)
2. Navigate to API Keys section
3. Create a new API key
4. Copy the key (it starts with `sk-ant-api...`)

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure the Application

**Option A: Using Environment Variables (Recommended)**

1. Copy the environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your API key:
   ```
   ANTHROPIC_API_KEY=sk-ant-api...
   PORT=3000
   ```

**Option B: Using Client Config**

1. Copy the config file:
   ```bash
   cp config.js.example config.js
   ```

2. Edit `config.js` and add your API key:
   ```javascript
   const API_CONFIG = {
       ANTHROPIC_API_KEY: 'sk-ant-api...',
       MODEL: 'claude-3-opus-20240229',
       MAX_TOKENS: 2000,
       TEMPERATURE: 0.3
   };
   ```

### 4. Run the Application

Start the Node.js server:

```bash
npm start
# Or for development with auto-reload:
npm run dev
```

Then open your browser to: http://localhost:3000/weekly-update.html

## Usage

1. **Fill out the form**: Enter your weekly update information in natural language
2. **Auto-save**: Your entries are automatically saved as you type
3. **Extract bullets**: Click "Extract Bullet Points" to convert your entries into structured bullets
4. **Review**: The AI will organize your content into clear, atomic bullet points by category

## Cost Estimates

Using Claude Opus 3:
- **Per update**: ~$0.07-0.08
- **For 100 updates**: ~$7-8
- **For 150 updates** (10 houses): ~$10-12

## Security Note

⚠️ **Important**: Never commit your `config.js` file with your API key to version control. The `.gitignore` file is configured to exclude it.

For production use, you should:
1. Use a backend server to make API calls
2. Implement proper authentication
3. Store API keys securely on the server

## Files

- `weekly-update.html` - Main application file
- `config.js` - Your API configuration (create from config.js.example)
- `config.js.example` - Example configuration file
- `style-guide.md` - Design system documentation
- `.gitignore` - Excludes sensitive files from git

## Troubleshooting

**"Server not running. Please run: npm install && npm start"**
- Make sure you've installed dependencies with `npm install`
- Start the server with `npm start`
- Check that the server is running on port 3000

**"Please configure your Anthropic API key"**
- Make sure you've created `.env` from `.env.example` or `config.js` from `config.js.example`
- Check that your API key is correctly entered
- Restart the server after adding the key

**"API request failed: 401"**
- Your API key may be invalid or expired
- Check your Anthropic account for the correct key
- Ensure the key starts with `sk-ant-api`

**"Failed to extract bullet points: NetworkError"**
- The server needs to be running to proxy API requests
- Run `npm start` in the project directory
- Check that port 3000 is not already in use

## License

MIT