#!/bin/bash
# Nettoyage sécurisé de l'historique Git

echo "🔒 Nettoyage sécurisé de l'historique Git..."

# Backup du repo actuel
cp -r .git .git.backup

# Méthode simple : créer un nouveau repo sans l'historique compromis
echo "Création d'un nouveau repo propre..."

# Sauvegarder l'état actuel
mkdir ../kaspa-ecosystem-clean
cp -r * ../kaspa-ecosystem-clean/
cp .gitignore ../kaspa-ecosystem-clean/
cp .netlify ../kaspa-ecosystem-clean/ 2>/dev/null || true

# Aller dans le nouveau repo
cd ../kaspa-ecosystem-clean

# Initialiser un nouveau repo
git init
git add .
git commit -m "Initial commit - Security fix: removed exposed credentials"

# Ajouter l'origin
git remote add origin https://github.com/ErwanHenry/kaspa-ecosystem.git

echo "✅ Nouveau repo créé sans historique compromis"
echo ""
echo "Prochaines étapes :"
echo "1. cd ../kaspa-ecosystem-clean"
echo "2. Vérifiez que tout est correct"
echo "3. git push origin main --force"
echo ""
echo "⚠️  ATTENTION: Cela va écraser tout l'historique sur GitHub!"
