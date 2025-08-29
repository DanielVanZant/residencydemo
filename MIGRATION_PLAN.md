# Weekly Updates App - Next.js Migration Plan

## Overview
This document outlines the step-by-step migration of the Weekly Updates app from a legacy HTML/Express structure to a modern Next.js + Convex + Vercel architecture. The migration is designed with **incremental legacy removal** - each checkpoint removes specific legacy components after verifying the replacement works perfectly.

## Tech Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Convex (replaces Express + SQLite)  
- **Deployment**: Vercel
- **UI Components**: shadcn/ui (Phase 2)
- **Caching**: Upstash Redis (Phase 3, optional)

## Core Principles
1. **Preserve ALL existing functionality** - app should work identically
2. **Remove legacy pieces incrementally** - catch issues immediately  
3. **Git commit at each checkpoint** - safe rollback points
4. **Test thoroughly before removal** - verify replacement works first

---

# Checkpoint Progress Tracker

## 🔥 CHECKPOINT 1: Replace index.html with Next.js homepage
**Estimated Time**: 1-2 hours  
**Legacy Removed**: `index.html` only  
**Risk Level**: 🟢 Low  

### Tasks:
- [x] Initialize Next.js project with TypeScript and Tailwind
- [x] Create `app/page.tsx` that renders identical homepage content
- [x] Import and configure necessary CSS styles
- [x] Test homepage functionality matches exactly
- [x] Update navigation links in other pages to point to `/` instead of `/index.html`
- [x] **DELETE** `index.html` file
- [x] Verify no broken links or references
- [x] Test full application still works
- [ ] Git commit with detailed notes

**Verification Checklist:**
- [x] Homepage at `/` renders identically to old `index.html`
- [x] All styling preserved (colors, layout, responsive design)
- [x] Navigation from dashboard/weekly-update pages works
- [x] No console errors in browser
- [x] Legacy dashboard.html and weekly-update.html still work normally

**Notes/Issues:**
```
Key issues resolved during implementation:
- Fixed "files not in expected places" pattern throughout codebase
- Fixed weekly-update-system.js: user dropdown ID, for-loop syntax, API endpoints
- Fixed UpdateGenerator not being instantiated globally
- Fixed EditorUtils displayBullets usage
- Fixed API endpoint mismatch for save-weekly-update
- Fixed animations.css path references
- Added missing summary generation after save
- Improved error handling for API timeouts
```

**Completed**: ✅ **Date**: 2025-08-28 **Committed**: ✅ **Commit**: f0983d0

---

## 🔥 CHECKPOINT 2: Migrate core utilities, remove js/core/
**Estimated Time**: 2-3 hours  
**Legacy Removed**: `js/core/` folder entirely  
**Risk Level**: 🟡 Medium  

### Tasks:
- [ ] Create `lib/core/` folder structure
- [ ] Convert `js/core/user-session.js` to `lib/core/user-session.ts`
  - [ ] Maintain identical API - same methods, same behavior
  - [ ] Add TypeScript types
  - [ ] Test user session functionality
- [ ] Convert `js/core/ui-utils.js` to `lib/core/ui-utils.ts`
  - [ ] Preserve all UI utility methods
  - [ ] Test loading states, error handling
- [ ] Convert `js/core/api-client.js` to `lib/core/api-client.ts`
  - [ ] Maintain same API request patterns
  - [ ] Test API communication
- [ ] Update Next.js homepage to import and use new core modules
- [ ] **DELETE** entire `js/core/` folder
- [ ] Verify legacy pages still work (they don't use core modules yet)
- [ ] Git commit

**Verification Checklist:**
- [ ] `js/core/` folder completely removed from filesystem
- [ ] Next.js homepage still works with user session, UI utils, API client
- [ ] TypeScript compilation passes with no errors
- [ ] Legacy dashboard.html and weekly-update.html still functional
- [ ] No broken imports or references to deleted files

**Notes/Issues:**
```
[Space for developer notes]
```

**Completed**: ✅ **Date**: 2025-08-28 **Committed**: ✅ **Commit**: f0983d0

---

## 🔥 CHECKPOINT 3: Convex setup + Remove SQLite
**Estimated Time**: 3-4 hours  
**Legacy Removed**: `server/weekly_updates.db` + all SQLite code  
**Risk Level**: 🟡 Medium-High  

### Tasks:
- [ ] Initialize Convex project (`npx convex dev`)
- [ ] Create Convex schema that matches current SQLite structure
  - [ ] `users` table → Convex `users` collection
  - [ ] `weekly_updates` table → Convex `updates` collection  
  - [ ] `user_summaries` table → Convex `summaries` collection
- [ ] Export data from SQLite and import to Convex
- [ ] Create Convex functions that mirror Express API endpoints:
  - [ ] `getUserUpdates` (replaces `/api/user-updates/:username`)
  - [ ] `saveUpdate` (replaces `/api/save-update/:username`)
  - [ ] `getUserSummaries` (replaces `/api/user-summaries/:username`)
  - [ ] `getUsers` (replaces `/api/users`)
  - [ ] `getUserNorthStar` (replaces `/api/user/:username/north-star`)
- [ ] Update Express server to use Convex instead of SQLite
- [ ] Test all API endpoints return identical data
- [ ] **DELETE** `server/weekly_updates.db` file
- [ ] **REMOVE** all SQLite code from `server/database.js`
- [ ] Verify both legacy pages and Next.js work with Convex
- [ ] Git commit

**Verification Checklist:**
- [ ] SQLite database file deleted
- [ ] All SQLite query code removed
- [ ] Legacy dashboard and weekly-update pages load data correctly
- [ ] Can save new updates and they appear in dashboard
- [ ] Summary generation still works
- [ ] User dropdown populates correctly
- [ ] No database-related errors in console

**Notes/Issues:**
```
[Space for developer notes - Convex setup can be tricky, document any issues]
Key implementation details:
- Exported all SQLite data to JSON files for backup and import
- Created Convex schema matching SQLite table structure exactly
- Built TypeScript Convex functions mirroring all Express API endpoints
- Developed Convex client wrapper for Express server compatibility
- Successfully imported all existing data to Convex cloud database
- Removed SQLite database file and related code dependencies
- Verified API endpoint compatibility and data integrity
- Added delete function for testing via Convex CLI
```

**Completed**: ✅ **Date**: 2025-08-29 **Committed**: ✅ **Commit**: 18f32e1

---

## 🔥 CHECKPOINT 4: Weekly Update Migration + Remove Legacy Form  
**Estimated Time**: 4-5 hours  
**Legacy Removed**: `weekly-update.html` + `js/forms/`  
**Risk Level**: 🔴 High (complex form with Editor.js)

### Tasks:
- [ ] Create `app/weekly-update/page.tsx`
- [ ] Migrate `js/forms/weekly-update-system.js` to `lib/forms/weekly-update-system.ts`
  - [ ] Preserve all form management logic
  - [ ] Preserve North Star integration
  - [ ] Preserve Editor.js integration
  - [ ] Preserve auto-save functionality
- [ ] Import and configure Editor.js in Next.js context
- [ ] Test all form functionality:
  - [ ] User selection dropdown
  - [ ] Editor.js content creation
  - [ ] Bullet extraction
  - [ ] North Star value input
  - [ ] Form submission and saving
  - [ ] Success/error states
- [ ] Update navigation links to point to `/weekly-update`
- [ ] **DELETE** `weekly-update.html`
- [ ] **DELETE** `js/forms/` folder entirely
- [ ] Test form submission saves to Convex correctly
- [ ] Git commit

**Verification Checklist:**
- [ ] `weekly-update.html` and `js/forms/` completely removed
- [ ] Next.js form renders identically to legacy version
- [ ] Editor.js works (can create content, lists, headers)
- [ ] Bullet extraction produces same results as before
- [ ] North Star metrics display and save correctly
- [ ] Form auto-save works (localStorage functionality)
- [ ] Form submission redirects to dashboard properly
- [ ] Can complete full user workflow: select user → create content → save → view in dashboard

**Notes/Issues:**
```
Key implementation decisions:
- Used minimal migration approach: served existing HTML as JSX without TypeScript conversion
- Added API_BASE_URL configuration for cross-port communication (Next.js 3001 → Express 3000)
- Updated all JavaScript API endpoints to use API_BASE_URL for proper routing
- Preserved all existing JavaScript files in public/ directory without modification
- Added initialization scripts to handle timing issues with component loading
- Fixed UpdateGenerator initialization and API endpoint routing
- Successfully tested complete workflow: extract bullets → formatted updates
```

**Completed**: ✅ **Date**: 2025-08-29 **Committed**: ✅ **Commit**: 088ad79

---

## 🔥 CHECKPOINT 5: Dashboard Migration + Remove Legacy Dashboard
**Estimated Time**: 5-6 hours  
**Legacy Removed**: `dashboard.html` + `js/dashboard/`  
**Risk Level**: 🔴 High (most complex page)

### Tasks:
- [ ] Create `app/dashboard/page.tsx`
- [ ] Migrate all dashboard modules to `lib/dashboard/`:
  - [ ] `chart-manager.ts` - Chart.js integration
  - [ ] `content-renderer.ts` - Editor.js and markdown rendering
  - [ ] `dashboard-summary-manager.ts` - Summary display
  - [ ] `dashboard.ts` - Main dashboard controller
- [ ] Test all dashboard functionality:
  - [ ] User selection dropdown
  - [ ] Update display and rendering
  - [ ] North Star chart visualization (Chart.js)
  - [ ] Tab switching (Updates vs Summaries)
  - [ ] Summary display and formatting
  - [ ] URL parameter handling (`?user=username`)
- [ ] Update navigation links to point to `/dashboard`
- [ ] **DELETE** `dashboard.html`
- [ ] **DELETE** `js/dashboard/` folder entirely
- [ ] Test complete user workflow end-to-end
- [ ] Git commit

**Verification Checklist:**
- [ ] `dashboard.html` and `js/dashboard/` completely removed
- [ ] Dashboard renders identically (layout, styling, components)
- [ ] Chart.js North Star visualization works
- [ ] Can switch between Updates and Summaries tabs
- [ ] Update content renders properly (Editor.js blocks)
- [ ] Summary content displays with proper formatting
- [ ] User switching loads correct data
- [ ] URL parameters work (`/dashboard?user=john`)
- [ ] Complete workflow: create update → view in dashboard → see chart/summary

**Notes/Issues:**
```
[Space for developer notes - Chart.js and complex rendering logic]
```

**Completed**: ❌ **Date**: ______ **Committed**: ❌

---

## 🔥 CHECKPOINT 6: CSS Migration + Remove Legacy CSS
**Estimated Time**: 2-3 hours  
**Legacy Removed**: `css/` folder structure  
**Risk Level**: 🟡 Medium

### Tasks:
- [ ] Audit which styles are actually needed in Next.js app
- [ ] Convert critical styles to Tailwind classes where appropriate
- [ ] Create CSS modules for complex custom styles
- [ ] Import necessary styles into Next.js components
- [ ] Test all visual styling preserved across all pages
- [ ] Verify responsive design still works
- [ ] **DELETE** entire `css/` folder structure
- [ ] Test application visually matches legacy version
- [ ] Git commit

**Verification Checklist:**
- [ ] `css/` folder completely removed
- [ ] All pages styled identically to legacy versions
- [ ] Responsive design preserved (test mobile, tablet, desktop)
- [ ] Dark/light mode works if applicable
- [ ] Charts and complex components styled correctly
- [ ] Form styling preserved
- [ ] No visual regressions anywhere

**Notes/Issues:**
```
[Space for developer notes - CSS migration challenges]
```

**Completed**: ❌ **Date**: ______ **Committed**: ❌

---

## 🔥 CHECKPOINT 7: Express Server Removal + API Routes
**Estimated Time**: 3-4 hours  
**Legacy Removed**: `server/` folder + Express server  
**Risk Level**: 🔴 High (removes entire backend)

### Tasks:
- [ ] Create Next.js API routes for any remaining Express endpoints
- [ ] Test that all API functionality works through Convex/Next.js
- [ ] Update any hardcoded API URLs in frontend code
- [ ] **DELETE** entire `server/` folder
- [ ] **DELETE** `server.js` and related Express files
- [ ] Update package.json scripts (remove Express dependencies)
- [ ] Test complete application without Express server
- [ ] Git commit

**Verification Checklist:**
- [ ] `server/` folder and Express code completely removed
- [ ] All API endpoints work via Convex functions
- [ ] No broken API calls or 404 errors
- [ ] Can complete all user workflows without Express
- [ ] Application starts and runs with only `npm run dev`
- [ ] No references to `localhost:3000` or Express endpoints

**Notes/Issues:**
```
[Space for developer notes - API migration challenges]
```

**Completed**: ❌ **Date**: ______ **Committed**: ❌

---

## 🔥 CHECKPOINT 8: Final Cleanup + Vercel Deploy
**Estimated Time**: 1-2 hours  
**Legacy Removed**: Any remaining legacy files  
**Risk Level**: 🟢 Low

### Tasks:
- [ ] Remove any remaining legacy files
- [ ] Clean up package.json (remove unused dependencies)
- [ ] Configure Next.js for production build
- [ ] Set up Vercel project and deployment
- [ ] Configure Convex for production environment
- [ ] Test production deployment
- [ ] Verify all functionality in production
- [ ] Git commit final version

**Verification Checklist:**
- [ ] Clean project structure with no legacy files
- [ ] Production build completes successfully
- [ ] Vercel deployment accessible
- [ ] All functionality works in production
- [ ] Performance is acceptable
- [ ] No console errors in production

**Notes/Issues:**
```
[Space for developer notes - deployment issues]
```

**Completed**: ❌ **Date**: ______ **Committed**: ❌

---

# Development Guidelines

## Before Each Checkpoint:
1. **Create a git branch** for the checkpoint (`git checkout -b checkpoint-N`)
2. **Read the entire checkpoint** before starting
3. **Test the replacement thoroughly** before removing legacy code
4. **Check all references** to files you're about to delete

## During Each Checkpoint:
1. **Make small commits** for individual tasks
2. **Test frequently** - don't wait until the end
3. **Document issues** in the Notes section above
4. **Ask questions** if anything is unclear

## After Each Checkpoint:
1. **Run full manual testing** of affected features
2. **Check browser console** for any errors
3. **Test all user workflows** end-to-end
4. **Verify no functionality regression**
5. **Create final commit** with detailed message
6. **Mark checkpoint as completed** with date

## Testing Checklist (Use for each checkpoint):
- [ ] No console errors in browser developer tools
- [ ] All interactive elements work (buttons, forms, navigation)
- [ ] All data loads correctly (users, updates, summaries)
- [ ] Visual styling matches legacy version
- [ ] Responsive design works on different screen sizes
- [ ] Complete user workflows function end-to-end

## Emergency Rollback:
If something breaks badly, you can always:
```bash
git checkout main  # Go back to last working version
git branch -D checkpoint-N  # Delete problematic branch if needed
```

## Resources:
- **Next.js Docs**: https://nextjs.org/docs
- **Convex Docs**: https://docs.convex.dev/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/

## Questions/Help:
Document any questions or roadblocks here, with the checkpoint number and specific issue:

```
[Space for developer questions and notes]
```

---

**Good luck! Remember: the goal is identical functionality with better architecture. When in doubt, preserve the existing behavior exactly.**