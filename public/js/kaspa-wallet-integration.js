// Kaspa Wallet Integration
// This file handles wallet connections for Kasware, Kastle, and other Kaspa wallets

const KaspaWallet = {
    // Supported wallets
    wallets: {
        kasware: {
            name: 'Kasware Wallet',
            installed: false,
            connected: false,
            address: null
        },
        kastle: {
            name: 'Kastle Wallet',
            installed: false,
            connected: false,
            address: null
        },
        kspr: {
            name: 'KSPR Wallet',
            installed: false,
            connected: false,
            address: null
        }
    },

    // Check if wallets are installed
    checkWallets: function() {
        if (typeof window.kasware !== 'undefined') {
            this.wallets.kasware.installed = true;
        }
        if (typeof window.kastle !== 'undefined') {
            this.wallets.kastle.installed = true;
        }
        if (typeof window.kspr !== 'undefined') {
            this.wallets.kspr.installed = true;
        }
    },

    // Connect to Kasware wallet
    connectKasware: async function() {
        if (!this.wallets.kasware.installed) {
            throw new Error('Kasware wallet not installed');
        }

        try {
            const accounts = await window.kasware.requestAccounts();
            if (accounts.length > 0) {
                this.wallets.kasware.connected = true;
                this.wallets.kasware.address = accounts[0];
                return accounts[0];
            }
            throw new Error('No accounts found');
        } catch (error) {
            console.error('Error connecting to Kasware:', error);
            throw error;
        }
    },

    // Connect to Kastle wallet
    connectKastle: async function() {
        if (!this.wallets.kastle.installed) {
            throw new Error('Kastle wallet not installed. Please install from https://kastle.cc/');
        }

        try {
            // Kastle wallet follows similar pattern to Kasware
            const accounts = await window.kastle.requestAccounts();
            if (accounts.length > 0) {
                this.wallets.kastle.connected = true;
                this.wallets.kastle.address = accounts[0];
                return accounts[0];
            }
            throw new Error('No accounts found in Kastle wallet');
        } catch (error) {
            console.error('Error connecting to Kastle:', error);
            throw error;
        }
    },

    // Connect to KSPR wallet
    connectKspr: async function() {
        if (!this.wallets.kspr.installed) {
            throw new Error('KSPR wallet not installed. Please install from Chrome Web Store');
        }

        try {
            // KSPR wallet follows similar API pattern
            const accounts = await window.kspr.requestAccounts();
            if (accounts.length > 0) {
                this.wallets.kspr.connected = true;
                this.wallets.kspr.address = accounts[0];
                return accounts[0];
            }
            throw new Error('No accounts found in KSPR wallet');
        } catch (error) {
            console.error('Error connecting to KSPR:', error);
            throw error;
        }
    },

    // Get connected wallet info
    getConnectedWallet: function() {
        for (const [key, wallet] of Object.entries(this.wallets)) {
            if (wallet.connected) {
                return {
                    type: key,
                    ...wallet
                };
            }
        }
        return null;
    },

    // Disconnect all wallets
    disconnect: function() {
        for (const wallet of Object.values(this.wallets)) {
            wallet.connected = false;
            wallet.address = null;
        }
    },

    // Sign message with connected wallet
    signMessage: async function(message) {
        const wallet = this.getConnectedWallet();
        if (!wallet) {
            throw new Error('No wallet connected');
        }

        switch (wallet.type) {
            case 'kasware':
                return await window.kasware.signMessage(message);
            case 'kastle':
                if (window.kastle.signMessage) {
                    return await window.kastle.signMessage(message);
                }
                throw new Error('Kastle message signing not supported in this version');
            case 'kspr':
                if (window.kspr.signMessage) {
                    return await window.kspr.signMessage(message);
                }
                throw new Error('KSPR message signing not supported in this version');
            default:
                throw new Error('Unknown wallet type');
        }
    },

    // Get balance (if supported)
    getBalance: async function() {
        const wallet = this.getConnectedWallet();
        if (!wallet) {
            throw new Error('No wallet connected');
        }

        switch (wallet.type) {
            case 'kasware':
                if (window.kasware.getBalance) {
                    return await window.kasware.getBalance();
                }
                break;
            case 'kastle':
                if (window.kastle.getBalance) {
                    return await window.kastle.getBalance();
                }
                break;
            case 'kspr':
                if (window.kspr.getBalance) {
                    return await window.kspr.getBalance();
                }
                break;
        }
        return null;
    },

    // Get current network
    getNetwork: async function() {
        const wallet = this.getConnectedWallet();
        if (!wallet) {
            throw new Error('No wallet connected');
        }

        switch (wallet.type) {
            case 'kasware':
                if (window.kasware.getNetwork) {
                    return await window.kasware.getNetwork();
                }
                break;
            case 'kastle':
                if (window.kastle.getNetwork) {
                    return await window.kastle.getNetwork();
                }
                break;
            case 'kspr':
                if (window.kspr.getNetwork) {
                    return await window.kspr.getNetwork();
                }
                break;
        }
        return 'mainnet'; // Default assumption
    },

    // Switch network
    switchNetwork: async function(network) {
        const wallet = this.getConnectedWallet();
        if (!wallet) {
            throw new Error('No wallet connected');
        }

        switch (wallet.type) {
            case 'kasware':
                if (window.kasware.switchNetwork) {
                    return await window.kasware.switchNetwork(network);
                }
                break;
            case 'kastle':
                if (window.kastle.switchNetwork) {
                    return await window.kastle.switchNetwork(network);
                }
                break;
            case 'kspr':
                if (window.kspr.switchNetwork) {
                    return await window.kspr.switchNetwork(network);
                }
                break;
        }
        throw new Error(`Network switching not supported for ${wallet.type}`);
    },

    // Get accounts
    getAccounts: async function() {
        const wallet = this.getConnectedWallet();
        if (!wallet) {
            throw new Error('No wallet connected');
        }

        switch (wallet.type) {
            case 'kasware':
                if (window.kasware.getAccounts) {
                    return await window.kasware.getAccounts();
                }
                break;
            case 'kastle':
                if (window.kastle.getAccounts) {
                    return await window.kastle.getAccounts();
                }
                break;
            case 'kspr':
                if (window.kspr.getAccounts) {
                    return await window.kspr.getAccounts();
                }
                break;
        }
        return [wallet.address];
    },

    // Get UTXO entries (for transaction building)
    getUtxoEntries: async function() {
        const wallet = this.getConnectedWallet();
        if (!wallet) {
            throw new Error('No wallet connected');
        }

        switch (wallet.type) {
            case 'kasware':
                if (window.kasware.getUtxoEntries) {
                    return await window.kasware.getUtxoEntries();
                }
                break;
            case 'kastle':
                if (window.kastle.getUtxoEntries) {
                    return await window.kastle.getUtxoEntries();
                }
                break;
            case 'kspr':
                if (window.kspr.getUtxoEntries) {
                    return await window.kspr.getUtxoEntries();
                }
                break;
        }
        throw new Error(`UTXO entries not supported for ${wallet.type}`);
    },

    // Send KAS transaction
    sendKAS: async function(to, amount) {
        const wallet = this.getConnectedWallet();
        if (!wallet) {
            throw new Error('No wallet connected');
        }

        switch (wallet.type) {
            case 'kasware':
                if (window.kasware.sendKAS) {
                    return await window.kasware.sendKAS(to, amount);
                }
                break;
            case 'kastle':
                if (window.kastle.sendKAS) {
                    return await window.kastle.sendKAS(to, amount);
                }
                break;
            case 'kspr':
                if (window.kspr.sendKAS) {
                    return await window.kspr.sendKAS(to, amount);
                }
                break;
        }
        throw new Error(`KAS sending not supported for ${wallet.type}`);
    },

    // Generic wallet connection (tries all available wallets)
    connectAny: async function() {
        this.checkWallets();
        
        // Try wallets in priority order
        const walletPriority = ['kasware', 'kastle', 'kspr'];
        
        for (const walletType of walletPriority) {
            if (this.wallets[walletType].installed) {
                try {
                    switch (walletType) {
                        case 'kasware':
                            return await this.connectKasware();
                        case 'kastle':
                            return await this.connectKastle();
                        case 'kspr':
                            return await this.connectKspr();
                    }
                } catch (error) {
                    console.warn(`Failed to connect to ${walletType}:`, error);
                    continue;
                }
            }
        }
        
        throw new Error('No compatible wallet found. Please install Kasware, Kastle, or KSPR wallet.');
    },

    // Check if any wallet is connected
    isConnected: function() {
        return this.getConnectedWallet() !== null;
    },

    // Get installed wallets
    getInstalledWallets: function() {
        this.checkWallets();
        return Object.entries(this.wallets)
            .filter(([_, wallet]) => wallet.installed)
            .map(([type, wallet]) => ({ type, ...wallet }));
    },

    // Listen for account changes
    onAccountsChanged: function(callback) {
        const wallet = this.getConnectedWallet();
        if (!wallet) return;

        switch (wallet.type) {
            case 'kasware':
                if (window.kasware.on) {
                    window.kasware.on('accountsChanged', callback);
                }
                break;
            case 'kastle':
                if (window.kastle.on) {
                    window.kastle.on('accountsChanged', callback);
                }
                break;
            case 'kspr':
                if (window.kspr.on) {
                    window.kspr.on('accountsChanged', callback);
                }
                break;
        }
    },

    // Listen for network changes
    onNetworkChanged: function(callback) {
        const wallet = this.getConnectedWallet();
        if (!wallet) return;

        switch (wallet.type) {
            case 'kasware':
                if (window.kasware.on) {
                    window.kasware.on('networkChanged', callback);
                }
                break;
            case 'kastle':
                if (window.kastle.on) {
                    window.kastle.on('networkChanged', callback);
                }
                break;
            case 'kspr':
                if (window.kspr.on) {
                    window.kspr.on('networkChanged', callback);
                }
                break;
        }
    }
};

// Initialize wallet checks on load
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        KaspaWallet.checkWallets();
    });
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KaspaWallet;
}
