const express = require('express');
const cors = require('cors');
const path = require('path');
const ConvexDatabase = require('./lib/convex-client');
const apiRoutes = require('./lib/api-routes');
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Convex database
const db = new ConvexDatabase();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('..'));

// Make database available to routes
app.locals.db = db;

// API routes
app.use('/api', apiRoutes);



// Redirect root to Next.js homepage
app.get('/', (req, res) => {
    res.redirect('http://localhost:3001');
});

app.get('/weekly-update.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'weekly-update.html'));
});

app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dashboard.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Open http://localhost:${PORT}/weekly-update.html to use the app`);
});