# Modifications à faire dans kaspa-ecosystem-app.js

## 1. Dans le constructor (ligne ~14), ajouter :
```javascript
this.sponsorshipSystem = new KaspaSponsorshipSystem();
```

## 2. Remplacer setupFeaturedCarousel() par :
```javascript
async setupFeaturedCarousel() {
    // Charger les projets sponsorisés en premier
    const sponsored = await this.sponsorshipSystem.loadSponsoredProjects();
    const featured = this.projects.filter(p => p.featured && !p.is_sponsored);
    this.featuredProjects = [...sponsored, ...featured];
    
    if (this.featuredProjects.length > 0) {
        this.updateCarousel();
    }
}
```

## 3. Dans renderProjectCard(), ajouter après la ligne des links :
```javascript
// Après project-links div
const { sponsorBtn, scamBtn } = this.sponsorshipSystem.enhanceProjectCard(project);

// Dans project-actions
${sponsorBtn}
${scamBtn}
```

## 4. Ajouter les badges dans renderProjectCard() :
```javascript
// Au début de la card
${project.is_sponsored ? '<div class="sponsored-badge">👑 Sponsored</div>' : ''}
${project.scam_report_count >= 5 ? '<div class="scam-warning">⚠️ ${project.scam_report_count} scam reports</div>' : ''}
```
