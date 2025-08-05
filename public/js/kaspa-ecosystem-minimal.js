// Version minimale qui fonctionne avec moins de colonnes
class KaspaEcosystemMinimal {
    constructor() {
        this.walletManager = new KaspaWalletManager();
        this.supabase = supabaseClient;
        this.projects = [];
        this.categories = [];
        
        this.init();
    }

    async init() {
        console.log('Initializing Kaspa Ecosystem (Minimal)...');
        
        await this.loadCategories();
        await this.loadProjects();
        this.attachEventListeners();
        this.updateStats();
    }

    async loadCategories() {
        try {
            const { data, error } = await this.supabase
                .from('categories')
                .select('*');
            
            if (error) {
                console.error('Categories error:', error);
                // Use default categories
                this.categories = [
                    { id: '1', name: 'DeFi', slug: 'defi' },
                    { id: '2', name: 'Wallets', slug: 'wallets' },
                    { id: '3', name: 'Tools', slug: 'tools' }
                ];
            } else {
                this.categories = data || [];
            }
            
            this.renderCategories();
        } catch (err) {
            console.error('Load categories error:', err);
        }
    }

    async loadProjects() {
        try {
            // Simple query without active column
            const { data, error } = await this.supabase
                .from('projects')
                .select(`
                    id,
                    title,
                    description,
                    website,
                    github,
                    twitter,
                    discord,
                    logo_url,
                    category_id,
                    categories (
                        name,
                        slug
                    )
                `);
            
            if (error) {
                console.error('Projects error:', error);
                // Use sample data
                this.projects = this.getSampleProjects();
            } else {
                this.projects = data || [];
            }
            
            this.renderProjects();
        } catch (err) {
            console.error('Load projects error:', err);
            this.projects = this.getSampleProjects();
            this.renderProjects();
        }
    }

    getSampleProjects() {
        return [
            {
                id: '1',
                title: 'Kaspa Wallet',
                description: 'Official Kaspa wallet',
                website: 'https://wallet.kaspanet.io',
                github: 'https://github.com/kaspanet/kaspad',
                categories: { name: 'Wallets' }
            },
            {
                id: '2',
                title: 'Kasware',
                description: 'Browser extension wallet',
                website: 'https://kasware.xyz',
                categories: { name: 'Wallets' }
            }
        ];
    }

    renderCategories() {
        const container = document.getElementById('category-filters');
        if (!container) return;
        
        container.innerHTML = `
            <button class="category-filter active" onclick="app.filterByCategory('all')">
                All Projects
            </button>
            ${this.categories.map(cat => `
                <button class="category-filter" onclick="app.filterByCategory('${cat.slug}')">
                    ${cat.name}
                </button>
            `).join('')}
        `;
    }

    renderProjects() {
        const container = document.getElementById('projects-grid');
        if (!container) return;
        
        if (this.projects.length === 0) {
            container.innerHTML = '<p class="no-projects">No projects found</p>';
            return;
        }
        
        container.innerHTML = this.projects.map(project => `
            <div class="project-card">
                <div class="project-header">
                    <h3>${project.title}</h3>
                    <span class="category-badge">
                        ${project.categories?.name || 'Other'}
                    </span>
                </div>
                
                <p class="project-description">
                    ${project.description || 'No description'}
                </p>
                
                <div class="project-links">
                    ${project.website ? `
                        <a href="${project.website}" target="_blank">🌐 Website</a>
                    ` : ''}
                    ${project.github ? `
                        <a href="${project.github}" target="_blank">💻 GitHub</a>
                    ` : ''}
                    ${project.twitter ? `
                        <a href="${project.twitter}" target="_blank">🐦 Twitter</a>
                    ` : ''}
                </div>
                
                <div class="project-actions">
                    <button class="rate-btn" onclick="app.rateProject('${project.id}')">
                        Rate Project
                    </button>
                </div>
            </div>
        `).join('');
    }

    async connectWallet(walletType) {
        try {
            const walletInfo = await this.walletManager.connectWallet(walletType);
            localStorage.setItem('kaspa_wallet_address', walletInfo.address);
            this.updateWalletUI();
            this.showToast(`Connected! Address: ${walletInfo.address.substring(0, 20)}...`, 'success');
        } catch (error) {
            console.error('Connection error:', error);
            this.showToast(error.message, 'error');
        }
    }

    async disconnectWallet() {
        this.walletManager.disconnect();
        localStorage.removeItem('kaspa_wallet_address');
        this.updateWalletUI();
        this.showToast('Disconnected', 'info');
    }

    updateWalletUI() {
        const connectBtn = document.querySelector('.wallet-connect-btn');
        const walletInfo = document.querySelector('.wallet-info');
        const walletAddress = document.querySelector('.wallet-address');
        
        if (this.walletManager.isConnected()) {
            if (connectBtn) connectBtn.style.display = 'none';
            if (walletInfo) {
                walletInfo.style.display = 'flex';
                walletAddress.textContent = this.walletManager.getShortAddress();
            }
        } else {
            if (connectBtn) connectBtn.style.display = 'block';
            if (walletInfo) walletInfo.style.display = 'none';
        }
    }

    async rateProject(projectId) {
        if (!this.walletManager.isConnected()) {
            this.showToast('Please connect wallet first', 'warning');
            return;
        }
        
        const rating = prompt('Rate this project (1-5):', '5');
        if (!rating || rating < 1 || rating > 5) {
            this.showToast('Invalid rating', 'error');
            return;
        }
        
        try {
            const { error } = await this.supabase
                .from('wallet_ratings')
                .insert({
                    project_id: projectId,
                    wallet_address: this.walletManager.getAddress(),
                    rating: parseInt(rating)
                });
            
            if (error) throw error;
            
            this.showToast('Rating submitted!', 'success');
        } catch (error) {
            console.error('Rating error:', error);
            this.showToast('Failed to submit rating', 'error');
        }
    }

    filterByCategory(slug) {
        document.querySelectorAll('.category-filter').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        if (slug === 'all') {
            this.renderProjects();
        } else {
            const filtered = this.projects.filter(p => p.categories?.slug === slug);
            const temp = this.projects;
            this.projects = filtered;
            this.renderProjects();
            this.projects = temp;
        }
    }

    updateStats() {
        document.getElementById('total-projects').textContent = this.projects.length;
        document.getElementById('active-projects').textContent = 
            this.projects.filter(p => p.website).length;
    }

    showToast(message, type = 'info') {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();
        
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

    attachEventListeners() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                const filtered = this.projects.filter(p => 
                    (p.title || '').toLowerCase().includes(query) ||
                    (p.description || '').toLowerCase().includes(query)
                );
                const temp = this.projects;
                this.projects = filtered;
                this.renderProjects();
                this.projects = temp;
            });
        }
    }
}

// Initialize
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new KaspaEcosystemMinimal();
    window.app = app;
});
