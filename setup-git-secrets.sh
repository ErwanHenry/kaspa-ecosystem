#!/bin/bash
# Installation de git-secrets pour prévenir les fuites de secrets

echo "🔐 Installation de git-secrets..."

# Vérifier si Homebrew est installé
if ! command -v brew &> /dev/null; then
    echo "Homebrew n'est pas installé. Installez-le d'abord."
    exit 1
fi

# Installer git-secrets
brew install git-secrets

# Configurer git-secrets pour ce repo
git secrets --install
git secrets --register-aws

# Ajouter des patterns personnalisés pour Google Cloud
git secrets --add 'private_key'
git secrets --add 'BEGIN PRIVATE KEY'
git secrets --add 'BEGIN RSA PRIVATE KEY'
git secrets --add 'service_account'
git secrets --add '@.*\.iam\.gserviceaccount\.com'

echo "✅ git-secrets configuré!"
echo "Désormais, git empêchera de commiter des secrets."
