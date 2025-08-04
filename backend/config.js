// Configuration sécurisée pour Kaspa Ecosystem
require('dotenv').config();

module.exports = {
    // Google Sheets Configuration
    SHEET_ID: process.env.GOOGLE_SHEET_ID || '1qZS7aQXCYoQcSODJbkbrr-hi5BFOXnjbGOypT8en2vQ',
    
    // Service Account Configuration
    // Les clés doivent être définies dans .env (jamais dans le code !)
    SERVICE_ACCOUNT: {
        client_email: process.env.SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.SERVICE_ACCOUNT_KEY ? 
            process.env.SERVICE_ACCOUNT_KEY.replace(/\\n/g, '\n') : 
            undefined
    },
    
    // Vérifier que les clés sont présentes
    isConfigured() {
        return !!(this.SERVICE_ACCOUNT.client_email && this.SERVICE_ACCOUNT.private_key);
    },
    
    // Server Configuration
    PORT: process.env.PORT || 3001,
    
    // Admin Configuration
    ADMIN: {
        username: process.env.ADMIN_USERNAME || 'admin',
        password: process.env.ADMIN_PASSWORD || 'CHANGE_THIS_PASSWORD'
    }
};
