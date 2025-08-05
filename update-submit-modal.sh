#!/bin/bash

# Script pour mettre à jour le modal de soumission

echo "🔄 Mise à jour du formulaire de soumission..."

# Vérifier si le modal existe
if grep -q "submit-modal" public/index.html; then
    echo "✅ Modal trouvé"
else
    echo "❌ Modal non trouvé - Vérifiez index.html"
    exit 1
fi

# Vérifier si le formulaire est déjà à jour
if grep -q "submit-project-form" public/index.html; then
    echo "✅ Formulaire déjà à jour!"
else
    echo "🔧 Mise à jour nécessaire..."
    echo ""
    echo "ACTION MANUELLE REQUISE:"
    echo "========================"
    echo ""
    echo "1. Ouvrez public/index.html"
    echo "2. Trouvez le div avec id='submit-modal'"
    echo "3. Remplacez le contenu 'coming soon' par le formulaire complet"
    echo "4. Le formulaire est dans /tmp/submit-project-form.html"
    echo ""
    echo "Ou utilisez cette commande pour voir le contenu:"
    echo "cat /tmp/submit-project-form.html"
fi

# Vérifier les scripts
echo ""
echo "📄 Vérification des scripts..."

if [ -f "public/js/submit-project.js" ]; then
    echo "✅ submit-project.js présent"
else
    echo "❌ submit-project.js manquant!"
fi

if [ -f "public/js/submit-project-update.js" ]; then
    echo "✅ submit-project-update.js présent"
else
    echo "⚠️ submit-project-update.js manquant (optionnel)"
fi

# Vérifier l'inclusion des scripts
if grep -q "submit-project.js" public/index.html; then
    echo "✅ Script inclus dans index.html"
else
    echo "❌ Script non inclus - Ajoutez avant </body>:"
    echo '    <script src="js/submit-project.js"></script>'
    echo '    <script src="js/submit-project-update.js"></script>'
fi

echo ""
echo "🎆 Status final:"
echo "==============="
if grep -q "submit-project-form" public/index.html && [ -f "public/js/submit-project.js" ]; then
    echo "✅ Formulaire de soumission FONCTIONNEL!"
    echo ""
    echo "Test:"
    echo "1. Ouvrez l'application"
    echo "2. Connectez un wallet"
    echo "3. Cliquez sur le bouton '+' (Submit Project)"
    echo "4. Remplissez et soumettez le formulaire"
else
    echo "⚠️ Configuration manuelle requise (voir ci-dessus)"
fi
