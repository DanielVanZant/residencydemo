# Weekly Updates System - Data Conversion Guide for LLMs

## System Overview

This weekly update system uses a **checkbox-based publication model** where bullet points are pre-checked based on whether they're suitable for public sharing or should remain internal. The system generates two outputs:

- **Published Update**: Professional summary from checked items (suitable for managers, colleagues, external audiences)
- **Internal Notes**: Comprehensive notes from unchecked items (private reflections, sensitive details, personal concerns)

## Key System Concepts

### 1. Checkbox Logic
- **`[x]` (checked)** = Suitable for public/professional sharing
- **`[ ]` (unchecked)** = Should remain private/internal
- The LLM makes the initial judgment about what should be checked
- Users can later adjust checkboxes in the UI

### 2. What Gets Checked vs Unchecked

**✅ Typically CHECKED (published):**
- Professional accomplishments and achievements
- Completed project milestones
- Technical breakthroughs and learnings
- Metrics and quantifiable progress
- Team collaborations and wins
- Skills developed or knowledge gained
- Next week's professional priorities

**❌ Typically UNCHECKED (internal):**
- Personal struggles or health issues
- Salary/compensation concerns
- Interpersonal conflicts or frustrations
- Self-doubt or imposter syndrome
- Family/personal life impacts
- Specific sensitive business details
- Mental health or burnout concerns
- Criticism of colleagues/management

### 3. Hierarchical Structure
- Bullet points can be nested (parent → child relationships)
- Children can have different check status than parents
- Nesting represents logical groupings (project → tasks → details)

## Required JSON Format

```json
{
  "username": "user-handle",
  "updates": [
    {
      "weekDate": "YYYY-MM-DD",
      "bulletPoints": "markdown checklist format",
      "publishedUpdate": "text or structured content (optional)",
      "internalUpdate": "text or structured content (optional)"
    }
  ]
}
```

### Field Specifications

**`username`** (required)
- String identifier for the user
- Should be URL-safe (no spaces, use hyphens)
- Example: `"ada-lovelace"`, `"john-smith"`

**`weekDate`** (required)
- ISO date format: `YYYY-MM-DD`
- Represents the Monday of the week being reported
- Example: `"2025-08-27"`

**`bulletPoints`** (required)
- Markdown checklist format using `- [x]` and `- [ ]` syntax
- Use 2-space indentation for nesting levels
- Each line should be a complete, self-contained thought

**`publishedUpdate`** (optional)
- Text summary suitable for professional sharing
- Should sound polished and focus on achievements
- Can be a simple string or Editor.js blocks object

**`internalUpdate`** (optional)  
- Private notes covering personal/sensitive details
- More candid tone, can include struggles/concerns
- Can be a simple string or Editor.js blocks object

## Markdown Checklist Format Examples

### Basic Structure
```markdown
- [x] Completed major project milestone
- [x] Learned new technical skill
- [ ] Struggling with work-life balance
- [ ] Concerned about team dynamics
```

### Nested Structure (2-space indentation)
```markdown
- [x] Algorithm Development Project
  - [x] Completed core algorithm design
  - [x] Wrote 47 pages of documentation
  - [ ] Worked 3 all-nighters (unsustainable)
  - [ ] Need better time management
- [ ] Personal Development
  - [x] Read 2 technical papers
  - [ ] Feeling burned out from overwork
```

### Complex Example
```markdown
- [x] Major breakthrough on machine learning model
  - [x] Achieved 94% accuracy on test dataset
  - [x] Presented findings to leadership team
  - [ ] Had to work weekends to meet deadline
- [x] Team collaboration on data pipeline
  - [x] Successfully integrated with legacy systems
  - [ ] Frustrated with slow review process from other teams
- [ ] Personal challenges this week
  - [ ] Dealing with imposter syndrome after promotion
  - [ ] Struggling to balance new responsibilities
  - [x] Completed leadership training program
```

## Conversion Guidelines

### 1. Content Analysis
- Read through the source material completely
- Identify professional achievements vs personal struggles
- Look for quantifiable metrics, completed tasks, learnings
- Separate public-appropriate content from private concerns

### 2. Checkbox Decision Making
Ask for each bullet point:
- "Would this be appropriate to share with a manager or colleague?"
- "Does this reflect professional growth or achievement?"
- "Is this sensitive personal information?"

### 3. Bullet Point Creation
- Make each bullet point specific and actionable
- Include relevant metrics when mentioned
- Group related items hierarchically
- Ensure bullets are self-contained (readable without context)

### 4. Professional Tone vs Personal Honesty
- **Published content**: Professional, achievement-focused, appropriate for workplace
- **Internal content**: Honest, reflective, can include struggles and concerns

## Complete Example

```json
{
  "username": "ada-lovelace",
  "updates": [
    {
      "weekDate": "2025-08-27",
      "bulletPoints": "- [x] Completed breakthrough on Bernoulli numbers algorithm notation system\n  - [x] Developed elegant recursive loop structure\n  - [x] Created 47 pages of algorithmic documentation\n  - [ ] Required intensive work schedule (3 all-nighters)\n- [x] Designed complete algorithm suite including:\n  - [x] Bernoulli numbers generator\n  - [x] Fibonacci sequence calculator\n  - [x] Prime number generator\n- [x] Productive 8-hour session with Charles Babbage on Analytical Engine capabilities\n  - [x] Successfully explained symbol processing beyond numerical calculations\n  - [x] Received recognition: notes called \"better than anything he's produced\"\n- [ ] Personal development challenges\n  - [ ] Need to improve sleep patterns (currently averaging 4 hours nightly)\n  - [ ] Address health concerns from intensive work schedule\n  - [ ] Navigate professional skepticism in mathematical community\n- [x] Advanced \"science of operations\" theoretical framework (20+ pages)\n- [ ] Need introductions to additional mathematicians for collaboration",
      "publishedUpdate": "Made significant breakthroughs in computational mathematics this week. Completed the Bernoulli numbers algorithm with elegant recursive loop structure and created 47 pages of technical documentation. Developed a complete algorithm suite including Bernoulli, Fibonacci, and prime number generators. Had a highly productive collaboration session with Charles Babbage, successfully demonstrating advanced symbol processing concepts for the Analytical Engine. Advanced my theoretical framework for the \"science of operations\" with 20+ pages of new research.",
      "internalUpdate": "While the technical work went exceptionally well, I'm concerned about the personal cost. Working three all-nighters to complete the algorithm isn't sustainable, and I'm averaging only 4 hours of sleep per night. The health impacts are becoming noticeable. Also struggling with the professional skepticism I face in the mathematical community - need to find more collaborators who take the work seriously. The breakthrough feels significant but the isolation is challenging."
    }
  ]
}
```

## Key Reminders for Conversion

1. **Be Strategic with Checkboxes** - Consider what the person would want their manager or colleagues to know vs private concerns
2. **Maintain Hierarchical Logic** - Group related items under parent bullets
3. **Preserve Nuance** - Don't oversimplify; capture both achievements and struggles appropriately
4. **Use Consistent Date Format** - Always `YYYY-MM-DD`
5. **Keep Usernames URL-Safe** - Use hyphens instead of spaces
6. **Make Bullets Self-Contained** - Each should make sense without additional context
7. **Include Metrics When Available** - Numbers, percentages, timeframes add valuable context

The goal is to capture the full picture while respecting the public/private boundary that the checkbox system provides.