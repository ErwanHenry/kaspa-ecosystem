# ⚡ Kaspa Ecosystem Directory

> Plateforme communautaire pour découvrir et évaluer les projets de l'écosystème Kaspa

## 🎆 Fonctionnalités

### Pour les Utilisateurs
- **👛 Connexion Multi-Wallet** : Kasware, Kastle, KSPR
- **⭐ Système de Notation** : Évaluez les projets avec votre wallet
- **💬 Commentaires** : Partagez votre expérience
- **⚠️ Reports de Scam** : Signalez les projets suspects
- **🔍 Recherche & Filtres** : Trouvez facilement les projets

### Pour les Projets
- **👑 Système de Sponsoring** : Enchères pour être mis en avant
- **🎰 Carousel Featured** : Visibilité maximale
- **📊 Analytics** : Suivez vos performances
- **🤖 Scraping Automatique** : Mise à jour des stats GitHub/Discord

### Pour les Admins
- **🔧 Interface d'Administration** : Gérez tous les aspects
- **📧 Alertes Email** : Notifications des reports de scam
- **📊 Dashboard Analytics** : Vue d'ensemble complète
- **🗑️ Suppression de Projets** : Modération facile

## 🚀 Installation

### Prérequis
- Node.js 16+
- Compte Supabase
- Compte Netlify
- (Optionnel) Compte Apify pour le scraping
- (Optionnel) SendGrid pour les emails

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/kaspa-ecosystem.git
cd kaspa-ecosystem
npm install
```

### 2. Configuration Supabase

1. Créez un nouveau projet sur [Supabase](https://supabase.com)
2. Exécutez les scripts SQL dans l'ordre :
   ```sql
   -- Dans Supabase SQL Editor
   -- 1. Schema de base
   supabase/01-complete-schema.sql
   
   -- 2. Fonctions analytics 
   supabase/analytics-functions.sql
   
   -- 3. Sponsoring & Scam features
   supabase/03-sponsorship-scam-features.sql
   ```

### 3. Variables d'Environnement

Créez `.env` à la racine :
```env
# Supabase
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...

# Email (SendGrid)
SENDGRID_API_KEY=SG...
FROM_EMAIL=alerts@kaspa-ecosystem.com
ADMIN_EMAIL=admin@kaspa-ecosystem.com

# Apify (optionnel)
APIFY_TOKEN=apify_api_...
APIFY_ACTOR_ID=username/kaspa-scraper
```

### 4. Déploiement Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login & Deploy
netlify login
netlify deploy --prod
```

## 📁 Structure du Projet

```
.
├── public/                 # Frontend
│   ├── index.html         # App principale
│   ├── admin-enhanced.html # Admin panel
│   ├── css/               # Styles Kaspa
│   └── js/                # JavaScript
│       ├── kaspa-ecosystem-app.js
│       ├── kaspa-wallet-integration.js
│       └── kaspa-sponsorship-system.js
├── netlify/               
│   └── functions/          # Serverless
│       ├── api-projects.js
│       ├── send-scam-alert.js
│       └── webhook-apify.js
├── supabase/              # Database
│   ├── 01-complete-schema.sql
│   ├── 03-sponsorship-scam-features.sql
│   └── analytics-functions.sql
└── apify/                 # Scraper
    └── main.js
```

## 🎯 Utilisation

### Connexion Wallet
1. Cliquez sur "Connect Wallet"
2. Choisissez votre wallet (Kasware, Kastle, KSPR)
3. Approuvez la connexion

### Sponsoriser un Projet
1. Connectez votre wallet
2. Cliquez sur "Sponsor" sur un projet
3. Placez votre enchère (minimum 100 KAS)
4. Choisissez la durée (1 semaine, 2 semaines, 1 mois)
5. Confirmez le paiement

### Reporter un Scam
1. Connectez votre wallet
2. Cliquez sur "Report Scam" 
3. Fournissez une raison détaillée
4. L'admin recevra une alerte après 5 reports

### Administration
1. Accédez à `/admin-enhanced.html`
2. Connectez-vous avec vos credentials Supabase
3. Gérez projets, sponsorships, reports
4. Configurez les paramètres (email, seuils)

## 🔧 Configuration Avancée

### Apify Scraping
1. Créez un Actor sur [Apify](https://apify.com)
2. Uploadez le contenu de `/apify/`
3. Configurez le webhook vers votre fonction Netlify
4. Planifiez l'exécution (toutes les 6h recommandé)

### Email Notifications
1. Créez un compte [SendGrid](https://sendgrid.com)
2. Obtenez une API key
3. Vérifiez votre domaine d'envoi
4. Configurez dans les variables Netlify

## 🤝 Contribution

Les contributions sont bienvenues ! 

1. Fork le projet
2. Créez votre branche (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 License

MIT License - voir [LICENSE](LICENSE)

## 📞 Support

- Email: support@kaspa-ecosystem.com
- Discord: [Kaspa Community](https://discord.gg/kaspa)
- Twitter: [@KaspaEcosystem](https://twitter.com/KaspaEcosystem)

## 🙏 Remerciements

- Communauté Kaspa
- Équipe Supabase
- Contributors open source

---

**Kaspa Ecosystem** - Prêts pour l'arrivée des Smart Contracts ! 🚀
