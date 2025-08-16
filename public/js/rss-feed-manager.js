// RSS Feed Manager for Kaspa Ecosystem
// Provides RSS feed discovery and subscription management

const RSSFeedManager = {
    // Available feeds
    feeds: {
        main: {
            title: 'All Projects',
            description: 'Complete feed of all projects in the Kaspa ecosystem',
            url: '/api/rss-feeds',
            icon: 'fas fa-list'
        },
        trending: {
            title: 'Trending Projects',
            description: 'Most trending and active projects',
            url: '/api/rss-feeds/trending',
            icon: 'fas fa-fire'
        },
        new: {
            title: 'New Projects',
            description: 'Recently added projects',
            url: '/api/rss-feeds/new-projects',
            icon: 'fas fa-plus'
        },
        updates: {
            title: 'Project Updates',
            description: 'Recent project activity and updates',
            url: '/api/rss-feeds/updates',
            icon: 'fas fa-sync'
        }
    },

    // Feed formats
    formats: {
        rss: { name: 'RSS 2.0', extension: 'rss', mime: 'application/rss+xml' },
        atom: { name: 'Atom 1.0', extension: 'atom', mime: 'application/atom+xml' },
        json: { name: 'JSON Feed', extension: 'json', mime: 'application/feed+json' }
    },

    // Initialize RSS feed manager
    init: function() {
        this.addFeedDiscoveryLinks();
        this.createFeedSubscriptionUI();
        this.setupEventListeners();
        this.addStyles();
    },

    // Add feed discovery links to document head
    addFeedDiscoveryLinks: function() {
        const baseUrl = window.location.origin;
        
        // Add main feeds to document head for auto-discovery
        Object.entries(this.feeds).forEach(([key, feed]) => {
            Object.entries(this.formats).forEach(([format, formatInfo]) => {
                const link = document.createElement('link');
                link.rel = 'alternate';
                link.type = formatInfo.mime;
                link.href = `${baseUrl}${feed.url}?format=${format}`;
                link.title = `${feed.title} (${formatInfo.name})`;
                document.head.appendChild(link);
            });
        });
    },

    // Create feed subscription UI
    createFeedSubscriptionUI: function() {
        // Check if UI already exists
        if (document.getElementById('rss-feeds-container')) return;

        const container = document.createElement('div');
        container.id = 'rss-feeds-container';
        container.className = 'rss-feeds-container hidden';
        
        container.innerHTML = `
            <div class="rss-modal-overlay" onclick="RSSFeedManager.hideFeedsModal()">
                <div class="rss-modal-content" onclick="event.stopPropagation()">
                    <div class="rss-modal-header">
                        <h2><i class="fas fa-rss"></i> RSS Feeds</h2>
                        <button onclick="RSSFeedManager.hideFeedsModal()" class="modal-close">&times;</button>
                    </div>
                    
                    <div class="rss-modal-body">
                        <p class="rss-description">
                            Subscribe to RSS feeds to stay updated with the latest projects and activity in the Kaspa ecosystem.
                        </p>
                        
                        <div class="feeds-grid">
                            ${Object.entries(this.feeds).map(([key, feed]) => `
                                <div class="feed-card">
                                    <div class="feed-header">
                                        <i class="${feed.icon}"></i>
                                        <h3>${feed.title}</h3>
                                    </div>
                                    <p class="feed-description">${feed.description}</p>
                                    <div class="feed-formats">
                                        ${Object.entries(this.formats).map(([format, formatInfo]) => `
                                            <a href="${feed.url}?format=${format}" 
                                               class="feed-format-link" 
                                               title="Subscribe to ${feed.title} (${formatInfo.name})"
                                               target="_blank">
                                                <i class="fas fa-rss"></i> ${formatInfo.name}
                                            </a>
                                        `).join('')}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div class="category-feeds-section">
                            <h3><i class="fas fa-folder"></i> Category Feeds</h3>
                            <div id="category-feeds-grid" class="category-feeds-grid">
                                <div class="loading">Loading categories...</div>
                            </div>
                        </div>
                        
                        <div class="feed-help-section">
                            <h3><i class="fas fa-question-circle"></i> How to Subscribe</h3>
                            <div class="help-content">
                                <div class="help-item">
                                    <h4>RSS Readers</h4>
                                    <p>Copy any feed URL above and add it to your favorite RSS reader like Feedly, Inoreader, or NewsBlur.</p>
                                </div>
                                <div class="help-item">
                                    <h4>Browser Bookmarks</h4>
                                    <p>Most modern browsers can bookmark RSS feeds and notify you of updates.</p>
                                </div>
                                <div class="help-item">
                                    <h4>Development Tools</h4>
                                    <p>Integrate feeds into your applications using our JSON Feed format for easy parsing.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(container);
        
        // Load category feeds
        this.loadCategoryFeeds();
    },

    // Load category feeds dynamically
    loadCategoryFeeds: async function() {
        try {
            const response = await fetch('/.netlify/functions/enhanced-projects-api/categories');
            if (!response.ok) throw new Error('Failed to load categories');
            
            const data = await response.json();
            const container = document.getElementById('category-feeds-grid');
            
            if (container) {
                container.innerHTML = data.categories.map(category => `
                    <div class="category-feed-item">
                        <div class="category-header">
                            <span class="category-icon">${category.icon}</span>
                            <span class="category-name">${category.name}</span>
                            <span class="category-count">(${category.project_count})</span>
                        </div>
                        <div class="category-feed-links">
                            ${Object.entries(this.formats).map(([format, formatInfo]) => `
                                <a href="/api/rss-feeds/category?category=${category.slug}&format=${format}" 
                                   class="category-feed-link" 
                                   title="${category.name} ${formatInfo.name} Feed"
                                   target="_blank">
                                    ${formatInfo.name}
                                </a>
                            `).join('')}
                        </div>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Error loading category feeds:', error);
            const container = document.getElementById('category-feeds-grid');
            if (container) {
                container.innerHTML = '<div class="error">Failed to load category feeds</div>';
            }
        }
    },

    // Show feeds modal
    showFeedsModal: function() {
        const container = document.getElementById('rss-feeds-container');
        if (container) {
            container.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    },

    // Hide feeds modal
    hideFeedsModal: function() {
        const container = document.getElementById('rss-feeds-container');
        if (container) {
            container.classList.add('hidden');
            document.body.style.overflow = '';
        }
    },

    // Create RSS button for navigation
    createRSSButton: function() {
        const button = document.createElement('button');
        button.className = 'rss-button';
        button.innerHTML = '<i class="fas fa-rss"></i> <span>RSS</span>';
        button.title = 'Subscribe to RSS feeds';
        button.onclick = () => this.showFeedsModal();
        
        // Add to navigation
        const nav = document.querySelector('.nav-actions') || 
                   document.querySelector('.navbar') || 
                   document.querySelector('nav');
        
        if (nav) {
            nav.appendChild(button);
        }
        
        return button;
    },

    // Generate feed URL with parameters
    generateFeedUrl: function(feedKey, options = {}) {
        const feed = this.feeds[feedKey];
        if (!feed) return null;
        
        const params = new URLSearchParams();
        
        if (options.format) params.set('format', options.format);
        if (options.limit) params.set('limit', options.limit);
        if (options.category) params.set('category', options.category);
        if (options.days) params.set('days', options.days);
        
        const queryString = params.toString();
        return `${window.location.origin}${feed.url}${queryString ? '?' + queryString : ''}`;
    },

    // Copy feed URL to clipboard
    copyFeedUrl: function(feedKey, format = 'rss') {
        const url = this.generateFeedUrl(feedKey, { format });
        if (!url) return;
        
        navigator.clipboard.writeText(url).then(() => {
            this.showToast('Feed URL copied to clipboard!', 'success');
        }).catch(() => {
            this.showToast('Failed to copy URL', 'error');
        });
    },

    // Setup event listeners
    setupEventListeners: function() {
        // Listen for feed subscription requests
        document.addEventListener('click', (e) => {
            if (e.target.closest('.rss-trigger')) {
                e.preventDefault();
                this.showFeedsModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Alt + R to open RSS feeds
            if (e.altKey && e.key === 'r') {
                e.preventDefault();
                this.showFeedsModal();
            }
            
            // Escape to close modal
            if (e.key === 'Escape') {
                this.hideFeedsModal();
            }
        });
    },

    // Add RSS feed button to project cards
    addProjectFeedButton: function(projectElement, project) {
        const button = document.createElement('button');
        button.className = 'project-rss-button';
        button.innerHTML = '<i class="fas fa-rss"></i>';
        button.title = 'Project RSS feed';
        button.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showProjectFeedOptions(project);
        };
        
        projectElement.appendChild(button);
    },

    // Show project-specific feed options
    showProjectFeedOptions: function(project) {
        const modal = document.createElement('div');
        modal.className = 'project-feed-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <h3><i class="fas fa-rss"></i> ${project.title} Feeds</h3>
                    <div class="project-feed-options">
                        <div class="feed-option">
                            <strong>Category Feed</strong>
                            <p>All projects in ${project.category_name}</p>
                            <div class="feed-links">
                                ${Object.entries(this.formats).map(([format, formatInfo]) => `
                                    <a href="/api/rss-feeds/category?category=${project.category_slug}&format=${format}" target="_blank">
                                        ${formatInfo.name}
                                    </a>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    <button onclick="this.closest('.project-feed-modal').remove()" class="btn btn-secondary">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    },

    // Add RSS meta tags for SEO
    addMetaTags: function() {
        // Add RSS meta tag
        const rssMetaTag = document.createElement('meta');
        rssMetaTag.name = 'application-name';
        rssMetaTag.content = 'Kaspa Ecosystem RSS Feeds';
        document.head.appendChild(rssMetaTag);
        
        // Add feed discovery tags
        const feedMeta = document.createElement('meta');
        feedMeta.name = 'feed';
        feedMeta.content = `${window.location.origin}/api/rss-feeds`;
        document.head.appendChild(feedMeta);
    },

    // Validate feed URL
    validateFeedUrl: async function(url) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            return false;
        }
    },

    // Add CSS styles
    addStyles: function() {
        if (document.getElementById('rss-feed-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'rss-feed-styles';
        styles.textContent = `
            .rss-button {
                display: flex;
                align-items: center;
                gap: 6px;
                background: var(--theme-secondary);
                border: 1px solid var(--theme-border);
                color: var(--theme-text);
                padding: 8px 12px;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.3s ease;
                text-decoration: none;
            }
            
            .rss-button:hover {
                background: #FF8C00;
                color: white;
                border-color: #FF8C00;
                transform: translateY(-1px);
            }
            
            .rss-feeds-container {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.8);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                transition: opacity 0.3s ease;
            }
            
            .rss-feeds-container.hidden {
                opacity: 0;
                pointer-events: none;
            }
            
            .rss-modal-content {
                background: var(--theme-primary);
                border-radius: 12px;
                max-width: 900px;
                width: 100%;
                max-height: 90vh;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                border: 1px solid var(--theme-border);
            }
            
            .rss-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 1px solid var(--theme-border);
                background: var(--theme-secondary);
            }
            
            .rss-modal-header h2 {
                margin: 0;
                color: var(--theme-text);
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .rss-modal-header h2 i {
                color: #FF8C00;
            }
            
            .modal-close {
                background: none;
                border: none;
                color: var(--theme-text);
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s ease;
            }
            
            .modal-close:hover {
                background: var(--theme-hover);
            }
            
            .rss-modal-body {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
            }
            
            .rss-description {
                color: var(--theme-text-secondary);
                margin-bottom: 30px;
                text-align: center;
                font-size: 1.1rem;
            }
            
            .feeds-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
                margin-bottom: 40px;
            }
            
            .feed-card {
                background: var(--theme-card);
                border: 1px solid var(--theme-border);
                border-radius: 8px;
                padding: 20px;
                transition: transform 0.2s ease;
            }
            
            .feed-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            
            .feed-header {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 10px;
            }
            
            .feed-header i {
                color: #FF8C00;
                font-size: 1.2rem;
            }
            
            .feed-header h3 {
                margin: 0;
                color: var(--theme-text);
                font-size: 1.1rem;
            }
            
            .feed-description {
                color: var(--theme-text-secondary);
                margin-bottom: 15px;
                line-height: 1.5;
            }
            
            .feed-formats {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }
            
            .feed-format-link {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 6px 10px;
                background: #FF8C00;
                color: white;
                text-decoration: none;
                border-radius: 4px;
                font-size: 0.875rem;
                font-weight: 500;
                transition: background 0.2s ease;
            }
            
            .feed-format-link:hover {
                background: #FF7700;
                color: white;
            }
            
            .category-feeds-section {
                margin-bottom: 40px;
            }
            
            .category-feeds-section h3 {
                color: var(--theme-text);
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .category-feeds-section h3 i {
                color: var(--theme-accent);
            }
            
            .category-feeds-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: 15px;
            }
            
            .category-feed-item {
                background: var(--theme-card);
                border: 1px solid var(--theme-border);
                border-radius: 6px;
                padding: 15px;
            }
            
            .category-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 10px;
            }
            
            .category-icon {
                font-size: 1.1rem;
            }
            
            .category-name {
                font-weight: 500;
                color: var(--theme-text);
            }
            
            .category-count {
                color: var(--theme-text-secondary);
                font-size: 0.875rem;
            }
            
            .category-feed-links {
                display: flex;
                gap: 6px;
                flex-wrap: wrap;
            }
            
            .category-feed-link {
                padding: 4px 8px;
                background: var(--theme-secondary);
                color: var(--theme-text);
                text-decoration: none;
                border-radius: 3px;
                font-size: 0.75rem;
                border: 1px solid var(--theme-border);
                transition: all 0.2s ease;
            }
            
            .category-feed-link:hover {
                background: #FF8C00;
                color: white;
                border-color: #FF8C00;
            }
            
            .feed-help-section h3 {
                color: var(--theme-text);
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .feed-help-section h3 i {
                color: var(--theme-accent);
            }
            
            .help-content {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
            }
            
            .help-item {
                background: var(--theme-card);
                border: 1px solid var(--theme-border);
                border-radius: 6px;
                padding: 15px;
            }
            
            .help-item h4 {
                margin: 0 0 10px 0;
                color: var(--theme-text);
                font-size: 1rem;
            }
            
            .help-item p {
                margin: 0;
                color: var(--theme-text-secondary);
                line-height: 1.5;
                font-size: 0.875rem;
            }
            
            .project-rss-button {
                position: absolute;
                top: 8px;
                right: 40px;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                border: 1px solid var(--theme-border);
                background: var(--theme-card);
                color: #FF8C00;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.75rem;
                transition: all 0.2s ease;
                z-index: 10;
            }
            
            .project-rss-button:hover {
                background: #FF8C00;
                color: white;
                transform: scale(1.1);
            }
            
            .loading, .error {
                text-align: center;
                color: var(--theme-text-secondary);
                padding: 20px;
                font-style: italic;
            }
            
            .error {
                color: #EF4444;
            }
            
            @media (max-width: 768px) {
                .rss-modal-content {
                    margin: 10px;
                    max-width: calc(100vw - 20px);
                }
                
                .feeds-grid {
                    grid-template-columns: 1fr;
                }
                
                .category-feeds-grid {
                    grid-template-columns: 1fr;
                }
                
                .help-content {
                    grid-template-columns: 1fr;
                }
                
                .rss-button span {
                    display: none;
                }
            }
        `;
        
        document.head.appendChild(styles);
    },

    // Show toast notification
    showToast: function(message, type = 'info') {
        if (typeof showToast === 'function') {
            showToast(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        RSSFeedManager.init();
        RSSFeedManager.createRSSButton();
        RSSFeedManager.addMetaTags();
    });
} else {
    RSSFeedManager.init();
    RSSFeedManager.createRSSButton();
    RSSFeedManager.addMetaTags();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RSSFeedManager;
}