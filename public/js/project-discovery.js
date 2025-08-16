// Advanced Project Discovery System for Kaspa Ecosystem
// Provides AI-powered recommendations, trending algorithms, and enhanced discovery

const ProjectDiscovery = {
    // Discovery algorithms and weights
    algorithms: {
        trending: {
            weights: {
                github_activity: 0.3,
                community_engagement: 0.25,
                rating_momentum: 0.2,
                recency: 0.15,
                view_velocity: 0.1
            }
        },
        recommendation: {
            weights: {
                category_similarity: 0.3,
                rating_alignment: 0.25,
                user_behavior: 0.2,
                social_signals: 0.15,
                freshness: 0.1
            }
        }
    },

    // User interaction tracking
    userInteractions: {
        views: new Map(),
        ratings: new Map(),
        searches: [],
        categoryPreferences: new Map(),
        timeSpent: new Map()
    },

    // Cache for computed scores
    cache: {
        trending: null,
        recommendations: null,
        lastUpdate: null,
        ttl: 5 * 60 * 1000 // 5 minutes
    },

    // Initialize the discovery system
    init: function() {
        this.loadUserInteractions();
        this.setupEventListeners();
        this.startPeriodicUpdates();
        this.createDiscoveryUI();
    },

    // Load user interactions from localStorage
    loadUserInteractions: function() {
        try {
            const stored = localStorage.getItem('kaspa-user-interactions');
            if (stored) {
                const data = JSON.parse(stored);
                this.userInteractions.views = new Map(data.views || []);
                this.userInteractions.ratings = new Map(data.ratings || []);
                this.userInteractions.searches = data.searches || [];
                this.userInteractions.categoryPreferences = new Map(data.categoryPreferences || []);
                this.userInteractions.timeSpent = new Map(data.timeSpent || []);
            }
        } catch (error) {
            console.warn('Failed to load user interactions:', error);
        }
    },

    // Save user interactions to localStorage
    saveUserInteractions: function() {
        try {
            const data = {
                views: Array.from(this.userInteractions.views.entries()),
                ratings: Array.from(this.userInteractions.ratings.entries()),
                searches: this.userInteractions.searches.slice(-50), // Keep last 50 searches
                categoryPreferences: Array.from(this.userInteractions.categoryPreferences.entries()),
                timeSpent: Array.from(this.userInteractions.timeSpent.entries())
            };
            localStorage.setItem('kaspa-user-interactions', JSON.stringify(data));
        } catch (error) {
            console.warn('Failed to save user interactions:', error);
        }
    },

    // Track user interactions
    trackInteraction: function(type, projectId, data = {}) {
        const timestamp = Date.now();
        
        switch (type) {
            case 'view':
                const views = this.userInteractions.views.get(projectId) || [];
                views.push(timestamp);
                this.userInteractions.views.set(projectId, views.slice(-10)); // Keep last 10 views
                break;

            case 'rating':
                this.userInteractions.ratings.set(projectId, {
                    rating: data.rating,
                    timestamp: timestamp
                });
                break;

            case 'search':
                this.userInteractions.searches.push({
                    query: data.query,
                    timestamp: timestamp
                });
                break;

            case 'category':
                const categoryCount = this.userInteractions.categoryPreferences.get(data.category) || 0;
                this.userInteractions.categoryPreferences.set(data.category, categoryCount + 1);
                break;

            case 'timeSpent':
                const currentTime = this.userInteractions.timeSpent.get(projectId) || 0;
                this.userInteractions.timeSpent.set(projectId, currentTime + data.duration);
                break;
        }

        this.saveUserInteractions();
        this.invalidateCache();
    },

    // Calculate trending projects
    calculateTrendingProjects: async function(projects, limit = 10) {
        if (this.isCacheValid('trending')) {
            return this.cache.trending;
        }

        const weights = this.algorithms.trending.weights;
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;

        const scoredProjects = projects.map(project => {
            let score = 0;

            // GitHub Activity Score (0-1)
            const githubScore = this.calculateGitHubActivityScore(project);
            score += githubScore * weights.github_activity;

            // Community Engagement Score (0-1)
            const engagementScore = this.calculateEngagementScore(project);
            score += engagementScore * weights.community_engagement;

            // Rating Momentum Score (0-1)
            const ratingMomentumScore = this.calculateRatingMomentumScore(project);
            score += ratingMomentumScore * weights.rating_momentum;

            // Recency Score (0-1) - newer projects get higher scores
            const daysSinceCreated = (now - new Date(project.created_at).getTime()) / dayMs;
            const recencyScore = Math.max(0, 1 - (daysSinceCreated / 90)); // Decay over 90 days
            score += recencyScore * weights.recency;

            // View Velocity Score (0-1)
            const viewVelocityScore = this.calculateViewVelocityScore(project);
            score += viewVelocityScore * weights.view_velocity;

            return {
                ...project,
                trendingScore: score,
                scoreBreakdown: {
                    github: githubScore,
                    engagement: engagementScore,
                    ratingMomentum: ratingMomentumScore,
                    recency: recencyScore,
                    viewVelocity: viewVelocityScore
                }
            };
        });

        const trending = scoredProjects
            .sort((a, b) => b.trendingScore - a.trendingScore)
            .slice(0, limit);

        this.cache.trending = trending;
        this.cache.lastUpdate = now;

        return trending;
    },

    // Calculate personalized recommendations
    calculateRecommendations: async function(projects, userWallet = null, limit = 10) {
        if (this.isCacheValid('recommendations')) {
            return this.cache.recommendations;
        }

        const weights = this.algorithms.recommendation.weights;
        const userPreferences = this.analyzeUserPreferences();

        const scoredProjects = projects.map(project => {
            let score = 0;

            // Category Similarity Score (0-1)
            const categorySimilarityScore = this.calculateCategorySimilarityScore(project, userPreferences);
            score += categorySimilarityScore * weights.category_similarity;

            // Rating Alignment Score (0-1)
            const ratingAlignmentScore = this.calculateRatingAlignmentScore(project, userPreferences);
            score += ratingAlignmentScore * weights.rating_alignment;

            // User Behavior Score (0-1)
            const userBehaviorScore = this.calculateUserBehaviorScore(project, userPreferences);
            score += userBehaviorScore * weights.user_behavior;

            // Social Signals Score (0-1)
            const socialSignalsScore = this.calculateSocialSignalsScore(project);
            score += socialSignalsScore * weights.social_signals;

            // Freshness Score (0-1) - avoid showing same projects repeatedly
            const freshnessScore = this.calculateFreshnessScore(project);
            score += freshnessScore * weights.freshness;

            return {
                ...project,
                recommendationScore: score,
                scoreBreakdown: {
                    categorySimilarity: categorySimilarityScore,
                    ratingAlignment: ratingAlignmentScore,
                    userBehavior: userBehaviorScore,
                    socialSignals: socialSignalsScore,
                    freshness: freshnessScore
                }
            };
        });

        const recommendations = scoredProjects
            .sort((a, b) => b.recommendationScore - a.recommendationScore)
            .slice(0, limit);

        this.cache.recommendations = recommendations;
        this.cache.lastUpdate = Date.now();

        return recommendations;
    },

    // Calculate GitHub activity score
    calculateGitHubActivityScore: function(project) {
        if (!project.github_pushed_at) return 0;

        const daysSinceUpdate = (Date.now() - new Date(project.github_pushed_at).getTime()) / (24 * 60 * 60 * 1000);
        const stars = project.github_stars || 0;
        const commits = project.github_commits || 0;

        // Recent activity (last 30 days gets full score)
        const activityScore = Math.max(0, 1 - (daysSinceUpdate / 30));
        
        // Star score (logarithmic scale)
        const starScore = Math.min(1, Math.log10(stars + 1) / 4);
        
        // Commit score (relative)
        const commitScore = Math.min(1, commits / 100);

        return (activityScore * 0.5 + starScore * 0.3 + commitScore * 0.2);
    },

    // Calculate community engagement score
    calculateEngagementScore: function(project) {
        const ratings = project.rating_count || 0;
        const comments = project.comment_count || 0;
        const avgRating = project.average_rating || 0;

        // Rating participation (logarithmic scale)
        const ratingParticipation = Math.min(1, Math.log10(ratings + 1) / 2);
        
        // Comment activity
        const commentActivity = Math.min(1, comments / 20);
        
        // Quality score based on average rating
        const qualityScore = avgRating / 5;

        return (ratingParticipation * 0.4 + commentActivity * 0.3 + qualityScore * 0.3);
    },

    // Calculate rating momentum score
    calculateRatingMomentumScore: function(project) {
        // This would ideally use recent ratings, but for now use rating count growth
        const ratingCount = project.rating_count || 0;
        const avgRating = project.average_rating || 0;
        
        if (ratingCount === 0) return 0;

        // Recent rating activity (simulated)
        const recentActivity = Math.min(1, ratingCount / 10);
        
        // Rating quality momentum
        const qualityMomentum = avgRating >= 4 ? 1 : avgRating / 4;

        return (recentActivity * 0.6 + qualityMomentum * 0.4);
    },

    // Calculate view velocity score
    calculateViewVelocityScore: function(project) {
        const views = project.views || 0;
        const daysSinceCreated = (Date.now() - new Date(project.created_at).getTime()) / (24 * 60 * 60 * 1000);
        
        if (daysSinceCreated === 0) return 0;

        const viewsPerDay = views / Math.max(1, daysSinceCreated);
        return Math.min(1, viewsPerDay / 10); // Normalize to 10 views per day = max score
    },

    // Analyze user preferences from interactions
    analyzeUserPreferences: function() {
        const preferences = {
            categories: this.getTopCategories(),
            ratingPatterns: this.getRatingPatterns(),
            searchPatterns: this.getSearchPatterns(),
            viewingBehavior: this.getViewingBehavior()
        };

        return preferences;
    },

    // Get user's top categories
    getTopCategories: function() {
        const categories = Array.from(this.userInteractions.categoryPreferences.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([category, count]) => ({ category, weight: count }));

        return categories;
    },

    // Get user's rating patterns
    getRatingPatterns: function() {
        const ratings = Array.from(this.userInteractions.ratings.values());
        if (ratings.length === 0) return { averageRating: 3, consistency: 0 };

        const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
        const average = sum / ratings.length;
        
        // Calculate consistency (how much ratings vary)
        const variance = ratings.reduce((acc, r) => acc + Math.pow(r.rating - average, 2), 0) / ratings.length;
        const consistency = 1 - Math.min(1, variance / 4); // Normalize variance

        return { averageRating: average, consistency };
    },

    // Get user's search patterns
    getSearchPatterns: function() {
        const recentSearches = this.userInteractions.searches.slice(-20);
        const keywords = recentSearches.map(s => s.query.toLowerCase().split(' ')).flat();
        const keywordFreq = keywords.reduce((acc, keyword) => {
            acc[keyword] = (acc[keyword] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(keywordFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([keyword, freq]) => ({ keyword, frequency: freq }));
    },

    // Get user's viewing behavior
    getViewingBehavior: function() {
        const viewCounts = Array.from(this.userInteractions.views.values()).map(views => views.length);
        const timeSpent = Array.from(this.userInteractions.timeSpent.values());

        return {
            averageViews: viewCounts.length > 0 ? viewCounts.reduce((a, b) => a + b, 0) / viewCounts.length : 0,
            averageTimeSpent: timeSpent.length > 0 ? timeSpent.reduce((a, b) => a + b, 0) / timeSpent.length : 0,
            explorationTendency: viewCounts.filter(count => count === 1).length / Math.max(1, viewCounts.length)
        };
    },

    // Calculate category similarity score
    calculateCategorySimilarityScore: function(project, userPreferences) {
        const userCategories = userPreferences.categories;
        if (userCategories.length === 0) return 0.5; // Neutral score if no preferences

        const projectCategory = project.category_name || project.category;
        const categoryMatch = userCategories.find(c => c.category === projectCategory);
        
        if (categoryMatch) {
            const totalWeight = userCategories.reduce((sum, c) => sum + c.weight, 0);
            return categoryMatch.weight / totalWeight;
        }

        return 0.1; // Low score for unpreferred categories
    },

    // Calculate rating alignment score
    calculateRatingAlignmentScore: function(project, userPreferences) {
        const projectRating = project.average_rating || 0;
        const userAverageRating = userPreferences.ratingPatterns.averageRating;
        const consistency = userPreferences.ratingPatterns.consistency;

        if (projectRating === 0) return 0.3; // Neutral for unrated projects

        // Score based on how close project rating is to user's typical rating
        const ratingDifference = Math.abs(projectRating - userAverageRating);
        const alignmentScore = Math.max(0, 1 - (ratingDifference / 5));

        // Weight by user's rating consistency
        return alignmentScore * (0.5 + consistency * 0.5);
    },

    // Calculate user behavior score
    calculateUserBehaviorScore: function(project, userPreferences) {
        const projectId = project.id;
        const hasViewed = this.userInteractions.views.has(projectId);
        const hasRated = this.userInteractions.ratings.has(projectId);
        const timeSpent = this.userInteractions.timeSpent.get(projectId) || 0;

        if (hasViewed && hasRated) return 0.2; // Lower score for already interacted

        // Search keyword relevance
        const keywords = userPreferences.searchPatterns;
        const projectText = `${project.name} ${project.description || ''} ${project.category || ''}`.toLowerCase();
        const keywordRelevance = keywords.reduce((score, kw) => {
            return score + (projectText.includes(kw.keyword) ? kw.frequency : 0);
        }, 0);

        const relevanceScore = Math.min(1, keywordRelevance / 10);
        const explorationBonus = userPreferences.viewingBehavior.explorationTendency;

        return relevanceScore * 0.7 + explorationBonus * 0.3;
    },

    // Calculate social signals score
    calculateSocialSignalsScore: function(project) {
        const views = project.views || 0;
        const ratings = project.rating_count || 0;
        const comments = project.comment_count || 0;
        const githubStars = project.github_stars || 0;

        // Normalize each signal
        const viewsScore = Math.min(1, views / 1000);
        const ratingsScore = Math.min(1, ratings / 50);
        const commentsScore = Math.min(1, comments / 20);
        const starsScore = Math.min(1, githubStars / 100);

        return (viewsScore * 0.3 + ratingsScore * 0.3 + commentsScore * 0.2 + starsScore * 0.2);
    },

    // Calculate freshness score (avoid showing same projects)
    calculateFreshnessScore: function(project) {
        const projectId = project.id;
        const viewHistory = this.userInteractions.views.get(projectId);
        const lastViewed = this.userInteractions.timeSpent.get(projectId);

        if (!viewHistory) return 1; // Full freshness for unviewed projects

        const daysSinceLastView = (Date.now() - Math.max(...viewHistory)) / (24 * 60 * 60 * 1000);
        const viewFrequency = viewHistory.length;

        // Reduce score based on recent views and frequency
        const recencyPenalty = Math.max(0, 1 - (1 / Math.max(1, daysSinceLastView)));
        const frequencyPenalty = Math.max(0, 1 - (viewFrequency / 10));

        return Math.min(recencyPenalty, frequencyPenalty);
    },

    // Check if cache is valid
    isCacheValid: function(type) {
        if (!this.cache.lastUpdate) return false;
        return (Date.now() - this.cache.lastUpdate) < this.cache.ttl;
    },

    // Invalidate cache
    invalidateCache: function() {
        this.cache.trending = null;
        this.cache.recommendations = null;
        this.cache.lastUpdate = null;
    },

    // Setup event listeners for tracking
    setupEventListeners: function() {
        // Track project views
        document.addEventListener('click', (e) => {
            const projectCard = e.target.closest('.card[onclick*="showProjectDetails"]');
            if (projectCard) {
                const onclickAttr = projectCard.getAttribute('onclick');
                const projectId = onclickAttr.match(/'([^']+)'/)?.[1];
                if (projectId) {
                    this.trackInteraction('view', projectId);
                }
            }
        });

        // Track search queries
        document.addEventListener('input', (e) => {
            if (e.target.id === 'search-input' || e.target.classList.contains('search-input')) {
                const query = e.target.value.trim();
                if (query.length > 2) {
                    this.trackInteraction('search', null, { query });
                }
            }
        });

        // Track category filtering
        document.addEventListener('change', (e) => {
            if (e.target.id === 'category-filter' || e.target.classList.contains('category-filter')) {
                const category = e.target.value;
                if (category) {
                    this.trackInteraction('category', null, { category });
                }
            }
        });

        // Track time spent on project details
        let projectViewStartTime = null;
        let currentProjectId = null;

        // Override showProjectDetails to track time
        const originalShowProjectDetails = window.showProjectDetails;
        if (originalShowProjectDetails) {
            window.showProjectDetails = (projectId) => {
                // Track time spent on previous project
                if (currentProjectId && projectViewStartTime) {
                    const timeSpent = Date.now() - projectViewStartTime;
                    this.trackInteraction('timeSpent', currentProjectId, { duration: timeSpent });
                }

                // Start tracking new project
                currentProjectId = projectId;
                projectViewStartTime = Date.now();

                return originalShowProjectDetails(projectId);
            };
        }

        // Track time when modal closes
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal') || e.target.classList.contains('modal-close')) {
                if (currentProjectId && projectViewStartTime) {
                    const timeSpent = Date.now() - projectViewStartTime;
                    this.trackInteraction('timeSpent', currentProjectId, { duration: timeSpent });
                    currentProjectId = null;
                    projectViewStartTime = null;
                }
            }
        });
    },

    // Start periodic updates
    startPeriodicUpdates: function() {
        // Update discovery data every 5 minutes
        setInterval(() => {
            this.invalidateCache();
        }, 5 * 60 * 1000);

        // Save interactions every minute
        setInterval(() => {
            this.saveUserInteractions();
        }, 60 * 1000);
    },

    // Create discovery UI components
    createDiscoveryUI: function() {
        this.addDiscoveryStyles();
        this.createTrendingSection();
        this.createRecommendationsSection();
        this.createDiscoveryFilters();
    },

    // Create trending projects section
    createTrendingSection: function() {
        const existingSection = document.getElementById('trending-section');
        if (existingSection) return;

        const section = document.createElement('div');
        section.id = 'trending-section';
        section.className = 'discovery-section';
        section.innerHTML = `
            <div class="section-header">
                <h2><span class="section-icon">🔥</span> Trending Projects</h2>
                <button class="refresh-btn" onclick="ProjectDiscovery.refreshTrending()">
                    <i class="fas fa-sync"></i> Refresh
                </button>
            </div>
            <div id="trending-projects" class="projects-carousel">
                <div class="loading">Loading trending projects...</div>
            </div>
        `;

        // Insert after hero section or at the beginning of main content
        const mainContent = document.querySelector('.projects-grid')?.parentElement || document.querySelector('main') || document.body;
        mainContent.insertBefore(section, mainContent.firstChild);
    },

    // Create recommendations section
    createRecommendationsSection: function() {
        const existingSection = document.getElementById('recommendations-section');
        if (existingSection) return;

        const section = document.createElement('div');
        section.id = 'recommendations-section';
        section.className = 'discovery-section';
        section.innerHTML = `
            <div class="section-header">
                <h2><span class="section-icon">🎯</span> Recommended for You</h2>
                <button class="refresh-btn" onclick="ProjectDiscovery.refreshRecommendations()">
                    <i class="fas fa-sync"></i> Refresh
                </button>
            </div>
            <div id="recommended-projects" class="projects-carousel">
                <div class="loading">Analyzing your preferences...</div>
            </div>
        `;

        // Insert after trending section
        const trendingSection = document.getElementById('trending-section');
        if (trendingSection) {
            trendingSection.insertAdjacentElement('afterend', section);
        }
    },

    // Create discovery filters
    createDiscoveryFilters: function() {
        const existingFilters = document.getElementById('discovery-filters');
        if (existingFilters) return;

        const filters = document.createElement('div');
        filters.id = 'discovery-filters';
        filters.className = 'discovery-filters';
        filters.innerHTML = `
            <div class="filter-group">
                <label>Discovery Mode:</label>
                <select id="discovery-mode" onchange="ProjectDiscovery.changeDiscoveryMode(this.value)">
                    <option value="balanced">Balanced</option>
                    <option value="trending">Trending Focus</option>
                    <option value="personal">Personal Focus</option>
                    <option value="explore">Exploration</option>
                </select>
            </div>
            <div class="filter-group">
                <label>Time Range:</label>
                <select id="time-range" onchange="ProjectDiscovery.changeTimeRange(this.value)">
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="quarter">This Quarter</option>
                    <option value="all">All Time</option>
                </select>
            </div>
        `;

        // Insert above trending section
        const trendingSection = document.getElementById('trending-section');
        if (trendingSection) {
            trendingSection.insertAdjacentElement('beforebegin', filters);
        }
    },

    // Refresh trending projects
    refreshTrending: async function() {
        this.cache.trending = null;
        const container = document.getElementById('trending-projects');
        if (container) {
            container.innerHTML = '<div class="loading">Refreshing trending projects...</div>';
            
            try {
                if (typeof allProjects !== 'undefined' && allProjects.length > 0) {
                    const trending = await this.calculateTrendingProjects(allProjects, 8);
                    this.renderProjectCarousel(container, trending, 'trending');
                }
            } catch (error) {
                console.error('Error refreshing trending:', error);
                container.innerHTML = '<div class="error">Failed to load trending projects</div>';
            }
        }
    },

    // Refresh recommendations
    refreshRecommendations: async function() {
        this.cache.recommendations = null;
        const container = document.getElementById('recommended-projects');
        if (container) {
            container.innerHTML = '<div class="loading">Refreshing recommendations...</div>';
            
            try {
                if (typeof allProjects !== 'undefined' && allProjects.length > 0) {
                    const recommendations = await this.calculateRecommendations(allProjects, null, 8);
                    this.renderProjectCarousel(container, recommendations, 'recommendations');
                }
            } catch (error) {
                console.error('Error refreshing recommendations:', error);
                container.innerHTML = '<div class="error">Failed to load recommendations</div>';
            }
        }
    },

    // Render project carousel
    renderProjectCarousel: function(container, projects, type) {
        if (!projects || projects.length === 0) {
            container.innerHTML = `<div class="no-results">No ${type} available</div>`;
            return;
        }

        container.innerHTML = `
            <div class="carousel-container">
                <div class="carousel-track">
                    ${projects.map(project => `
                        <div class="carousel-item">
                            <div class="discovery-card" onclick="showProjectDetails('${project.id}')">
                                <div class="card-header">
                                    ${project.logo_url 
                                        ? `<img src="${project.logo_url}" alt="${project.name}" class="project-logo">`
                                        : `<div class="project-icon">${(project.name || '?').charAt(0).toUpperCase()}</div>`
                                    }
                                    <div class="project-info">
                                        <h3>${project.name}</h3>
                                        <div class="project-category">${project.category_name || project.category || 'Other'}</div>
                                    </div>
                                    <div class="discovery-score">
                                        ${type === 'trending' 
                                            ? `<div class="score trending">${(project.trendingScore * 100).toFixed(0)}</div>`
                                            : `<div class="score recommendation">${(project.recommendationScore * 100).toFixed(0)}</div>`
                                        }
                                    </div>
                                </div>
                                <p class="project-description">${project.description || 'No description available'}</p>
                                <div class="project-stats">
                                    <span class="stat">
                                        <i class="fas fa-star"></i> ${(project.average_rating || 0).toFixed(1)}
                                    </span>
                                    <span class="stat">
                                        <i class="fas fa-eye"></i> ${project.views || 0}
                                    </span>
                                    <span class="stat">
                                        <i class="fas fa-comment"></i> ${project.comment_count || 0}
                                    </span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <button class="carousel-btn prev" onclick="ProjectDiscovery.slideCarousel('${type}', -1)">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <button class="carousel-btn next" onclick="ProjectDiscovery.slideCarousel('${type}', 1)">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;
    },

    // Slide carousel
    slideCarousel: function(type, direction) {
        const carousel = document.querySelector(`#${type}-projects .carousel-track`);
        if (!carousel) return;

        const itemWidth = 320; // Card width + margin
        const currentTransform = carousel.style.transform || 'translateX(0px)';
        const currentX = parseInt(currentTransform.match(/-?\d+/) || [0])[0];
        const newX = currentX + (direction * itemWidth * -1);

        const maxSlide = (carousel.children.length - 3) * itemWidth; // Show 3 items
        const clampedX = Math.max(-maxSlide, Math.min(0, newX));

        carousel.style.transform = `translateX(${clampedX}px)`;
    },

    // Change discovery mode
    changeDiscoveryMode: function(mode) {
        // Adjust algorithm weights based on mode
        switch (mode) {
            case 'trending':
                this.algorithms.trending.weights.github_activity = 0.4;
                this.algorithms.trending.weights.community_engagement = 0.3;
                break;
            case 'personal':
                this.algorithms.recommendation.weights.user_behavior = 0.4;
                this.algorithms.recommendation.weights.category_similarity = 0.35;
                break;
            case 'explore':
                this.algorithms.recommendation.weights.freshness = 0.4;
                this.algorithms.recommendation.weights.social_signals = 0.3;
                break;
            default: // balanced
                // Reset to default weights
                break;
        }

        this.invalidateCache();
        this.refreshTrending();
        this.refreshRecommendations();
    },

    // Change time range
    changeTimeRange: function(range) {
        // This would filter projects by time range
        // For now, just refresh with current projects
        this.invalidateCache();
        this.refreshTrending();
        this.refreshRecommendations();
    },

    // Add CSS styles
    addDiscoveryStyles: function() {
        if (document.getElementById('discovery-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'discovery-styles';
        styles.textContent = `
            .discovery-section {
                margin: 30px 0;
                background: var(--theme-secondary);
                border-radius: 12px;
                padding: 20px;
                border: 1px solid var(--theme-border);
            }

            .section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }

            .section-header h2 {
                margin: 0;
                color: var(--theme-text);
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 1.3rem;
            }

            .section-icon {
                font-size: 1.4rem;
            }

            .refresh-btn {
                background: var(--theme-accent);
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.875rem;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .refresh-btn:hover {
                background: #3DD5B0;
                transform: translateY(-1px);
            }

            .projects-carousel {
                position: relative;
                overflow: hidden;
            }

            .carousel-container {
                position: relative;
            }

            .carousel-track {
                display: flex;
                gap: 20px;
                transition: transform 0.3s ease;
            }

            .carousel-item {
                flex-shrink: 0;
                width: 300px;
            }

            .discovery-card {
                background: var(--theme-card);
                border: 1px solid var(--theme-border);
                border-radius: 8px;
                padding: 16px;
                cursor: pointer;
                transition: all 0.2s ease;
                height: 200px;
                display: flex;
                flex-direction: column;
            }

            .discovery-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                border-color: var(--theme-accent);
            }

            .discovery-card .card-header {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                margin-bottom: 10px;
            }

            .project-logo {
                width: 40px;
                height: 40px;
                border-radius: 6px;
                object-fit: cover;
                flex-shrink: 0;
            }

            .project-icon {
                width: 40px;
                height: 40px;
                border-radius: 6px;
                background: var(--theme-accent);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                flex-shrink: 0;
            }

            .project-info {
                flex: 1;
                min-width: 0;
            }

            .project-info h3 {
                margin: 0;
                color: var(--theme-text);
                font-size: 0.95rem;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .project-category {
                color: var(--theme-text-secondary);
                font-size: 0.8rem;
                margin-top: 2px;
            }

            .discovery-score {
                flex-shrink: 0;
            }

            .score {
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 0.75rem;
                font-weight: bold;
                color: white;
            }

            .score.trending {
                background: #FF6B35;
            }

            .score.recommendation {
                background: #4F46E5;
            }

            .project-description {
                flex: 1;
                margin: 0;
                color: var(--theme-text-secondary);
                font-size: 0.85rem;
                line-height: 1.4;
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            .project-stats {
                display: flex;
                gap: 12px;
                margin-top: 10px;
                padding-top: 10px;
                border-top: 1px solid var(--theme-border);
            }

            .stat {
                display: flex;
                align-items: center;
                gap: 4px;
                color: var(--theme-text-secondary);
                font-size: 0.8rem;
            }

            .stat i {
                color: var(--theme-accent);
            }

            .carousel-btn {
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                background: var(--theme-primary);
                border: 1px solid var(--theme-border);
                color: var(--theme-text);
                width: 40px;
                height: 40px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                z-index: 10;
            }

            .carousel-btn:hover {
                background: var(--theme-hover);
                border-color: var(--theme-accent);
            }

            .carousel-btn.prev {
                left: -20px;
            }

            .carousel-btn.next {
                right: -20px;
            }

            .discovery-filters {
                display: flex;
                gap: 20px;
                margin: 20px 0;
                padding: 15px;
                background: var(--theme-card);
                border-radius: 8px;
                border: 1px solid var(--theme-border);
            }

            .filter-group {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }

            .filter-group label {
                color: var(--theme-text);
                font-size: 0.875rem;
                font-weight: 500;
            }

            .filter-group select {
                background: var(--theme-primary);
                border: 1px solid var(--theme-border);
                color: var(--theme-text);
                padding: 6px 10px;
                border-radius: 4px;
                font-size: 0.875rem;
            }

            .loading, .error, .no-results {
                text-align: center;
                padding: 40px 20px;
                color: var(--theme-text-secondary);
                font-style: italic;
            }

            .error {
                color: #EF4444;
            }

            @media (max-width: 768px) {
                .discovery-section {
                    margin: 20px 0;
                    padding: 15px;
                }

                .section-header {
                    flex-direction: column;
                    gap: 10px;
                    align-items: flex-start;
                }

                .carousel-item {
                    width: 280px;
                }

                .discovery-filters {
                    flex-direction: column;
                    gap: 15px;
                }

                .carousel-btn {
                    display: none;
                }

                .carousel-track {
                    overflow-x: auto;
                    scroll-snap-type: x mandatory;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }

                .carousel-track::-webkit-scrollbar {
                    display: none;
                }

                .carousel-item {
                    scroll-snap-align: start;
                }
            }
        `;

        document.head.appendChild(styles);
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        ProjectDiscovery.init();
        
        // Initialize trending and recommendations when projects are loaded
        setTimeout(() => {
            if (typeof allProjects !== 'undefined' && allProjects.length > 0) {
                ProjectDiscovery.refreshTrending();
                ProjectDiscovery.refreshRecommendations();
            }
        }, 2000);
    });
} else {
    ProjectDiscovery.init();
    setTimeout(() => {
        if (typeof allProjects !== 'undefined' && allProjects.length > 0) {
            ProjectDiscovery.refreshTrending();
            ProjectDiscovery.refreshRecommendations();
        }
    }, 2000);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProjectDiscovery;
}