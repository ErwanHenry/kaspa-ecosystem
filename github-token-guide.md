# 🔑 Guide pour créer un GitHub Personal Access Token

## Pourquoi vous en avez besoin
GitHub a désactivé l'authentification par mot de passe. Vous devez utiliser un token.

## Étapes pour créer un token :

1. **Allez sur GitHub** : https://github.com

2. **Accédez aux paramètres** :
   - Cliquez sur votre avatar (en haut à droite)
   - Settings
   - Developer settings (tout en bas à gauche)
   - Personal access tokens
   - Tokens (classic)

3. **Créez un nouveau token** :
   - Generate new token
   - Generate new token (classic)
   - Note: "Kaspa Ecosystem Push"
   - Expiration: 30 days (ou selon votre préférence)
   - Cochez ces permissions :
     - ✅ repo (tout)
     - ✅ workflow
   - Generate token

4. **COPIEZ LE TOKEN IMMEDIATEMENT** !
   Il ne sera plus visible après.

## Comment l'utiliser :

```bash
cd ~/kaspa-project/kaspa-ecosystem-clean
git push https://ErwanHenry:VOTRE_TOKEN_ICI@github.com/ErwanHenry/kaspa-ecosystem.git main --force
```

Remplacez VOTRE_TOKEN_ICI par le token que vous venez de copier.

## Sécurité :
- Ne partagez JAMAIS votre token
- Ne le commitez JAMAIS dans Git
- Supprimez-le après utilisation si c'était temporaire
