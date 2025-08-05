// Système de sponsoring et report de scam pour Kaspa Ecosystem

class KaspaSponsorshipSystem {
    constructor() {
        this.minBid = 100; // KAS minimum
        this.scamThreshold = 5; // Nombre de reports avant alerte
    }

    // Afficher le modal d'enchères
    showSponsorModal(projectId, projectTitle, currentBid = 0) {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2 class="modal-title">Sponsor Project: ${projectTitle}</h2>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="sponsor-info">
                        <div class="info-card">
                            <h3>Current Highest Bid</h3>
                            <div class="bid-amount">${currentBid || this.minBid} KAS</div>
                        </div>
                        <div class="info-card">
                            <h3>Benefits</h3>
                            <ul>
                                <li>✓ Featured in carousel</li>
                                <li>✓ Priority listing</li>
                                <li>✓ "Sponsored" badge</li>
                                <li>✓ Increased visibility</li>
                            </ul>
                        </div>
                    </div>
                    
                    <form onsubmit="app.sponsorshipSystem.submitBid(event, '${projectId}')">
                        <div class="form-group">
                            <label>Your Bid (KAS)</label>
                            <input type="number" 
                                   class="form-control" 
                                   name="bidAmount" 
                                   min="${Math.max(this.minBid, currentBid + 10)}" 
                                   value="${Math.max(this.minBid, currentBid + 10)}"
                                   step="10"
                                   required>
                            <small class="form-text">Minimum bid: ${Math.max(this.minBid, currentBid + 10)} KAS</small>
                        </div>
                        
                        <div class="form-group">
                            <label>Duration</label>
                            <select class="form-control" name="duration" required>
                                <option value="7">1 Week (7 days)</option>
                                <option value="14">2 Weeks (14 days)</option>
                                <option value="30">1 Month (30 days)</option>
                            </select>
                        </div>
                        
                        <div class="bid-summary">
                            <p>Total Cost: <span id="total-cost">${Math.max(this.minBid, currentBid + 10)}</span> KAS</p>
                            <p class="text-muted">Payment will be processed via your connected wallet</p>
                        </div>
                        
                        <button type="submit" class="btn btn-primary" style="width: 100%;">
                            Place Bid
                        </button>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Update total cost when inputs change
        modal.querySelector('input[name="bidAmount"]').addEventListener('input', (e) => {
            document.getElementById('total-cost').textContent = e.target.value;
        });
    }

    async submitBid(event, projectId) {
        event.preventDefault();
        
        if (!app.walletManager?.isConnected()) {
            app.showToast('Please connect your wallet first', 'error');
            return;
        }
        
        const formData = new FormData(event.target);
        const bidAmount = parseFloat(formData.get('bidAmount'));
        const duration = parseInt(formData.get('duration'));
        
        try {
            // TODO: Implémenter le paiement on-chain ici
            // Pour l'instant, on simule
            
            // Enregistrer l'enchère dans la base
            const { data, error } = await supabaseClient
                .from('sponsorships')
                .insert({
                    project_id: projectId,
                    wallet_address: app.walletManager.getAddress(),
                    bid_amount: bidAmount,
                    duration_days: duration,
                    status: 'pending', // Sera 'active' après paiement
                    transaction_hash: 'simulation_' + Date.now() // TODO: Vrai hash de transaction
                });
            
            if (error) throw error;
            
            app.showToast('Bid placed successfully! Processing payment...', 'success');
            event.target.closest('.modal').remove();
            
            // Recharger les projets pour afficher les changements
            if (app.loadProjects) app.loadProjects();
            
        } catch (error) {
            console.error('Sponsorship error:', error);
            app.showToast('Failed to place bid', 'error');
        }
    }

    // Report de scam
    async reportScam(projectId, projectTitle) {
        if (!app.walletManager?.isConnected()) {
            app.showToast('Please connect your wallet to report scams', 'error');
            return;
        }
        
        const reason = prompt(`Why do you think "${projectTitle}" is a scam?\n\nPlease provide details:`);
        
        if (!reason || reason.trim().length < 10) {
            app.showToast('Please provide a detailed reason', 'error');
            return;
        }
        
        try {
            const { error } = await supabaseClient
                .from('scam_reports')
                .insert({
                    project_id: projectId,
                    wallet_address: app.walletManager.getAddress(),
                    reason: reason.trim(),
                    severity: this.calculateSeverity(reason)
                });
            
            if (error) {
                if (error.code === '23505') { // Unique violation
                    app.showToast('You have already reported this project', 'warning');
                } else {
                    throw error;
                }
                return;
            }
            
            app.showToast('Thank you for your report. We will investigate.', 'success');
            
            // Vérifier si on doit envoyer une alerte
            await this.checkScamAlertThreshold(projectId);
            
        } catch (error) {
            console.error('Scam report error:', error);
            app.showToast('Failed to submit report', 'error');
        }
    }

    calculateSeverity(reason) {
        const keywords = {
            high: ['stolen', 'hack', 'theft', 'scam confirmed'],
            critical: ['rugpull', 'exit scam', 'funds lost']
        };
        
        const lowerReason = reason.toLowerCase();
        
        for (const [severity, words] of Object.entries(keywords)) {
            if (words.some(word => lowerReason.includes(word))) {
                return severity;
            }
        }
        
        return 'medium';
    }

    async checkScamAlertThreshold(projectId) {
        const { data: reports } = await supabaseClient
            .from('scam_reports')
            .select('id')
            .eq('project_id', projectId);
        
        if (reports && reports.length >= this.scamThreshold) {
            // Trigger alert email via fonction serverless
            await fetch('/.netlify/functions/send-scam-alert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId, reportCount: reports.length })
            });
        }
    }

    // Mettre à jour le carousel avec les projets sponsorisés
    async loadSponsoredProjects() {
        const { data: sponsored } = await supabaseClient
            .from('project_full_stats')
            .select('*')
            .eq('currently_sponsored', true)
            .order('current_bid', { ascending: false });
        
        return sponsored || [];
    }

    // Ajouter les boutons sponsor et report aux cartes de projet
    enhanceProjectCard(project) {
        const sponsorBtn = project.is_sponsored 
            ? '' 
            : `<button class="sponsor-btn" onclick="app.sponsorshipSystem.showSponsorModal('${project.id}', '${project.title.replace(/'/g, "\\'")}')">Sponsor</button>`;
        
        const scamBtn = `<button class="scam-btn" onclick="app.sponsorshipSystem.reportScam('${project.id}', '${project.title.replace(/'/g, "\\'")}')">Report Scam</button>`;
        
        return { sponsorBtn, scamBtn };
    }
}

// Styles additionnels pour le système de sponsoring
const sponsorStyles = `
<style>
.sponsor-info {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 2rem;
}

.info-card {
    background: var(--bg-tertiary);
    padding: 1.5rem;
    border-radius: 12px;
    border: 1px solid var(--border-color);
}

.bid-amount {
    font-size: 2rem;
    font-weight: bold;
    color: var(--kaspa-green);
    margin-top: 0.5rem;
}

.bid-summary {
    background: rgba(73, 234, 203, 0.1);
    border: 1px solid var(--kaspa-green);
    padding: 1rem;
    border-radius: 8px;
    margin: 1rem 0;
    text-align: center;
}

.sponsor-btn {
    background: linear-gradient(135deg, #FFD700, #FFA500);
    color: var(--bg-primary);
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
}

.sponsor-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
}

.scam-btn {
    background: none;
    color: var(--warning-bg);
    border: 1px solid var(--warning-bg);
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.3s;
}

.scam-btn:hover {
    background: var(--warning-bg);
    color: white;
}

.sponsored-badge {
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    background: linear-gradient(135deg, #FFD700, #FFA500);
    color: var(--bg-primary);
    padding: 0.25rem 0.75rem;
    border-radius: 16px;
    font-size: 0.8rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.scam-warning {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid var(--warning-bg);
    color: var(--warning-bg);
    padding: 0.75rem;
    border-radius: 8px;
    margin-top: 1rem;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
</style>
`;

// Ajouter les styles au document
if (!document.getElementById('sponsor-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'sponsor-styles';
    styleElement.innerHTML = sponsorStyles;
    document.head.appendChild(styleElement.firstElementChild);
}

// Export pour utilisation
window.KaspaSponsorshipSystem = KaspaSponsorshipSystem;
