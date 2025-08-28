# Weekly Updates Import System

This system allows you to import existing weekly updates from JSON files into the database.

## 📁 File Structure

Create one JSON file per user in a directory (e.g., `./import-data/`):
```
import-data/
├── ada-lovelace.json
├── charles-babbage.json
├── marie-curie.json
└── alan-turing.json
```

## 📝 JSON Format

Each JSON file should contain:

```json
{
  "username": "user-handle",
  "updates": [
    {
      "weekDate": "YYYY-MM-DD",
      "bulletPoints": "markdown checklist OR object",
      "publishedUpdate": "text OR Editor.js object (optional)",
      "internalUpdate": "text OR Editor.js object (optional)"
    }
  ]
}
```

### Bullet Points Formats

**Option 1: Markdown Checklist** (Recommended)
```json
"bulletPoints": "- [x] Completed task\n  - [x] Subtask done\n  - [ ] Subtask pending\n- [ ] Future work needed"
```

**Option 2: Editor.js Object**
```json
"bulletPoints": {
  "style": "checklist",
  "meta": {},
  "items": [
    {
      "content": "Completed task",
      "meta": { "checked": true },
      "items": []
    }
  ]
}
```

### Formatted Updates (Optional)

**Simple Text:**
```json
"publishedUpdate": "Made great progress this week on the algorithm work."
```

**Editor.js Blocks:**
```json
"publishedUpdate": {
  "blocks": [
    {
      "type": "header",
      "data": { "text": "Weekly Update", "level": 2 }
    },
    {
      "type": "paragraph", 
      "data": { "text": "Content here..." }
    }
  ]
}
```

## 🚀 How to Import

1. **Create your JSON files** following the format above
2. **Put them in a directory** (e.g., `./import-data/`)
3. **Run the import script:**

```bash
cd server
node import-updates.js ./import-data
```

## 📋 Import Process

The script will:
- ✅ Read all `.json` files in the specified directory
- ✅ Create users if they don't exist
- ✅ Import bullet points in the correct checklist format
- ✅ Import formatted updates (published/internal) 
- ✅ Skip updates that already exist (by username + week date)
- ✅ Show progress and any errors

## 🔧 Advanced Usage

**Import from different directory:**
```bash
node import-updates.js /path/to/my/updates
```

**Test with the example:**
```bash
node import-updates.js .
# This will import the example-import-format.json file
```

## 🧪 Example Files

- `example-import-format.json` - Shows all supported formats
- Run with: `node import-updates.js .` to test

## ⚠️ Important Notes

1. **Unique Constraint**: Each user can only have one update per week date
2. **Date Format**: Use `YYYY-MM-DD` format for dates
3. **Username**: Should match your system's username format
4. **Backup**: The script doesn't modify existing data, only adds new records
5. **Markdown**: Checkbox format should use `[x]` for checked, `[ ]` for unchecked

## 🐛 Troubleshooting

**Error: "Missing required field: username"**
- Make sure each JSON file has a `username` field

**Error: "Missing or invalid updates array"**  
- Ensure `updates` is an array with at least one update

**Error: "Invalid bulletPoints format"**
- bulletPoints must be either a markdown string or a checklist object

**Warning: "Update already exists"**
- The combination of username + weekDate already exists in database
- This is normal and the script will skip and continue