# 🔔 Configuration des Webhooks pour Alertes Scam

## Option 1 : Discord Webhook (GRATUIT - Recommandé)

### Étapes :

1. **Créer un webhook Discord**
   - Allez dans votre serveur Discord
   - Paramètres du serveur > Intégrations > Webhooks
   - Cliquez sur "Nouveau webhook"
   - Nommez-le "Kaspa Ecosystem Alerts"
   - Copiez l'URL du webhook

2. **Configurer dans Netlify**
   - Allez dans votre projet Netlify
   - Site settings > Environment variables
   - Ajoutez : `DISCORD_WEBHOOK_URL` = votre URL copiée

3. **Tester**
   ```bash
   curl -X POST YOUR_NETLIFY_URL/.netlify/functions/send-scam-alert-webhook \
     -H "Content-Type: application/json" \
     -d '{"projectId": "test-id", "reportCount": 5}'
   ```

## Option 2 : Telegram Bot (GRATUIT)

### Étapes :

1. **Créer un bot Telegram**
   - Parlez à @BotFather sur Telegram
   - Envoyez `/newbot`
   - Choisissez un nom et username
   - Copiez le token du bot

2. **Obtenir votre Chat ID**
   - Envoyez un message à votre bot
   - Visitez : `https://api.telegram.org/botYOUR_TOKEN/getUpdates`
   - Trouvez votre chat_id dans la réponse

3. **Configurer dans Netlify**
   - `TELEGRAM_BOT_TOKEN` = votre token
   - `TELEGRAM_CHAT_ID` = votre chat ID

## Option 3 : SendGrid Email (Payant)

### Étapes :

1. **Créer un compte SendGrid**
   - Inscrivez-vous sur sendgrid.com
   - Vérifiez votre domaine
   - Créez une API key

2. **Configurer dans Netlify**
   - `SENDGRID_API_KEY` = votre clé API
   - `FROM_EMAIL` = email@votredomaine.com
   - `ADMIN_EMAIL` = admin@votredomaine.com

## Déclenchement automatique

Le système est déjà configuré pour envoyer automatiquement une alerte quand :
- Un projet atteint le seuil de reports (par défaut : 5)
- Le seuil est configurable dans l'interface admin

## Test manuel

Pour tester manuellement une alerte :

```javascript
// Dans la console du navigateur
await fetch('/.netlify/functions/send-scam-alert-webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        projectId: 'ID_DU_PROJET',
        reportCount: 5
    })
});
```

## Vérification

Après configuration :
1. Créez un projet test
2. Reportez-le 5 fois avec différents wallets
3. Vérifiez que l'alerte est bien reçue

