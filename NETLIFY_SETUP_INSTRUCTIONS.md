# 🚀 Configuration Netlify - Kaspa Ecosystem

## ❌ Problème : Site not found

Le site n'existe pas encore sur Netlify. Voici comment le créer :

## 📋 Étapes pour créer le site

### 1. Aller sur Netlify

1. Ouvrir https://app.netlify.com
2. Se connecter avec votre compte

### 2. Créer un nouveau site

1. Cliquer sur **"Add new site"**
2. Choisir **"Import an existing project"**
3. Sélectionner **GitHub**
4. Autoriser Netlify si demandé

### 3. Sélectionner le repository

1. Chercher : **ErwanHenry/kaspa-ecosystem**
2. Cliquer dessus pour le sélectionner

### 4. Configuration du build

**IMPORTANT** - Utiliser ces paramètres :

- **Branch to deploy** : `main`
- **Build command** : (laisser vide)
- **Publish directory** : `public`
- **Functions directory** : `netlify/functions`

### 5. Variables d'environnement

Cliquer sur **"Show advanced"** puis **"New variable"** et ajouter :

```
SUPABASE_URL = https://kxdngctxlxrbjhdtztuu.supabase.co
```

```
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZG5nY3R4bHhyYmpoZHR6dHV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNDU3MzYsImV4cCI6MjA2OTkyMTczNn0.N_jgf3Q2R98-FqsYpz7sns9CwOnViuQBXFoA0TcmWSM
```

```
DISCORD_WEBHOOK_URL = [Votre webhook Discord si vous en avez un]
```

### 6. Déployer

1. Cliquer sur **"Deploy site"**
2. Attendre le déploiement (~1-2 minutes)

### 7. URL personnalisée (optionnel)

Une fois déployé :
1. Aller dans **Site settings** > **Domain management**
2. Cliquer sur **"Change site name"**
3. Choisir : `kaspa-ecosystem`
4. L'URL sera : https://kaspa-ecosystem.netlify.app

## 🔧 Alternative : Déploiement manuel

Si vous préférez déployer manuellement :

### Option 1 : Netlify Drop

1. Zipper le dossier `public`
2. Aller sur https://app.netlify.com/drop
3. Glisser-déposer le zip

### Option 2 : Netlify CLI

```bash
# Installer Netlify CLI
npm install -g netlify-cli

# Se connecter
netlify login

# Initialiser le site
netlify init

# Déployer
netlify deploy --dir=public --prod
```

## ✅ Vérification

Une fois déployé, vérifier :

1. Le site se charge
2. La connexion Supabase fonctionne
3. Les projets s'affichent

## 🆘 Support

Si problème :
- Vérifier les logs de build dans Netlify
- Utiliser la page de debug : `/test-debug.html`
- Consulter : https://docs.netlify.com

## 📝 Notes

- Le repository GitHub est prêt
- Le code fonctionne en local
- Il faut juste créer le site sur Netlify
- Les variables d'environnement sont essentielles

Bonne chance ! 🚀
