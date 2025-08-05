# 💛 Guide d'Installation - Kaspa Ecosystem avec Wallet

## 🚀 Installation Rapide

### 1. Configuration Supabase

Dans l'éditeur SQL de Supabase, exécutez dans l'ordre :

```sql
-- 1. D'abord vérifier les tables existantes
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;
```

```sql
-- 2. Exécuter wallet-minimal.sql
-- Copier/coller tout le contenu du fichier supabase/wallet-minimal.sql
```

### 2. Test Local

1. Ouvrez `public/index-functional.html` dans votre navigateur
2. Cliquez sur "Connect Wallet"
3. Choisissez "Kasware Wallet"
4. Le wallet mock se connectera automatiquement pour les tests

### 3. Installation Kasware (Production)

1. Visitez https://kasware.xyz
2. Installez l'extension Chrome/Firefox
3. Créez ou importez votre wallet Kaspa
4. Rafraîchissez la page et connectez-vous

## 📋 Fonctionnalités

### Connexion Wallet
- ✅ Détection automatique de Kasware
- ✅ Mock wallet pour développement
- ✅ Persistance de session
- ✅ Affichage balance KAS

### Système de Rating
- ✅ Un vote par wallet par projet
- ✅ Signature des votes
- ✅ Commentaires optionnels
- ✅ Mise à jour en temps réel

### Profils Utilisateur
- ✅ Création automatique
- ✅ Avatar unique par wallet
- ✅ Username basé sur l'adresse
- ✅ Statistiques utilisateur

## 🛠️ Dépannage

### Erreur "wallet_ratings does not exist"
```sql
-- Vérifier si la table existe
SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'wallet_ratings'
);

-- Si false, exécuter wallet-minimal.sql
```

### Erreur de connexion wallet
1. Vérifier que Kasware est installé
2. Vérifier que le site est en HTTPS (ou localhost)
3. Rafraîchir la page
4. Essayer en navigation privée

### Problèmes Supabase
1. Vérifier SUPABASE_URL et SUPABASE_ANON_KEY dans supabase-client.js
2. Vérifier les policies RLS
3. Activer les logs dans Dashboard > Logs

## 📁 Structure des Fichiers

```
public/
├── index-functional.html        # Interface fonctionnelle
├── js/
│   ├── kaspa-wallet-integration.js  # Gestion des wallets
│   ├── kaspa-ecosystem-functional.js # Logique app
│   └── supabase-client.js          # Config Supabase
└── css/
    └── kaspa-modern.css            # Styles

supabase/
├── wallet-minimal.sql      # Tables essentielles
├── wallet-integration.sql  # Version complète
└── check-tables.sql       # Vérification
```

## 🔧 Configuration Production

### Variables Netlify
```env
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
```

### Sécurité
1. Activer RLS sur toutes les tables
2. Utiliser HTTPS obligatoirement
3. Valider les signatures wallet côté serveur
4. Rate limiting sur les votes

## 🎯 Prochaines Étapes

1. **Analytics Dashboard**
   - Graphiques Chart.js
   - Métriques en temps réel

2. **Système de Notifications**
   - Bell icon avec badge
   - Push notifications

3. **Features Sociales**
   - Follow projects
   - Commentaires threadés
   - Partage social

4. **Intégration KRC-20**
   - Support tokens Kaspa
   - Rewards système

## 💡 Tips Développement

- Utilisez le mock wallet pour tester sans installer Kasware
- Les console.log sont votre ami pour debug
- Testez sur différents navigateurs
- Gardez un œil sur la console Supabase

Bon développement! 🚀
