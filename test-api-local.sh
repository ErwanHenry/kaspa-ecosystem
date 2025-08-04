#!/bin/bash
# Script de test local de l'API Netlify

echo "=== Test Local de l'API Kaspa Ecosystem ==="
echo ""

# Vérifier si netlify-cli est installé
if ! command -v netlify &> /dev/null; then
    echo "Netlify CLI n'est pas installé. Installation..."
    npm install -g netlify-cli
fi

# Installer les dépendances
echo "Installation des dépendances..."
cd netlify/functions && npm install && cd ../..

# Démarrer le serveur local Netlify
echo ""
echo "Démarrage du serveur local Netlify..."
echo "L'API sera disponible sur : http://localhost:8888/api/projects"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter le serveur"
echo ""

# Note: Les variables d'environnement doivent être configurées dans un fichier .env local
netlify dev
