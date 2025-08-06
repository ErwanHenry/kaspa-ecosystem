#!/bin/bash

echo "🚀 Déploiement local pour test"
echo "============================="
echo ""
echo "Options disponibles :"
echo ""
echo "1. Python HTTP Server (recommandé)"
echo "   cd public && python3 -m http.server 8000"
echo "   Ouvrir : http://localhost:8000"
echo ""
echo "2. Node HTTP Server"
echo "   npx http-server public -p 8000"
echo "   Ouvrir : http://localhost:8000"
echo ""
echo "3. Live Server (avec auto-reload)"
echo "   npx live-server public --port=8000"
echo "   Ouvrir : http://localhost:8000"
echo ""
echo "4. Netlify Dev (simule Netlify)"
echo "   netlify dev"
echo "   Ouvrir : http://localhost:8888"
echo ""
echo "Choisissez une option (1-4) : "
read choice

case $choice in
    1)
        echo "🌐 Démarrage du serveur Python..."
        cd public && python3 -m http.server 8000
        ;;
    2)
        echo "🌐 Démarrage du serveur Node..."
        npx http-server public -p 8000
        ;;
    3)
        echo "🌐 Démarrage de Live Server..."
        npx live-server public --port=8000
        ;;
    4)
        echo "🌐 Démarrage de Netlify Dev..."
        netlify dev
        ;;
    *)
        echo "❌ Option invalide"
        exit 1
        ;;
esac
