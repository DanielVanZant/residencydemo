# Server Utility Scripts

This folder contains utility scripts for managing the weekly updates system.

## Scripts

### `manage-summaries.js`
**Unified summary management tool** - replaces the previous individual scripts:
- `regenerate-summaries.js` (removed)
- `generate-all-summaries.js` (removed) 
- `trigger-summaries.js` (removed)

**Usage:**
```bash
# Generate summaries directly via database (recommended)
node scripts/manage-summaries.js
node scripts/manage-summaries.js direct

# Generate summaries via API endpoint (server must be running)
node scripts/manage-summaries.js api

# Generate for specific users only
node scripts/manage-summaries.js direct --users ada-lovelace,marie-curie

# Show help
node scripts/manage-summaries.js help
```

### `setup-north-stars.js`
**North star metric setup script** - initializes user north star metrics and historical data.

**Usage:**
```bash
node scripts/setup-north-stars.js
```

This script sets up:
- North star metrics for each user (Algorithms Documented, Inventions Prototyped, etc.)
- Historical progression data showing metric values over time
- Sample data for dashboard visualization

## Migration Notes

The server directory has been reorganized to reduce clutter:
- **Before**: 4 separate utility scripts at server root level
- **After**: 2 organized scripts in dedicated `scripts/` folder
- **Benefit**: Cleaner server directory structure, unified functionality

The unified `manage-summaries.js` script provides all the functionality of the three previous scripts with a cleaner interface and consistent error handling.