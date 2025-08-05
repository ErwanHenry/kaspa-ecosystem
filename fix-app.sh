#!/bin/bash

echo "🔧 Réparation de l'application Kaspa Ecosystem"
echo "============================================"

# 1. Vérifier que kaspa-ecosystem-app.js est utilisé
if grep -q "kaspa-ecosystem-functional.js" public/index.html; then
    echo "⚠️  Problème détecté: index.html utilise kaspa-ecosystem-functional.js"
    echo "🔄 Il faut utiliser kaspa-ecosystem-app.js à la place"
    
    # Remplacer le script
    sed -i '' 's/kaspa-ecosystem-functional.js/kaspa-ecosystem-app.js/g' public/index.html
    echo "✅ Script remplacé"
fi

# 2. Vérifier que le carousel est ajouté
if ! grep -q "featured-carousel" public/index.html; then
    echo "⚠️  Le carousel n'est pas dans index.html"
    echo "📝 Ajoutez le carousel manuellement après la section wallet"
fi

# 3. Vérifier que le modal est mis à jour
if grep -q "coming soon" public/index.html; then
    echo "⚠️  Le formulaire de soumission affiche encore 'coming soon'"
    echo "📝 Remplacez le modal par le formulaire complet"
fi

# 4. Ajouter les scripts manquants
if ! grep -q "submit-project.js" public/index.html; then
    echo "⚠️  Scripts de soumission manquants"
    # Ajouter avant </body>
    sed -i '' '/<\/body>/i\
    <script src="js/submit-project.js"></script>\
    <script src="js/submit-project-update.js"></script>' public/index.html
    echo "✅ Scripts ajoutés"
fi

# 5. Vérifier l'initialisation
echo "
🔍 Vérification finale:"
echo "- Scripts Supabase: $(grep -c 'supabase' public/index.html) références"
echo "- App principale: $(grep -c 'kaspa-ecosystem-app.js' public/index.html) référence(s)"
echo "- Submit scripts: $(grep -c 'submit-project.js' public/index.html) référence(s)"

echo "
🎯 Actions restantes:"
echo "1. Ajouter le HTML du carousel (voir index-updates.txt)"
echo "2. Remplacer le modal 'coming soon' par le formulaire"
echo "3. Commit et push les changements"
