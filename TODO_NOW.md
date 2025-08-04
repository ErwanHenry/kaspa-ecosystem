# 📋 TODO Liste - Actions Immédiates

## 1️⃣ Sur Google Cloud Console (URGENT)
- [ ] Aller sur https://console.cloud.google.com
- [ ] IAM & Admin > Service Accounts
- [ ] Trouver: kaspa-ecosystem-service@annuairekaspa.iam.gserviceaccount.com
- [ ] Supprimer l'ancienne clé: 08f6620c50134cf77e781ecd75a0b9aa63bd2311
- [ ] Créer une nouvelle clé JSON
- [ ] Télécharger et garder en sécurité

## 2️⃣ Push le code nettoyé
```bash
cd ~/kaspa-project/kaspa-ecosystem-clean
git push origin main --force
```

## 3️⃣ Configuration locale (si besoin du backend)
- [ ] Copier backend/.env.example vers backend/.env
- [ ] Coller la nouvelle clé privée dans .env
- [ ] NE JAMAIS commiter .env!

## 4️⃣ Sécurité future
```bash
./setup-git-secrets.sh
```

## 5️⃣ Vérifications
- [ ] Vérifier sur GitHub que l'historique est propre
- [ ] Tester que le site fonctionne sur Netlify
- [ ] Supprimer les backups locaux après vérification

## 🎆 Bonne nouvelle!
Votre frontend fonctionne SANS les clés Google!
Seul le scraper backend (optionnel) en a besoin.
