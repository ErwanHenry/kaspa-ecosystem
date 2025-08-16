// Multi-Wallet UI Component for Kaspa Ecosystem
// Provides a unified interface for connecting to Kasware, Kastle, and KSPR wallets

const MultiWalletUI = {
    // Wallet metadata and display information
    walletInfo: {
        kasware: {
            name: 'Kasware Wallet',
            description: 'First Bitcoin & Kaspa wallet on Chrome extension',
            icon: '💼',
            installUrl: 'https://chromewebstore.google.com/detail/kasware-wallet/gncjnkkjlbhkjplflojlikedlkakgakp',
            features: ['KAS', 'KRC20', 'Message Signing'],
            status: 'stable'
        },
        kastle: {
            name: 'Kastle Wallet',
            description: 'Fast & Secure Kaspa Wallet with KRC20 support',
            icon: '🏰',
            installUrl: 'https://kastle.cc/',
            features: ['KAS', 'KRC20', 'KRC721'],
            status: 'stable'
        },
        kspr: {
            name: 'KSPR Wallet',
            description: 'First Kaspa wallet offering seamless KRC20 & NFT management',
            icon: '🚀',
            installUrl: 'https://chromewebstore.google.com/detail/kspr-wallet/bjjnnpilnbkodgfbmdlgbhkknfhglfac',
            features: ['KAS', 'KRC20', 'KRC721', 'NFTs'],
            status: 'stable'
        }
    },

    // Current UI state
    state: {
        isModalOpen: false,
        isConnecting: false,
        connectedWallet: null,
        error: null
    },

    // Initialize the multi-wallet UI
    init: function() {
        this.createModal();
        this.attachEventListeners();
        this.updateUI();
        this.checkExistingConnection();
    },

    // Create the wallet connection modal
    createModal: function() {
        if (document.getElementById('multi-wallet-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'multi-wallet-modal';
        modal.className = 'wallet-modal hidden';
        
        modal.innerHTML = `
            <div class="wallet-modal-overlay" onclick="MultiWalletUI.closeModal()">
                <div class="wallet-modal-content" onclick="event.stopPropagation()">
                    <div class="wallet-modal-header">
                        <h2><span class="wallet-icon">🔗</span> Connect Wallet</h2>
                        <button onclick="MultiWalletUI.closeModal()" class="modal-close">&times;</button>
                    </div>
                    
                    <div class="wallet-modal-body">
                        <p class="wallet-description">
                            Choose your preferred Kaspa wallet to connect and interact with the ecosystem.
                        </p>
                        
                        <div id="wallet-status" class="wallet-status hidden"></div>
                        
                        <div class="wallet-grid">
                            ${Object.entries(this.walletInfo).map(([key, wallet]) => `
                                <div class="wallet-card" data-wallet="${key}">
                                    <div class="wallet-card-header">
                                        <span class="wallet-icon">${wallet.icon}</span>
                                        <div class="wallet-info">
                                            <h3>${wallet.name}</h3>
                                            <p class="wallet-desc">${wallet.description}</p>
                                        </div>
                                        <div class="wallet-status-indicator" id="status-${key}">
                                            <span class="status-text">Checking...</span>
                                        </div>
                                    </div>
                                    
                                    <div class="wallet-features">
                                        ${wallet.features.map(feature => `
                                            <span class="feature-tag">${feature}</span>
                                        `).join('')}
                                    </div>
                                    
                                    <div class="wallet-actions">
                                        <button class="btn-connect" data-wallet="${key}" disabled>
                                            <span class="btn-text">Connect</span>
                                            <span class="btn-loading hidden">⏳</span>
                                        </button>
                                        <button class="btn-install hidden" data-wallet="${key}">
                                            Install Wallet
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div class="wallet-help">
                            <details>
                                <summary>Need help choosing a wallet?</summary>
                                <div class="help-content">
                                    <p><strong>Kasware:</strong> Great for users who also use Bitcoin. Supports basic KAS and KRC20 tokens.</p>
                                    <p><strong>Kastle:</strong> Feature-rich wallet with excellent KRC20 and KRC721 support.</p>
                                    <p><strong>KSPR:</strong> Best for NFT enthusiasts with comprehensive KRC721 and DApp support.</p>
                                </div>
                            </details>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.addStyles();
    },

    // Check for existing wallet connections
    checkExistingConnection: function() {
        if (typeof KaspaWallet !== 'undefined') {
            const connectedWallet = KaspaWallet.getConnectedWallet();
            if (connectedWallet) {
                this.state.connectedWallet = connectedWallet;
                this.updateUI();
            }
        }
    },

    // Show the wallet connection modal
    showModal: function() {
        const modal = document.getElementById('multi-wallet-modal');
        if (modal) {
            modal.classList.remove('hidden');
            this.state.isModalOpen = true;
            this.checkWalletAvailability();
            document.body.style.overflow = 'hidden';
        }
    },

    // Close the wallet connection modal
    closeModal: function() {
        const modal = document.getElementById('multi-wallet-modal');
        if (modal) {
            modal.classList.add('hidden');
            this.state.isModalOpen = false;
            document.body.style.overflow = '';
        }
    },

    // Check which wallets are available
    checkWalletAvailability: function() {
        if (typeof KaspaWallet === 'undefined') {
            this.showError('KaspaWallet integration not loaded');
            return;
        }

        KaspaWallet.checkWallets();

        Object.keys(this.walletInfo).forEach(walletType => {
            const wallet = KaspaWallet.wallets[walletType];
            const statusEl = document.getElementById(`status-${walletType}`);
            const connectBtn = document.querySelector(`[data-wallet="${walletType}"].btn-connect`);
            const installBtn = document.querySelector(`[data-wallet="${walletType}"].btn-install`);

            if (wallet.installed) {
                statusEl.innerHTML = '<span class="status-dot installed"></span><span class="status-text">Installed</span>';
                connectBtn.disabled = false;
                connectBtn.classList.remove('hidden');
                installBtn.classList.add('hidden');
            } else {
                statusEl.innerHTML = '<span class="status-dot not-installed"></span><span class="status-text">Not Installed</span>';
                connectBtn.disabled = true;
                connectBtn.classList.add('hidden');
                installBtn.classList.remove('hidden');
            }
        });
    },

    // Connect to a specific wallet
    connectWallet: async function(walletType) {
        if (typeof KaspaWallet === 'undefined') {
            this.showError('KaspaWallet integration not loaded');
            return;
        }

        this.state.isConnecting = true;
        this.state.error = null;
        
        const connectBtn = document.querySelector(`[data-wallet="${walletType}"].btn-connect`);
        const btnText = connectBtn.querySelector('.btn-text');
        const btnLoading = connectBtn.querySelector('.btn-loading');
        
        btnText.classList.add('hidden');
        btnLoading.classList.remove('hidden');
        connectBtn.disabled = true;

        try {
            let address;
            switch (walletType) {
                case 'kasware':
                    address = await KaspaWallet.connectKasware();
                    break;
                case 'kastle':
                    address = await KaspaWallet.connectKastle();
                    break;
                case 'kspr':
                    address = await KaspaWallet.connectKspr();
                    break;
                default:
                    throw new Error(`Unknown wallet type: ${walletType}`);
            }

            this.state.connectedWallet = {
                type: walletType,
                address: address,
                name: this.walletInfo[walletType].name
            };

            this.showSuccess(`Connected to ${this.walletInfo[walletType].name}`);
            this.updateUI();
            this.closeModal();

            // Trigger custom event for other components
            window.dispatchEvent(new CustomEvent('walletConnected', {
                detail: this.state.connectedWallet
            }));

        } catch (error) {
            console.error(`Error connecting to ${walletType}:`, error);
            this.showError(error.message);
        } finally {
            this.state.isConnecting = false;
            btnText.classList.remove('hidden');
            btnLoading.classList.add('hidden');
            connectBtn.disabled = false;
        }
    },

    // Disconnect wallet
    disconnectWallet: function() {
        if (typeof KaspaWallet !== 'undefined') {
            KaspaWallet.disconnect();
        }
        
        this.state.connectedWallet = null;
        this.updateUI();

        // Trigger custom event
        window.dispatchEvent(new CustomEvent('walletDisconnected'));
        
        this.showSuccess('Wallet disconnected');
    },

    // Install wallet
    installWallet: function(walletType) {
        const walletInfo = this.walletInfo[walletType];
        if (walletInfo && walletInfo.installUrl) {
            window.open(walletInfo.installUrl, '_blank');
        }
    },

    // Show success message
    showSuccess: function(message) {
        this.showStatus(message, 'success');
    },

    // Show error message
    showError: function(message) {
        this.showStatus(message, 'error');
        this.state.error = message;
    },

    // Show status message
    showStatus: function(message, type = 'info') {
        const statusEl = document.getElementById('wallet-status');
        if (statusEl) {
            statusEl.className = `wallet-status ${type}`;
            statusEl.textContent = message;
            statusEl.classList.remove('hidden');

            // Auto-hide after 5 seconds
            setTimeout(() => {
                statusEl.classList.add('hidden');
            }, 5000);
        }

        // Also show toast if available
        if (typeof showToast === 'function') {
            showToast(message, type);
        }
    },

    // Update UI based on current state
    updateUI: function() {
        // Update main connect button
        const mainConnectBtn = document.querySelector('.wallet-connect-btn');
        if (mainConnectBtn) {
            if (this.state.connectedWallet) {
                mainConnectBtn.innerHTML = `
                    <span class="wallet-icon">${this.walletInfo[this.state.connectedWallet.type]?.icon || '🔗'}</span>
                    <span class="wallet-text">
                        <span class="wallet-name">${this.state.connectedWallet.name}</span>
                        <span class="wallet-address">${this.formatAddress(this.state.connectedWallet.address)}</span>
                    </span>
                    <span class="wallet-dropdown">▼</span>
                `;
                mainConnectBtn.classList.add('connected');
            } else {
                mainConnectBtn.innerHTML = `
                    <span class="wallet-icon">🔗</span>
                    <span class="wallet-text">Connect Wallet</span>
                `;
                mainConnectBtn.classList.remove('connected');
            }
        }
    },

    // Format wallet address for display
    formatAddress: function(address) {
        if (!address) return '';
        if (address.length <= 12) return address;
        return `${address.slice(0, 6)}...${address.slice(-6)}`;
    },

    // Attach event listeners
    attachEventListeners: function() {
        // Listen for clicks on wallet connect buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-connect') || e.target.closest('.btn-connect')) {
                const btn = e.target.classList.contains('btn-connect') ? e.target : e.target.closest('.btn-connect');
                const walletType = btn.getAttribute('data-wallet');
                if (walletType) {
                    this.connectWallet(walletType);
                }
            }

            if (e.target.classList.contains('btn-install') || e.target.closest('.btn-install')) {
                const btn = e.target.classList.contains('btn-install') ? e.target : e.target.closest('.btn-install');
                const walletType = btn.getAttribute('data-wallet');
                if (walletType) {
                    this.installWallet(walletType);
                }
            }

            // Main wallet connect button
            if (e.target.classList.contains('wallet-connect-btn') || e.target.closest('.wallet-connect-btn')) {
                if (this.state.connectedWallet) {
                    // Show dropdown with disconnect option
                    this.showWalletDropdown(e.target);
                } else {
                    this.showModal();
                }
            }
        });

        // Listen for wallet events
        window.addEventListener('walletConnected', (e) => {
            console.log('Wallet connected:', e.detail);
        });

        window.addEventListener('walletDisconnected', () => {
            console.log('Wallet disconnected');
        });
    },

    // Show wallet dropdown menu
    showWalletDropdown: function(button) {
        // Remove existing dropdown
        const existingDropdown = document.querySelector('.wallet-dropdown-menu');
        if (existingDropdown) {
            existingDropdown.remove();
        }

        const dropdown = document.createElement('div');
        dropdown.className = 'wallet-dropdown-menu';
        dropdown.innerHTML = `
            <div class="dropdown-item" onclick="MultiWalletUI.copyAddress()">
                <span class="dropdown-icon">📋</span>
                Copy Address
            </div>
            <div class="dropdown-item" onclick="MultiWalletUI.showWalletInfo()">
                <span class="dropdown-icon">ℹ️</span>
                Wallet Info
            </div>
            <div class="dropdown-item disconnect" onclick="MultiWalletUI.disconnectWallet()">
                <span class="dropdown-icon">🔌</span>
                Disconnect
            </div>
        `;

        // Position dropdown
        const rect = button.getBoundingClientRect();
        dropdown.style.position = 'fixed';
        dropdown.style.top = `${rect.bottom + 5}px`;
        dropdown.style.right = `${window.innerWidth - rect.right}px`;

        document.body.appendChild(dropdown);

        // Close dropdown when clicking outside
        const closeDropdown = (e) => {
            if (!dropdown.contains(e.target) && !button.contains(e.target)) {
                dropdown.remove();
                document.removeEventListener('click', closeDropdown);
            }
        };
        setTimeout(() => document.addEventListener('click', closeDropdown), 0);
    },

    // Copy wallet address to clipboard
    copyAddress: function() {
        if (this.state.connectedWallet?.address) {
            navigator.clipboard.writeText(this.state.connectedWallet.address).then(() => {
                this.showSuccess('Address copied to clipboard');
            }).catch(() => {
                this.showError('Failed to copy address');
            });
        }
    },

    // Show wallet information
    showWalletInfo: async function() {
        if (!this.state.connectedWallet) return;

        try {
            const wallet = this.state.connectedWallet;
            const balance = typeof KaspaWallet !== 'undefined' ? await KaspaWallet.getBalance() : null;
            const network = typeof KaspaWallet !== 'undefined' ? await KaspaWallet.getNetwork() : null;

            alert(`Wallet Info:
Name: ${wallet.name}
Address: ${wallet.address}
Balance: ${balance ? `${balance} KAS` : 'Unknown'}
Network: ${network || 'Unknown'}`);
        } catch (error) {
            this.showError('Failed to get wallet info');
        }
    },

    // Create and add wallet connect button to navigation
    createConnectButton: function() {
        const button = document.createElement('button');
        button.className = 'wallet-connect-btn';
        button.innerHTML = `
            <span class="wallet-icon">🔗</span>
            <span class="wallet-text">Connect Wallet</span>
        `;

        // Add to navigation
        const nav = document.querySelector('.nav-actions') || 
                   document.querySelector('.navbar') || 
                   document.querySelector('nav');

        if (nav) {
            nav.appendChild(button);
        }

        return button;
    },

    // Add CSS styles
    addStyles: function() {
        if (document.getElementById('multi-wallet-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'multi-wallet-styles';
        styles.textContent = `
            .wallet-modal {
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
            
            .wallet-modal.hidden {
                opacity: 0;
                pointer-events: none;
            }
            
            .wallet-modal-content {
                background: var(--theme-primary);
                border-radius: 12px;
                max-width: 800px;
                width: 100%;
                max-height: 90vh;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                border: 1px solid var(--theme-border);
            }
            
            .wallet-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 1px solid var(--theme-border);
                background: var(--theme-secondary);
            }
            
            .wallet-modal-header h2 {
                margin: 0;
                color: var(--theme-text);
                display: flex;
                align-items: center;
                gap: 10px;
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
            
            .wallet-modal-body {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
            }
            
            .wallet-description {
                color: var(--theme-text-secondary);
                margin-bottom: 20px;
                text-align: center;
                font-size: 1.1rem;
            }
            
            .wallet-status {
                padding: 12px;
                border-radius: 6px;
                margin-bottom: 20px;
                text-align: center;
                font-weight: 500;
            }
            
            .wallet-status.success {
                background: #10B981;
                color: white;
            }
            
            .wallet-status.error {
                background: #EF4444;
                color: white;
            }
            
            .wallet-status.info {
                background: var(--theme-accent);
                color: white;
            }
            
            .wallet-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .wallet-card {
                background: var(--theme-card);
                border: 1px solid var(--theme-border);
                border-radius: 8px;
                padding: 20px;
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            }
            
            .wallet-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            
            .wallet-card-header {
                display: flex;
                align-items: flex-start;
                gap: 15px;
                margin-bottom: 15px;
            }
            
            .wallet-icon {
                font-size: 2rem;
                flex-shrink: 0;
            }
            
            .wallet-info {
                flex: 1;
            }
            
            .wallet-info h3 {
                margin: 0 0 5px 0;
                color: var(--theme-text);
                font-size: 1.1rem;
            }
            
            .wallet-desc {
                margin: 0;
                color: var(--theme-text-secondary);
                font-size: 0.9rem;
                line-height: 1.4;
            }
            
            .wallet-status-indicator {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 0.8rem;
            }
            
            .status-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #6B7280;
            }
            
            .status-dot.installed {
                background: #10B981;
            }
            
            .status-dot.not-installed {
                background: #EF4444;
            }
            
            .wallet-features {
                display: flex;
                gap: 6px;
                flex-wrap: wrap;
                margin-bottom: 15px;
            }
            
            .feature-tag {
                background: var(--theme-accent);
                color: white;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 0.7rem;
                font-weight: 500;
            }
            
            .wallet-actions {
                display: flex;
                gap: 10px;
            }
            
            .btn-connect, .btn-install {
                flex: 1;
                padding: 10px 16px;
                border: none;
                border-radius: 6px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
            }
            
            .btn-connect {
                background: #49EACB;
                color: #0F172A;
            }
            
            .btn-connect:hover:not(:disabled) {
                background: #3DD5B0;
                transform: translateY(-1px);
            }
            
            .btn-connect:disabled {
                background: #6B7280;
                color: #9CA3AF;
                cursor: not-allowed;
            }
            
            .btn-install {
                background: transparent;
                color: var(--theme-text);
                border: 1px solid var(--theme-border);
            }
            
            .btn-install:hover {
                background: var(--theme-hover);
            }
            
            .wallet-help {
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid var(--theme-border);
            }
            
            .wallet-help details {
                color: var(--theme-text-secondary);
            }
            
            .wallet-help summary {
                cursor: pointer;
                font-weight: 500;
                color: var(--theme-text);
                margin-bottom: 10px;
            }
            
            .help-content p {
                margin: 5px 0;
                line-height: 1.5;
            }
            
            .wallet-connect-btn {
                display: flex;
                align-items: center;
                gap: 8px;
                background: var(--theme-secondary);
                border: 1px solid var(--theme-border);
                color: var(--theme-text);
                padding: 8px 12px;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.3s ease;
                text-decoration: none;
                min-width: 140px;
            }
            
            .wallet-connect-btn:hover {
                background: var(--theme-hover);
                transform: translateY(-1px);
            }
            
            .wallet-connect-btn.connected {
                background: #49EACB;
                color: #0F172A;
                border-color: #49EACB;
            }
            
            .wallet-text {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                flex: 1;
            }
            
            .wallet-name {
                font-weight: 500;
                font-size: 0.9rem;
            }
            
            .wallet-address {
                font-size: 0.75rem;
                opacity: 0.8;
            }
            
            .wallet-dropdown {
                font-size: 0.8rem;
                opacity: 0.7;
            }
            
            .wallet-dropdown-menu {
                background: var(--theme-primary);
                border: 1px solid var(--theme-border);
                border-radius: 6px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10001;
                min-width: 160px;
            }
            
            .dropdown-item {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 10px 12px;
                color: var(--theme-text);
                cursor: pointer;
                transition: background 0.2s ease;
                border-bottom: 1px solid var(--theme-border);
            }
            
            .dropdown-item:last-child {
                border-bottom: none;
            }
            
            .dropdown-item:hover {
                background: var(--theme-hover);
            }
            
            .dropdown-item.disconnect {
                color: #EF4444;
            }
            
            .dropdown-icon {
                font-size: 0.9rem;
            }
            
            @media (max-width: 768px) {
                .wallet-modal-content {
                    margin: 10px;
                    max-width: calc(100vw - 20px);
                }
                
                .wallet-grid {
                    grid-template-columns: 1fr;
                }
                
                .wallet-card-header {
                    flex-direction: column;
                    gap: 10px;
                }
                
                .wallet-status-indicator {
                    align-self: flex-start;
                }
                
                .wallet-connect-btn .wallet-text {
                    display: none;
                }
            }
        `;

        document.head.appendChild(styles);
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        MultiWalletUI.init();
        MultiWalletUI.createConnectButton();
    });
} else {
    MultiWalletUI.init();
    MultiWalletUI.createConnectButton();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MultiWalletUI;
}