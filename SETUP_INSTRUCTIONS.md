# Kaspa Ecosystem - Instructions de Configuration

## 🔧 Configuration de la Base de Données

### Problème identifié
Le site recherche une table `categories` qui n'existe pas dans votre base de données Supabase.

### Solution

1. **Allez dans Supabase**
   - Connectez-vous à votre dashboard Supabase
   - Sélectionnez votre projet Kaspa Ecosystem

2. **Ouvrez l'éditeur SQL**
   - Dans le menu de gauche, cliquez sur "SQL Editor"
   - Cliquez sur "New Query"

3. **Exécutez le script SQL**
   - Copiez tout le contenu du fichier `database-setup-uuid.sql`
   - Collez-le dans l'éditeur SQL
   - Cliquez sur "Run"

4. **Vérifiez les résultats**
   - Vous devriez voir "Configuration terminée!" 
   - Le nombre de catégories créées (8)
   - Le nombre de projets dans votre base

## 🌐 URLs du Site

- **Site Principal**: https://kaspa-ecosystem.netlify.app
- **Admin Panel**: https://kaspa-ecosystem.netlify.app/admin-complete.html
  - Mot de passe: `kaspa2024admin`

## 📝 Fonctionnalités

### Site Public
- Affichage de tous les projets
- Formulaire de soumission de projets
- Recherche et filtrage
- Catégories dynamiques

### Panel Admin (`/admin-complete.html`)
- Dashboard avec statistiques
- Gestion des projets (CRUD complet)
- Gestion des catégories
- Gestion des sponsorships
- Interface par onglets

## 🔍 Dépannage

### Si vous avez toujours l'erreur "categories does not exist"
1. Assurez-vous d'avoir exécuté le script `database-setup-uuid.sql` (pas l'ancien)
2. Vérifiez que vous êtes dans le bon projet Supabase
3. Rafraîchissez la page après avoir exécuté le script

### Si les projets ne s'affichent pas
1. Vérifiez dans Supabase Table Editor que:
   - La table `projects` existe
   - La table `categories` existe
   - Les projets ont un `category_id` valide

### Pour ajouter des projets depuis l'admin
La fonctionnalité "Add Project" est en cours de développement.
Utilisez le formulaire sur le site public pour l'instant.

## 💡 Notes Importantes

- Votre table `projects` utilise des UUID, pas des entiers
- Le script SQL gère automatiquement la migration
- Les politiques RLS sont configurées pour permettre la lecture publique
- Les index sont créés pour optimiser les performances

## 🛠️ Structure de la Base de Données

### Table `categories`
- id (SERIAL)
- name (VARCHAR)
- slug (VARCHAR)
- description (TEXT)
- created_at (TIMESTAMP)

### Table `projects`
- id (UUID)
- title (TEXT)
- description (TEXT)
- category_id (INTEGER) -> FK vers categories.id
- website (TEXT)
- logo_url (TEXT)
- submitter_email (VARCHAR)
- submitter_wallet (VARCHAR)
- views (INTEGER)
- average_rating (DECIMAL)
- comment_count (INTEGER)
- twitter, github, discord, telegram (VARCHAR)
- created_at (TIMESTAMP)

### Table `sponsorships`
- id (SERIAL)
- project_id (UUID) -> FK vers projects.id
- sponsor_wallet (VARCHAR)
- sponsor_email (VARCHAR)
- amount (DECIMAL)
- start_date (DATE)
- end_date (DATE)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
