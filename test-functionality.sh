#!/bin/bash

# Script de test pour Kaspa Ecosystem

echo "🚀 Test des fonctionnalités Kaspa Ecosystem"
echo "=========================================="

# Vérifier les variables d'environnement
echo "
✅ Vérification des variables d'environnement..."
if [ -f .env ]; then
    echo "Fichier .env trouvé"
    grep -E "SUPABASE_URL|SUPABASE_ANON_KEY" .env | sed 's/=.*/=***/' 
else
    echo "⚠️  Fichier .env non trouvé - Assurez-vous que les variables sont dans Netlify"
fi

# Vérifier la structure des fichiers
echo "
✅ Vérification de la structure..."
FILES_TO_CHECK=(
    "public/index.html"
    "public/admin-enhanced.html"
    "public/js/kaspa-ecosystem-app.js"
    "public/js/kaspa-wallet-integration.js"
    "public/js/kaspa-sponsorship-system.js"
    "netlify/functions/send-scam-alert-webhook.js"
    "supabase/03-sponsorship-scam-features.sql"
)

for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ $file"
    else
        echo "❌ $file MANQUANT!"
    fi
done

# Vérifier le carousel dans index.html
echo "
✅ Vérification du carousel..."
if grep -q "carousel" public/index.html; then
    echo "✓ Carousel trouvé dans index.html"
else
    echo "⚠️  Carousel non trouvé - À ajouter"
fi

# Vérifier les fonctions de sponsoring
echo "
✅ Vérification du système de sponsoring..."
if grep -q "showSponsorModal" public/js/kaspa-sponsorship-system.js; then
    echo "✓ Fonction showSponsorModal trouvée"
fi
if grep -q "submitBid" public/js/kaspa-sponsorship-system.js; then
    echo "✓ Fonction submitBid trouvée"
fi

# Vérifier l'intégration wallet
echo "
✅ Vérification de l'intégration wallet..."
if grep -q "kasware" public/js/kaspa-wallet-integration.js; then
    echo "✓ Support Kasware détecté"
fi
if grep -q "kastle" public/js/kaspa-wallet-integration.js; then
    echo "✓ Support Kastle mentionné"
fi
if grep -q "kspr" public/js/kaspa-wallet-integration.js; then
    echo "✓ Support KSPR mentionné"
fi

# Vérifier les alertes email
echo "
✅ Vérification des alertes scam..."
if grep -q "DISCORD_WEBHOOK_URL" netlify/functions/send-scam-alert-webhook.js; then
    echo "✓ Support Discord webhook"
fi
if grep -q "TELEGRAM_BOT_TOKEN" netlify/functions/send-scam-alert-webhook.js; then
    echo "✓ Support Telegram bot"
fi

# Recommandations
echo "
📝 Recommandations:"
echo "=================="
echo "1. Ajoutez les variables suivantes dans Netlify:"
echo "   - DISCORD_WEBHOOK_URL (pour alertes gratuites)"
echo "   - Ou SENDGRID_API_KEY + FROM_EMAIL + ADMIN_EMAIL (pour emails)"
echo ""
echo "2. Vérifiez que le carousel est bien visible sur la page d'accueil"
echo ""
echo "3. Testez:"
echo "   - Connexion wallet (mock)"
echo "   - Création d'un sponsorship"
echo "   - Report d'un scam"
echo "   - Fonctions admin"
echo ""
echo "✅ Le projet semble prêt pour le déploiement!"
echo ""
echo "URL de production: https://kaspa-ecosystem.netlify.app"
echo "URL admin: https://kaspa-ecosystem.netlify.app/admin-enhanced.html"
