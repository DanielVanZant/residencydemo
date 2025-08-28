// Legacy app.js - Replaced by modular structure
// 
// This file is kept for backward compatibility but functionality
// has been moved to the new modular system:
//
// - User management: js/user-session.js
// - Form handling: js/form-manager.js  
// - North Star metrics: js/north-star-manager.js
// - UI utilities: js/ui-utils.js
// - Main controller: js/weekly-update-app.js
//
// The new system provides:
// - Better separation of concerns
// - Easier testing and maintenance
// - More reusable components
// - Cleaner code organization

console.warn('app.js is deprecated. Functionality moved to modular system.');

// If this file is accidentally loaded on pages that need the functionality,
// show a helpful message
if (document.getElementById('updateForm')) {
    console.log('Weekly update form detected. Make sure weekly-update-app.js is loaded.');
}