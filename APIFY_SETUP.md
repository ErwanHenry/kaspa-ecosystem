# Configuration Apify pour Kaspa Ecosystem

## 🤖 Actor Apify

L'Actor Apify permet de scraper automatiquement les nouveaux projets Kaspa depuis différentes sources.

### 1. Configuration sur Apify

1. **Créez un compte Apify** : https://apify.com

2. **Créez un nouvel Actor** avec le code suivant :

```javascript
// main.js pour l'Actor Apify
const Apify = require('apify');
const { utils: { log } } = Apify;

Apify.main(async () => {
    const input = await Apify.getInput();
    const { sources = ['twitter', 'github'] } = input;
    
    log.info('Starting Kaspa projects scraper...');
    
    const projects = [];
    
    // Scraper Twitter pour #kaspa
    if (sources.includes('twitter')) {
        // Logique de scraping Twitter
        // Rechercher les tweets avec #kaspa, $KAS
        // Extraire les projets mentionnés
    }
    
    // Scraper GitHub pour les repos Kaspa
    if (sources.includes('github')) {
        const requestQueue = await Apify.openRequestQueue();
        await requestQueue.addRequest({
            url: 'https://api.github.com/search/repositories?q=kaspa&sort=updated',
        });
        
        const crawler = new Apify.CheerioCrawler({
            requestQueue,
            handlePageFunction: async ({ request, $ }) => {
                // Parser les résultats GitHub
                const repos = JSON.parse($('body').text());
                repos.items.forEach(repo => {
                    projects.push({
                        name: repo.name,
                        description: repo.description,
                        url: repo.html_url,
                        category: 'Tools',
                        github: repo.html_url,
                        tags: repo.topics || []
                    });
                });
            },
        });
        
        await crawler.run();
    }
    
    // Sauvegarder les résultats
    await Apify.setValue('OUTPUT', projects);
    
    // Envoyer webhook
    if (input.webhookUrl) {
        await Apify.call('apify/send-mail', {
            to: input.webhookUrl,
            subject: 'New Kaspa Projects Found',
            text: `Found ${projects.length} new projects`,
            attachments: [{
                filename: 'projects.json',
                data: JSON.stringify(projects, null, 2)
            }]
        });
    }
    
    log.info(`Scraping completed. Found ${projects.length} projects.`);
});
```

### 2. Configuration sur Netlify

1. **Variables d'environnement** dans Netlify :
   ```
   APIFY_API_TOKEN=apify_api_XXXXXXXXXX
   APIFY_ACTOR_ID=your-actor-id
   APIFY_WEBHOOK_SECRET=secret-key-123
   ```

2. **Webhook URL** : `https://kaspa-ecosystem.netlify.app/.netlify/functions/webhook-apify`

### 3. Déclenchement du Scraping

#### Manuel (via le bouton "Scrape")
```javascript
// Déjà implémenté dans index.html
async function triggerApifyScrape() {
    const response = await fetch('/.netlify/functions/trigger-apify', {
        method: 'POST'
    });
}
```

#### Automatique (via Cron)
Dans Apify, configurez un schedule :
- Daily at 09:00 UTC
- Weekly on Mondays

### 4. Format des Données

L'Actor doit retourner des projets au format :
```json
{
    "name": "Project Name",
    "description": "Project description",
    "url": "https://project.com",
    "category": "DeFi|Wallets|Mining|NFTs|Infrastructure|Tools|Education|Other",
    "logo_url": "https://logo.png",
    "twitter": "handle",
    "github": "https://github.com/project",
    "discord": "https://discord.gg/invite",
    "telegram": "https://t.me/channel",
    "tags": ["defi", "dex", "kaspa"]
}
```

### 5. Sécurité

- Vérifiez toujours la signature du webhook
- Limitez les sources de scraping aux sites officiels
- Implémentez un système de validation des projets

### 6. Monitoring

- Vérifiez les logs dans Apify Console
- Surveillez les webhooks dans Netlify Functions
- Alertes email si erreurs

## 🔧 Dépannage

### "Actor not found"
- Vérifiez l'ACTOR_ID dans les variables d'environnement
- Assurez-vous que l'Actor est publié

### "Webhook failed"
- Vérifiez que l'URL est correcte
- Testez avec RequestBin d'abord
- Vérifiez les logs Netlify Functions

### "No new projects"
- Vérifiez les sources de scraping
- Ajustez les critères de recherche
- Vérifiez les filtres de duplication
