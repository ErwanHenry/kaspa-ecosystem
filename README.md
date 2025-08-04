# Kaspa Ecosystem Directory

Un annuaire complet pour l'écosystème Kaspa avec système de notation communautaire.

## 🎆 Fonctionnalités

- 🔗 Intégration wallet (Kasware, Kastle, KSPR)
- ⭐ Système de notation 5 étoiles
- 🎰 Projets vedettes en carousel
- 🤖 Scraping automatique quotidien
- 👨‍💼 Interface d'administration
- 🔒 Sécurité renforcée

## 🚀 Déploiement

### Frontend (Netlify)

Le frontend fonctionne parfaitement SANS aucune clé API :

```bash
git push origin main
```

C'est tout ! Netlify déploiera automatiquement.

### Backend (Optionnel - pour le scraping)

1. **Configuration** :
   ```bash
   cd backend
   cp .env.example .env
   # Éditez .env avec vos clés Google Cloud
   ```

2. **Installation** :
   ```bash
   npm install
   ```

3. **Lancement** :
   ```bash
   npm start
   # ou avec PM2
   pm2 start kaspa-ecosystem-scraper.js
   ```

## 🔐 Sécurité

- Toutes les clés sensibles sont dans `.env` (jamais commitées)
- Historique Git nettoyé de toute clé exposée
- `git-secrets` installé pour prévenir les fuites

## 📋 Admin

- URL : `/admin.html`
- Identifiants par défaut : admin / kaspa2024
- **Changez le mot de passe immédiatement !**

## 📦 Structure

```
kaspa-ecosystem/
├── public/          # Frontend (déployé sur Netlify)
├── backend/         # Backend optionnel (scraping)
├── .gitignore       # Fichiers ignorés
└── netlify.toml     # Configuration Netlify
```

## 🌐 License

MIT - Voir [LICENSE](LICENSE)
