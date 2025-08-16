// Project Comparison Tool for Kaspa Ecosystem
// Allows users to compare multiple projects side-by-side

const ProjectComparison = {
    // Storage for selected projects
    selectedProjects: [],
    maxComparison: 3,
    
    // Comparison criteria with weights
    comparisonCriteria: {
        github_metrics: {
            name: 'GitHub Metrics',
            weight: 0.25,
            fields: ['github_stars', 'github_forks', 'github_contributors_count', 'github_activity_score']
        },
        community: {
            name: 'Community',
            weight: 0.25,
            fields: ['rating_count', 'average_rating', 'comment_count']
        },
        development: {
            name: 'Development',
            weight: 0.3,
            fields: ['github_health_score', 'github_releases_count', 'maturity_level']
        },
        adoption: {
            name: 'Adoption',
            weight: 0.2,
            fields: ['verified_status', 'discord_members', 'twitter_followers']
        }
    },

    // Initialize comparison tool
    init: function() {
        this.loadSelectedProjects();
        this.setupEventListeners();
        this.updateComparisonButton();
        this.addStyles();
    },

    // Load selected projects from localStorage
    loadSelectedProjects: function() {
        const saved = localStorage.getItem('kaspa-ecosystem-comparison');
        if (saved) {
            try {
                this.selectedProjects = JSON.parse(saved);
            } catch (e) {
                this.selectedProjects = [];
            }
        }
    },

    // Save selected projects to localStorage
    saveSelectedProjects: function() {
        localStorage.setItem('kaspa-ecosystem-comparison', JSON.stringify(this.selectedProjects));
    },

    // Add project to comparison
    addProject: function(project) {
        // Check if project already selected
        if (this.selectedProjects.find(p => p.id === project.id)) {
            this.showToast('Project already in comparison', 'warning');
            return false;
        }

        // Check max limit
        if (this.selectedProjects.length >= this.maxComparison) {
            this.showToast(`Maximum ${this.maxComparison} projects can be compared`, 'warning');
            return false;
        }

        this.selectedProjects.push(project);
        this.saveSelectedProjects();
        this.updateComparisonButton();
        this.updateProjectButtons();
        this.showToast(`${project.title} added to comparison`, 'success');
        return true;
    },

    // Remove project from comparison
    removeProject: function(projectId) {
        const project = this.selectedProjects.find(p => p.id === projectId);
        this.selectedProjects = this.selectedProjects.filter(p => p.id !== projectId);
        this.saveSelectedProjects();
        this.updateComparisonButton();
        this.updateProjectButtons();
        
        if (project) {
            this.showToast(`${project.title} removed from comparison`, 'info');
        }
    },

    // Clear all selected projects
    clearComparison: function() {
        this.selectedProjects = [];
        this.saveSelectedProjects();
        this.updateComparisonButton();
        this.updateProjectButtons();
        this.showToast('Comparison cleared', 'info');
    },

    // Toggle project in comparison
    toggleProject: function(project) {
        if (this.selectedProjects.find(p => p.id === project.id)) {
            this.removeProject(project.id);
        } else {
            this.addProject(project);
        }
    },

    // Update comparison button in header
    updateComparisonButton: function() {
        let button = document.getElementById('comparison-button');
        
        if (!button) {
            button = document.createElement('button');
            button.id = 'comparison-button';
            button.className = 'comparison-button';
            button.innerHTML = '<i class="fas fa-balance-scale"></i> <span class="comparison-count">0</span>';
            button.title = 'Compare projects';
            
            // Add to navigation
            const nav = document.querySelector('.nav-actions') || document.querySelector('.navbar');
            if (nav) {
                nav.appendChild(button);
            }
        }

        const count = this.selectedProjects.length;
        const countEl = button.querySelector('.comparison-count');
        
        if (countEl) {
            countEl.textContent = count;
        }
        
        button.disabled = count < 2;
        button.onclick = () => this.showComparison();
        
        if (count > 0) {
            button.classList.add('has-items');
        } else {
            button.classList.remove('has-items');
        }
    },

    // Update project comparison buttons in project cards
    updateProjectButtons: function() {
        document.querySelectorAll('[data-project-id]').forEach(element => {
            const projectId = element.dataset.projectId;
            const button = element.querySelector('.comparison-toggle');
            
            if (button) {
                const isSelected = this.selectedProjects.find(p => p.id === projectId);
                
                if (isSelected) {
                    button.classList.add('selected');
                    button.innerHTML = '<i class="fas fa-check"></i>';
                    button.title = 'Remove from comparison';
                } else {
                    button.classList.remove('selected');
                    button.innerHTML = '<i class="fas fa-plus"></i>';
                    button.title = 'Add to comparison';
                }
            }
        });
    },

    // Add comparison button to project card
    addComparisonButton: function(container, project) {
        const button = document.createElement('button');
        button.className = 'comparison-toggle';
        button.title = 'Add to comparison';
        button.innerHTML = '<i class="fas fa-plus"></i>';
        
        const isSelected = this.selectedProjects.find(p => p.id === project.id);
        if (isSelected) {
            button.classList.add('selected');
            button.innerHTML = '<i class="fas fa-check"></i>';
            button.title = 'Remove from comparison';
        }
        
        button.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleProject(project);
        };
        
        container.appendChild(button);
        return button;
    },

    // Show comparison modal
    showComparison: function() {
        if (this.selectedProjects.length < 2) {
            this.showToast('Select at least 2 projects to compare', 'warning');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'comparison-modal';
        modal.innerHTML = this.generateComparisonHTML();
        
        document.body.appendChild(modal);
        
        // Setup modal events
        modal.querySelector('.modal-close').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
        
        // Setup remove buttons
        modal.querySelectorAll('.remove-project').forEach(btn => {
            btn.onclick = (e) => {
                const projectId = e.target.dataset.projectId;
                this.removeProject(projectId);
                modal.remove();
                if (this.selectedProjects.length >= 2) {
                    this.showComparison();
                }
            };
        });
    },

    // Generate comparison HTML
    generateComparisonHTML: function() {
        const projects = this.selectedProjects;
        const scores = this.calculateComparisonScores();
        
        return `
            <div class="modal-overlay">
                <div class="modal-content comparison-content">
                    <div class="modal-header">
                        <h2><i class="fas fa-balance-scale"></i> Project Comparison</h2>
                        <button class="modal-close">&times;</button>
                    </div>
                    
                    <div class="comparison-table-container">
                        <table class="comparison-table">
                            <thead>
                                <tr>
                                    <th class="metric-column">Metric</th>
                                    ${projects.map(project => `
                                        <th class="project-column">
                                            <div class="project-header">
                                                <img src="${project.logo_url || '/images/default-logo.png'}" alt="${project.title}" class="project-logo">
                                                <div>
                                                    <h3>${project.title}</h3>
                                                    <span class="project-category">${project.category_name || 'Unknown'}</span>
                                                </div>
                                                <button class="remove-project" data-project-id="${project.id}" title="Remove from comparison">
                                                    <i class="fas fa-times"></i>
                                                </button>
                                            </div>
                                        </th>
                                    `).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${this.generateComparisonRows(projects, scores)}
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="comparison-summary">
                        <h3>Overall Scores</h3>
                        <div class="score-charts">
                            ${projects.map((project, index) => `
                                <div class="score-item">
                                    <div class="score-circle" style="background: conic-gradient(#49EACB ${scores[index] * 3.6}deg, #334155 0deg);">
                                        <span class="score-value">${Math.round(scores[index])}</span>
                                    </div>
                                    <span class="score-label">${project.title}</span>
                                </div>
                            `).join('')}
                        </div>
                        <div class="comparison-actions">
                            <button onclick="ProjectComparison.clearComparison(); this.closest('.comparison-modal').remove();" class="btn btn-secondary">
                                Clear All
                            </button>
                            <button onclick="ProjectComparison.exportComparison()" class="btn btn-primary">
                                Export Comparison
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Generate comparison table rows
    generateComparisonRows: function(projects, scores) {
        const metrics = [
            { key: 'github_stars', label: 'GitHub Stars', format: 'number', type: 'higher-better' },
            { key: 'github_forks', label: 'GitHub Forks', format: 'number', type: 'higher-better' },
            { key: 'github_activity_score', label: 'Activity Score', format: 'score', type: 'higher-better' },
            { key: 'github_health_score', label: 'Health Score', format: 'score', type: 'higher-better' },
            { key: 'average_rating', label: 'Community Rating', format: 'rating', type: 'higher-better' },
            { key: 'rating_count', label: 'Total Ratings', format: 'number', type: 'higher-better' },
            { key: 'comment_count', label: 'Comments', format: 'number', type: 'higher-better' },
            { key: 'github_language', label: 'Language', format: 'text', type: 'neutral' },
            { key: 'maturity_level', label: 'Maturity', format: 'text', type: 'neutral' },
            { key: 'project_status', label: 'Status', format: 'text', type: 'neutral' },
            { key: 'verified_status', label: 'Verified', format: 'boolean', type: 'higher-better' },
            { key: 'created_at', label: 'Created', format: 'date', type: 'neutral' }
        ];

        return metrics.map(metric => {
            const values = projects.map(project => project[metric.key]);
            const bestIndex = this.findBestValue(values, metric.type);
            
            return `
                <tr>
                    <td class="metric-label">${metric.label}</td>
                    ${projects.map((project, index) => {
                        const value = project[metric.key];
                        const formattedValue = this.formatValue(value, metric.format);
                        const isBest = index === bestIndex && metric.type !== 'neutral';
                        
                        return `
                            <td class="metric-value ${isBest ? 'best-value' : ''}">
                                ${formattedValue}
                                ${isBest ? '<i class="fas fa-crown"></i>' : ''}
                            </td>
                        `;
                    }).join('')}
                </tr>
            `;
        }).join('');
    },

    // Find best value index based on metric type
    findBestValue: function(values, type) {
        if (type === 'neutral') return -1;
        
        const numericValues = values.map(v => {
            if (typeof v === 'boolean') return v ? 1 : 0;
            if (typeof v === 'number') return v || 0;
            return 0;
        });
        
        if (type === 'higher-better') {
            const maxValue = Math.max(...numericValues);
            return numericValues.indexOf(maxValue);
        }
        
        if (type === 'lower-better') {
            const minValue = Math.min(...numericValues);
            return numericValues.indexOf(minValue);
        }
        
        return -1;
    },

    // Format value for display
    formatValue: function(value, format) {
        if (value === null || value === undefined) return 'N/A';
        
        switch (format) {
            case 'number':
                return typeof value === 'number' ? value.toLocaleString() : value;
            case 'score':
                return typeof value === 'number' ? `${value}/100` : 'N/A';
            case 'rating':
                return typeof value === 'number' ? `${value.toFixed(1)}/5.0` : 'N/A';
            case 'boolean':
                return value ? '✅ Yes' : '❌ No';
            case 'date':
                return value ? new Date(value).toLocaleDateString() : 'N/A';
            case 'text':
            default:
                return value || 'N/A';
        }
    },

    // Calculate overall comparison scores
    calculateComparisonScores: function() {
        return this.selectedProjects.map(project => {
            let totalScore = 0;
            let totalWeight = 0;
            
            Object.entries(this.comparisonCriteria).forEach(([category, config]) => {
                let categoryScore = 0;
                let validFields = 0;
                
                config.fields.forEach(field => {
                    const value = project[field];
                    if (value !== null && value !== undefined) {
                        categoryScore += this.normalizeMetric(field, value);
                        validFields++;
                    }
                });
                
                if (validFields > 0) {
                    categoryScore = (categoryScore / validFields) * config.weight;
                    totalScore += categoryScore;
                    totalWeight += config.weight;
                }
            });
            
            return totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
        });
    },

    // Normalize metric to 0-1 scale
    normalizeMetric: function(field, value) {
        const normalizers = {
            'github_stars': v => Math.min(v / 1000, 1),
            'github_forks': v => Math.min(v / 100, 1),
            'github_activity_score': v => v / 100,
            'github_health_score': v => v / 100,
            'average_rating': v => v / 5,
            'rating_count': v => Math.min(v / 50, 1),
            'comment_count': v => Math.min(v / 100, 1),
            'verified_status': v => v ? 1 : 0,
            'maturity_level': v => {
                const levels = { concept: 0.2, development: 0.4, alpha: 0.6, beta: 0.8, mainnet: 1, mature: 1 };
                return levels[v] || 0.5;
            }
        };
        
        const normalizer = normalizers[field];
        return normalizer ? normalizer(value) : 0.5;
    },

    // Export comparison
    exportComparison: function() {
        const data = {
            projects: this.selectedProjects,
            scores: this.calculateComparisonScores(),
            timestamp: new Date().toISOString(),
            comparison_url: `${window.location.origin}?compare=${this.selectedProjects.map(p => p.id).join(',')}`
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kaspa-ecosystem-comparison-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Comparison exported successfully', 'success');
    },

    // Setup event listeners
    setupEventListeners: function() {
        // Listen for project card clicks to add comparison buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.comparison-toggle')) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
        
        // Listen for URL params to load comparison
        const urlParams = new URLSearchParams(window.location.search);
        const compareIds = urlParams.get('compare');
        if (compareIds) {
            this.loadComparisonFromUrl(compareIds);
        }
    },

    // Load comparison from URL
    loadComparisonFromUrl: function(compareIds) {
        const ids = compareIds.split(',');
        // This would need to fetch project data by IDs
        // Implementation depends on your data loading strategy
    },

    // Add CSS styles
    addStyles: function() {
        if (document.getElementById('comparison-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'comparison-styles';
        styles.textContent = `
            .comparison-button {
                position: relative;
                background: var(--theme-secondary);
                border: 1px solid var(--theme-border);
                color: var(--theme-text);
                padding: 8px 12px;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            
            .comparison-button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .comparison-button.has-items {
                background: var(--theme-accent);
                color: var(--theme-primary);
            }
            
            .comparison-count {
                background: var(--theme-primary);
                color: var(--theme-accent);
                border-radius: 50%;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.75rem;
                font-weight: bold;
            }
            
            .comparison-toggle {
                position: absolute;
                top: 8px;
                right: 8px;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                border: 1px solid var(--theme-border);
                background: var(--theme-card);
                color: var(--theme-text);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.75rem;
                transition: all 0.2s ease;
                z-index: 10;
            }
            
            .comparison-toggle:hover {
                background: var(--theme-accent);
                color: var(--theme-primary);
                transform: scale(1.1);
            }
            
            .comparison-toggle.selected {
                background: var(--theme-accent);
                color: var(--theme-primary);
            }
            
            .comparison-modal {
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
            }
            
            .comparison-content {
                background: var(--theme-primary);
                border-radius: 12px;
                max-width: 95vw;
                max-height: 90vh;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }
            
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 1px solid var(--theme-border);
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
            }
            
            .comparison-table-container {
                flex: 1;
                overflow: auto;
                padding: 20px;
            }
            
            .comparison-table {
                width: 100%;
                border-collapse: collapse;
                background: var(--theme-card);
                border-radius: 8px;
                overflow: hidden;
            }
            
            .comparison-table th,
            .comparison-table td {
                padding: 12px;
                text-align: left;
                border-bottom: 1px solid var(--theme-border);
            }
            
            .comparison-table th {
                background: var(--theme-secondary);
                font-weight: 600;
                position: sticky;
                top: 0;
                z-index: 1;
            }
            
            .project-header {
                display: flex;
                align-items: center;
                gap: 10px;
                min-width: 200px;
            }
            
            .project-logo {
                width: 32px;
                height: 32px;
                border-radius: 4px;
                object-fit: cover;
            }
            
            .project-category {
                font-size: 0.75rem;
                color: var(--theme-text-secondary);
            }
            
            .remove-project {
                background: none;
                border: none;
                color: var(--theme-text-secondary);
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                opacity: 0.7;
                transition: all 0.2s ease;
            }
            
            .remove-project:hover {
                background: var(--theme-hover);
                opacity: 1;
            }
            
            .metric-label {
                font-weight: 500;
                min-width: 120px;
            }
            
            .metric-value {
                position: relative;
            }
            
            .best-value {
                background: rgba(73, 234, 203, 0.1);
                color: var(--theme-accent);
                font-weight: 600;
            }
            
            .best-value .fa-crown {
                position: absolute;
                right: 4px;
                top: 50%;
                transform: translateY(-50%);
                color: #FFD700;
                font-size: 0.75rem;
            }
            
            .comparison-summary {
                padding: 20px;
                border-top: 1px solid var(--theme-border);
                background: var(--theme-secondary);
            }
            
            .score-charts {
                display: flex;
                justify-content: center;
                gap: 30px;
                margin: 20px 0;
            }
            
            .score-item {
                text-align: center;
            }
            
            .score-circle {
                width: 80px;
                height: 80px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 10px;
                position: relative;
            }
            
            .score-circle::before {
                content: '';
                position: absolute;
                inset: 8px;
                background: var(--theme-secondary);
                border-radius: 50%;
            }
            
            .score-value {
                position: relative;
                z-index: 1;
                font-size: 1.25rem;
                font-weight: bold;
                color: var(--theme-accent);
            }
            
            .score-label {
                font-size: 0.875rem;
                color: var(--theme-text-secondary);
            }
            
            .comparison-actions {
                display: flex;
                gap: 10px;
                justify-content: center;
                margin-top: 20px;
            }
            
            @media (max-width: 768px) {
                .comparison-content {
                    margin: 10px;
                    max-width: calc(100vw - 20px);
                }
                
                .project-header {
                    min-width: 150px;
                }
                
                .score-charts {
                    flex-direction: column;
                    gap: 20px;
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
    document.addEventListener('DOMContentLoaded', () => ProjectComparison.init());
} else {
    ProjectComparison.init();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProjectComparison;
}