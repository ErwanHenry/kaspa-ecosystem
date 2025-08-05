# 🤖 Guide de Configuration Apify pour Kaspa Ecosystem

## 1. Créer votre Actor Apify

### A. Créez un compte Apify
1. Allez sur [Apify.com](https://apify.com)
2. Créez un compte gratuit
3. Confirmez votre email

### B. Créez un nouvel Actor
1. Dans le dashboard, cliquez sur **"Actors"** > **"Create new"**
2. Choisissez **"Start from scratch"**
3. Nom: `kaspa-ecosystem-scraper`
4. Copiez les fichiers depuis `/apify/` :
   - `main.js`
   - `package.json`
   - `README.md`

### C. Configurez les variables d'environnement
Dans l'Actor settings > Environment variables :
```
SUPABASE_URL=https://kxdngctxlxrbjhdtztuu.supabase.co
SUPABASE_SERVICE_KEY=votre-service-key
WEBHOOK_URL=https://votre-site.netlify.app/.netlify/functions/webhook-apify
WEBHOOK_SECRET=un-secret-securise
```

## 2. Configurer Netlify

### Variables d'environnement Netlify
Ajoutez dans Netlify > Site settings > Environment variables :
```
APIFY_TOKEN=votre-token-apify
APIFY_ACTOR_ID=votre-username/kaspa-ecosystem-scraper
APIFY_WEBHOOK_SECRET=le-meme-secret-que-ci-dessus
```

### Obtenir votre token Apify
1. Dans Apify > Settings > API
2. Copiez votre **API token**

## 3. Tester l'intégration

### A. Test manuel de l'Actor
```json
// Input de test
{
    "projectId": "test-123",
    "urls": {
        "github": "https://github.com/kaspanet/kaspad",
        "website": "https://kaspa.org"
    }
}
```

### B. Déclencher via l'API
```bash
curl -X POST https://votre-site.netlify.app/.netlify/functions/trigger-apify \
  -H "Authorization: Bearer your-secret-token" \
  -H "Content-Type: application/json"
```

## 4. Automatisation

### A. Cron Job Netlify (netlify.toml)
```toml
[[plugins]]
  package = "@netlify/plugin-scheduled-functions"

[functions."trigger-apify"]
  schedule = "0 */6 * * *"  # Toutes les 6 heures
```

### B. Ou utilisez Apify Scheduler
1. Dans votre Actor > Schedules
2. Create schedule
3. Cron: `0 */6 * * *`

## 5. Monitoring

### Vérifier les logs
- **Apify**: Actor > Runs > View logs
- **Netlify**: Functions > View logs
- **Supabase**: SQL Editor
  ```sql
  SELECT * FROM scraping_queue 
  ORDER BY created_at DESC 
  LIMIT 10;
  ```

### Dashboard de monitoring
```sql
-- Créer une vue pour le monitoring
CREATE VIEW scraping_status AS
SELECT 
    p.title,
    sq.status,
    sq.attempts,
    sq.last_error,
    sq.started_at,
    sq.completed_at,
    p.github_stars,
    p.last_scraped_at
FROM scraping_queue sq
JOIN projects p ON p.id = sq.project_id
ORDER BY sq.created_at DESC;
```

## 6. Troubleshooting

### Erreurs communes

1. **"Webhook failed"**
   - Vérifiez WEBHOOK_SECRET des deux côtés
   - Vérifiez que l'URL est correcte

2. **"Rate limit exceeded"**
   - GitHub: Max 60 requêtes/heure sans auth
   - Ajoutez un GitHub token si nécessaire

3. **"Discord 403"**
   - Certains serveurs bloquent les bots
   - Utilisez l'API Discord si possible

### Logs utiles
```javascript
// Dans main.js, ajoutez plus de logs
console.log('Processing:', projectId);
console.log('URLs:', urls);
console.log('Response:', scrapedData);
```

## 7. Optimisations

### Batch processing
```javascript
// Traiter plusieurs projets en parallèle
const results = await Promise.allSettled(
    projects.map(p => scrapeProject(p))
);
```

### Cache GitHub API
```javascript
// Utiliser l'API GitHub avec auth
const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});
```

### Retry logic
```javascript
// Réessayer en cas d'échec
for (let i = 0; i < 3; i++) {
    try {
        return await scrapeUrl(url);
    } catch (error) {
        if (i === 2) throw error;
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
}
```
