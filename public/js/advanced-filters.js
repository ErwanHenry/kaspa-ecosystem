// Advanced Filters for Kaspa Ecosystem
// Provides comprehensive filtering and search capabilities

const AdvancedFilters = {
    // Filter state
    activeFilters: {},
    defaultFilters: {
        search: '',
        category: '',
        status: '',
        maturity: '',
        language: '',
        min_stars: 0,
        min_rating: 0,
        verified_only: false,
        has_demo: false,
        has_audit: false,
        sort: 'overall_score',
        order: 'desc'
    },

    // Filter definitions
    filterDefinitions: {
        category: {
            type: 'select',
            label: 'Category',
            icon: 'fas fa-folder',
            options: [] // Loaded dynamically
        },
        status: {
            type: 'select',
            label: 'Project Status',
            icon: 'fas fa-heartbeat',
            options: [
                { value: '', label: 'All Statuses' },
                { value: 'active', label: 'Active' },
                { value: 'maintenance', label: 'Maintenance' },
                { value: 'deprecated', label: 'Deprecated' },
                { value: 'coming-soon', label: 'Coming Soon' }
            ]
        },
        maturity: {
            type: 'select',
            label: 'Maturity Level',
            icon: 'fas fa-seedling',
            options: [
                { value: '', label: 'All Levels' },
                { value: 'concept', label: 'Concept' },
                { value: 'development', label: 'Development' },
                { value: 'alpha', label: 'Alpha' },
                { value: 'beta', label: 'Beta' },
                { value: 'mainnet', label: 'Mainnet' },
                { value: 'mature', label: 'Mature' }
            ]
        },
        language: {
            type: 'select',
            label: 'Programming Language',
            icon: 'fas fa-code',
            options: [] // Loaded dynamically
        },
        min_stars: {
            type: 'range',
            label: 'Minimum GitHub Stars',
            icon: 'fas fa-star',
            min: 0,
            max: 1000,
            step: 10
        },
        min_rating: {
            type: 'range',
            label: 'Minimum Rating',
            icon: 'fas fa-thumbs-up',
            min: 0,
            max: 5,
            step: 0.1
        },
        verified_only: {
            type: 'checkbox',
            label: 'Verified Projects Only',
            icon: 'fas fa-shield-check'
        },
        has_demo: {
            type: 'checkbox',
            label: 'Has Demo/Preview',
            icon: 'fas fa-play'
        },
        has_audit: {
            type: 'checkbox',
            label: 'Security Audited',
            icon: 'fas fa-security'
        }
    },

    // Sort options
    sortOptions: [
        { value: 'overall_score', label: 'Overall Score', icon: 'fas fa-trophy' },
        { value: 'github_stars', label: 'GitHub Stars', icon: 'fas fa-star' },
        { value: 'average_rating', label: 'Community Rating', icon: 'fas fa-heart' },
        { value: 'github_activity_score', label: 'Activity Score', icon: 'fas fa-chart-line' },
        { value: 'created_at', label: 'Newest First', icon: 'fas fa-clock' },
        { value: 'github_pushed_at', label: 'Recently Updated', icon: 'fas fa-sync' },
        { value: 'title', label: 'Alphabetical', icon: 'fas fa-sort-alpha-down' }
    ],

    // Initialize filters
    init: function() {
        this.loadFiltersFromUrl();
        this.loadDynamicOptions();
        this.createFilterUI();
        this.setupEventListeners();
        this.addStyles();
        this.applyFilters();
    },

    // Load filters from URL parameters
    loadFiltersFromUrl: function() {
        const urlParams = new URLSearchParams(window.location.search);
        this.activeFilters = { ...this.defaultFilters };
        
        Object.keys(this.defaultFilters).forEach(key => {
            if (urlParams.has(key)) {
                const value = urlParams.get(key);
                if (typeof this.defaultFilters[key] === 'boolean') {
                    this.activeFilters[key] = value === 'true';
                } else if (typeof this.defaultFilters[key] === 'number') {
                    this.activeFilters[key] = parseFloat(value) || this.defaultFilters[key];
                } else {
                    this.activeFilters[key] = value;
                }
            }
        });
    },

    // Save filters to URL
    saveFiltersToUrl: function() {
        const url = new URL(window.location);
        const params = new URLSearchParams();
        
        Object.entries(this.activeFilters).forEach(([key, value]) => {
            if (value !== this.defaultFilters[key] && value !== '' && value !== false && value !== 0) {
                params.set(key, value);
            }
        });
        
        url.search = params.toString();
        window.history.replaceState({}, '', url);
    },

    // Load dynamic filter options
    loadDynamicOptions: async function() {
        try {
            // Load categories
            const categoriesResponse = await fetch('/.netlify/functions/enhanced-projects-api/categories');
            if (categoriesResponse.ok) {
                const categoriesData = await categoriesResponse.json();
                this.filterDefinitions.category.options = [
                    { value: '', label: 'All Categories' },
                    ...categoriesData.categories.map(cat => ({
                        value: cat.slug,
                        label: `${cat.icon} ${cat.name} (${cat.project_count})`
                    }))
                ];
            }

            // Load programming languages
            const statsResponse = await fetch('/.netlify/functions/enhanced-projects-api/stats');
            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                this.filterDefinitions.language.options = [
                    { value: '', label: 'All Languages' },
                    ...statsData.ecosystem_stats.top_languages.map(lang => ({
                        value: lang.language,
                        label: `${lang.language} (${lang.count})`
                    }))
                ];
            }
        } catch (error) {
            console.error('Error loading filter options:', error);
        }
    },

    // Create filter UI
    createFilterUI: function() {
        // Check if filters already exist
        if (document.getElementById('advanced-filters')) return;

        const container = document.createElement('div');
        container.id = 'advanced-filters';
        container.className = 'filters-container';
        
        container.innerHTML = `
            <div class="filters-header">
                <button class="filters-toggle" onclick="AdvancedFilters.toggleFilters()">
                    <i class="fas fa-filter"></i>
                    <span>Filters</span>
                    <span class="filter-count" id="filter-count">0</span>
                </button>
                <div class="filters-actions">
                    <button class="btn-clear" onclick="AdvancedFilters.clearAllFilters()">
                        <i class="fas fa-times"></i> Clear All
                    </button>
                    <button class="btn-save" onclick="AdvancedFilters.saveFilterPreset()">
                        <i class="fas fa-bookmark"></i> Save
                    </button>
                </div>
            </div>
            
            <div class="filters-panel" id="filters-panel">
                <div class="filters-grid">
                    <div class="filter-section">
                        <h4><i class="fas fa-search"></i> Search & Basic Filters</h4>
                        <div class="filter-group">
                            <input type="text" id="filter-search" placeholder="Search projects..." 
                                   value="${this.activeFilters.search}" class="filter-input">
                        </div>
                        ${this.generateFilterGroup(['category', 'status', 'maturity'])}
                    </div>
                    
                    <div class="filter-section">
                        <h4><i class="fas fa-code"></i> Technical Filters</h4>
                        ${this.generateFilterGroup(['language', 'min_stars', 'min_rating'])}
                    </div>
                    
                    <div class="filter-section">
                        <h4><i class="fas fa-check-circle"></i> Quality Filters</h4>
                        ${this.generateFilterGroup(['verified_only', 'has_demo', 'has_audit'])}
                    </div>
                    
                    <div class="filter-section">
                        <h4><i class="fas fa-sort"></i> Sort Options</h4>
                        <div class="filter-group">
                            <select id="filter-sort" class="filter-select">
                                ${this.sortOptions.map(option => `
                                    <option value="${option.value}" ${this.activeFilters.sort === option.value ? 'selected' : ''}>
                                        ${option.label}
                                    </option>
                                `).join('')}
                            </select>
                            <div class="sort-order">
                                <label class="radio-label">
                                    <input type="radio" name="sort-order" value="desc" 
                                           ${this.activeFilters.order === 'desc' ? 'checked' : ''}>
                                    <span>Descending</span>
                                </label>
                                <label class="radio-label">
                                    <input type="radio" name="sort-order" value="asc" 
                                           ${this.activeFilters.order === 'asc' ? 'checked' : ''}>
                                    <span>Ascending</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="filters-summary" id="filters-summary">
                    <span>Active filters will appear here</span>
                </div>
            </div>
        `;

        // Insert before project container
        const projectContainer = document.querySelector('.projects-container') || 
                                document.querySelector('#projects-grid') || 
                                document.querySelector('main');
        
        if (projectContainer) {
            projectContainer.parentNode.insertBefore(container, projectContainer);
        } else {
            document.body.appendChild(container);
        }

        this.updateFilterCount();
        this.updateFiltersSummary();
    },

    // Generate filter group HTML
    generateFilterGroup: function(filterKeys) {
        return filterKeys.map(key => {
            const def = this.filterDefinitions[key];
            const value = this.activeFilters[key];
            
            switch (def.type) {
                case 'select':
                    return `
                        <div class="filter-group">
                            <label><i class="${def.icon}"></i> ${def.label}</label>
                            <select id="filter-${key}" class="filter-select">
                                ${def.options.map(option => `
                                    <option value="${option.value}" ${value === option.value ? 'selected' : ''}>
                                        ${option.label}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                    `;
                    
                case 'range':
                    return `
                        <div class="filter-group">
                            <label><i class="${def.icon}"></i> ${def.label}</label>
                            <div class="range-container">
                                <input type="range" id="filter-${key}" class="filter-range"
                                       min="${def.min}" max="${def.max}" step="${def.step}" value="${value}">
                                <span class="range-value" id="range-value-${key}">${value}</span>
                            </div>
                        </div>
                    `;
                    
                case 'checkbox':
                    return `
                        <div class="filter-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="filter-${key}" ${value ? 'checked' : ''}>
                                <span class="checkmark"></span>
                                <i class="${def.icon}"></i> ${def.label}
                            </label>
                        </div>
                    `;
                    
                default:
                    return '';
            }
        }).join('');
    },

    // Setup event listeners
    setupEventListeners: function() {
        // Search input
        const searchInput = document.getElementById('filter-search');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.activeFilters.search = e.target.value;
                    this.applyFilters();
                }, 300);
            });
        }

        // Filter controls
        Object.keys(this.filterDefinitions).forEach(key => {
            const element = document.getElementById(`filter-${key}`);
            if (element) {
                const def = this.filterDefinitions[key];
                
                if (def.type === 'select') {
                    element.addEventListener('change', (e) => {
                        this.activeFilters[key] = e.target.value;
                        this.applyFilters();
                    });
                } else if (def.type === 'range') {
                    element.addEventListener('input', (e) => {
                        const value = parseFloat(e.target.value);
                        this.activeFilters[key] = value;
                        document.getElementById(`range-value-${key}`).textContent = value;
                        this.applyFilters();
                    });
                } else if (def.type === 'checkbox') {
                    element.addEventListener('change', (e) => {
                        this.activeFilters[key] = e.target.checked;
                        this.applyFilters();
                    });
                }
            }
        });

        // Sort controls
        const sortSelect = document.getElementById('filter-sort');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.activeFilters.sort = e.target.value;
                this.applyFilters();
            });
        }

        const orderRadios = document.querySelectorAll('input[name="sort-order"]');
        orderRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.activeFilters.order = e.target.value;
                this.applyFilters();
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + F to focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                const searchInput = document.getElementById('filter-search');
                if (searchInput) {
                    searchInput.focus();
                }
            }
            
            // Escape to clear search
            if (e.key === 'Escape') {
                const searchInput = document.getElementById('filter-search');
                if (searchInput && document.activeElement === searchInput) {
                    searchInput.value = '';
                    this.activeFilters.search = '';
                    this.applyFilters();
                }
            }
        });
    },

    // Toggle filters panel
    toggleFilters: function() {
        const panel = document.getElementById('filters-panel');
        const toggle = document.querySelector('.filters-toggle');
        
        if (panel.classList.contains('open')) {
            panel.classList.remove('open');
            toggle.classList.remove('active');
        } else {
            panel.classList.add('open');
            toggle.classList.add('active');
        }
    },

    // Apply filters
    applyFilters: async function() {
        this.updateFilterCount();
        this.updateFiltersSummary();
        this.saveFiltersToUrl();
        
        // Show loading state
        this.showLoadingState();
        
        try {
            // Build query parameters
            const params = new URLSearchParams();
            Object.entries(this.activeFilters).forEach(([key, value]) => {
                if (value !== this.defaultFilters[key] && value !== '' && value !== false && value !== 0) {
                    params.set(key, value);
                }
            });
            
            // Fetch filtered results
            const response = await fetch(`/.netlify/functions/enhanced-projects-api/search?${params}`);
            if (!response.ok) throw new Error('Failed to fetch projects');
            
            const data = await response.json();
            
            // Update UI with results
            this.displayResults(data);
            
        } catch (error) {
            console.error('Error applying filters:', error);
            this.showErrorState();
        }
    },

    // Display filtered results
    displayResults: function(data) {
        const { projects, pagination } = data;
        
        // Update project grid
        const projectsContainer = document.querySelector('#projects-grid') || 
                                 document.querySelector('.projects-container');
        
        if (projectsContainer) {
            if (projects.length === 0) {
                projectsContainer.innerHTML = `
                    <div class="no-results">
                        <i class="fas fa-search"></i>
                        <h3>No projects found</h3>
                        <p>Try adjusting your filters or search terms</p>
                        <button onclick="AdvancedFilters.clearAllFilters()" class="btn btn-primary">
                            Clear Filters
                        </button>
                    </div>
                `;
            } else {
                projectsContainer.innerHTML = projects.map(project => this.generateProjectCard(project)).join('');
            }
        }
        
        // Update results count
        this.updateResultsCount(pagination);
        
        // Hide loading state
        this.hideLoadingState();
    },

    // Generate project card HTML
    generateProjectCard: function(project) {
        return `
            <div class="project-card" data-project-id="${project.id}">
                <div class="project-header">
                    <img src="${project.logo_url || '/images/default-logo.png'}" alt="${project.title}" class="project-logo">
                    <div class="project-badges">
                        ${project.verified_status ? '<span class="badge verified">✓ Verified</span>' : ''}
                        ${project.github_stars ? `<span class="badge stars">${project.github_stars} ⭐</span>` : ''}
                        ${project.activity_level ? `<span class="badge activity-${project.activity_level.toLowerCase().replace(' ', '-')}">${project.activity_level}</span>` : ''}
                    </div>
                </div>
                
                <div class="project-content">
                    <h3>${project.title}</h3>
                    <p class="project-category">${project.category_name || 'Uncategorized'}</p>
                    <p class="project-description">${project.description || 'No description available'}</p>
                    
                    <div class="project-stats">
                        ${project.average_rating ? `
                            <span class="stat">
                                <i class="fas fa-star"></i>
                                ${project.average_rating.toFixed(1)} (${project.rating_count})
                            </span>
                        ` : ''}
                        ${project.github_language ? `
                            <span class="stat">
                                <i class="fas fa-code"></i>
                                ${project.github_language}
                            </span>
                        ` : ''}
                        ${project.maturity_level ? `
                            <span class="stat">
                                <i class="fas fa-seedling"></i>
                                ${project.maturity_level.charAt(0).toUpperCase() + project.maturity_level.slice(1)}
                            </span>
                        ` : ''}
                    </div>
                </div>
                
                <div class="project-actions">
                    ${project.website ? `<a href="${project.website}" target="_blank" class="btn btn-primary">Visit</a>` : ''}
                    ${project.github ? `<a href="${project.github}" target="_blank" class="btn btn-secondary">GitHub</a>` : ''}
                </div>
            </div>
        `;
    },

    // Update filter count
    updateFilterCount: function() {
        const count = Object.entries(this.activeFilters).filter(([key, value]) => 
            value !== this.defaultFilters[key] && value !== '' && value !== false && value !== 0
        ).length;
        
        const countEl = document.getElementById('filter-count');
        if (countEl) {
            countEl.textContent = count;
            countEl.style.display = count > 0 ? 'inline' : 'none';
        }
    },

    // Update filters summary
    updateFiltersSummary: function() {
        const summary = document.getElementById('filters-summary');
        if (!summary) return;
        
        const activeFilters = Object.entries(this.activeFilters).filter(([key, value]) => 
            value !== this.defaultFilters[key] && value !== '' && value !== false && value !== 0
        );
        
        if (activeFilters.length === 0) {
            summary.innerHTML = '<span>No active filters</span>';
            return;
        }
        
        const filterTags = activeFilters.map(([key, value]) => {
            const def = this.filterDefinitions[key];
            let displayValue = value;
            
            if (def && def.type === 'select') {
                const option = def.options.find(opt => opt.value === value);
                displayValue = option ? option.label : value;
            } else if (key === 'search') {
                displayValue = `"${value}"`;
            } else if (typeof value === 'boolean') {
                displayValue = def ? def.label : key;
            }
            
            return `
                <span class="filter-tag">
                    ${def ? def.label : key}: ${displayValue}
                    <button onclick="AdvancedFilters.removeFilter('${key}')" class="remove-filter">×</button>
                </span>
            `;
        }).join('');
        
        summary.innerHTML = filterTags;
    },

    // Remove single filter
    removeFilter: function(key) {
        this.activeFilters[key] = this.defaultFilters[key];
        
        // Update UI element
        const element = document.getElementById(`filter-${key}`);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = false;
            } else if (element.type === 'range') {
                element.value = this.defaultFilters[key];
                document.getElementById(`range-value-${key}`).textContent = this.defaultFilters[key];
            } else {
                element.value = this.defaultFilters[key];
            }
        }
        
        if (key === 'search') {
            const searchInput = document.getElementById('filter-search');
            if (searchInput) searchInput.value = '';
        }
        
        this.applyFilters();
    },

    // Clear all filters
    clearAllFilters: function() {
        this.activeFilters = { ...this.defaultFilters };
        
        // Reset all UI elements
        Object.keys(this.filterDefinitions).forEach(key => {
            const element = document.getElementById(`filter-${key}`);
            if (element) {
                const def = this.filterDefinitions[key];
                if (def.type === 'checkbox') {
                    element.checked = false;
                } else if (def.type === 'range') {
                    element.value = this.defaultFilters[key];
                    const valueEl = document.getElementById(`range-value-${key}`);
                    if (valueEl) valueEl.textContent = this.defaultFilters[key];
                } else {
                    element.value = this.defaultFilters[key];
                }
            }
        });
        
        const searchInput = document.getElementById('filter-search');
        if (searchInput) searchInput.value = '';
        
        const sortSelect = document.getElementById('filter-sort');
        if (sortSelect) sortSelect.value = this.defaultFilters.sort;
        
        const orderRadios = document.querySelectorAll('input[name="sort-order"]');
        orderRadios.forEach(radio => {
            radio.checked = radio.value === this.defaultFilters.order;
        });
        
        this.applyFilters();
    },

    // Update results count
    updateResultsCount: function(pagination) {
        const countEl = document.getElementById('results-count') || this.createResultsCount();
        if (countEl) {
            const { total, offset, limit } = pagination;
            const start = offset + 1;
            const end = Math.min(offset + limit, total);
            countEl.textContent = `Showing ${start}-${end} of ${total} projects`;
        }
    },

    // Create results count element
    createResultsCount: function() {
        const element = document.createElement('div');
        element.id = 'results-count';
        element.className = 'results-count';
        
        const filtersContainer = document.getElementById('advanced-filters');
        if (filtersContainer) {
            filtersContainer.appendChild(element);
        }
        
        return element;
    },

    // Show loading state
    showLoadingState: function() {
        const container = document.querySelector('#projects-grid') || 
                         document.querySelector('.projects-container');
        if (container) {
            container.innerHTML = `
                <div class="loading-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Applying filters...</p>
                </div>
            `;
        }
    },

    // Hide loading state
    hideLoadingState: function() {
        // Loading state is replaced by results
    },

    // Show error state
    showErrorState: function() {
        const container = document.querySelector('#projects-grid') || 
                         document.querySelector('.projects-container');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error loading projects</h3>
                    <p>Please try again or refresh the page</p>
                    <button onclick="AdvancedFilters.applyFilters()" class="btn btn-primary">
                        Retry
                    </button>
                </div>
            `;
        }
    },

    // Save filter preset
    saveFilterPreset: function() {
        const name = prompt('Enter a name for this filter preset:');
        if (!name) return;
        
        const presets = JSON.parse(localStorage.getItem('kaspa-filter-presets') || '{}');
        presets[name] = { ...this.activeFilters };
        localStorage.setItem('kaspa-filter-presets', JSON.stringify(presets));
        
        this.showToast(`Filter preset "${name}" saved`, 'success');
    },

    // Load filter preset
    loadFilterPreset: function(name) {
        const presets = JSON.parse(localStorage.getItem('kaspa-filter-presets') || '{}');
        if (presets[name]) {
            this.activeFilters = { ...presets[name] };
            this.updateAllFilterInputs();
            this.applyFilters();
            this.showToast(`Filter preset "${name}" loaded`, 'success');
        }
    },

    // Update all filter inputs
    updateAllFilterInputs: function() {
        Object.keys(this.filterDefinitions).forEach(key => {
            const element = document.getElementById(`filter-${key}`);
            const value = this.activeFilters[key];
            
            if (element) {
                const def = this.filterDefinitions[key];
                if (def.type === 'checkbox') {
                    element.checked = value;
                } else if (def.type === 'range') {
                    element.value = value;
                    const valueEl = document.getElementById(`range-value-${key}`);
                    if (valueEl) valueEl.textContent = value;
                } else {
                    element.value = value;
                }
            }
        });
        
        const searchInput = document.getElementById('filter-search');
        if (searchInput) searchInput.value = this.activeFilters.search;
    },

    // Add CSS styles
    addStyles: function() {
        if (document.getElementById('advanced-filters-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'advanced-filters-styles';
        styles.textContent = `
            .filters-container {
                background: var(--theme-card);
                border: 1px solid var(--theme-border);
                border-radius: 8px;
                margin-bottom: 20px;
                overflow: hidden;
            }
            
            .filters-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px;
                background: var(--theme-secondary);
                border-bottom: 1px solid var(--theme-border);
            }
            
            .filters-toggle {
                display: flex;
                align-items: center;
                gap: 8px;
                background: none;
                border: none;
                color: var(--theme-text);
                cursor: pointer;
                font-weight: 500;
                padding: 0;
            }
            
            .filters-toggle.active {
                color: var(--theme-accent);
            }
            
            .filter-count {
                background: var(--theme-accent);
                color: var(--theme-primary);
                border-radius: 50%;
                width: 20px;
                height: 20px;
                display: none;
                align-items: center;
                justify-content: center;
                font-size: 0.75rem;
                font-weight: bold;
            }
            
            .filters-actions {
                display: flex;
                gap: 8px;
            }
            
            .btn-clear, .btn-save {
                background: none;
                border: 1px solid var(--theme-border);
                color: var(--theme-text);
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.875rem;
                transition: all 0.2s ease;
            }
            
            .btn-clear:hover, .btn-save:hover {
                background: var(--theme-hover);
            }
            
            .filters-panel {
                max-height: 0;
                overflow: hidden;
                transition: max-height 0.3s ease;
            }
            
            .filters-panel.open {
                max-height: 800px;
            }
            
            .filters-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 20px;
                padding: 20px;
            }
            
            .filter-section h4 {
                color: var(--theme-accent);
                margin-bottom: 15px;
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 0.875rem;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .filter-group {
                margin-bottom: 15px;
            }
            
            .filter-group label {
                display: block;
                color: var(--theme-text);
                font-weight: 500;
                margin-bottom: 6px;
                font-size: 0.875rem;
            }
            
            .filter-input, .filter-select {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid var(--theme-border);
                border-radius: 4px;
                background: var(--theme-secondary);
                color: var(--theme-text);
                font-size: 0.875rem;
            }
            
            .filter-input:focus, .filter-select:focus {
                outline: none;
                border-color: var(--theme-accent);
                box-shadow: 0 0 0 3px rgba(73, 234, 203, 0.1);
            }
            
            .range-container {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .filter-range {
                flex: 1;
                height: 6px;
                border-radius: 3px;
                background: var(--theme-border);
                outline: none;
                -webkit-appearance: none;
            }
            
            .filter-range::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: var(--theme-accent);
                cursor: pointer;
            }
            
            .filter-range::-moz-range-thumb {
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: var(--theme-accent);
                cursor: pointer;
                border: none;
            }
            
            .range-value {
                min-width: 40px;
                text-align: center;
                font-weight: 500;
                color: var(--theme-accent);
            }
            
            .checkbox-label {
                display: flex !important;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                margin-bottom: 0 !important;
            }
            
            .checkbox-label input[type="checkbox"] {
                margin: 0;
                width: auto;
            }
            
            .sort-order {
                display: flex;
                gap: 15px;
                margin-top: 8px;
            }
            
            .radio-label {
                display: flex !important;
                align-items: center;
                gap: 6px;
                cursor: pointer;
                font-size: 0.875rem;
            }
            
            .radio-label input[type="radio"] {
                margin: 0;
                width: auto;
            }
            
            .filters-summary {
                padding: 15px 20px;
                border-top: 1px solid var(--theme-border);
                background: var(--theme-secondary);
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                align-items: center;
                min-height: 50px;
            }
            
            .filter-tag {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                background: var(--theme-accent);
                color: var(--theme-primary);
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 0.75rem;
                font-weight: 500;
            }
            
            .remove-filter {
                background: none;
                border: none;
                color: inherit;
                cursor: pointer;
                padding: 0;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.875rem;
            }
            
            .remove-filter:hover {
                background: rgba(0,0,0,0.2);
            }
            
            .results-count {
                padding: 10px 20px;
                color: var(--theme-text-secondary);
                font-size: 0.875rem;
                text-align: center;
                border-top: 1px solid var(--theme-border);
            }
            
            .no-results, .loading-state, .error-state {
                text-align: center;
                padding: 60px 20px;
                color: var(--theme-text-secondary);
            }
            
            .no-results i, .loading-state i, .error-state i {
                font-size: 3rem;
                margin-bottom: 20px;
                color: var(--theme-accent);
            }
            
            .loading-state i {
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            
            .project-card {
                background: var(--theme-card);
                border: 1px solid var(--theme-border);
                border-radius: 8px;
                padding: 20px;
                transition: all 0.3s ease;
                position: relative;
            }
            
            .project-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            
            .project-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 15px;
            }
            
            .project-logo {
                width: 48px;
                height: 48px;
                border-radius: 6px;
                object-fit: cover;
            }
            
            .project-badges {
                display: flex;
                flex-direction: column;
                gap: 4px;
                align-items: flex-end;
            }
            
            .badge {
                padding: 2px 6px;
                border-radius: 10px;
                font-size: 0.75rem;
                font-weight: 500;
            }
            
            .badge.verified {
                background: var(--theme-accent);
                color: var(--theme-primary);
            }
            
            .badge.stars {
                background: var(--theme-secondary);
                color: var(--theme-text);
            }
            
            .project-content h3 {
                color: var(--theme-text);
                margin-bottom: 5px;
                font-size: 1.25rem;
            }
            
            .project-category {
                color: var(--theme-accent);
                font-size: 0.875rem;
                margin-bottom: 10px;
            }
            
            .project-description {
                color: var(--theme-text-secondary);
                line-height: 1.5;
                margin-bottom: 15px;
            }
            
            .project-stats {
                display: flex;
                gap: 15px;
                margin-bottom: 15px;
                flex-wrap: wrap;
            }
            
            .stat {
                display: flex;
                align-items: center;
                gap: 4px;
                color: var(--theme-text-secondary);
                font-size: 0.875rem;
            }
            
            .project-actions {
                display: flex;
                gap: 10px;
            }
            
            @media (max-width: 768px) {
                .filters-grid {
                    grid-template-columns: 1fr;
                }
                
                .filters-header {
                    flex-direction: column;
                    gap: 10px;
                    align-items: stretch;
                }
                
                .filters-actions {
                    justify-content: center;
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
    document.addEventListener('DOMContentLoaded', () => AdvancedFilters.init());
} else {
    AdvancedFilters.init();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedFilters;
}