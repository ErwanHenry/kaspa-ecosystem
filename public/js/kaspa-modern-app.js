// Kaspa Ecosystem Modern App - Supabase Integration
class KaspaModernApp {
    constructor() {
        this.currentUser = null;
        this.projects = [];
        this.categories = [];
        this.connectedWallet = null;
        this.currentProjectId = null;
        this.selectedRating = 0;
        this.carouselIndex = 0;
        this.featuredProjects = [];
        
        this.init();
    }

    async init() {
        // Check Supabase auth
        const { data: { session } } = await supabaseClient.auth.getSession();
        this.currentUser = session?.user || null;
        
        // Setup auth listener
        supabaseClient.auth.onAuthStateChange((event, session) => {
            this.handleAuthChange(event, session);
        });
        
        // Load data
        await Promise.all([
            this.loadCategories(),
            this.loadProjects()
        ]);
        
        // Setup UI
        this.updateStats();
        this.setupEventListeners();
        this.setupFeaturedCarousel();
        this.updateAuthUI();
        
        // Auto-rotate carousel
        setInterval(() => {
            if (this.featuredProjects.length > 1) {
                this.moveCarousel(1);
            }
        }, 5000);
    }

    async handleAuthChange(event, session) {
        this.currentUser = session?.user || null;
        this.updateAuthUI();
        
        if (event === 'SIGNED_IN') {
            await this.loadProjects();
            this.showToast('Welcome back!', 'success');
        }
    }

    updateAuthUI() {
        const walletSection = document.querySelector('.wallet-section');
        
        if (this.currentUser) {
            walletSection.innerHTML = `
                <div class="wallet-connected" style="display: flex;">
                    <span class="wallet-address">${this.currentUser.email}</span>
                    <button class="wallet-btn" onclick="app.logout()">Disconnect</button>
                </div>
            `;
        } else {
            walletSection.innerHTML = `
                <button class="wallet-btn" onclick="app.connectWallet()">Connect Wallet</button>
                <div class="wallet-connected">
                    <span class="wallet-address"></span>
                    <button class="wallet-btn" onclick="app.disconnectWallet()">Disconnect</button>
                </div>
            `;
        }
    }

    async loadCategories() {
        try {
            const { data, error } = await supabaseClient
                .from('categories')
                .select('*')
                .order('name');
            
            if (error) throw error;
            
            this.categories = data || [];
            this.renderCategoryFilter();
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    async loadProjects() {
        try {
            const { data, error } = await supabaseClient
                .from('projects')
                .select(`
                    *,
                    categories!inner(name, slug, icon),
                    project_ratings(rating, user_id),
                    project_comments(id)
                `)
                .eq('active', true)
                .order('featured', { ascending: false })
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            this.projects = data || [];
            this.renderProjects();
            this.setupFeaturedCarousel();
        } catch (error) {
            console.error('Error loading projects:', error);
            this.showToast('Failed to load projects', 'error');
        }
    }

    renderCategoryFilter() {
        const filter = document.getElementById('categoryFilter');
        if (!filter) return;
        
        filter.innerHTML = `
            <option value="">All Categories</option>
            ${this.categories.map(cat => `
                <option value="${cat.slug}">${cat.name}</option>
            `).join('')}
        `;
    }

    renderProjects() {
        const grid = document.getElementById('projects');
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter').value;
        const ratingFilter = document.getElementById('ratingFilter').value;
        
        const filteredProjects = this.projects.filter(project => {
            const matchesSearch = project.title.toLowerCase().includes(searchTerm) || 
                                project.description.toLowerCase().includes(searchTerm);
            const matchesCategory = !categoryFilter || project.categories?.slug === categoryFilter;
            
            let matchesRating = true;
            if (ratingFilter) {
                const avgRating = this.getAverageRating(project);
                if (ratingFilter === 'warn') {
                    matchesRating = avgRating < 2;
                } else {
                    matchesRating = avgRating >= parseInt(ratingFilter);
                }
            }
            
            return matchesSearch && matchesCategory && matchesRating;
        });
        
        grid.innerHTML = filteredProjects.map(project => this.renderProjectCard(project)).join('');
    }

    renderProjectCard(project) {
        const avgRating = this.getAverageRating(project);
        const ratingCount = project.project_ratings?.length || 0;
        const commentCount = project.project_comments?.length || 0;
        
        return `
            <div class="project-card">
                <div class="project-header">
                    <img src="${project.logo_url || this.generateDefaultLogo(project.title)}" 
                         alt="${project.title}" class="project-logo">
                    <div class="project-info">
                        <h3>${project.title}</h3>
                        <span class="project-category">${project.categories?.name || 'Other'}</span>
                    </div>
                </div>
                <p class="project-description">${project.description || 'No description available'}</p>
                <div class="project-links">
                    ${project.website ? `<a href="${project.website}" target="_blank" class="project-link">🌐 Website</a>` : ''}
                    ${project.twitter ? `<a href="${project.twitter}" target="_blank" class="project-link">🐦 Twitter</a>` : ''}
                    ${project.github ? `<a href="${project.github}" target="_blank" class="project-link">💻 GitHub</a>` : ''}
                    ${project.discord ? `<a href="${project.discord}" target="_blank" class="project-link">💬 Discord</a>` : ''}
                </div>
                <div class="rating-section">
                    <div class="rating-display">
                        <div class="rating-stars">
                            ${this.renderStars(avgRating)}
                        </div>
                        <span class="rating-count">(${ratingCount} ratings)</span>
                    </div>
                    ${avgRating < 2 && ratingCount > 5 ? '<div class="scam-warning show">⚠️ Community Warning</div>' : ''}
                    <button class="rate-btn" onclick="app.showRatingModal('${project.id}', '${project.title}')">Rate Project</button>
                </div>
            </div>
        `;
    }

    getAverageRating(project) {
        const ratings = project.project_ratings || [];
        if (ratings.length === 0) return 0;
        
        const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
        return (sum / ratings.length).toFixed(1);
    }

    renderStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += `<span class="star">${i <= Math.round(rating) ? '★' : '☆'}</span>`;
        }
        return stars;
    }

    generateDefaultLogo(name) {
        const colors = ['#49EACB', '#6366F1', '#2AC9A7', '#1E3A8A'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const initial = name.charAt(0).toUpperCase();
        
        return `data:image/svg+xml;base64,${btoa(`
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="60" height="60" rx="12" fill="${color}"/>
                <text x="30" y="38" font-family="Inter" font-size="24" font-weight="600" text-anchor="middle" fill="white">${initial}</text>
            </svg>
        `)}`;
    }

    setupFeaturedCarousel() {
        this.featuredProjects = this.projects.filter(p => p.featured);
        if (this.featuredProjects.length > 0) {
            this.updateCarousel();
        }
    }

    updateCarousel() {
        const track = document.getElementById('carouselTrack');
        if (!track) return;
        
        track.innerHTML = this.featuredProjects.map(project => `
            <div class="carousel-item">
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
                </div>
            </div>
        `).join('');
    }

    moveCarousel(direction) {
        if (this.featuredProjects.length === 0) return;
        
        this.carouselIndex += direction;
        if (this.carouselIndex < 0) this.carouselIndex = this.featuredProjects.length - 1;
        if (this.carouselIndex >= this.featuredProjects.length) this.carouselIndex = 0;
        
        const track = document.getElementById('carouselTrack');
        track.style.transform = `translateX(-${this.carouselIndex * 100}%)`;
    }

    async updateStats() {
        document.getElementById('totalProjects').textContent = this.projects.length;
        document.getElementById('activeProjects').textContent = this.projects.filter(p => p.website).length;
        
        // Get total ratings from Supabase
        const { count: ratingsCount } = await supabaseClient
            .from('project_ratings')
            .select('*', { count: 'exact', head: true });
        
        document.getElementById('totalRatings').textContent = ratingsCount || 0;
        document.getElementById('verifiedProjects').textContent = this.projects.filter(p => p.featured).length;
    }

    // Modal functions
    showModal(modalId) {
        document.getElementById(modalId).classList.add('show');
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('show');
    }

    async connectWallet() {
        if (this.currentUser) {
            // Already authenticated via Supabase
            return;
        }
        
        // Show wallet/auth modal
        this.showModal('walletModal');
    }

    async connectSpecificWallet(walletType) {
        try {
            // For now, we'll use Supabase auth instead of direct wallet connection
            // You can implement actual wallet connection here
            
            if (walletType === 'kasware' || walletType === 'kastle' || walletType === 'kspr') {
                // Redirect to Supabase auth
                const { error } = await supabaseClient.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: window.location.origin
                    }
                });
                
                if (error) throw error;
            }
        } catch (error) {
            console.error('Connection error:', error);
            this.showToast('Failed to connect', 'error');
        }
    }

    async logout() {
        try {
            await supabaseClient.auth.signOut();
            this.showToast('Disconnected successfully', 'success');
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    showAddProjectModal() {
        if (!this.currentUser) {
            this.showToast('Please connect your wallet first', 'error');
            return;
        }
        this.showModal('addProjectModal');
    }

    async showRatingModal(projectId, projectName) {
        if (!this.currentUser) {
            this.showToast('Please connect your wallet to rate projects', 'error');
            return;
        }
        
        this.currentProjectId = projectId;
        document.getElementById('ratingProjectName').textContent = projectName;
        this.selectedRating = 0;
        document.querySelectorAll('.rating-star').forEach(star => star.classList.remove('active'));
        document.getElementById('ratingComment').value = '';
        document.getElementById('scamWarning').checked = false;
        
        // Check if user already rated
        const { data: existingRating } = await supabaseClient
            .from('project_ratings')
            .select('rating')
            .eq('project_id', projectId)
            .eq('user_id', this.currentUser.id)
            .single();
        
        if (existingRating) {
            this.setRating(existingRating.rating);
        }
        
        this.showModal('ratingModal');
    }

    setRating(rating) {
        this.selectedRating = rating;
        document.querySelectorAll('.rating-star').forEach((star, index) => {
            star.classList.toggle('active', index < rating);
        });
    }

    async submitRating() {
        if (this.selectedRating === 0) {
            this.showToast('Please select a rating', 'error');
            return;
        }
        
        try {
            const { error } = await supabaseClient
                .from('project_ratings')
                .upsert({
                    project_id: this.currentProjectId,
                    user_id: this.currentUser.id,
                    rating: this.selectedRating
                });
            
            if (error) throw error;
            
            // Add comment if provided
            const comment = document.getElementById('ratingComment').value.trim();
            if (comment) {
                await supabaseClient
                    .from('project_comments')
                    .insert({
                        project_id: this.currentProjectId,
                        user_id: this.currentUser.id,
                        content: comment
                    });
            }
            
            await this.loadProjects();
            this.closeModal('ratingModal');
            this.showToast('Rating submitted successfully!', 'success');
        } catch (error) {
            console.error('Error submitting rating:', error);
            this.showToast('Failed to submit rating', 'error');
        }
    }

    async submitProject(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        
        try {
            // Find category ID
            const categorySlug = formData.get('category');
            const category = this.categories.find(c => c.slug === categorySlug);
            
            const projectData = {
                title: formData.get('name'),
                category_id: category?.id,
                description: formData.get('description'),
                website: formData.get('url'),
                twitter: formData.get('twitter'),
                github: formData.get('github'),
                discord: formData.get('discord'),
                active: false, // Pending approval
                logo_url: document.getElementById('logoPreview').src || null
            };
            
            const { error } = await supabaseClient
                .from('projects')
                .insert(projectData);
            
            if (error) throw error;
            
            this.closeModal('addProjectModal');
            this.showToast('Project submitted for review!', 'success');
            event.target.reset();
            document.getElementById('logoPreview').style.display = 'none';
        } catch (error) {
            console.error('Error submitting project:', error);
            this.showToast('Failed to submit project', 'error');
        }
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast show ${type}`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    setupEventListeners() {
        document.getElementById('searchInput')?.addEventListener('input', () => this.renderProjects());
        document.getElementById('categoryFilter')?.addEventListener('change', () => this.renderProjects());
        document.getElementById('ratingFilter')?.addEventListener('change', () => this.renderProjects());
        
        // Make methods available globally
        window.app = this;
    }

    // Logo preview for add project form
    previewLogo(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('logoPreview');
                preview.src = e.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    }
}

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new KaspaModernApp();
});

// Global functions for onclick handlers
function moveCarousel(direction) {
    app.moveCarousel(direction);
}

function closeModal(modalId) {
    app.closeModal(modalId);
}

function showAddProjectModal() {
    app.showAddProjectModal();
}

function submitProject(event) {
    app.submitProject(event);
}

function previewLogo(event) {
    app.previewLogo(event);
}

function connectWallet() {
    app.connectWallet();
}

function connectSpecificWallet(walletType) {
    app.connectSpecificWallet(walletType);
}

function disconnectWallet() {
    app.logout();
}

function setRating(rating) {
    app.setRating(rating);
}

function submitRating() {
    app.submitRating();
}

function showAdminLogin() {
    // Redirect to Supabase dashboard or custom admin
    window.open('https://supabase.com/dashboard/project/kxdngctxlxrbjhdtztuu', '_blank');
}
