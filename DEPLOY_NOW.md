# 🚀 Instructions de déploiement immédiat

## 1. Push vers GitHub

```bash
# Push la branche feature
git push origin feature/backend-api

# OU directement sur main si vous êtes sûr
git checkout main
git merge feature/backend-api
git push origin main --force
```

## 2. Configuration sur Netlify

1. Aller sur [Netlify](https://app.netlify.com)
2. Site settings > Environment variables
3. Ajouter ces 4 variables (OBLIGATOIRE) :
   - GOOGLE_SHEET_ID
   - GOOGLE_PROJECT_ID
   - SERVICE_ACCOUNT_EMAIL
   - SERVICE_ACCOUNT_KEY

## 3. Google Cloud Setup

1. [Console Google Cloud](https://console.cloud.google.com)
2. Créer/sélectionner un projet
3. Activer "Google Sheets API"
4. Créer un compte de service
5. Télécharger la clé JSON
6. Partager votre Google Sheet avec l'email du compte

## 4. Redéployer sur Netlify

- Le déploiement se fait automatiquement au push
- Sinon : Deploys > Trigger deploy > Deploy site

## 5. Tester l'API

```bash
# Remplacer par votre URL Netlify
curl https://kaspa-ecosystem.netlify.app/api/projects
```

## ✅ Checklist finale

- [ ] Code pushé sur GitHub
- [ ] Variables d'environnement configurées sur Netlify
- [ ] Google Sheet partagé avec le compte de service
- [ ] Site redéployé
- [ ] API testée et fonctionnelle
