# 🤔 Comment fonctionne Kaspa Ecosystem Directory

## 🌐 Frontend (Sur Netlify)

Le frontend est une application web moderne qui fonctionne **ENTIÈREMENT dans le navigateur**.

### Stockage des données

- **IndexedDB** : Base de données intégrée au navigateur
- **LocalStorage** : Pour les préférences utilisateur
- **Pas de serveur nécessaire** : Tout est stocké localement

### Fonctionnalités disponibles

1. **Gestion des projets**
   - Ajouter des projets avec logo
   - Modifier/Supprimer
   - Catégorisation

2. **Système de notation**
   - Notes de 1 à 5 étoiles
   - Commentaires
   - Signalement de scam

3. **Connexion Wallet**
   - Kasware
   - Kastle
   - KSPR

4. **Interface Admin**
   - Login local (admin/kaspa2024)
   - Modération des projets
   - Export/Import de données

## 🤖 Backend (OPTIONNEL)

Le backend n'est nécessaire QUE si vous voulez :

- Synchroniser les données entre utilisateurs
- Faire du scraping automatique
- Sauvegarder sur Google Sheets

### Architecture sécurisée

```
Utilisateur <-> Frontend <-> API Backend <-> Google Sheets
                   |             |
              (Pas de clés)  (Clés privées)
```

## 💡 Points importants

1. **Le frontend NE CONTIENT AUCUNE CLÉ**
2. **Il fonctionne SANS backend**
3. **Chaque utilisateur a ses propres données**
4. **Les données restent dans le navigateur**

## 🚀 Déploiement

### Frontend seul (Recommandé)

```bash
git push origin main
# C'est tout ! Netlify fait le reste
```

### Avec backend (Optionnel)

1. Déployer le frontend sur Netlify
2. Déployer le backend sur un serveur (Heroku, etc.)
3. Configurer les variables d'environnement
4. Mettre à jour l'URL de l'API dans le frontend

## 🎯 Résumé

**Vous n'avez PAS BESOIN du backend pour que le site fonctionne !**

Le frontend est une application complète qui stocke tout localement.
C'est sûr, rapide et fonctionne parfaitement sur Netlify.
