# 🆓 Alternatives Gratuites aux Emails

## 1. Discord Webhook (GRATUIT & ILLIMITÉ)

### Configuration :
1. Créer un serveur Discord
2. Paramètres du canal > Intégrations > Webhooks
3. Nouveau Webhook > Copier l'URL

### Dans Netlify :
```env
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxx/yyy
```

## 2. Telegram Bot (GRATUIT & ILLIMITÉ)

### Configuration :
1. Parler à @BotFather sur Telegram
2. `/newbot` > Choisir un nom
3. Récupérer le token
4. Créer un canal/groupe et ajouter le bot
5. Récupérer le chat_id

### Dans Netlify :
```env
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
TELEGRAM_CHAT_ID=-1001234567890
```

## 3. Slack Webhook (GRATUIT jusqu'à 10K messages/mois)

### Configuration :
1. Créer un workspace Slack
2. Apps > Incoming Webhooks
3. Add to Slack > Choisir un canal

### Dans Netlify :
```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00/B00/XXX
```

## 4. EmailJS (GRATUIT 200 emails/mois)

### Configuration simple :
1. Inscription sur emailjs.com
2. Ajouter votre Gmail/Outlook
3. Créer un template
4. Utiliser directement depuis le frontend JS !

```javascript
// Dans le frontend directement
emailjs.send("service_xxx", "template_yyy", {
    to_email: "admin@domain.com",
    project_name: project.title,
    report_count: reportCount
});
```

## 5. Netlify Forms (GRATUIT 100 soumissions/mois)

### Ultra simple :
```html
<form name="scam-alerts" netlify netlify-honeypot="bot-field" hidden>
    <input type="text" name="project" />
    <input type="text" name="reports" />
    <textarea name="details"></textarea>
</form>
```

Les soumissions arrivent dans votre dashboard Netlify !

## 6. n8n.cloud (GRATUIT)

### Workflow automation :
1. Créer un compte sur n8n.cloud
2. Workflow : Webhook > Email/Discord/Telegram
3. URL webhook fournie

## 🎯 Recommandation

**Pour Kaspa Ecosystem :**
1. **Discord** pour les alertes temps réel (illimité)
2. **EmailJS** pour les emails critiques (200/mois)
3. **Netlify Forms** comme backup

**Configuration minimale :**
```env
# Dans Netlify Environment Variables
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
# C'est tout ! 🎉
```
