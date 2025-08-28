const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('./database');
const apiRoutes = require('./lib/api-routes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
const db = new Database();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('..'));

// Make database available to routes
app.locals.db = db;

// API routes
app.use('/api', apiRoutes);



// Serve the HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dashboard.html'));
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