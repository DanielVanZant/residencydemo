# Import Data Directory

Place your JSON files here (one per user) for importing into the weekly updates system.

## File Structure
```
import-data/
├── user1.json
├── user2.json
├── user3.json
└── ...
```

## To Import
```bash
cd ../server
node imports/import-updates.js ../import-data
```

## File Format
Each JSON file should follow the format specified in:
- `../server/imports/LLM-CONVERSION-GUIDE.md`
- `../server/imports/example-import-format.json`