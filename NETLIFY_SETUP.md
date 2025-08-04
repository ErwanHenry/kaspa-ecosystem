# Configuration Netlify pour Kaspa Ecosystem

## 1. Variables d'environnement à configurer sur Netlify

Dans les settings de votre site Netlify > Environment variables, ajoutez :

```
GOOGLE_SHEET_ID = "votre_sheet_id"
GOOGLE_PROJECT_ID = "votre_project_id"
SERVICE_ACCOUNT_EMAIL = "votre-service@projet.iam.gserviceaccount.com"
SERVICE_ACCOUNT_KEY = "-----BEGIN PRIVATE KEY-----\nVOTRE_CLE_PRIVEE\n-----END PRIVATE KEY-----"
```

## 2. Configuration Google Cloud

1. Aller sur [Google Cloud Console](https://console.cloud.google.com)
2. Créer un nouveau projet ou utiliser un existant
3. Activer l'API Google Sheets
4. Créer un compte de service (IAM & Admin > Service Accounts)
5. Créer une nouvelle clé JSON pour ce compte
6. Partager votre Google Sheet avec l'email du compte de service

## 3. Déploiement

```bash
# Commit et push
git add .
git commit -m "feat: Add Netlify Functions API backend"
git push origin feature/backend-api

# Merger dans main
git checkout main
git merge feature/backend-api
git push origin main
```

## 4. Test de l'API

Une fois déployé, testez votre API :

```bash
# Test local
curl http://localhost:8888/api/projects

# Test production
curl https://votre-site.netlify.app/api/projects
```

## 5. Monitoring

- Vérifier les logs dans Netlify > Functions
- Surveiller les quotas Google Sheets API
- Configurer des alertes si nécessaire
