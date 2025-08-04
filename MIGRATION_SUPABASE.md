# 🚀 Guide de Migration vers Supabase

## État actuel du projet

- ✅ Backend API avec Google Sheets (fonctionnel)
- ✅ Frontend statique déployé sur Netlify
- 🔄 Migration vers Supabase pour support des notations/commentaires

## Étapes de migration

### 1. Configuration Supabase (✅ Fait)
- Tables créées : projects, ratings, comments, submissions
- RLS configuré
- Triggers pour les notations

### 2. Mise à jour du Frontend (✅ Fait)
- Remplacer l'appel API par Supabase
- Ajouter formulaire de soumission
- Système de notation et commentaires

### 3. Configuration Apify (✅ Fait)  
- Actor pour scraper GitHub, Reddit
- Webhook vers Netlify Functions
- Scheduling automatique

### 4. Prochaines étapes

1. **Remplacer les clés dans le frontend** :
   ```javascript
   // public/js/supabase-client.js
   const SUPABASE_URL = 'votre-url.supabase.co';
   const SUPABASE_ANON_KEY = 'votre-anon-key';
   ```

2. **Déployer les nouvelles fonctions Netlify** :
   ```bash
   git add -A
   git commit -m "feat: Add Supabase integration and scraping webhook"
   git push origin main
   ```

3. **Ajouter les variables d'environnement Netlify** :
   - SUPABASE_URL
   - SUPABASE_SERVICE_KEY (pour le webhook)

4. **Tester** :
   - Soumission de projet
   - Notation
   - Commentaires
   - Webhook Apify

5. **Configurer l'admin** :
   - Protéger /admin.html avec Netlify Identity
   - Ou créer un dashboard Supabase

## Structure finale

```
kaspa-ecosystem/
├── public/
│   ├── index.html          # App principale
│   ├── admin.html          # Interface admin
│   ├── js/
│   │   ├── supabase-client.js
│   │   └── app.js
│   └── css/
├── netlify/
│   └── functions/
│       ├── api-projects.js    # Ancien (peut être supprimé)
│       └── webhook-apify.js   # Nouveau webhook
├── supabase/
│   └── schema.sql          # Schema de la DB
└── apify/
    └── kaspa-scraper.js   # Actor Apify
```

## Avantages de la nouvelle architecture

1. **Base de données relationnelle** pour les notations/commentaires
2. **Scraping automatique** des nouveaux projets
3. **Modération** des soumissions
4. **Performance** avec cache Supabase
5. **Scalabilité** illimitée

## Support

- Documentation Supabase : https://supabase.com/docs
- Documentation Apify : https://docs.apify.com
- Discord Kaspa : Pour annoncer le nouveau site
