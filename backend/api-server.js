// api-server.js - API Backend pour Kaspa Ecosystem
// Ce fichier est OPTIONNEL - le frontend fonctionne sans lui

const express = require('express');
const cors = require('cors');
const config = require('./config');

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        configured: config.isConfigured(),
        timestamp: new Date().toISOString() 
    });
});

// Get all projects (example)
app.get('/api/projects', async (req, res) => {
    // Si vous voulez synchroniser avec Google Sheets
    if (config.isConfigured()) {
        // TODO: Implémenter la lecture depuis Google Sheets
        res.json({ message: 'Google Sheets integration not implemented yet' });
    } else {
        res.status(503).json({ 
            error: 'Backend not configured. Please set up .env file.' 
        });
    }
});

// Add project (example)
app.post('/api/projects', async (req, res) => {
    // Si vous voulez synchroniser avec Google Sheets
    if (config.isConfigured()) {
        // TODO: Implémenter l'écriture vers Google Sheets
        res.json({ message: 'Project would be saved to Google Sheets' });
    } else {
        res.status(503).json({ 
            error: 'Backend not configured. Please set up .env file.' 
        });
    }
});

// Start server
const PORT = config.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 API Server running on port ${PORT}`);
    console.log(`Configuration: ${config.isConfigured() ? '✅ Ready' : '❌ Not configured'}`);
    
    if (!config.isConfigured()) {
        console.log('\nTo configure:');
        console.log('1. Copy backend/.env.example to backend/.env');
        console.log('2. Add your Google Cloud credentials');
    }
});
