# 🔄 Mise à jour de index.html

Pour intégrer toutes les nouvelles fonctionnalités dans votre index.html existant :

## 1. Ajouter les scripts nécessaires (dans <head>)

```html
<!-- Après les scripts existants -->
<script src="js/kaspa-sponsorship-system.js"></script>
```

## 2. Dans kaspa-ecosystem-app.js, ajouter au constructor:

```javascript
constructor() {
    // ... existing code ...
    this.sponsorshipSystem = new KaspaSponsorshipSystem();
}
```

## 3. Remplacer les fonctions suivantes:

- `setupFeaturedCarousel()` - Version améliorée qui priorise les sponsors
- `renderProjectCard()` - Version avec badges sponsor et boutons scam
- `updateCarousel()` - Version avec indicateur sponsor

(Voir le fichier kaspa-ecosystem-enhanced.js pour le code complet)

## 4. Ajouter dans le CSS (kaspa-modern.css):

```css
/* Styles pour sponsoring et scam reports */
.sponsored-badge {
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    background: linear-gradient(135deg, #FFD700, #FFA500);
    color: var(--bg-primary);
    padding: 0.25rem 0.75rem;
    border-radius: 16px;
    font-size: 0.8rem;
    font-weight: 600;
}

.scam-warning {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid var(--warning-bg);
    color: var(--warning-bg);
    padding: 0.75rem;
    border-radius: 8px;
    margin-top: 1rem;
}

.sponsor-btn {
    background: linear-gradient(135deg, #FFD700, #FFA500);
    color: var(--bg-primary);
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
}

.scam-btn {
    background: none;
    color: var(--warning-bg);
    border: 1px solid var(--warning-bg);
    padding: 0.5rem 1rem;
    border-radius: 8px;
    cursor: pointer;
}
```

## 5. Variables Netlify à ajouter:

```
SENDGRID_API_KEY=SG...
ADMIN_EMAIL=admin@kaspa-ecosystem.com
FROM_EMAIL=alerts@kaspa-ecosystem.com
```

## 6. Exécuter les migrations SQL:

```sql
-- Dans Supabase SQL Editor
-- Exécuter: supabase/03-sponsorship-scam-features.sql
```

## ✅ Fonctionnalités ajoutées:

- 👑 Système d'enchères pour sponsoring
- 🎰 Carousel priorisant les sponsors
- ⚠️ Reports de scam avec alertes email
- 📧 Notifications automatiques à l'admin
- 🔧 Interface admin améliorée
- 📊 Analytics et statistiques
