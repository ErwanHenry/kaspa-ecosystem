# 🚀 Guide Final de Configuration - Kaspa Ecosystem API

## ✅ Ce qui est déjà fait

1. **Code pushé sur GitHub** ✓
   - Backend API avec Netlify Functions
   - Documentation complète
   - Configuration sécurisée

2. **Architecture serverless prête** ✓
   - `/api/projects` - Endpoint principal
   - Support de recherche et filtrage
   - Cache de 5 minutes

## 🔧 Ce qu'il reste à faire

### 1️⃣ Sur Google Cloud Console

1. Aller sur https://console.cloud.google.com
2. Sélectionner le projet **annuairekaspa**
3. IAM & Admin > Service Accounts
4. Trouver : **kaspa-ecosystem-service@annuairekaspa.iam.gserviceaccount.com**
5. Cliquer sur les 3 points > Manage keys
6. Add Key > Create new key > JSON
7. Télécharger le fichier JSON

### 2️⃣ Sur Netlify

1. Aller sur https://app.netlify.com
2. Sélectionner votre site Kaspa Ecosystem
3. Site settings > Environment variables
4. Ajouter ces variables :

```
GOOGLE_SHEET_ID = 1qZS7aQXCYoQcSODJbkbrr-hi5BFOXnjbGOypT8en2vQ
GOOGLE_PROJECT_ID = annuairekaspa
SERVICE_ACCOUNT_EMAIL = kaspa-ecosystem-service@annuairekaspa.iam.gserviceaccount.com
SERVICE_ACCOUNT_KEY = [Copier la valeur "private_key" du JSON téléchargé]
```

**Important pour SERVICE_ACCOUNT_KEY** :
- Ouvrir le fichier JSON téléchargé
- Copier TOUT le contenu de "private_key" (incluant les -----BEGIN/END-----)
- Dans Netlify, coller tel quel avec les \n
### 3️⃣ Partager le Google Sheet

1. Ouvrir votre Google Sheet : https://docs.google.com/spreadsheets/d/1qZS7aQXCYoQcSODJbkbrr-hi5BFOXnjbGOypT8en2vQ
2. Cliquer sur "Partager"
3. Ajouter : **kaspa-ecosystem-service@annuairekaspa.iam.gserviceaccount.com**
4. Donner l'accès "Lecteur" (Viewer)

### 4️⃣ Redéployer

- Netlify redéploiera automatiquement après l'ajout des variables
- Sinon : Deploys > Trigger deploy > Clear cache and deploy site

## 🧑 Test de l'API

Une fois déployé, tester :

```bash
# Remplacer par votre URL Netlify
curl https://kaspa-ecosystem.netlify.app/api/projects

# Test avec recherche
curl "https://kaspa-ecosystem.netlify.app/api/projects?q=wallet"

# Test avec filtre
curl "https://kaspa-ecosystem.netlify.app/api/projects?category=DeFi"
```

## ⚠️ Points d'attention

1. **Sécurité** : Ne jamais commiter la clé privée
2. **Quota Google** : 300 requêtes/minute (largement suffisant avec le cache)
3. **Netlify Functions** : 125 000 requêtes/mois gratuites

## 🎉 Félicitations !

Une fois ces étapes terminées, votre API sera opérationnelle et votre site récupérera automatiquement les données depuis Google Sheets.
