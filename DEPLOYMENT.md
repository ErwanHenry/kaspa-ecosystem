# Déploiement sur Netlify - Kaspa Ecosystem Directory

## Changements effectués pour corriger l'erreur 404

1. **Configuration du fichier `netlify.toml`**
   - Défini le répertoire de publication : `publish = "public"`
   - Ajouté des headers de sécurité
   - Configuré la mise en cache des assets statiques

2. **Ajout du fichier `_redirects`**
   - Créé dans le dossier `public/`
   - Redirige toutes les routes vers `index.html` pour supporter le SPA

3. **Sécurité**
   - ⚠️ **IMPORTANT** : Les clés de service Google ont été déplacées hors du dossier public
   - Mis à jour `.gitignore` pour exclure les fichiers sensibles
   - Créé un fichier de données JSON d'exemple sans informations sensibles

## Structure des fichiers

```
kaspa-ecosystem/
├── backend/           # Code serveur (non déployé sur Netlify)
├── frontend/          # Fichiers sources
├── public/            # Fichiers statiques à déployer
│   ├── index.html     # Application principale
│   ├── kaspa-ecosystem-data.json  # Données d'exemple
│   ├── _redirects     # Configuration des redirections
│   └── README.md      # Documentation
├── netlify.toml       # Configuration Netlify
└── .gitignore         # Fichiers à ignorer
```

## Déploiement

1. **Commit et push des changements**
   ```bash
   git add .
   git commit -m "Fix Netlify deployment configuration"
   git push
   ```

2. **Sur Netlify**
   - Le site devrait se déployer automatiquement
   - Vérifier que le "Publish directory" est bien défini sur `public`

## Notes importantes

- L'application utilise IndexedDB pour le stockage local des données
- Le backend n'est pas nécessaire pour le fonctionnement de base
- Les données peuvent être importées/exportées via l'interface utilisateur

## Problèmes résolus

- ✅ Erreur 404 corrigée
- ✅ Fichiers sensibles sécurisés
- ✅ Configuration de déploiement optimisée
