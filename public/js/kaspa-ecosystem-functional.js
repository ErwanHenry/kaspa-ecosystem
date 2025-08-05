// Kaspa Ecosystem - Functional Implementation
class KaspaEcosystem {
    constructor() {
        this.walletManager = new KaspaWalletManager();
        this.supabase = supabaseClient;
        this.currentUser = null;
        this.projects = [];
        this.categories = [];
        
        this.init();
    }

    async init() {
        console.log('Initializing Kaspa Ecosystem...');
        
        // Check if user has a saved session
        const savedWallet = localStorage.getItem('kaspa_wallet_address');
        if (savedWallet) {
            await this.autoConnect(savedWallet);
        }
        
        // Load data
        await this.loadCategories();
        await this.loadProjects();
        
        // Setup UI
        this.updateUI();
        this.attachEventListeners();
    }

    async autoConnect(address) {
        try {
            // Try to reconnect to wallet
            if (window.kasware) {
                const accounts = await window.kasware.requestAccounts();
                if (accounts.includes(address)) {
                    this.walletManager.connectedWallet = address;
                    this.walletManager.walletType = 'kasware';
                    await this.onWalletConnected();
                }
            }
        } catch (error) {
            console.log('Auto-connect failed:', error);
            localStorage.removeItem('kaspa_wallet_address');
        }
    }

    async connectWallet(walletType) {
        try {
            console.log('Connecting to', walletType);
            const walletInfo = await this.walletManager.connectWallet(walletType);
            
            // Save wallet address
            localStorage.setItem('kaspa_wallet_address', walletInfo.address);
            
            await this.onWalletConnected();
            
            // Show success
            this.showToast(`Connected to ${walletType}! Balance: ${walletInfo.balance.confirmed} KAS`, 'success');
            
        } catch (error) {
            console.error('Connection error:', error);
            this.showToast(error.message, 'error');
            
            // If Kasware not installed, show install prompt
            if (error.message.includes('not found')) {
                this.showInstallPrompt(walletType);
            }
        }
    }

    async onWalletConnected() {
        // Create or get user profile
        await this.createOrGetUserProfile();
        
        // Update UI
        this.updateWalletUI();
        
        // Enable features
        this.enableAuthenticatedFeatures();
    }

    async createOrGetUserProfile() {
        const address = this.walletManager.getAddress();
        
        try {
            // Check if profile exists
            const { data: existingProfile } = await this.supabase
                .from('profiles')
                .select('*')
                .eq('wallet_address', address)
                .single();
            
            if (existingProfile) {
                this.currentUser = existingProfile;
                return;
            }
            
            // Create new profile
            const { data: newProfile, error } = await this.supabase
                .from('profiles')
                .insert({
                    wallet_address: address,
                    username: `kaspa_${address.substring(6, 12)}`,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();
            
            if (error) throw error;
            
            this.currentUser = newProfile;
            console.log('Profile created:', newProfile);
            
        } catch (error) {
            console.error('Profile error:', error);
        }
    }

    async disconnectWallet() {
        this.walletManager.disconnect();
        this.currentUser = null;
        localStorage.removeItem('kaspa_wallet_address');
        
        this.updateWalletUI();
        this.disableAuthenticatedFeatures();
        
        this.showToast('Wallet disconnected', 'info');
    }

    updateWalletUI() {
        const connectBtn = document.querySelector('.wallet-connect-btn');
        const walletInfo = document.querySelector('.wallet-info');
        const walletAddress = document.querySelector('.wallet-address');
        const walletBalance = document.querySelector('.wallet-balance');
        
        if (this.walletManager.isConnected()) {
            // Show connected state
            if (connectBtn) connectBtn.style.display = 'none';
            if (walletInfo) {
                walletInfo.style.display = 'flex';
                walletAddress.textContent = this.walletManager.getShortAddress();
                
                // Update balance
                this.walletManager.getBalance().then(balance => {
                    walletBalance.textContent = `${balance.confirmed.toFixed(2)} KAS`;
                });
            }
        } else {
            // Show disconnected state
            if (connectBtn) connectBtn.style.display = 'block';
            if (walletInfo) walletInfo.style.display = 'none';
        }
    }

    enableAuthenticatedFeatures() {
        // Enable rating
        document.querySelectorAll('.rate-btn').forEach(btn => {
            btn.disabled = false;
            btn.title = 'Rate this project';
        });
        
        // Enable submit project
        const submitBtn = document.querySelector('.submit-project-btn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.title = 'Submit a new project';
        }
        
        // Show user menu
        this.showUserMenu();
    }

    disableAuthenticatedFeatures() {
        // Disable rating
        document.querySelectorAll('.rate-btn').forEach(btn => {
            btn.disabled = true;
            btn.title = 'Connect wallet to rate';
        });
        
        // Disable submit project
        const submitBtn = document.querySelector('.submit-project-btn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.title = 'Connect wallet to submit projects';
        }
        
        // Hide user menu
        this.hideUserMenu();
    }

    showUserMenu() {
        const userMenu = document.getElementById('user-menu');
        if (userMenu && this.currentUser) {
            userMenu.innerHTML = `
                <div class="user-info">
                    <img src="${this.generateAvatar(this.currentUser.wallet_address)}" class="user-avatar">
                    <span class="username">${this.currentUser.username}</span>
                </div>
                <div class="user-stats">
                    <span>Reputation: ${this.currentUser.reputation || 0}</span>
                </div>
            `;
            userMenu.style.display = 'block';
        }
    }

    hideUserMenu() {
        const userMenu = document.getElementById('user-menu');
        if (userMenu) {
            userMenu.style.display = 'none';
        }
    }

    generateAvatar(address) {
        // Generate a unique avatar based on wallet address
        const colors = ['#49EACB', '#6366F1', '#2AC9A7', '#1E3A8A', '#FFD700'];
        const colorIndex = parseInt(address.substring(10, 12), 16) % colors.length;
        const letter = address.substring(6, 7).toUpperCase();
        
        const svg = `
            <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="20" fill="${colors[colorIndex]}"/>
                <text x="20" y="25" text-anchor="middle" fill="white" font-size="18" font-weight="bold">${letter}</text>
            </svg>
        `;
        
        return `data:image/svg+xml;base64,${btoa(svg)}`;
    }

    async loadCategories() {
        try {
            const { data, error } = await this.supabase
                .from('categories')
                .select('*')
                .order('name');
            
            if (error) throw error;
            
            this.categories = data || [];
            this.renderCategories();
            
        } catch (error) {
            console.error('Error loading categories:', error);
            // Use fallback categories
            this.categories = [
                { id: '1', name: 'DeFi', slug: 'defi', icon: '💰' },
                { id: '2', name: 'Wallets', slug: 'wallets', icon: '👛' },
                { id: '3', name: 'Mining', slug: 'mining', icon: '⛏️' },
                { id: '4', name: 'Tools', slug: 'tools', icon: '🔧' },
                { id: '5', name: 'Games', slug: 'games', icon: '🎮' }
            ];
            this.renderCategories();
        }
    }

    async loadProjects() {
        try {
            const { data, error } = await this.supabase
                .from('projects')
                .select(`
                    *,
                    categories (name, slug, icon)
                `)
                .eq('active', true);
            
            if (error) throw error;
            
            this.projects = data || [];
            this.renderProjects();
            
        } catch (error) {
            console.error('Error loading projects:', error);
            // Use sample projects for demo
            this.projects = this.getSampleProjects();
            this.renderProjects();
        }
    }

    getSampleProjects() {
        return [
            {
                id: '1',
                title: 'Kaspa Wallet',
                description: 'Official Kaspa wallet for secure transactions',
                website: 'https://wallet.kaspanet.io',
                github: 'https://github.com/kaspanet/kaspad',
                twitter: '@KaspaCurrency',
                categories: { name: 'Wallets', icon: '👛' },
                github_stars: 1234,
                featured: true
            },
            {
                id: '2',
                title: 'Kasware Wallet',
                description: 'Browser extension wallet for Kaspa',
                website: 'https://kasware.xyz',
                twitter: '@kasware_wallet',
                categories: { name: 'Wallets', icon: '👛' },
                featured: true
            },
            {
                id: '3',
                title: 'Kasplex',
                description: 'DeFi platform on Kaspa blockchain',
                website: 'https://kasplex.org',
                categories: { name: 'DeFi', icon: '💰' }
            }
        ];
    }

    renderCategories() {
        const container = document.getElementById('category-filters');
        if (!container) return;
        
        const html = `
            <button class="category-filter active" onclick="app.filterByCategory('all')">
                All Projects
            </button>
            ${this.categories.map(cat => `
                <button class="category-filter" onclick="app.filterByCategory('${cat.slug}')">
                    ${cat.icon} ${cat.name}
                </button>
            `).join('')}
        `;
        
        container.innerHTML = html;
    }

    renderProjects() {
        const container = document.getElementById('projects-grid');
        if (!container) return;
        
        const html = this.projects.map(project => `
            <div class="project-card" data-project-id="${project.id}">
                ${project.featured ? '<div class="featured-badge">⭐ Featured</div>' : ''}
                
                <div class="project-header">
                    <img src="${project.logo_url || this.generateProjectLogo(project.title)}" 
                         alt="${project.title}" class="project-logo">
                    <div>
                        <h3>${project.title}</h3>
                        <span class="category-badge">
                            ${project.categories?.icon || '📦'} ${project.categories?.name || 'Other'}
                        </span>
                    </div>
                </div>
                
                <p class="project-description">${project.description}</p>
                
                ${project.github_stars ? `
                    <div class="project-stats">
                        <span>⭐ ${project.github_stars} stars</span>
                    </div>
                ` : ''}
                
                <div class="project-links">
                    ${project.website ? `<a href="${project.website}" target="_blank">🌐 Website</a>` : ''}
                    ${project.github ? `<a href="${project.github}" target="_blank">💻 GitHub</a>` : ''}
                    ${project.twitter ? `<a href="${project.twitter}" target="_blank">🐦 Twitter</a>` : ''}
                </div>
                
                <div class="project-actions">
                    <button class="rate-btn" onclick="app.rateProject('${project.id}')" 
                            ${!this.walletManager.isConnected() ? 'disabled' : ''}>
                        Rate Project
                    </button>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html || '<p class="no-projects">No projects found</p>';
    }

    generateProjectLogo(title) {
        const colors = ['#49EACB', '#6366F1', '#2AC9A7', '#1E3A8A'];
        const color = colors[title.length % colors.length];
        const letter = title.charAt(0).toUpperCase();
        
        const svg = `
            <svg width="60" height="60" xmlns="http://www.w3.org/2000/svg">
                <rect width="60" height="60" rx="12" fill="${color}"/>
                <text x="30" y="38" text-anchor="middle" fill="white" font-size="24" font-weight="bold">${letter}</text>
            </svg>
        `;
        
        return `data:image/svg+xml;base64,${btoa(svg)}`;
    }

    async rateProject(projectId) {
        if (!this.walletManager.isConnected()) {
            this.showToast('Please connect your wallet to rate projects', 'warning');
            return;
        }
        
        // Show rating modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Rate Project</h2>
                <div class="rating-stars">
                    ${[1,2,3,4,5].map(i => `
                        <span class="star" data-rating="${i}" onclick="app.selectRating(${i})">☆</span>
                    `).join('')}
                </div>
                <textarea id="rating-comment" placeholder="Add a comment (optional)"></textarea>
                <div class="modal-actions">
                    <button onclick="app.submitRating('${projectId}')">Submit Rating</button>
                    <button onclick="this.closest('.modal').remove()">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    selectRating(rating) {
        this.selectedRating = rating;
        document.querySelectorAll('.star').forEach((star, index) => {
            star.textContent = index < rating ? '★' : '☆';
        });
    }

    async submitRating(projectId) {
        if (!this.selectedRating) {
            this.showToast('Please select a rating', 'warning');
            return;
        }
        
        const comment = document.getElementById('rating-comment').value;
        
        try {
            // Sign the rating with wallet
            const message = `Rate project ${projectId} with ${this.selectedRating} stars`;
            const signature = await this.walletManager.signMessage(message);
            
            // Submit to Supabase
            const { error } = await this.supabase
                .from('project_ratings')
                .insert({
                    project_id: projectId,
                    wallet_address: this.walletManager.getAddress(),
                    rating: this.selectedRating,
                    comment: comment,
                    signature: signature
                });
            
            if (error) throw error;
            
            this.showToast('Rating submitted successfully!', 'success');
            document.querySelector('.modal').remove();
            
            // Reload projects to update ratings
            await this.loadProjects();
            
        } catch (error) {
            console.error('Rating error:', error);
            this.showToast('Failed to submit rating', 'error');
        }
    }

    filterByCategory(slug) {
        // Update active button
        document.querySelectorAll('.category-filter').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // Filter projects
        if (slug === 'all') {
            this.renderProjects();
        } else {
            const filtered = this.projects.filter(p => p.categories?.slug === slug);
            this.renderFilteredProjects(filtered);
        }
    }

    renderFilteredProjects(projects) {
        const container = document.getElementById('projects-grid');
        if (projects.length === 0) {
            container.innerHTML = '<p class="no-projects">No projects in this category</p>';
            return;
        }
        
        // Re-render with filtered projects
        const temp = this.projects;
        this.projects = projects;
        this.renderProjects();
        this.projects = temp;
    }

    showInstallPrompt(walletType) {
        const urls = {
            kasware: 'https://kasware.xyz',
            kastle: 'https://kastle.app',
            kspr: 'https://kspr.app'
        };
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Install ${walletType} Wallet</h2>
                <p>${walletType} wallet is not installed. Would you like to install it?</p>
                <div class="modal-actions">
                    <button onclick="window.open('${urls[walletType]}', '_blank'); this.closest('.modal').remove()">
                        Install ${walletType}
                    </button>
                    <button onclick="this.closest('.modal').remove()">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    updateUI() {
        this.updateWalletUI();
        this.renderCategories();
        this.renderProjects();
        
        // Update stats
        document.getElementById('total-projects').textContent = this.projects.length;
        document.getElementById('active-projects').textContent = 
            this.projects.filter(p => p.website).length;
    }

    attachEventListeners() {
        // Search
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                const filtered = this.projects.filter(p => 
                    p.title.toLowerCase().includes(query) ||
                    p.description?.toLowerCase().includes(query)
                );
                this.renderFilteredProjects(filtered);
            });
        }
    }
}

// Initialize on DOM load
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new KaspaEcosystem();
    
    // Make app globally available
    window.app = app;
});
