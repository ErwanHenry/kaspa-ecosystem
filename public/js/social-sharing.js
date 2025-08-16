// Social Sharing Module for Kaspa Ecosystem
// Handles sharing projects to various social platforms

const SocialSharing = {
    // Platform configurations
    platforms: {
        twitter: {
            name: 'Twitter',
            icon: 'fab fa-twitter',
            color: '#1DA1F2',
            baseUrl: 'https://twitter.com/intent/tweet'
        },
        telegram: {
            name: 'Telegram',
            icon: 'fab fa-telegram',
            color: '#0088cc',
            baseUrl: 'https://t.me/share/url'
        },
        discord: {
            name: 'Discord',
            icon: 'fab fa-discord',
            color: '#5865F2',
            baseUrl: null // Custom handling
        },
        reddit: {
            name: 'Reddit',
            icon: 'fab fa-reddit',
            color: '#FF4500',
            baseUrl: 'https://reddit.com/submit'
        },
        linkedin: {
            name: 'LinkedIn',
            icon: 'fab fa-linkedin',
            color: '#0077B5',
            baseUrl: 'https://www.linkedin.com/sharing/share-offsite'
        },
        facebook: {
            name: 'Facebook',
            icon: 'fab fa-facebook',
            color: '#1877F2',
            baseUrl: 'https://www.facebook.com/sharer/sharer.php'
        },
        copy: {
            name: 'Copy Link',
            icon: 'fas fa-copy',
            color: '#64748B',
            baseUrl: null // Custom handling
        }
    },

    // Generate share URLs for different platforms
    generateShareUrl: function(platform, data) {
        const { title, description, url, hashtags = [] } = data;
        const platforms = this.platforms;
        
        switch (platform) {
            case 'twitter':
                const twitterText = `${title}\\n\\n${description}\\n\\n${hashtags.map(tag => `#${tag}`).join(' ')} #Kaspa #KaspaEcosystem`;
                return `${platforms.twitter.baseUrl}?text=${encodeURIComponent(twitterText)}&url=${encodeURIComponent(url)}`;
                
            case 'telegram':
                const telegramText = `${title}\\n\\n${description}`;
                return `${platforms.telegram.baseUrl}?url=${encodeURIComponent(url)}&text=${encodeURIComponent(telegramText)}`;
                
            case 'reddit':
                return `${platforms.reddit.baseUrl}?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
                
            case 'linkedin':
                return `${platforms.linkedin.baseUrl}?url=${encodeURIComponent(url)}`;
                
            case 'facebook':
                return `${platforms.facebook.baseUrl}?u=${encodeURIComponent(url)}`;
                
            default:
                return url;
        }
    },

    // Share a project
    shareProject: function(project, platform = 'twitter') {
        const shareData = this.prepareProjectShareData(project);
        
        if (platform === 'copy') {
            this.copyToClipboard(shareData.url);
            return;
        }
        
        if (platform === 'discord') {
            this.shareToDiscord(shareData);
            return;
        }
        
        const shareUrl = this.generateShareUrl(platform, shareData);
        window.open(shareUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
    },

    // Prepare project data for sharing
    prepareProjectShareData: function(project) {
        const baseUrl = window.location.origin;
        const projectUrl = `${baseUrl}?project=${project.slug || project.id}`;
        
        let description = project.description || 'Check out this awesome Kaspa ecosystem project!';
        if (description.length > 200) {
            description = description.substring(0, 197) + '...';
        }
        
        const hashtags = [
            'Kaspa',
            'KaspaEcosystem',
            'Blockchain',
            'Crypto'
        ];
        
        // Add category as hashtag
        if (project.category_name) {
            hashtags.push(project.category_name.replace(/\\s+/g, ''));
        }
        
        // Add programming language as hashtag
        if (project.github_language) {
            hashtags.push(project.github_language);
        }
        
        return {
            title: project.title,
            description: description,
            url: projectUrl,
            hashtags: hashtags,
            image: project.logo_url
        };
    },

    // Copy URL to clipboard
    copyToClipboard: async function(url) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(url);
                this.showToast('Link copied to clipboard!', 'success');
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = url;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                try {
                    document.execCommand('copy');
                    this.showToast('Link copied to clipboard!', 'success');
                } catch (err) {
                    this.showToast('Failed to copy link', 'error');
                }
                
                document.body.removeChild(textArea);
            }
        } catch (err) {
            this.showToast('Failed to copy link', 'error');
        }
    },

    // Share to Discord (custom handling)
    shareToDiscord: function(shareData) {
        const discordText = `**${shareData.title}**\\n\\n${shareData.description}\\n\\n${shareData.url}\\n\\n${shareData.hashtags.map(tag => `#${tag}`).join(' ')}`;
        
        this.copyToClipboard(discordText);
        this.showToast('Discord message copied! Paste it in your Discord channel.', 'info');
    },

    // Generate share buttons HTML
    generateShareButtons: function(project, container = null) {
        const shareData = this.prepareProjectShareData(project);
        const platforms = ['twitter', 'telegram', 'discord', 'reddit', 'copy'];
        
        let buttonsHtml = '<div class="share-buttons">';
        
        platforms.forEach(platform => {
            const platformConfig = this.platforms[platform];
            buttonsHtml += `
                <button class="share-btn share-btn-${platform}" 
                        onclick="SocialSharing.shareProject(${JSON.stringify(project).replace(/"/g, '&quot;')}, '${platform}')"
                        title="Share on ${platformConfig.name}"
                        style="color: ${platformConfig.color}; border-color: ${platformConfig.color};">
                    <i class="${platformConfig.icon}"></i>
                    <span class="share-btn-text">${platformConfig.name}</span>
                </button>
            `;
        });
        
        buttonsHtml += '</div>';
        
        if (container) {
            document.getElementById(container).innerHTML = buttonsHtml;
        }
        
        return buttonsHtml;
    },

    // Generate share menu (compact version)
    generateShareMenu: function(project) {
        const platforms = ['twitter', 'telegram', 'copy'];
        
        let menuHtml = '<div class="share-menu">';
        
        platforms.forEach(platform => {
            const platformConfig = this.platforms[platform];
            menuHtml += `
                <a class="share-menu-item" 
                   onclick="SocialSharing.shareProject(${JSON.stringify(project).replace(/"/g, '&quot;')}, '${platform}')"
                   title="Share on ${platformConfig.name}">
                    <i class="${platformConfig.icon}" style="color: ${platformConfig.color};"></i>
                    <span>${platformConfig.name}</span>
                </a>
            `;
        });
        
        menuHtml += '</div>';
        return menuHtml;
    },

    // Share ecosystem stats
    shareEcosystemStats: function(stats, platform = 'twitter') {
        const shareData = {
            title: 'Kaspa Ecosystem Statistics',
            description: `🚀 The Kaspa ecosystem is growing!\\n\\n📊 ${stats.total_projects} total projects\\n⭐ ${stats.active_projects} active projects\\n👥 ${stats.total_ratings} community ratings\\n✅ ${stats.verified_projects} verified projects`,
            url: window.location.origin,
            hashtags: ['KaspaEcosystem', 'Kaspa', 'Blockchain', 'Stats']
        };
        
        if (platform === 'copy') {
            this.copyToClipboard(`${shareData.title}\\n\\n${shareData.description}\\n\\n${shareData.url}`);
            return;
        }
        
        const shareUrl = this.generateShareUrl(platform, shareData);
        window.open(shareUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
    },

    // Share trending projects
    shareTrendingProjects: function(projects, platform = 'twitter') {
        const topProjects = projects.slice(0, 3);
        const projectList = topProjects.map((p, i) => `${i + 1}. ${p.title}`).join('\\n');
        
        const shareData = {
            title: 'Trending Kaspa Projects',
            description: `🔥 Trending projects in the Kaspa ecosystem:\\n\\n${projectList}\\n\\nDiscover more at`,
            url: window.location.origin,
            hashtags: ['KaspaTrending', 'KaspaEcosystem', 'Blockchain']
        };
        
        if (platform === 'copy') {
            this.copyToClipboard(`${shareData.title}\\n\\n${shareData.description}\\n\\n${shareData.url}`);
            return;
        }
        
        const shareUrl = this.generateShareUrl(platform, shareData);
        window.open(shareUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
    },

    // Show toast notification
    showToast: function(message, type = 'info') {
        // Check if there's a global toast function available
        if (typeof showToast === 'function') {
            showToast(message, type);
            return;
        }
        
        // Fallback: create simple toast
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease;
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    },

    // Initialize social sharing
    init: function() {
        // Add CSS for share buttons
        this.addStyles();
        
        // Listen for share button clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('.share-trigger')) {
                e.preventDefault();
                const projectData = e.target.closest('.project-item')?.dataset.project;
                if (projectData) {
                    const project = JSON.parse(projectData);
                    this.showShareModal(project);
                }
            }
        });
    },

    // Add CSS styles for share buttons
    addStyles: function() {
        if (document.getElementById('social-sharing-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'social-sharing-styles';
        styles.textContent = `
            .share-buttons {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
                margin: 10px 0;
            }
            
            .share-btn {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 8px 12px;
                border: 1px solid;
                border-radius: 6px;
                background: transparent;
                text-decoration: none;
                font-size: 0.875rem;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .share-btn:hover {
                background: currentColor;
                color: white !important;
                transform: translateY(-1px);
            }
            
            .share-btn i {
                font-size: 1rem;
            }
            
            .share-menu {
                display: flex;
                flex-direction: column;
                background: #1E293B;
                border-radius: 8px;
                padding: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                min-width: 150px;
            }
            
            .share-menu-item {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 8px 12px;
                text-decoration: none;
                color: #CBD5E1;
                border-radius: 4px;
                cursor: pointer;
                transition: background 0.2s ease;
            }
            
            .share-menu-item:hover {
                background: #334155;
                color: white;
            }
            
            @media (max-width: 768px) {
                .share-btn-text {
                    display: none;
                }
                
                .share-btn {
                    padding: 8px;
                    min-width: 40px;
                    justify-content: center;
                }
            }
            
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        
        document.head.appendChild(styles);
    },

    // Show share modal
    showShareModal: function(project) {
        const modal = document.createElement('div');
        modal.className = 'share-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div class="share-modal-content" style="
                background: #1E293B;
                padding: 24px;
                border-radius: 12px;
                max-width: 400px;
                width: 90%;
                color: #CBD5E1;
            ">
                <h3 style="margin: 0 0 16px 0; color: #49EACB;">Share ${project.title}</h3>
                ${this.generateShareButtons(project)}
                <button onclick="this.closest('.share-modal').remove()" style="
                    margin-top: 16px;
                    padding: 8px 16px;
                    background: #374151;
                    border: none;
                    color: #CBD5E1;
                    border-radius: 6px;
                    cursor: pointer;
                ">Close</button>
            </div>
        `;
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        document.body.appendChild(modal);
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SocialSharing.init());
} else {
    SocialSharing.init();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SocialSharing;
}