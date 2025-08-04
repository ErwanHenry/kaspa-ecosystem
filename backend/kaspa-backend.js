// kaspa-backend-simplified.js
// Version simplifiée qui utilise un Google Sheets existant

const { google } = require('googleapis');
const { JWT } = require('google-auth-library');
const cron = require('node-cron');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;

// Configuration
const CONFIG = {
    // IMPORTANT: Remplacez ceci par l'ID de votre Google Sheets
    SHEET_ID: process.env.GOOGLE_SHEET_ID || '1qZS7aQXCYoQcSODJbkbrr-hi5BFOXnjbGOypT8en2vQ',
    
    // Compte de service (intégré)
    SERVICE_ACCOUNT: {
        client_email: "kaspa-ecosystem-service@annuairekaspa.iam.gserviceaccount.com",
        private_key: "-----BEGIN PRIVATE KEY-----\nREMOVED_FOR_SECURITY\n-----END PRIVATE KEY-----\n"
    },
    
    // Sources de scraping
    SCRAPING_SOURCES: [
        {
            name: 'Kaspa Official',
            url: 'https://kaspa.org',
            type: 'website'
        },
        {
            name: 'Kas.fyi Explorer',
            url: 'https://kas.fyi',
            type: 'website'
        },
        {
            name: 'GitHub Kaspa',
            url: 'https://api.github.com/search/repositories?q=kaspa+in:name,description&sort=stars&per_page=20',
            type: 'github'
        }
    ]
};

// Manager Google Sheets simplifié
class GoogleSheetsManager {
    constructor() {
        this.auth = null;
        this.sheets = null;
    }
    
    async initialize() {
        console.log('📊 Initialisation Google Sheets...');
        
        if (CONFIG.SHEET_ID === 'REMPLACEZ_PAR_VOTRE_ID_SPREADSHEET') {
            console.error('❌ ERREUR: Vous devez configurer l\'ID du Google Sheets!');
            console.log('\n📋 Instructions:');
            console.log('1. Créez un Google Sheets: https://sheets.google.com');
            console.log('2. Partagez-le avec:', CONFIG.SERVICE_ACCOUNT.client_email);
            console.log('3. Copiez l\'ID depuis l\'URL');
            console.log('4. Remplacez SHEET_ID dans ce fichier ou utilisez:');
            console.log('   export GOOGLE_SHEET_ID=votre_id_ici');
            process.exit(1);
        }
        
        try {
            // Créer l'authentification
            this.auth = new JWT({
                email: CONFIG.SERVICE_ACCOUNT.client_email,
                key: CONFIG.SERVICE_ACCOUNT.private_key,
                scopes: ['https://www.googleapis.com/auth/spreadsheets']
            });
            
            // Initialiser le service
            this.sheets = google.sheets({ version: 'v4', auth: this.auth });
            
            // Vérifier l'accès
            await this.verifyAccess();
            
            console.log('✅ Google Sheets connecté avec succès!');
            console.log(`📊 Spreadsheet: https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}`);
            
        } catch (error) {
            console.error('❌ Erreur d\'initialisation:', error.message);
            throw error;
        }
    }
    
    async verifyAccess() {
        try {
            const response = await this.sheets.spreadsheets.get({
                spreadsheetId: CONFIG.SHEET_ID
            });
            console.log(`✅ Accès confirmé au spreadsheet: ${response.data.properties.title}`);
            
            // Vérifier ou créer les feuilles nécessaires
            await this.ensureSheets(response.data.sheets || []);
            
        } catch (error) {
            if (error.code === 403) {
                console.error('\n❌ Erreur d\'accès au spreadsheet!');
                console.log('Vérifiez que vous avez bien partagé le spreadsheet avec:');
                console.log(`   ${CONFIG.SERVICE_ACCOUNT.client_email}`);
                console.log('Avec les permissions "Éditeur"\n');
            }
            throw error;
        }
    }
    
    async ensureSheets(existingSheets) {
        const requiredSheets = ['Projects', 'Scraping_Log', 'Statistics'];
        const existingNames = existingSheets.map(s => s.properties.title);
        
        for (const sheetName of requiredSheets) {
            if (!existingNames.includes(sheetName)) {
                console.log(`📝 Création de la feuille: ${sheetName}`);
                await this.createSheet(sheetName);
            }
        }
        
        // Setup headers si nécessaire
        await this.setupHeaders();
    }
    
    async createSheet(title) {
        await this.sheets.spreadsheets.batchUpdate({
            spreadsheetId: CONFIG.SHEET_ID,
            requestBody: {
                requests: [{
                    addSheet: {
                        properties: { title }
                    }
                }]
            }
        });
    }
    
    async setupHeaders() {
        try {
            // Vérifier si les headers existent déjà
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: CONFIG.SHEET_ID,
                range: 'Projects!A1:T1'
            });
            
            if (!response.data.values || response.data.values[0].length === 0) {
                console.log('📝 Configuration des headers...');
                
                const headers = [[
                    'ID', 'Name', 'URL', 'Category', 'Status', 'Description',
                    'Twitter', 'Discord', 'Telegram', 'GitHub', 'Website',
                    'Audit Status', 'Tags', 'Source', 'First Seen', 'Last Updated',
                    'Active Users', 'TVL', 'Market Cap', 'Notes'
                ]];
                
                await this.sheets.spreadsheets.values.update({
                    spreadsheetId: CONFIG.SHEET_ID,
                    range: 'Projects!A1:T1',
                    valueInputOption: 'RAW',
                    requestBody: { values: headers }
                });
            }
        } catch (error) {
            console.log('Headers déjà configurés ou erreur:', error.message);
        }
    }
    
    async addProject(project) {
        try {
            // Obtenir la prochaine ligne disponible
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: CONFIG.SHEET_ID,
                range: 'Projects!A:A'
            });
            
            const nextRow = (response.data.values?.length || 0) + 1;
            const projectId = `KAS-${Date.now()}`;
            
            const values = [[
                projectId,
                project.name,
                project.url,
                project.category,
                project.status || 'active',
                project.description,
                project.twitter || '',
                project.discord || '',
                project.telegram || '',
                project.github || '',
                project.website || project.url,
                project.audit || 'none',
                (project.tags || []).join(', '),
                project.source || 'scraper',
                new Date().toISOString(),
                new Date().toISOString(),
                '', '', '', ''
            ]];
            
            await this.sheets.spreadsheets.values.append({
                spreadsheetId: CONFIG.SHEET_ID,
                range: `Projects!A${nextRow}:T${nextRow}`,
                valueInputOption: 'RAW',
                requestBody: { values }
            });
            
            console.log(`✅ Projet ajouté: ${project.name}`);
            return projectId;
            
        } catch (error) {
            console.error('❌ Erreur ajout projet:', error.message);
            throw error;
        }
    }
    
    async getProjects() {
        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: CONFIG.SHEET_ID,
                range: 'Projects!A2:T'
            });
            
            return (response.data.values || []).map(row => ({
                id: row[0],
                name: row[1],
                url: row[2],
                category: row[3],
                status: row[4],
                description: row[5]
            }));
        } catch (error) {
            console.error('Erreur lecture projets:', error.message);
            return [];
        }
    }
    
    async logScraping(source, count, status) {
        try {
            const values = [[
                new Date().toISOString(),
                source,
                count,
                status
            ]];
            
            await this.sheets.spreadsheets.values.append({
                spreadsheetId: CONFIG.SHEET_ID,
                range: 'Scraping_Log!A:D',
                valueInputOption: 'RAW',
                requestBody: { values }
            });
        } catch (error) {
            console.error('Erreur log scraping:', error.message);
        }
    }
}

// Scraper simplifié
class KaspaScraper {
    constructor(sheetsManager) {
        this.sheetsManager = sheetsManager;
        this.existingUrls = new Set();
    }
    
    async initialize() {
        const projects = await this.sheetsManager.getProjects();
        projects.forEach(p => this.existingUrls.add(p.url));
        console.log(`📊 ${this.existingUrls.size} projets existants chargés`);
    }
    
    async scrapeAll() {
        console.log('\n🔍 Démarrage du scraping Kaspa...\n');
        let totalNew = 0;
        
        for (const source of CONFIG.SCRAPING_SOURCES) {
            console.log(`📡 Scraping ${source.name}...`);
            
            try {
                let newProjects = [];
                
                if (source.type === 'website') {
                    newProjects = await this.scrapeWebsite(source);
                } else if (source.type === 'github') {
                    newProjects = await this.scrapeGitHub(source);
                }
                
                // Ajouter les nouveaux projets
                for (const project of newProjects) {
                    if (!this.existingUrls.has(project.url)) {
                        await this.sheetsManager.addProject(project);
                        this.existingUrls.add(project.url);
                        totalNew++;
                    }
                }
                
                console.log(`✅ ${newProjects.length} projets trouvés (${newProjects.filter(p => !this.existingUrls.has(p.url)).length} nouveaux)`);
                await this.sheetsManager.logScraping(source.name, newProjects.length, 'success');
                
            } catch (error) {
                console.error(`❌ Erreur sur ${source.name}:`, error.message);
                await this.sheetsManager.logScraping(source.name, 0, 'error');
            }
        }
        
        console.log(`\n✅ Scraping terminé! ${totalNew} nouveaux projets ajoutés.\n`);
    }
    
    async scrapeWebsite(source) {
        const projects = [];
        
        try {
            const response = await axios.get(source.url, {
                headers: { 'User-Agent': 'Kaspa Ecosystem Bot' }
            });
            const $ = cheerio.load(response.data);
            
            // Recherche générique de liens Kaspa
            $('a[href*="kaspa"], a[href*="kas."]').each((i, elem) => {
                const href = $(elem).attr('href');
                const text = $(elem).text().trim();
                
                if (href && !href.startsWith('#') && href.startsWith('http')) {
                    projects.push({
                        name: text || new URL(href).hostname,
                        url: href,
                        category: this.detectCategory(href, text),
                        description: `Found on ${source.name}`,
                        source: source.name
                    });
                }
            });
            
        } catch (error) {
            console.error(`Erreur scraping ${source.url}:`, error.message);
        }
        
        return projects;
    }
    
    async scrapeGitHub(source) {
        const projects = [];
        
        try {
            const response = await axios.get(source.url, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'Kaspa-Ecosystem-Bot'
                }
            });
            
            for (const repo of response.data.items || []) {
                projects.push({
                    name: repo.name,
                    url: repo.html_url,
                    category: 'tool',
                    description: repo.description || 'Kaspa-related GitHub project',
                    github: repo.html_url,
                    source: 'GitHub'
                });
            }
            
        } catch (error) {
            console.error('Erreur GitHub:', error.message);
        }
        
        return projects;
    }
    
    detectCategory(url, text = '') {
        const combined = (url + ' ' + text).toLowerCase();
        
        if (combined.includes('wallet')) return 'wallet';
        if (combined.includes('exchange') || combined.includes('swap')) return 'exchange';
        if (combined.includes('defi')) return 'defi';
        if (combined.includes('nft')) return 'nft';
        if (combined.includes('explorer')) return 'explorer';
        if (combined.includes('mining') || combined.includes('pool')) return 'infrastructure';
        
        return 'other';
    }
}

// Application principale
async function main() {
    console.log('🚀 Kaspa Ecosystem Backend v2.0');
    console.log('================================\n');
    
    const sheetsManager = new GoogleSheetsManager();
    const scraper = new KaspaScraper(sheetsManager);
    
    try {
        // Initialiser
        await sheetsManager.initialize();
        await scraper.initialize();
        
        // Lancer un scraping initial
        await scraper.scrapeAll();
        
        // Configurer le cron (toutes les 6 heures)
        cron.schedule('0 */6 * * *', async () => {
            console.log(`⏰ Scraping programmé - ${new Date().toISOString()}`);
            await scraper.scrapeAll();
        });
        
        console.log('✅ Backend en cours d\'exécution');
        console.log('⏰ Prochain scraping dans 6 heures\n');
        
        // Garder le processus actif
        process.on('SIGINT', () => {
            console.log('\n👋 Arrêt du backend...');
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ Erreur fatale:', error.message);
        process.exit(1);
    }
}

// Lancer si exécuté directement
if (require.main === module) {
    main();
}

module.exports = { main };