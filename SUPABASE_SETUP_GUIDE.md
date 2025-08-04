# 🔑 Guide de Configuration Supabase - Étape par Étape

## 1️⃣ Récupérer vos clés Supabase

### A. Connectez-vous à Supabase
1. Allez sur https://app.supabase.com
2. Sélectionnez votre projet "kaspa-ecosystem"

### B. Trouvez vos clés
1. Cliquez sur **Settings** (icône engrenage) dans le menu de gauche
2. Cliquez sur **API** dans le sous-menu
3. Vous verrez 2 sections importantes :

```
Project URL
https://abcdefghijk.supabase.co   ← Copiez ceci

Project API keys

anon (public)                      ← Pour le frontend (public)
eyJhbGciOiJIUzI1NiIsInR5cCI6...   ← Copiez ceci

service_role (secret)              ← Pour le backend (privé)
eyJhbGciOiJIUzI1NiIsInR5cCI6...   ← Copiez ceci
```

## 2️⃣ Configurer le Frontend (côté public)

### Fichier: `public/js/supabase-client.js`

```javascript
// Remplacez ces valeurs:
const SUPABASE_URL = 'https://abcdefghijk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// ✅ La clé "anon" peut être visible publiquement
// ✅ Elle est limitée par les règles de sécurité (RLS)
```

## 3️⃣ Configurer Netlify (côté serveur)

### A. Allez sur Netlify
1. https://app.netlify.com
2. Sélectionnez votre site
3. **Site configuration** > **Environment variables**

### B. Ajoutez ces 2 variables

1. Cliquez **Add a variable**
   - Key: `SUPABASE_URL`
   - Value: `https://abcdefghijk.supabase.co`
   - Cliquez **Create variable**

2. Cliquez **Add a variable**
   - Key: `SUPABASE_SERVICE_KEY`
   - Value: `eyJhbGc...` (la clé service_role)
   - Cliquez **Create variable**

## 4️⃣ Pourquoi 2 endroits différents ?

### Frontend (supabase-client.js)
- 🌐 Exécuté dans le navigateur
- 👥 Visible par tout le monde
- 🔐 Utilise la clé "anon" (publique)
- ⛔ Accès limité par les RLS

### Backend (Netlify Functions)
- 📦 Exécuté sur le serveur Netlify
- 🔒 Invisible aux utilisateurs
- 🔑 Utilise la clé "service_role" (privée)
- ✅ Accès complet à la base de données

## 5️⃣ Vérifier que ça fonctionne

1. **Commitez les changements**
   ```bash
   git add -A
   git commit -m "chore: Configure Supabase keys"
   git push origin main
   ```

2. **Attendez le redéploiement** (2-3 minutes)

3. **Testez votre site**
   - Ouvrez la console du navigateur (F12)
   - Vous devriez voir: "Supabase client initialized"
   - Les projets devraient se charger

## ⚠️ Erreurs courantes

### "Failed to fetch projects"
- Vérifiez que vous avez bien copié l'URL et la clé
- Vérifiez qu'il n'y a pas d'espaces avant/après

### "Invalid API key"
- Vous avez peut-être mélangé les clés
- Vérifiez que vous utilisez "anon" pour le frontend

### "permission denied for table"
- Les tables n'ont pas été créées
- Exécutez le schema SQL dans Supabase

## 🎉 C'est tout !

Votre site utilise maintenant Supabase pour :
- 📋 Stocker les projets
- ⭐ Gérer les notations
- 💬 Stocker les commentaires
- 📨 Recevoir les soumissions
