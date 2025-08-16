# Multi-Wallet Integration Guide

## Overview

The Kaspa Ecosystem now supports multiple wallet connections including:
- **Kasware Wallet** - First Bitcoin & Kaspa wallet on Chrome extension
- **Kastle Wallet** - Fast & Secure Kaspa Wallet with KRC20 support  
- **KSPR Wallet** - Comprehensive KRC20 & NFT management

## Features

### Core Functionality
- ✅ **Multi-wallet Detection** - Automatically detects installed wallets
- ✅ **Universal Connection** - Connect to any supported wallet
- ✅ **Wallet Switching** - Easy switching between different wallets
- ✅ **Account Management** - View wallet info, copy addresses, disconnect
- ✅ **Network Support** - Mainnet/testnet network switching
- ✅ **Transaction Support** - Send KAS, sign messages, get UTXO entries
- ✅ **Event Listeners** - Account and network change detection

### Supported Operations
- Request wallet connection
- Get wallet accounts and balances
- Sign messages for authentication
- Send KAS transactions
- Network switching (mainnet/testnet)
- UTXO management for transaction building

## Implementation

### File Structure
```
public/js/
├── kaspa-wallet-integration.js    # Core wallet integration logic
├── multi-wallet-ui.js             # UI components and modal
└── ... (existing files)
```

### Integration Steps

1. **Include Scripts** (already added to index.html):
```html
<script src="js/kaspa-wallet-integration.js"></script>
<script src="js/multi-wallet-ui.js"></script>
```

2. **Basic Usage**:
```javascript
// Check for installed wallets
KaspaWallet.checkWallets();
const installedWallets = KaspaWallet.getInstalledWallets();

// Connect to any available wallet
const address = await KaspaWallet.connectAny();

// Connect to specific wallet
const kaswareAddress = await KaspaWallet.connectKasware();
const kastleAddress = await KaspaWallet.connectKastle();
const ksprAddress = await KaspaWallet.connectKspr();

// Get connected wallet info
const connectedWallet = KaspaWallet.getConnectedWallet();

// Sign message
const signature = await KaspaWallet.signMessage("Hello Kaspa!");

// Send transaction
const txId = await KaspaWallet.sendKAS(toAddress, amount);
```

3. **UI Integration**:
```javascript
// Show wallet connection modal
MultiWalletUI.showModal();

// Listen for wallet events
window.addEventListener('walletConnected', (event) => {
    console.log('Connected to:', event.detail);
});

window.addEventListener('walletDisconnected', () => {
    console.log('Wallet disconnected');
});
```

## Wallet-Specific Features

### Kasware Wallet
- **Strengths**: Mature, Bitcoin & Kaspa support, reliable
- **Features**: KAS, KRC20 tokens, message signing
- **Install**: [Chrome Web Store](https://chromewebstore.google.com/detail/kasware-wallet/gncjnkkjlbhkjplflojlikedlkakgakp)

### Kastle Wallet  
- **Strengths**: Modern UI, comprehensive KRC20/KRC721 support
- **Features**: KAS, KRC20, KRC721, WASM integration
- **Install**: [Kastle.cc](https://kastle.cc/)

### KSPR Wallet
- **Strengths**: NFT-focused, comprehensive DApp support  
- **Features**: KAS, KRC20, KRC721, NFT management
- **Install**: [Chrome Web Store](https://chromewebstore.google.com/detail/kspr-wallet/bjjnnpilnbkodgfbmdlgbhkknfhglfac)

## User Experience

### Connection Flow
1. User clicks "Connect Wallet"
2. Modal shows available wallets with installation status
3. User selects preferred wallet
4. Wallet prompts for connection approval
5. Success! Wallet address and type displayed

### Wallet Management
- **Address Display**: Shows formatted address (6...4 chars)
- **Wallet Type**: Displays connected wallet name
- **Quick Actions**: Copy address, view info, disconnect
- **Dropdown Menu**: Access to wallet-specific features

## API Reference

### KaspaWallet Object

#### Properties
```javascript
KaspaWallet.wallets = {
    kasware: { name, installed, connected, address },
    kastle: { name, installed, connected, address },
    kspr: { name, installed, connected, address }
}
```

#### Methods
```javascript
// Wallet detection
checkWallets()
getInstalledWallets()
isConnected()

// Connection management  
connectKasware()
connectKastle()
connectKspr()
connectAny()
disconnect()

// Wallet operations
getConnectedWallet()
getAccounts()
getBalance()
getNetwork()
switchNetwork(network)

// Transactions
signMessage(message)
sendKAS(to, amount)
getUtxoEntries()

// Event handling
onAccountsChanged(callback)
onNetworkChanged(callback)
```

### MultiWalletUI Object

#### Methods
```javascript
// UI management
init()
showModal()
closeModal()
createConnectButton()

// Wallet operations
connectWallet(walletType)
disconnectWallet()
installWallet(walletType)

// Utilities
copyAddress()
showWalletInfo()
formatAddress(address)
```

## Error Handling

The system includes comprehensive error handling:

```javascript
try {
    const address = await KaspaWallet.connectKasware();
} catch (error) {
    if (error.message.includes('not installed')) {
        // Show installation prompt
    } else if (error.message.includes('user rejected')) {
        // Handle user rejection
    } else {
        // Handle other errors
    }
}
```

## Security Considerations

- ✅ **No Private Keys**: Never stores or handles private keys
- ✅ **User Approval**: All operations require user approval  
- ✅ **Secure Messaging**: Messages signed with wallet private keys
- ✅ **Network Verification**: Confirms network before transactions
- ✅ **Address Validation**: Validates addresses before sending

## Browser Compatibility

- ✅ **Chrome/Chromium**: Full support (primary target)
- ✅ **Firefox**: Kasware support, others may vary
- ✅ **Edge**: Chrome extension compatibility
- ❌ **Safari**: Limited wallet extension support

## Development Notes

### Testing
1. Install wallet extensions in development browser
2. Test connection flow for each wallet type
3. Verify signing and transaction capabilities
4. Test network switching functionality

### Debugging
```javascript
// Enable debug logging
localStorage.setItem('kaspa-wallet-debug', 'true');

// Check wallet availability
console.log('Kasware:', typeof window.kasware);
console.log('Kastle:', typeof window.kastle);  
console.log('KSPR:', typeof window.kspr);
```

## Future Enhancements

### Planned Features
- 🔄 **Hardware Wallet Support** - Ledger integration
- 🔄 **Mobile Wallet Support** - WalletConnect protocol
- 🔄 **Multi-Account Management** - Switch between accounts
- 🔄 **Transaction History** - View past transactions
- 🔄 **DApp Integration** - Enhanced DApp connectivity

### API Extensions
- Token balance queries
- Smart contract interactions  
- NFT metadata retrieval
- Cross-chain functionality

## Support

For issues or questions:
1. Check wallet-specific documentation
2. Join Kaspa Discord community
3. Report issues on project GitHub
4. Consult wallet provider support

## Changelog

### v1.0.0 (Current)
- ✅ Multi-wallet detection and connection
- ✅ Kasware, Kastle, and KSPR support
- ✅ Transaction signing and sending
- ✅ Network switching capabilities
- ✅ Comprehensive UI components
- ✅ Event-driven architecture

---

**Note**: This implementation provides a robust foundation for Kaspa wallet integration while maintaining compatibility with existing applications and future wallet innovations.