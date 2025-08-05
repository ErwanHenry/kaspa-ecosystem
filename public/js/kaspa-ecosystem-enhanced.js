// Version améliorée avec sponsoring et reports de scam

// Modifications à ajouter à kaspa-ecosystem-app.js

// Dans la classe KaspaEcosystemApp, ajouter dans le constructor:
// this.sponsorshipSystem = new KaspaSponsorshipSystem();

// Modifier la fonction setupFeaturedCarousel pour prioriser les projets sponsorisés
async function setupFeaturedCarousel() {
    // D'abord charger les projets sponsorisés
    const sponsored = await this.sponsorshipSystem.loadSponsoredProjects();
    
    // Puis les projets featured non-sponsorisés
    const featured = this.projects.filter(p => p.featured && !p.is_sponsored);
    
    // Combiner avec les sponsorisés en premier
    this.featuredProjects = [...sponsored, ...featured];
    
    if (this.featuredProjects.length > 0) {
        this.updateCarousel();
    }
}

// Modifier renderProjectCard pour ajouter les badges et boutons
function renderProjectCard(project) {
    const avgRating = this.getAverageRating(project);
    const ratingCount = project.project_ratings?.length || 0;
    const commentCount = project.project_comments?.length || 0;
    const scamReports = project.scam_report_count || 0;
    
    // Get sponsor and scam buttons
    const { sponsorBtn, scamBtn } = this.sponsorshipSystem.enhanceProjectCard(project);
    
    return `
        <div class="project-card" data-project-id="${project.id}">
            ${project.is_sponsored ? '<div class="sponsored-badge">👑 Sponsored</div>' : ''}
            ${project.featured && !project.is_sponsored ? '<div class="featured-badge">🌟 Featured</div>' : ''}
            
            <div class="project-header">
                <img src="${project.logo_url || this.generateDefaultLogo(project.title)}" 
                     alt="${project.title}" class="project-logo">
                <div class="project-info">
                    <h3>${project.title}</h3>
                    <span class="project-category">${project.categories?.icon || ''} ${project.categories?.name || 'Other'}</span>
                </div>
            </div>
            
            <p class="project-description">${project.description || 'No description available'}</p>
            
            ${project.github_stars ? `
                <div class="project-metrics">
                    <span class="metric">⭐ ${this.formatNumber(project.github_stars)} stars</span>
                    ${project.github_forks ? `<span class="metric">🍴 ${this.formatNumber(project.github_forks)} forks</span>` : ''}
                    ${project.discord_members ? `<span class="metric">👥 ${this.formatNumber(project.discord_members)} members</span>` : ''}
                </div>
            ` : ''}
            
            <div class="project-links">
                ${project.website ? `<a href="${project.website}" target="_blank" class="project-link">🌐 Website</a>` : ''}
                ${project.github ? `<a href="${project.github}" target="_blank" class="project-link">💻 GitHub</a>` : ''}
                ${project.twitter ? `<a href="${project.twitter}" target="_blank" class="project-link">🐦 Twitter</a>` : ''}
                ${project.discord ? `<a href="${project.discord}" target="_blank" class="project-link">💬 Discord</a>` : ''}
            </div>
            
            <div class="rating-section">
                <div class="rating-display">
                    <div class="rating-stars">
                        ${this.renderStars(avgRating)}
                    </div>
                    <span class="rating-count">(${ratingCount} ratings)</span>
                    <span class="comment-count">💬 ${commentCount}</span>
                </div>
                
                ${scamReports >= 5 ? `
                    <div class="scam-warning">
                        ⚠️ Community Warning: ${scamReports} scam reports
                    </div>
                ` : ''}
                
                <div class="project-actions">
                    <button class="rate-btn" onclick="app.showRatingModal('${project.id}', '${project.title.replace(/'/g, "\\'")}')">Rate</button>
                    ${sponsorBtn}
                    ${scamBtn}
                </div>
            </div>
        </div>
    `;
}

// Modifier updateCarousel pour les projets sponsorisés
function updateCarousel() {
    const track = document.getElementById('carouselTrack');
    if (!track) return;
    
    track.innerHTML = this.featuredProjects.map(project => `
        <div class="carousel-item">
            ${project.is_sponsored ? '<div class="sponsor-indicator">👑 SPONSORED</div>' : ''}
            <img src="${project.logo_url || this.generateDefaultLogo(project.title)}" 
                 alt="${project.title}" class="featured-logo">
            <div class="featured-content">
                <h3>${project.title}</h3>
                <p>${project.description}</p>
                <div class="featured-rating">
                    ${this.renderStars(this.getAverageRating(project))}
                    <span>(${project.project_ratings?.length || 0} ratings)</span>
                </div>
                <div class="project-links">
                    ${project.website ? `<a href="${project.website}" target="_blank" class="project-link">Visit Website →</a>` : ''}
                </div>
                ${project.current_bid ? `
                    <div class="sponsor-info">
                        <small>Sponsored for ${project.current_bid} KAS</small>
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Ajouter des styles pour le carousel sponsorisé
const additionalStyles = `
<style>
.sponsor-indicator {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: linear-gradient(135deg, #FFD700, #FFA500);
    color: #0F172A;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-weight: bold;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
}

.sponsor-info {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border-color);
    color: #94A3B8;
    font-size: 0.9rem;
}

.carousel-item {
    position: relative;
}

.project-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-top: 1rem;
}

.scam-warning {
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
}
</style>
`;

// Ajouter les styles au document
if (!document.getElementById('enhanced-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'enhanced-styles';
    styleElement.innerHTML = additionalStyles;
    document.head.appendChild(styleElement.firstElementChild);
}
