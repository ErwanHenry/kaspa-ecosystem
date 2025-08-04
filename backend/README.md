# Kaspa Ecosystem Backend

## Configuration
Le backend est configuré avec :
- Google Sheets API (compte de service intégré)
- Scraping automatique toutes les 6 heures
- Support Twitter API (optionnel)

## Commandes

### Développement
```bash
npm run dev
```

### Production avec PM2
```bash
npm run pm2         # Démarrer
npm run pm2-logs    # Voir les logs
npm run pm2-stop    # Arrêter
```

### Test manuel du scraping
```bash
node kaspa-backend.js
```

## Logs
- Logs PM2 : `./logs/`
- Console : Lors du lancement direct

## Google Sheets
L'ID du spreadsheet créé apparaîtra dans les logs au premier lancement.
