# 🚀 Kaspa Ecosystem - Structure du Projet

## 📁 Structure Actuelle (Nettoyée)

```
.
├── public/
│   ├── index.html           # Interface principale
│   ├── admin.html           # Interface d'administration
│   ├── api-docs.html        # Documentation API
│   ├── css/
│   │   ├── kaspa-modern.css # Styles avec charte graphique Kaspa
│   │   └── supabase-styles.css
│   └── js/
│       ├── kaspa-ecosystem-app.js    # App principale avec carousel
│       ├── kaspa-wallet-integration.js # Connexion wallets
│       └── supabase-client.js        # Configuration Supabase
├── netlify/
│   └── functions/
│       ├── api-projects.js      # API REST
│       ├── webhook-apify.js     # Webhook pour scraping
│       └── trigger-apify.js     # Déclencheur Apify
├── supabase/
│   ├── schema.sql               # Schema principal
│   └── analytics-functions.sql  # Fonctions analytics
├── apify/
│   └── main.js                  # Actor Apify pour scraping
└── archive/                     # Fichiers archivés
```

## ✅ Fonctionnalités Existantes

### Frontend
- ✅ Carousel pour projets featured/sponsorisés
- ✅ Connexion wallet (Kasware, Kastle, KSPR)
- ✅ Système de notation par wallet
- ✅ Commentaires
- ✅ Recherche et filtres
- ✅ Charte graphique Kaspa (vert #49EACB)

### Backend
- ✅ Supabase configuré
- ✅ API REST fonctionnelle
- ✅ Scraping Apify
- ✅ Webhooks

### Admin
- ✅ Interface de modération existante
- ⚠️ À améliorer : suppression projets, alertes scam

## 🎯 Améliorations à Implémenter

### 1. Système de Sponsoring avec Enchères
- Table `sponsorships` pour gérer les enchères
- Durée de sponsoring (1 semaine, 1 mois)
- Prix minimum et système d'enchères
- Rotation automatique dans le carousel

### 2. Alertes Scam Améliorées
- Flag "Report as Scam" sur chaque projet
- Seuil d'alertes (ex: 5 reports = alerte admin)
- Email automatique à l'admin
- Badge warning visible

### 3. Interface Admin Améliorée
- Suppression de projets
- Gestion des sponsorings
- Configuration email alertes
- Dashboard analytics

### 4. Smart Contracts Ready
- Structure pour intégrer KRC-20 tokens
- Préparation pour paiements on-chain
- Système de rewards

## 🔧 Variables d'Environnement (Netlify)

```env
# Existantes
SUPABASE_URL=https://kxdngctxlxrbjhdtztuu.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
APIFY_TOKEN=...

# À ajouter
ADMIN_EMAIL=admin@kaspa-ecosystem.com
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=SG...
MIN_SPONSOR_BID=100  # En KAS
```

## 📊 Schema Base de Données

### Tables Existantes
- projects
- categories
- profiles
- wallet_ratings
- project_comments

### Tables à Ajouter
```sql
-- Sponsorships (enchères)
CREATE TABLE sponsorships (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id),
    wallet_address TEXT,
    bid_amount DECIMAL,
    duration_days INTEGER,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    status VARCHAR(20), -- 'active', 'pending', 'expired'
    transaction_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scam Reports
CREATE TABLE scam_reports (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id),
    wallet_address TEXT,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin Settings
CREATE TABLE admin_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
