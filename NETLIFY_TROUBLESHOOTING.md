# 🚑 Netlify Troubleshooting - Site Not Found

## 🔴 Problème : "Site not found" sur Netlify

### Causes possibles :

1. **Le site n'est pas lié au repository GitHub**
   - Vérifier dans Netlify Dashboard
   - Le repository doit être ErwanHenry/kaspa-ecosystem

2. **Build failure**
   - La commande `npm install` échoue
   - Les dépendances ne sont pas installées

3. **Mauvais nom de domaine**
   - Vérifier l'URL exacte dans Netlify

## 🔧 Solutions

### 1. Vérifier sur Netlify Dashboard

1. Aller sur https://app.netlify.com
2. Vérifier si le site existe
3. Si non, créer un nouveau site :
   - "Add new site" > "Import an existing project"
   - Choisir GitHub
   - Sélectionner ErwanHenry/kaspa-ecosystem
   - Configuration :
     - Build command: `echo "No build needed"`
     - Publish directory: `public`
     - Functions directory: `netlify/functions`

### 2. Simplifier netlify.toml

```toml
[build]
  publish = "public"
  functions = "netlify/functions"

# Headers
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
```

### 3. Variables d'environnement à configurer

Dans Netlify > Site settings > Environment variables :

- `SUPABASE_URL`: https://kxdngctxlxrbjhdtztuu.supabase.co
- `SUPABASE_ANON_KEY`: (voir supabase-client.js)
- `DISCORD_WEBHOOK_URL`: (déjà configuré)

### 4. Structure minimale requise

```
kaspa-ecosystem/
├── public/
│   ├── index.html
│   ├── css/
│   └── js/
├── netlify/
│   └── functions/
└── netlify.toml
```

## 🚀 Deployment manuel rapide

### Option 1 : Drag & Drop
1. Zipper le dossier `public`
2. Aller sur https://app.netlify.com/drop
3. Glisser-déposer le zip

### Option 2 : Netlify CLI
```bash
# Installation
npm install -g netlify-cli

# Login
netlify login

# Déployer
netlify deploy --dir=public --prod
```

## 📋 Checklist

- [ ] Site existe sur Netlify Dashboard
- [ ] Repository connecté correctement
- [ ] Build settings corrects
- [ ] Variables d'environnement configurées
- [ ] Dernier déploiement réussi

## 🆘 Support

- Netlify Support : https://www.netlify.com/support/
- Status : https://www.netlifystatus.com/
- Community : https://answers.netlify.com/
