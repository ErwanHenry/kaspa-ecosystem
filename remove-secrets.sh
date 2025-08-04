#!/bin/bash
# Script pour nettoyer l'historique Git des secrets exposés

echo "🔍 Recherche des secrets dans l'historique..."

# Utiliser BFG ou git filter-branch pour nettoyer l'historique
# Option 1: Avec git filter-branch (plus lent mais intégré)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch public/kaspa-ecosystem-data.json" \
  --prune-empty --tag-name-filter cat -- --all

echo "✅ Historique nettoyé"
echo "⚠️  ATTENTION: Vous devez forcer le push"
echo "Commande: git push origin --force --all"
