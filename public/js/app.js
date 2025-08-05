// Kaspa Ecosystem App with Supabase
class KaspaEcosystem {
    constructor() {
        this.currentUser = null;
        this.currentCategory = 'all';
        this.projects = [];
        this.categories = [];
        this.isAuthenticated = false;
        
        this.init();
    }

    async init() {
        // Check authentication
        await this.checkAuth();
        
        // Load initial data
        await Promise.all([
            this.loadCategories(),
            this.loadProjects()
        ]);
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup auth state listener
        supabaseClient.auth.onAuthStateChange((event, session) => {
            this.handleAuthChange(event, session);
        });
    }

    async checkAuth() {
        const { data: { session } } = await supabaseClient.auth.getSession();
        this.isAuthenticated = !!session;
        this.currentUser = session?.user || null;
        this.updateAuthUI();
    }

    async handleAuthChange(event, session) {
        this.isAuthenticated = !!session;
        this.currentUser = session?.user || null;
        this.updateAuthUI();
        
        if (event === 'SIGNED_IN') {
            // Reload data to get user-specific content
            await this.loadProjects();
        }
    }

    updateAuthUI() {
        const authSection = document.getElementById('auth-section');
        if (!authSection) return;
        
        if (this.isAuthenticated) {
            authSection.innerHTML = `
                <div class="user-menu">
                    <img src="${this.currentUser.user_metadata?.avatar_url || '/images/default-avatar.png'}" 
                         alt="Avatar" class="user-avatar">
                    <span>${this.currentUser.email}</span>
                    <button onclick="app.logout()" class="btn-logout">Logout</button>
                </div>
            `;
        } else {
            authSection.innerHTML = `
                <button onclick="app.showAuthModal()" class="btn-login">Login / Sign Up</button>
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
            this.renderCategories();
        } catch (error) {
            console.error('Error loading categories:', error);
            this.showNotification('Failed to load categories', 'error');
        }
    }

    async loadProjects() {
        try {
            let query = supabaseClient
                .from('projects')
                .select(`
                    *,
                    categories!inner(name, slug),
                    project_stats!inner(average_rating, rating_count, comment_count)
                `)
                .eq('active', true)
                .order('featured', { ascending: false })
                .order('created_at', { ascending: false });
            
            if (this.currentCategory && this.currentCategory !== 'all') {
                query = query.eq('categories.slug', this.currentCategory);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            
            this.projects = data || [];
            this.renderProjects();
        } catch (error) {
            console.error('Error loading projects:', error);
            this.showNotification('Failed to load projects', 'error');
        }
    }

    renderCategories() {
        const container = document.getElementById('categories-nav');
        if (!container) return;
        
        let html = `
            <button class="category-btn ${this.currentCategory === 'all' ? 'active' : ''}" 
                    onclick="app.filterByCategory('all')">
                All Projects
            </button>
        `;
        
        this.categories.forEach(cat => {
            html += `
                <button class="category-btn ${this.currentCategory === cat.slug ? 'active' : ''}" 
                        onclick="app.filterByCategory('${cat.slug}')">
                    ${cat.icon ? `<span class="category-icon">${cat.icon}</span>` : ''}
                    ${cat.name}
                </button>
            `;
        });
        
        container.innerHTML = html;
    }

    renderProjects() {
        const container = document.getElementById('projects-grid');
        if (!container) return;
        
        if (this.projects.length === 0) {
            container.innerHTML = '<p class="no-projects">No projects found</p>';
            return;
        }
        
        const html = this.projects.map(project => this.createProjectCard(project)).join('');
        container.innerHTML = html;
    }

    createProjectCard(project) {
        const rating = project.project_stats?.average_rating || 0;
        const ratingCount = project.project_stats?.rating_count || 0;
        const commentCount = project.project_stats?.comment_count || 0;
        
        return `
            <div class="project-card ${project.featured ? 'featured' : ''}" data-id="${project.id}">
                ${project.featured ? '<div class="featured-badge">Featured</div>' : ''}
                
                <div class="project-header">
                    ${project.logo_url ? 
                        `<img src="${project.logo_url}" alt="${project.title}" class="project-logo">` :
                        `<div class="project-logo-placeholder">${project.title.charAt(0)}</div>`
                    }
                    <h3 class="project-title">${project.title}</h3>
                </div>
                
                <p class="project-description">${project.description || 'No description available'}</p>
                
                <div class="project-stats">
                    <div class="stat-item">
                        <span class="stars">${this.renderStars(rating)}</span>
                        <span class="rating-text">(${ratingCount})</span>
                    </div>
                    <div class="stat-item">
                        <i class="icon-comment"></i>
                        <span>${commentCount}</span>
                    </div>
                    ${project.github_stars ? 
                        `<div class="stat-item">
                            <i class="icon-github"></i>
                            <span>${this.formatNumber(project.github_stars)}</span>
                        </div>` : ''
                    }
                </div>
                
                <div class="project-links">
                    ${project.website ? `<a href="${project.website}" target="_blank" class="project-link"><i class="icon-web"></i></a>` : ''}
                    ${project.github ? `<a href="${project.github}" target="_blank" class="project-link"><i class="icon-github"></i></a>` : ''}
                    ${project.twitter ? `<a href="${project.twitter}" target="_blank" class="project-link"><i class="icon-twitter"></i></a>` : ''}
                    ${project.discord ? `<a href="${project.discord}" target="_blank" class="project-link"><i class="icon-discord"></i></a>` : ''}
                </div>
                
                <button class="btn-view-details" onclick="app.showProjectDetails('${project.id}')">View Details</button>
            </div>
        `;
    }

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        let stars = '';
        
        for (let i = 0; i < fullStars; i++) {
            stars += '★';
        }
        if (hasHalfStar) {
            stars += '☆';
        }
        for (let i = stars.length; i < 5; i++) {
            stars += '☆';
        }
        
        return stars;
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    async filterByCategory(category) {
        this.currentCategory = category;
        await this.loadProjects();
        this.renderCategories();
    }

    async showProjectDetails(projectId) {
        try {
            // Load full project details with comments
            const { data: project, error } = await supabaseClient
                .from('projects')
                .select(`
                    *,
                    categories(name, slug),
                    project_ratings(rating, user_id),
                    project_comments(
                        id, content, created_at, 
                        profiles(username, avatar_url),
                        upvotes, downvotes
                    )
                `)
                .eq('id', projectId)
                .single();
            
            if (error) throw error;
            
            this.showProjectModal(project);
        } catch (error) {
            console.error('Error loading project details:', error);
            this.showNotification('Failed to load project details', 'error');
        }
    }

    showProjectModal(project) {
        // Implementation for project detail modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
                <h2>${project.title}</h2>
                <div class="project-detail-content">
                    <!-- Add detailed project view here -->
                    <p>${project.description}</p>
                    
                    ${this.isAuthenticated ? `
                        <div class="rating-section">
                            <h3>Rate this project</h3>
                            <div class="star-rating" data-project-id="${project.id}">
                                ${[1,2,3,4,5].map(i => 
                                    `<span class="star" data-rating="${i}" onclick="app.rateProject('${project.id}', ${i})">☆</span>`
                                ).join('')}
                            </div>
                        </div>
                        
                        <div class="comment-section">
                            <h3>Comments</h3>
                            <form onsubmit="app.addComment(event, '${project.id}')">
                                <textarea name="comment" placeholder="Add a comment..." required></textarea>
                                <button type="submit">Post Comment</button>
                            </form>
                            <div class="comments-list">
                                ${this.renderComments(project.project_comments || [])}
                            </div>
                        </div>
                    ` : `
                        <p class="auth-prompt">Please login to rate and comment</p>
                    `}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    renderComments(comments) {
        if (comments.length === 0) {
            return '<p>No comments yet</p>';
        }
        
        return comments.map(comment => `
            <div class="comment">
                <div class="comment-header">
                    <img src="${comment.profiles?.avatar_url || '/images/default-avatar.png'}" 
                         alt="Avatar" class="comment-avatar">
                    <span class="comment-author">${comment.profiles?.username || 'Anonymous'}</span>
                    <span class="comment-date">${new Date(comment.created_at).toLocaleDateString()}</span>
                </div>
                <p class="comment-content">${comment.content}</p>
                <div class="comment-actions">
                    <button onclick="app.voteComment('${comment.id}', 'upvote')" 
                            class="vote-btn ${comment.user_vote === 'upvote' ? 'active' : ''}">
                        ▲ ${comment.upvotes || 0}
                    </button>
                    <button onclick="app.voteComment('${comment.id}', 'downvote')" 
                            class="vote-btn ${comment.user_vote === 'downvote' ? 'active' : ''}">
                        ▼ ${comment.downvotes || 0}
                    </button>
                </div>
            </div>
        `).join('');
    }

    async rateProject(projectId, rating) {
        if (!this.isAuthenticated) {
            this.showAuthModal();
            return;
        }
        
        try {
            const { error } = await supabaseClient
                .from('project_ratings')
                .upsert({
                    project_id: projectId,
                    user_id: this.currentUser.id,
                    rating: rating
                });
            
            if (error) throw error;
            
            // Update UI
            document.querySelectorAll(`.star-rating[data-project-id="${projectId}"] .star`).forEach((star, index) => {
                star.textContent = index < rating ? '★' : '☆';
            });
            
            this.showNotification('Rating saved!', 'success');
        } catch (error) {
            console.error('Error rating project:', error);
            this.showNotification('Failed to save rating', 'error');
        }
    }

    async addComment(event, projectId) {
        event.preventDefault();
        
        if (!this.isAuthenticated) {
            this.showAuthModal();
            return;
        }
        
        const form = event.target;
        const content = form.comment.value.trim();
        
        try {
            const { data, error } = await supabaseClient
                .from('project_comments')
                .insert({
                    project_id: projectId,
                    user_id: this.currentUser.id,
                    content: content
                })
                .select(`
                    id, content, created_at,
                    profiles(username, avatar_url)
                `);
            
            if (error) throw error;
            
            // Add comment to UI
            const commentsList = form.nextElementSibling;
            const newCommentHtml = this.renderComments(data);
            commentsList.insertAdjacentHTML('afterbegin', newCommentHtml);
            
            form.reset();
            this.showNotification('Comment posted!', 'success');
        } catch (error) {
            console.error('Error posting comment:', error);
            this.showNotification('Failed to post comment', 'error');
        }
    }

    async voteComment(commentId, voteType) {
        if (!this.isAuthenticated) {
            this.showAuthModal();
            return;
        }
        
        try {
            // Check if user already voted
            const { data: existingVote } = await supabaseClient
                .from('comment_votes')
                .select('vote_type')
                .eq('comment_id', commentId)
                .eq('user_id', this.currentUser.id)
                .single();
            
            if (existingVote && existingVote.vote_type === voteType) {
                // Remove vote
                await supabaseClient
                    .from('comment_votes')
                    .delete()
                    .eq('comment_id', commentId)
                    .eq('user_id', this.currentUser.id);
            } else {
                // Add or update vote
                await supabaseClient
                    .from('comment_votes')
                    .upsert({
                        comment_id: commentId,
                        user_id: this.currentUser.id,
                        vote_type: voteType
                    });
            }
            
            // Reload comments to update vote counts
            // In production, you'd update the UI optimistically
            this.showNotification('Vote recorded!', 'success');
        } catch (error) {
            console.error('Error voting on comment:', error);
            this.showNotification('Failed to record vote', 'error');
        }
    }

    showAuthModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content auth-modal">
                <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
                <h2>Login or Sign Up</h2>
                <div class="auth-tabs">
                    <button class="tab-btn active" onclick="app.switchAuthTab('login')">Login</button>
                    <button class="tab-btn" onclick="app.switchAuthTab('signup')">Sign Up</button>
                </div>
                <form id="auth-form" onsubmit="app.handleAuth(event)">
                    <input type="email" name="email" placeholder="Email" required>
                    <input type="password" name="password" placeholder="Password" required>
                    <button type="submit">Login</button>
                </form>
                <div class="auth-providers">
                    <button onclick="app.signInWithProvider('google')" class="provider-btn">
                        <i class="icon-google"></i> Continue with Google
                    </button>
                    <button onclick="app.signInWithProvider('github')" class="provider-btn">
                        <i class="icon-github"></i> Continue with GitHub
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    switchAuthTab(tab) {
        const form = document.getElementById('auth-form');
        const submitBtn = form.querySelector('button[type="submit"]');
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.textContent.toLowerCase() === tab);
        });
        
        submitBtn.textContent = tab === 'login' ? 'Login' : 'Sign Up';
        form.dataset.mode = tab;
    }

    async handleAuth(event) {
        event.preventDefault();
        
        const form = event.target;
        const email = form.email.value;
        const password = form.password.value;
        const mode = form.dataset.mode || 'login';
        
        try {
            let result;
            if (mode === 'login') {
                result = await supabaseClient.auth.signInWithPassword({ email, password });
            } else {
                result = await supabaseClient.auth.signUp({ email, password });
            }
            
            if (result.error) throw result.error;
            
            // Close modal
            form.closest('.modal').remove();
            
            this.showNotification(
                mode === 'login' ? 'Welcome back!' : 'Account created successfully!',
                'success'
            );
        } catch (error) {
            console.error('Auth error:', error);
            this.showNotification(error.message || 'Authentication failed', 'error');
        }
    }

    async signInWithProvider(provider) {
        try {
            const { error } = await supabaseClient.auth.signInWithOAuth({
                provider: provider,
                options: {
                    redirectTo: window.location.origin
                }
            });
            
            if (error) throw error;
        } catch (error) {
            console.error('OAuth error:', error);
            this.showNotification('Failed to sign in with ' + provider, 'error');
        }
    }

    async logout() {
        try {
            await supabaseClient.auth.signOut();
            this.showNotification('Logged out successfully', 'success');
        } catch (error) {
            console.error('Logout error:', error);
            this.showNotification('Failed to logout', 'error');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', debounce((e) => {
                this.searchProjects(e.target.value);
            }, 300));
        }
        
        // Mobile menu
        const menuToggle = document.getElementById('menu-toggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                document.body.classList.toggle('menu-open');
            });
        }
    }

    async searchProjects(query) {
        if (!query) {
            await this.loadProjects();
            return;
        }
        
        try {
            const { data, error } = await supabaseClient
                .from('projects')
                .select(`
                    *,
                    categories!inner(name, slug),
                    project_stats!inner(average_rating, rating_count, comment_count)
                `)
                .eq('active', true)
                .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
                .order('featured', { ascending: false })
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            this.projects = data || [];
            this.renderProjects();
        } catch (error) {
            console.error('Error searching projects:', error);
            this.showNotification('Search failed', 'error');
        }
    }
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new KaspaEcosystem();
});
