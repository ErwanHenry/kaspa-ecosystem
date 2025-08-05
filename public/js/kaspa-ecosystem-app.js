// Kaspa Ecosystem App - Complete Implementation
class KaspaEcosystemApp {
    constructor() {
        // State
        this.projects = [];
        this.categories = [];
        this.currentUser = null;
        this.connectedWallet = null;
        this.notifications = [];
        this.charts = {};
        this.featuredProjects = [];
        this.carouselIndex = 0;
        this.selectedRating = 0;
        this.currentProjectId = null;
        
        // Initialize
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
        
        // Load initial data
        await Promise.all([
            this.loadCategories(),
            this.loadProjects()
        ]);
        
        // Setup UI
        this.updateStats();
        this.setupEventListeners();
        this.setupFeaturedCarousel();
        this.updateAuthUI();
        this.initializeAnalytics();
        this.setupRealtimeSubscriptions();
        this.setupNotificationSystem();
        
        // Auto-rotate carousel
        setInterval(() => {
            if (this.featuredProjects.length > 1) {
                this.moveCarousel(1);
            }
        }, 5000);
        
        // Check for notifications every minute
        setInterval(() => this.checkNotifications(), 60000);
    }

    // 1. Dashboard Analytics
    async initializeAnalytics() {
        // Show analytics section if user is authenticated
        if (this.currentUser) {
            document.getElementById('analytics').style.display = 'block';
            await this.loadAnalyticsData();
        }
    }

    async loadAnalyticsData() {
        try {
            // Get project growth data
            const { data: growthData } = await supabaseClient
                .rpc('get_project_growth_stats');
            
            // Get category distribution
            const { data: categoryStats } = await supabaseClient
                .from('projects')
                .select('categories(name)')
                .eq('active', true);
            
            // Get rating trends
            const { data: ratingTrends } = await supabaseClient
                .rpc('get_rating_trends');
            
            // Get GitHub activity
            const { data: githubActivity } = await supabaseClient
                .from('projects')
                .select('title, github_stars, github_last_commit')
                .not('github_stars', 'is', null)
                .order('github_stars', { ascending: false })
                .limit(10);
            
            this.renderCharts({
                growth: growthData || [],
                categories: categoryStats || [],
                ratings: ratingTrends || [],
                github: githubActivity || []
            });
        } catch (error) {
            console.error('Error loading analytics:', error);
        }
    }

    renderCharts(data) {
        // Growth Chart
        const growthCtx = document.getElementById('growthChart')?.getContext('2d');
        if (growthCtx) {
            this.charts.growth = new Chart(growthCtx, {
                type: 'line',
                data: {
                    labels: data.growth.map(d => d.date),
                    datasets: [{
                        label: 'Total Projects',
                        data: data.growth.map(d => d.count),
                        borderColor: '#49EACB',
                        backgroundColor: 'rgba(73, 234, 203, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        }

        // Category Distribution Chart
        const categoryCtx = document.getElementById('categoryChart')?.getContext('2d');
        if (categoryCtx) {
            const categoryCounts = {};
            data.categories.forEach(p => {
                const cat = p.categories?.name || 'Other';
                categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
            });
            
            this.charts.category = new Chart(categoryCtx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(categoryCounts),
                    datasets: [{
                        data: Object.values(categoryCounts),
                        backgroundColor: [
                            '#49EACB', '#6366F1', '#2AC9A7', '#1E3A8A',
                            '#FFD700', '#DC2626', '#F59E0B', '#10B981'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
        }

        // Activity Heatmap
        const activityCtx = document.getElementById('activityChart')?.getContext('2d');
        if (activityCtx && data.github.length > 0) {
            this.charts.activity = new Chart(activityCtx, {
                type: 'bar',
                data: {
                    labels: data.github.map(p => p.title.substring(0, 15) + '...'),
                    datasets: [{
                        label: 'GitHub Stars',
                        data: data.github.map(p => p.github_stars),
                        backgroundColor: '#49EACB'
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        }

        // Rating Trends
        const ratingCtx = document.getElementById('ratingChart')?.getContext('2d');
        if (ratingCtx && data.ratings.length > 0) {
            this.charts.rating = new Chart(ratingCtx, {
                type: 'line',
                data: {
                    labels: data.ratings.map(d => d.week),
                    datasets: [{
                        label: 'Average Rating',
                        data: data.ratings.map(d => d.avg_rating),
                        borderColor: '#FFD700',
                        backgroundColor: 'rgba(255, 215, 0, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: { 
                            beginAtZero: true,
                            max: 5
                        }
                    }
                }
            });
        }
    }

    // 2. Notification System
    setupNotificationSystem() {
        // Load saved notifications from localStorage
        const savedNotifications = localStorage.getItem('kaspa_notifications');
        if (savedNotifications) {
            this.notifications = JSON.parse(savedNotifications);
            this.updateNotificationBadge();
        }
    }

    async checkNotifications() {
        if (!this.currentUser) return;
        
        try {
            // Check for new projects
            const { data: newProjects } = await supabaseClient
                .from('projects')
                .select('id, title, created_at')
                .eq('active', true)
                .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                .order('created_at', { ascending: false });
            
            if (newProjects && newProjects.length > 0) {
                newProjects.forEach(project => {
                    this.addNotification({
                        type: 'new_project',
                        title: 'New Project Added',
                        message: `${project.title} has been added to the ecosystem`,
                        timestamp: project.created_at,
                        projectId: project.id
                    });
                });
            }
            
            // Check for significant changes in followed projects
            if (this.currentUser) {
                const { data: followedProjects } = await supabaseClient
                    .from('user_follows')
                    .select('project_id')
                    .eq('user_id', this.currentUser.id);
                
                if (followedProjects) {
                    for (const follow of followedProjects) {
                        const { data: project } = await supabaseClient
                            .from('projects')
                            .select('title, github_stars, last_scraped_at')
                            .eq('id', follow.project_id)
                            .single();
                        
                        // Check for significant star increases
                        const lastStars = parseInt(localStorage.getItem(`stars_${follow.project_id}`) || '0');
                        if (project.github_stars > lastStars + 10) {
                            this.addNotification({
                                type: 'star_increase',
                                title: 'Project Milestone',
                                message: `${project.title} reached ${project.github_stars} GitHub stars!`,
                                timestamp: new Date().toISOString(),
                                projectId: follow.project_id
                            });
                            localStorage.setItem(`stars_${follow.project_id}`, project.github_stars.toString());
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error checking notifications:', error);
        }
    }

    addNotification(notification) {
        // Check if notification already exists
        const exists = this.notifications.find(n => 
            n.type === notification.type && 
            n.projectId === notification.projectId &&
            n.timestamp === notification.timestamp
        );
        
        if (!exists) {
            notification.id = Date.now().toString();
            notification.read = false;
            this.notifications.unshift(notification);
            
            // Keep only last 50 notifications
            this.notifications = this.notifications.slice(0, 50);
            
            // Save to localStorage
            localStorage.setItem('kaspa_notifications', JSON.stringify(this.notifications));
            
            // Update UI
            this.updateNotificationBadge();
            this.renderNotifications();
            
            // Show toast
            this.showToast(notification.message, 'info');
        }
    }

    updateNotificationBadge() {
        const unreadCount = this.notifications.filter(n => !n.read).length;
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            badge.textContent = unreadCount.toString();
            badge.style.display = unreadCount > 0 ? 'block' : 'none';
        }
    }

    renderNotifications() {
        const list = document.getElementById('notificationList');
        if (!list) return;
        
        if (this.notifications.length === 0) {
            list.innerHTML = '<p class="no-notifications">No notifications</p>';
            return;
        }
        
        list.innerHTML = this.notifications.map(notification => `
            <div class="notification-item ${notification.read ? 'read' : 'unread'}" 
                 onclick="app.handleNotificationClick('${notification.id}')">
                <div class="notification-icon">
                    ${this.getNotificationIcon(notification.type)}
                </div>
                <div class="notification-content">
                    <h4>${notification.title}</h4>
                    <p>${notification.message}</p>
                    <span class="notification-time">${this.formatRelativeTime(notification.timestamp)}</span>
                </div>
            </div>
        `).join('');
    }

    getNotificationIcon(type) {
        const icons = {
            new_project: '🆕',
            star_increase: '⭐',
            new_rating: '🌟',
            new_comment: '💬',
            update: '🔄'
        };
        return icons[type] || '🔔';
    }

    handleNotificationClick(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            this.updateNotificationBadge();
            localStorage.setItem('kaspa_notifications', JSON.stringify(this.notifications));
            
            // Navigate to project if applicable
            if (notification.projectId) {
                this.scrollToProject(notification.projectId);
            }
        }
    }

    toggleNotifications() {
        const center = document.getElementById('notificationCenter');
        center.classList.toggle('show');
        this.renderNotifications();
    }

    // 3. Realtime Subscriptions
    setupRealtimeSubscriptions() {
        // Subscribe to new projects
        supabaseClient
            .channel('projects_changes')
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'projects' },
                (payload) => {
                    this.handleNewProject(payload.new);
                }
            )
            .subscribe();
        
        // Subscribe to ratings changes
        supabaseClient
            .channel('ratings_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'project_ratings' },
                () => {
                    this.loadProjects(); // Reload to update averages
                }
            )
            .subscribe();
        
        // Subscribe to comments
        supabaseClient
            .channel('comments_changes')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'project_comments' },
                (payload) => {
                    this.handleNewComment(payload.new);
                }
            )
            .subscribe();
    }

    handleNewProject(project) {
        this.projects.unshift(project);
        this.renderProjects();
        this.updateStats();
        
        this.addNotification({
            type: 'new_project',
            title: 'New Project Added',
            message: `${project.title} has joined the ecosystem!`,
            timestamp: project.created_at,
            projectId: project.id
        });
    }

    handleNewComment(comment) {
        // Update comment count in UI
        const projectCard = document.querySelector(`[data-project-id="${comment.project_id}"]`);
        if (projectCard) {
            const commentCount = projectCard.querySelector('.comment-count');
            if (commentCount) {
                const current = parseInt(commentCount.textContent) || 0;
                commentCount.textContent = (current + 1).toString();
            }
        }
    }

    // 4. Wallet Connection
    async connectWallet() {
        this.showModal('walletModal');
    }

    async connectSpecificWallet(walletType) {
        try {
            let address = null;
            
            switch(walletType) {
                case 'kasware':
                    if (window.kasware) {
                        const accounts = await window.kasware.requestAccounts();
                        address = accounts[0];
                    } else {
                        this.showToast('Kasware wallet not found. Please install it first.', 'error');
                        window.open('https://kasware.xyz', '_blank');
                        return;
                    }
                    break;
                    
                case 'kastle':
                    if (window.kastle) {
                        const accounts = await window.kastle.connect();
                        address = accounts[0];
                    } else {
                        this.showToast('Kastle wallet not found. Please install it first.', 'error');
                        return;
                    }
                    break;
                    
                case 'kspr':
                    if (window.kspr) {
                        const result = await window.kspr.connect();
                        address = result.address;
                    } else {
                        this.showToast('KSPR wallet not found. Please install it first.', 'error');
                        return;
                    }
                    break;
            }
            
            if (address) {
                this.connectedWallet = address;
                
                // Create or update user profile in Supabase
                await this.authenticateWithWallet(address, walletType);
                
                this.closeModal('walletModal');
                this.showToast('Wallet connected successfully!', 'success');
            }
        } catch (error) {
            console.error('Wallet connection error:', error);
            this.showToast('Failed to connect wallet', 'error');
        }
    }

    async authenticateWithWallet(address, walletType) {
        try {
            // Sign a message to prove ownership
            const message = `Connect to Kaspa Ecosystem\nWallet: ${address}\nTimestamp: ${Date.now()}`;
            let signature;
            
            switch(walletType) {
                case 'kasware':
                    signature = await window.kasware.signMessage(message);
                    break;
                // Add other wallet signature methods
            }
            
            // Authenticate with Supabase using wallet
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: `${address.toLowerCase()}@kaspa.wallet`,
                password: signature || address // Use signature as password if available
            });
            
            if (error && error.message.includes('Invalid login')) {
                // User doesn't exist, create account
                const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({
                    email: `${address.toLowerCase()}@kaspa.wallet`,
                    password: signature || address,
                    options: {
                        data: {
                            wallet_address: address,
                            wallet_type: walletType
                        }
                    }
                });
                
                if (signUpError) throw signUpError;
            }
        } catch (error) {
            console.error('Wallet auth error:', error);
            // Fallback to anonymous connection
            this.updateWalletUI();
        }
    }

    async connectWithSupabase(provider) {
        try {
            const { error } = await supabaseClient.auth.signInWithOAuth({
                provider: provider,
                options: {
                    redirectTo: window.location.origin
                }
            });
            
            if (error) throw error;
            this.closeModal('walletModal');
        } catch (error) {
            console.error('OAuth error:', error);
            this.showToast(`Failed to connect with ${provider}`, 'error');
        }
    }

    async disconnectWallet() {
        this.connectedWallet = null;
        await supabaseClient.auth.signOut();
        this.updateWalletUI();
        this.showToast('Disconnected successfully', 'success');
    }

    updateWalletUI() {
        const walletBtn = document.querySelector('.wallet-btn');
        const walletConnected = document.querySelector('.wallet-connected');
        const walletAddress = document.querySelector('.wallet-address');
        
        if (this.connectedWallet || this.currentUser) {
            const displayAddress = this.connectedWallet || this.currentUser.email;
            walletBtn.style.display = 'none';
            walletConnected.style.display = 'flex';
            
            if (this.connectedWallet) {
                walletAddress.textContent = 
                    `${this.connectedWallet.substring(0, 6)}...${this.connectedWallet.substring(this.connectedWallet.length - 4)}`;
            } else {
                walletAddress.textContent = this.currentUser.email.split('@')[0];
            }
        } else {
            walletBtn.style.display = 'block';
            walletConnected.style.display = 'none';
        }
    }

    // Core functionality
    async handleAuthChange(event, session) {
        this.currentUser = session?.user || null;
        this.updateWalletUI();
        
        if (event === 'SIGNED_IN') {
            await this.loadProjects();
            await this.initializeAnalytics();
            this.setupNotificationSystem();
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
        const addProjectCategory = document.querySelector('select[name="category"]');
        
        const options = this.categories.map(cat => 
            `<option value="${cat.slug}">${cat.icon || ''} ${cat.name}</option>`
        ).join('');
        
        if (filter) {
            filter.innerHTML = '<option value="">All Categories</option>' + options;
        }
        
        if (addProjectCategory) {
            addProjectCategory.innerHTML = '<option value="">Select Category</option>' + options;
        }
    }

    renderProjects() {
        const grid = document.getElementById('projects');
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter').value;
        const ratingFilter = document.getElementById('ratingFilter').value;
        const sortFilter = document.getElementById('sortFilter').value;
        
        let filteredProjects = this.projects.filter(project => {
            const matchesSearch = project.title.toLowerCase().includes(searchTerm) || 
                                project.description?.toLowerCase().includes(searchTerm);
            const matchesCategory = !categoryFilter || project.categories?.slug === categoryFilter;
            
            let matchesRating = true;
            if (ratingFilter) {
                const avgRating = this.getAverageRating(project);
                if (ratingFilter === 'warn') {
                    matchesRating = avgRating < 2 && project.project_ratings?.length > 5;
                } else {
                    matchesRating = avgRating >= parseInt(ratingFilter);
                }
            }
            
            return matchesSearch && matchesCategory && matchesRating;
        });
        
        // Sort projects
        filteredProjects.sort((a, b) => {
            switch(sortFilter) {
                case 'rating':
                    return this.getAverageRating(b) - this.getAverageRating(a);
                case 'recent':
                    return new Date(b.created_at) - new Date(a.created_at);
                case 'active':
                    return (b.github_stars || 0) - (a.github_stars || 0);
                default: // featured
                    return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
            }
        });
        
        grid.innerHTML = filteredProjects.map(project => this.renderProjectCard(project)).join('');
    }

    renderProjectCard(project) {
        const avgRating = this.getAverageRating(project);
        const ratingCount = project.project_ratings?.length || 0;
        const commentCount = project.project_comments?.length || 0;
        
        return `
            <div class="project-card" data-project-id="${project.id}">
                ${project.featured ? '<div class="featured-badge">🌟 Featured</div>' : ''}
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
                    ${avgRating < 2 && ratingCount > 5 ? '<div class="scam-warning show">⚠️ Community Warning</div>' : ''}
                    <div class="project-actions">
                        <button class="rate-btn" onclick="app.showRatingModal('${project.id}', '${project.title.replace(/'/g, "\\'")}')">Rate</button>
                        ${this.currentUser ? `
                            <button class="follow-btn ${this.isFollowing(project.id) ? 'following' : ''}" 
                                    onclick="app.toggleFollow('${project.id}')">
                                ${this.isFollowing(project.id) ? '✓ Following' : '+ Follow'}
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    isFollowing(projectId) {
        // Check localStorage for now, implement proper DB check later
        const follows = JSON.parse(localStorage.getItem('following_projects') || '[]');
        return follows.includes(projectId);
    }

    async toggleFollow(projectId) {
        if (!this.currentUser) {
            this.showToast('Please connect wallet to follow projects', 'error');
            return;
        }
        
        const follows = JSON.parse(localStorage.getItem('following_projects') || '[]');
        const index = follows.indexOf(projectId);
        
        if (index > -1) {
            follows.splice(index, 1);
        } else {
            follows.push(projectId);
        }
        
        localStorage.setItem('following_projects', JSON.stringify(follows));
        this.renderProjects();
        
        // Save to database
        try {
            if (index > -1) {
                await supabaseClient
                    .from('user_follows')
                    .delete()
                    .eq('user_id', this.currentUser.id)
                    .eq('project_id', projectId);
            } else {
                await supabaseClient
                    .from('user_follows')
                    .insert({ 
                        user_id: this.currentUser.id, 
                        project_id: projectId 
                    });
            }
        } catch (error) {
            console.error('Error updating follow status:', error);
        }
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

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'k';
        }
        return num.toString();
    }

    formatRelativeTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
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

    async showRatingModal(projectId, projectName) {
        if (!this.currentUser && !this.connectedWallet) {
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
        if (this.currentUser) {
            const { data: existingRating } = await supabaseClient
                .from('project_ratings')
                .select('rating')
                .eq('project_id', projectId)
                .eq('user_id', this.currentUser.id)
                .single();
            
            if (existingRating) {
                this.setRating(existingRating.rating);
            }
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
        
        if (!this.currentUser) {
            this.showToast('Please sign in to submit rating', 'error');
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
        
        if (!this.currentUser && !this.connectedWallet) {
            this.showToast('Please connect your wallet to submit projects', 'error');
            return;
        }
        
        const formData = new FormData(event.target);
        
        try {
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
        document.getElementById('sortFilter')?.addEventListener('change', () => this.renderProjects());
        
        // Make methods available globally
        window.app = this;
    }

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

    scrollToProject(projectId) {
        const projectCard = document.querySelector(`[data-project-id="${projectId}"]`);
        if (projectCard) {
            projectCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            projectCard.classList.add('highlight');
            setTimeout(() => projectCard.classList.remove('highlight'), 2000);
        }
    }
}

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new KaspaEcosystemApp();
});

// Global functions for onclick handlers
function connectWallet() { app.connectWallet(); }
function disconnectWallet() { app.disconnectWallet(); }
function connectSpecificWallet(type) { app.connectSpecificWallet(type); }
function connectWithSupabase(provider) { app.connectWithSupabase(provider); }
function moveCarousel(direction) { app.moveCarousel(direction); }
function closeModal(modalId) { app.closeModal(modalId); }
function showAddProjectModal() { app.showAddProjectModal(); }
function submitProject(event) { app.submitProject(event); }
function previewLogo(event) { app.previewLogo(event); }
function setRating(rating) { app.setRating(rating); }
function submitRating() { app.submitRating(); }
function showAdminLogin() { window.open('https://supabase.com/dashboard/project/kxdngctxlxrbjhdtztuu', '_blank'); }
function toggleNotifications() { app.toggleNotifications(); }

// API Functions for external access
window.KaspaEcosystemAPI = {
    getProjects: async (filters = {}) => {
        const { data, error } = await supabaseClient
            .from('projects')
            .select('*')
            .match(filters);
        return { data, error };
    },
    
    getProject: async (id) => {
        const { data, error } = await supabaseClient
            .from('projects')
            .select('*, categories(*), project_ratings(*), project_comments(*)')
            .eq('id', id)
            .single();
        return { data, error };
    },
    
    getCategories: async () => {
        const { data, error } = await supabaseClient
            .from('categories')
            .select('*');
        return { data, error };
    },
    
    subscribeToProjects: (callback) => {
        return supabaseClient
            .channel('api_projects')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'projects' },
                callback
            )
            .subscribe();
    }
};
