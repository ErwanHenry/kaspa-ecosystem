# 🔧 Troubleshooting - Kaspa Ecosystem

## 🔴 Si le site ne fonctionne pas

### 1. Pages de test disponibles

- **Debug Page** : `/test-debug.html`
  - Vérifie que tous les composants se chargent
  - Affiche les erreurs en détail
  
- **Simple Version** : `/index-simple.html`
  - Version minimaliste qui devrait toujours fonctionner
  - Affiche juste la liste des projets

### 2. Problèmes courants

#### "Page blanche"
- Ouvrir la console (F12)
- Chercher les erreurs JavaScript
- Vérifier que Supabase est accessible

#### "supabaseClient is not defined"
- Le fichier `js/supabase-client.js` n'est pas chargé
- Vérifier l'URL et les credentials Supabase

#### "Cannot read property of undefined"
- Un script dépend d'un autre qui n'est pas chargé
- Vérifier l'ordre de chargement des scripts

### 3. Vérification Supabase

```javascript
// Dans la console du navigateur
supabaseClient
  .from('projects')
  .select('count')
  .then(console.log)
```

Si ça retourne une erreur, vérifier :
- URL Supabase correcte
- Anon key valide
- Tables existent en base

### 4. Solution rapide

Utiliser la version simple :
```bash
cp public/index-simple.html public/index.html
git add public/index.html
git commit -m "fix: Use simple version"
git push
```

### 5. Debug avancé

1. Aller sur `/test-debug.html`
2. Noter tous les composants qui échouent
3. Vérifier chaque fichier JS individuellement
4. Corriger dans l'ordre des dépendances

### 6. Variables d'environnement Netlify

Assurez-vous que ces variables sont configurées :
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `DISCORD_WEBHOOK_URL`

### 7. Cache navigateur

Parfois le cache pose problème :
- Ctrl+Shift+R (hard refresh)
- Ou ouvrir en navigation privée

## 🎆 Version de secours

Si rien ne fonctionne, il y a 3 versions :
1. `index.html` - Version actuelle
2. `index-simple.html` - Version basique fonctionnelle
3. `index-complex.html` - Version complète avec toutes les features

Choisir selon les besoins!
