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

    // Connect to Kastle wallet (placeholder)
    connectKastle: async function() {
        throw new Error('Kastle wallet support coming soon');
    },

    // Connect to KSPR wallet (placeholder)
    connectKspr: async function() {
        throw new Error('KSPR wallet support coming soon');
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
                throw new Error('Kastle signing not implemented');
            case 'kspr':
                throw new Error('KSPR signing not implemented');
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
        }
        return null;
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
