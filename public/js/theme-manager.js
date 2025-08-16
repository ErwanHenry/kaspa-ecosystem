// Theme Manager for Kaspa Ecosystem
// Handles dark/light mode switching with user preferences

const ThemeManager = {
    // Theme configurations
    themes: {
        dark: {
            name: 'Dark',
            icon: 'fas fa-moon',
            primary: '#0F172A',
            secondary: '#1E293B',
            accent: '#49EACB',
            text: '#CBD5E1',
            textSecondary: '#64748B',
            border: '#334155',
            card: '#1E293B',
            hover: '#334155'
        },
        light: {
            name: 'Light',
            icon: 'fas fa-sun',
            primary: '#FFFFFF',
            secondary: '#F8FAFC',
            accent: '#0D9488',
            text: '#1E293B',
            textSecondary: '#64748B',
            border: '#E2E8F0',
            card: '#FFFFFF',
            hover: '#F1F5F9'
        },
        auto: {
            name: 'Auto',
            icon: 'fas fa-circle-half-stroke',
            followSystem: true
        }
    },

    currentTheme: 'dark',
    systemPreference: 'dark',

    // Initialize theme manager
    init: function() {
        this.detectSystemPreference();
        this.loadUserPreference();
        this.applyTheme(this.currentTheme);
        this.setupEventListeners();
        this.createThemeToggle();
    },

    // Detect system color scheme preference
    detectSystemPreference: function() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.systemPreference = 'dark';
        } else {
            this.systemPreference = 'light';
        }

        // Listen for system preference changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                this.systemPreference = e.matches ? 'dark' : 'light';
                if (this.currentTheme === 'auto') {
                    this.applyTheme('auto');
                }
            });
        }
    },

    // Load user's saved theme preference
    loadUserPreference: function() {
        const savedTheme = localStorage.getItem('kaspa-ecosystem-theme');
        if (savedTheme && this.themes[savedTheme]) {
            this.currentTheme = savedTheme;
        } else {
            // Default to auto if no preference saved
            this.currentTheme = 'auto';
        }
    },

    // Save user's theme preference
    saveUserPreference: function(theme) {
        localStorage.setItem('kaspa-ecosystem-theme', theme);
    },

    // Apply theme to the document
    applyTheme: function(themeName) {
        this.currentTheme = themeName;
        
        let effectiveTheme = themeName;
        if (themeName === 'auto') {
            effectiveTheme = this.systemPreference;
        }

        const theme = this.themes[effectiveTheme];
        if (!theme) return;

        // Update CSS custom properties
        const root = document.documentElement;
        root.style.setProperty('--theme-primary', theme.primary);
        root.style.setProperty('--theme-secondary', theme.secondary);
        root.style.setProperty('--theme-accent', theme.accent);
        root.style.setProperty('--theme-text', theme.text);
        root.style.setProperty('--theme-text-secondary', theme.textSecondary);
        root.style.setProperty('--theme-border', theme.border);
        root.style.setProperty('--theme-card', theme.card);
        root.style.setProperty('--theme-hover', theme.hover);

        // Update data attribute for CSS targeting
        document.body.setAttribute('data-theme', effectiveTheme);
        
        // Update theme toggle button
        this.updateThemeToggle();
        
        // Save preference
        this.saveUserPreference(themeName);
        
        // Emit theme change event
        this.emitThemeChangeEvent(effectiveTheme, themeName);
    },

    // Switch to next theme
    toggleTheme: function() {
        const themeOrder = ['auto', 'light', 'dark'];
        const currentIndex = themeOrder.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themeOrder.length;
        this.applyTheme(themeOrder[nextIndex]);
    },

    // Switch to specific theme
    setTheme: function(themeName) {
        if (this.themes[themeName]) {
            this.applyTheme(themeName);
        }
    },

    // Create theme toggle button
    createThemeToggle: function() {
        // Check if toggle already exists
        if (document.getElementById('theme-toggle')) return;

        const toggle = document.createElement('button');
        toggle.id = 'theme-toggle';
        toggle.className = 'theme-toggle';
        toggle.title = 'Toggle theme';
        toggle.setAttribute('aria-label', 'Toggle theme');
        
        // Add to navigation or create floating button
        const nav = document.querySelector('.nav-actions') || document.querySelector('.navbar') || document.querySelector('nav');
        if (nav) {
            nav.appendChild(toggle);
        } else {
            // Create floating toggle
            toggle.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
                background: var(--theme-card);
                border: 1px solid var(--theme-border);
                color: var(--theme-text);
                width: 44px;
                height: 44px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.2rem;
                transition: all 0.3s ease;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            `;
            document.body.appendChild(toggle);
        }

        toggle.addEventListener('click', () => this.toggleTheme());
        this.updateThemeToggle();
    },

    // Update theme toggle button appearance
    updateThemeToggle: function() {
        const toggle = document.getElementById('theme-toggle');
        if (!toggle) return;

        const theme = this.themes[this.currentTheme];
        const effectiveTheme = this.currentTheme === 'auto' ? this.systemPreference : this.currentTheme;
        
        toggle.innerHTML = `<i class="${theme.icon}"></i>`;
        toggle.title = `Current: ${theme.name} theme`;
        
        // Add visual indicator for auto mode
        if (this.currentTheme === 'auto') {
            toggle.style.background = 'linear-gradient(45deg, var(--theme-card) 50%, var(--theme-hover) 50%)';
        } else {
            toggle.style.background = 'var(--theme-card)';
        }
    },

    // Setup event listeners
    setupEventListeners: function() {
        // Listen for manual theme changes
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Shift + T to toggle theme
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                this.toggleTheme();
            }
        });

        // Listen for storage changes (sync across tabs)
        window.addEventListener('storage', (e) => {
            if (e.key === 'kaspa-ecosystem-theme' && e.newValue) {
                this.applyTheme(e.newValue);
            }
        });
    },

    // Emit theme change event for other components to listen
    emitThemeChangeEvent: function(effectiveTheme, selectedTheme) {
        const event = new CustomEvent('themeChanged', {
            detail: {
                theme: effectiveTheme,
                selected: selectedTheme,
                isDark: effectiveTheme === 'dark'
            }
        });
        document.dispatchEvent(event);
    },

    // Get current theme info
    getCurrentTheme: function() {
        const effectiveTheme = this.currentTheme === 'auto' ? this.systemPreference : this.currentTheme;
        return {
            selected: this.currentTheme,
            effective: effectiveTheme,
            isDark: effectiveTheme === 'dark',
            colors: this.themes[effectiveTheme]
        };
    },

    // Create theme selector dropdown
    createThemeSelector: function(container) {
        const selector = document.createElement('div');
        selector.className = 'theme-selector';
        selector.innerHTML = `
            <label>Theme:</label>
            <select id="theme-select">
                <option value="auto">🌓 Auto</option>
                <option value="light">☀️ Light</option>
                <option value="dark">🌙 Dark</option>
            </select>
        `;

        const select = selector.querySelector('#theme-select');
        select.value = this.currentTheme;
        select.addEventListener('change', (e) => {
            this.setTheme(e.target.value);
        });

        if (typeof container === 'string') {
            document.getElementById(container)?.appendChild(selector);
        } else if (container) {
            container.appendChild(selector);
        }

        return selector;
    },

    // Add theme styles to document
    addThemeStyles: function() {
        if (document.getElementById('theme-manager-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'theme-manager-styles';
        styles.textContent = `
            :root {
                --theme-primary: #0F172A;
                --theme-secondary: #1E293B;
                --theme-accent: #49EACB;
                --theme-text: #CBD5E1;
                --theme-text-secondary: #64748B;
                --theme-border: #334155;
                --theme-card: #1E293B;
                --theme-hover: #334155;
            }

            /* Global theme application */
            body {
                background-color: var(--theme-primary);
                color: var(--theme-text);
                transition: background-color 0.3s ease, color 0.3s ease;
            }

            /* Card styles */
            .card, .project-card, .project-item {
                background-color: var(--theme-card);
                border-color: var(--theme-border);
                color: var(--theme-text);
            }

            /* Navigation */
            .nav, .navbar {
                background-color: var(--theme-secondary);
                border-color: var(--theme-border);
            }

            /* Buttons and inputs */
            .btn, button {
                background-color: var(--theme-secondary);
                border-color: var(--theme-border);
                color: var(--theme-text);
            }

            .btn:hover, button:hover {
                background-color: var(--theme-hover);
            }

            .btn-primary {
                background-color: var(--theme-accent);
                border-color: var(--theme-accent);
                color: var(--theme-primary);
            }

            /* Inputs */
            input, textarea, select {
                background-color: var(--theme-secondary);
                border-color: var(--theme-border);
                color: var(--theme-text);
            }

            input:focus, textarea:focus, select:focus {
                border-color: var(--theme-accent);
                box-shadow: 0 0 0 3px rgba(73, 234, 203, 0.1);
            }

            /* Theme toggle button */
            .theme-toggle {
                background: var(--theme-card);
                border: 1px solid var(--theme-border);
                color: var(--theme-text);
                padding: 8px 12px;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                min-width: 44px;
                height: 44px;
            }

            .theme-toggle:hover {
                background: var(--theme-hover);
                transform: translateY(-1px);
            }

            /* Theme selector */
            .theme-selector {
                display: flex;
                align-items: center;
                gap: 8px;
                margin: 10px 0;
            }

            .theme-selector label {
                color: var(--theme-text);
                font-weight: 500;
            }

            .theme-selector select {
                padding: 6px 10px;
                border-radius: 4px;
                background: var(--theme-secondary);
                border: 1px solid var(--theme-border);
                color: var(--theme-text);
            }

            /* Smooth transitions for theme changes */
            * {
                transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
            }

            /* Light theme specific adjustments */
            [data-theme="light"] {
                --shadow: 0 2px 8px rgba(0,0,0,0.1);
            }

            [data-theme="light"] .card,
            [data-theme="light"] .project-card {
                box-shadow: var(--shadow);
            }

            /* Dark theme specific adjustments */
            [data-theme="dark"] {
                --shadow: 0 2px 8px rgba(0,0,0,0.3);
            }

            [data-theme="dark"] .card,
            [data-theme="dark"] .project-card {
                box-shadow: var(--shadow);
            }
        `;

        document.head.appendChild(styles);
    },

    // Initialize with styles
    initWithStyles: function() {
        this.addThemeStyles();
        this.init();
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ThemeManager.initWithStyles());
} else {
    ThemeManager.initWithStyles();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}