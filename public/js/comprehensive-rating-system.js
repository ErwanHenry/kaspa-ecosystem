// Comprehensive Rating System for Kaspa Ecosystem
// Multi-dimensional ratings, reputation-weighted scoring, and advanced analytics

const ComprehensiveRating = {
    // Rating dimensions and their weights
    dimensions: {
        overall: { name: 'Overall Quality', weight: 1.0, icon: '⭐', description: 'General project quality and usefulness' },
        technical: { name: 'Technical Merit', weight: 0.25, icon: '🔧', description: 'Code quality, architecture, and innovation' },
        usability: { name: 'User Experience', weight: 0.25, icon: '👤', description: 'Ease of use and interface design' },
        community: { name: 'Community Support', weight: 0.2, icon: '👥', description: 'Community engagement and support quality' },
        documentation: { name: 'Documentation', weight: 0.15, icon: '📚', description: 'Quality and completeness of documentation' },
        security: { name: 'Security', weight: 0.15, icon: '🔐', description: 'Security practices and audit status' }
    },

    // User reputation system
    reputation: {
        weights: {
            ratingCount: 0.3,        // Number of ratings given
            ratingQuality: 0.25,     // How detailed/helpful ratings are
            accountAge: 0.2,         // How long user has been active
            projectOwnership: 0.15,  // Owns/contributes to projects
            communityEngagement: 0.1 // Comments, discussions
        },
        levels: {
            novice: { min: 0, max: 100, multiplier: 0.5, name: 'Novice Reviewer' },
            experienced: { min: 100, max: 500, multiplier: 0.8, name: 'Experienced Reviewer' },
            expert: { min: 500, max: 1500, multiplier: 1.0, name: 'Expert Reviewer' },
            authority: { min: 1500, max: 5000, multiplier: 1.2, name: 'Community Authority' },
            legend: { min: 5000, max: Infinity, multiplier: 1.5, name: 'Rating Legend' }
        }
    },

    // Rating state and cache
    state: {
        userRatings: new Map(),
        projectRatings: new Map(),
        userReputation: new Map(),
        ratingHistory: [],
        pendingRatings: new Set()
    },

    // Initialize the rating system
    init: function() {
        this.loadUserRatings();
        this.setupEventListeners();
        this.createRatingUI();
        this.loadReputationData();
    },

    // Load user ratings from localStorage and server
    loadUserRatings: async function() {
        try {
            // Load from localStorage first
            const stored = localStorage.getItem('kaspa-user-ratings');
            if (stored) {
                const data = JSON.parse(stored);
                this.state.userRatings = new Map(data.userRatings || []);
                this.state.ratingHistory = data.ratingHistory || [];
            }

            // Load from server if wallet connected
            if (typeof walletAddress !== 'undefined' && walletAddress) {
                await this.syncRatingsFromServer();
            }
        } catch (error) {
            console.warn('Failed to load user ratings:', error);
        }
    },

    // Sync ratings from server
    syncRatingsFromServer: async function() {
        try {
            if (typeof supabaseClient === 'undefined') return;

            const { data: ratings } = await supabaseClient
                .from('comprehensive_ratings')
                .select('*')
                .eq('user_wallet', walletAddress);

            if (ratings) {
                ratings.forEach(rating => {
                    this.state.userRatings.set(rating.project_id, {
                        dimensions: rating.dimensions || {},
                        overall: rating.overall_rating,
                        comment: rating.comment,
                        timestamp: rating.created_at,
                        helpful_votes: rating.helpful_votes || 0,
                        verified: rating.verified || false
                    });
                });
            }
        } catch (error) {
            console.warn('Failed to sync ratings from server:', error);
        }
    },

    // Save user ratings to localStorage
    saveUserRatings: function() {
        try {
            const data = {
                userRatings: Array.from(this.state.userRatings.entries()),
                ratingHistory: this.state.ratingHistory.slice(-100) // Keep last 100 ratings
            };
            localStorage.setItem('kaspa-user-ratings', JSON.stringify(data));
        } catch (error) {
            console.warn('Failed to save user ratings:', error);
        }
    },

    // Load reputation data for users
    loadReputationData: async function() {
        try {
            if (typeof supabaseClient === 'undefined') return;

            // Load reputation scores for active users
            const { data: reputationData } = await supabaseClient
                .from('user_reputation_scores')
                .select('*')
                .order('reputation_score', { ascending: false })
                .limit(1000);

            if (reputationData) {
                reputationData.forEach(user => {
                    this.state.userReputation.set(user.wallet_address, {
                        score: user.reputation_score,
                        level: this.getReputationLevel(user.reputation_score),
                        rating_count: user.rating_count,
                        avg_helpfulness: user.avg_helpfulness,
                        verified_reviewer: user.verified_reviewer
                    });
                });
            }
        } catch (error) {
            console.warn('Failed to load reputation data:', error);
        }
    },

    // Get reputation level from score
    getReputationLevel: function(score) {
        for (const [level, config] of Object.entries(this.reputation.levels)) {
            if (score >= config.min && score < config.max) {
                return { level, ...config };
            }
        }
        return this.reputation.levels.novice;
    },

    // Calculate user reputation score
    calculateUserReputation: async function(walletAddress) {
        try {
            if (typeof supabaseClient === 'undefined') return 0;

            // Get user's rating activity
            const { data: userRatings } = await supabaseClient
                .from('comprehensive_ratings')
                .select('*')
                .eq('user_wallet', walletAddress);

            const { data: userComments } = await supabaseClient
                .from('comments')
                .select('*')
                .eq('user_wallet', walletAddress);

            const { data: userProjects } = await supabaseClient
                .from('projects')
                .select('*')
                .eq('submitter_wallet', walletAddress);

            if (!userRatings) return 0;

            const weights = this.reputation.weights;
            let score = 0;

            // Rating count score
            const ratingCount = userRatings.length;
            const ratingCountScore = Math.min(1000, ratingCount * 10);
            score += ratingCountScore * weights.ratingCount;

            // Rating quality score (based on helpfulness and detail)
            const avgHelpfulness = userRatings.reduce((sum, r) => sum + (r.helpful_votes || 0), 0) / Math.max(1, ratingCount);
            const detailedRatings = userRatings.filter(r => r.comment && r.comment.length > 50).length;
            const qualityScore = (avgHelpfulness * 100) + (detailedRatings * 20);
            score += qualityScore * weights.ratingQuality;

            // Account age score (simulated - in real app would use creation date)
            const accountAgeScore = Math.min(500, ratingCount * 5); // Proxy for account age
            score += accountAgeScore * weights.accountAge;

            // Project ownership score
            const projectCount = userProjects?.length || 0;
            const ownershipScore = projectCount * 100;
            score += ownershipScore * weights.projectOwnership;

            // Community engagement score
            const commentCount = userComments?.length || 0;
            const engagementScore = Math.min(200, commentCount * 10);
            score += engagementScore * weights.communityEngagement;

            return Math.round(score);
        } catch (error) {
            console.warn('Failed to calculate user reputation:', error);
            return 0;
        }
    },

    // Submit comprehensive rating
    submitRating: async function(projectId, ratingData) {
        try {
            if (!walletAddress) {
                throw new Error('Please connect your wallet to submit ratings');
            }

            if (this.state.pendingRatings.has(projectId)) {
                throw new Error('Rating submission already in progress');
            }

            this.state.pendingRatings.add(projectId);

            // Validate rating data
            this.validateRatingData(ratingData);

            // Calculate overall rating from dimensions
            const overallRating = this.calculateOverallRating(ratingData.dimensions);

            const comprehensiveRating = {
                project_id: projectId,
                user_wallet: walletAddress,
                overall_rating: overallRating,
                dimensions: ratingData.dimensions,
                comment: ratingData.comment || null,
                pros: ratingData.pros || [],
                cons: ratingData.cons || [],
                recommended: ratingData.recommended || true,
                use_case: ratingData.useCase || null,
                experience_level: ratingData.experienceLevel || 'intermediate',
                created_at: new Date().toISOString(),
                helpful_votes: 0,
                verified: await this.isVerifiedReviewer(walletAddress)
            };

            // Save to server
            if (typeof supabaseClient !== 'undefined') {
                const { data, error } = await supabaseClient
                    .from('comprehensive_ratings')
                    .upsert(comprehensiveRating, { 
                        onConflict: 'project_id,user_wallet'
                    })
                    .select()
                    .single();

                if (error) throw error;

                // Update aggregate ratings
                await this.updateProjectAggregateRatings(projectId);
            }

            // Save locally
            this.state.userRatings.set(projectId, {
                dimensions: ratingData.dimensions,
                overall: overallRating,
                comment: ratingData.comment,
                timestamp: new Date().toISOString(),
                pros: ratingData.pros,
                cons: ratingData.cons,
                recommended: ratingData.recommended
            });

            this.state.ratingHistory.push({
                projectId,
                rating: overallRating,
                timestamp: new Date().toISOString()
            });

            this.saveUserRatings();

            // Update UI
            this.updateProjectRatingDisplay(projectId);
            
            return { success: true, rating: comprehensiveRating };

        } catch (error) {
            console.error('Failed to submit rating:', error);
            throw error;
        } finally {
            this.state.pendingRatings.delete(projectId);
        }
    },

    // Validate rating data
    validateRatingData: function(ratingData) {
        if (!ratingData.dimensions) {
            throw new Error('Rating dimensions are required');
        }

        // Check that all required dimensions have valid ratings
        const requiredDimensions = ['overall', 'technical', 'usability'];
        for (const dim of requiredDimensions) {
            const rating = ratingData.dimensions[dim];
            if (!rating || rating < 1 || rating > 5) {
                throw new Error(`Invalid rating for ${dim}: must be between 1 and 5`);
            }
        }

        // Validate comment length if provided
        if (ratingData.comment && ratingData.comment.length > 1000) {
            throw new Error('Comment must be less than 1000 characters');
        }
    },

    // Calculate overall rating from dimensions
    calculateOverallRating: function(dimensions) {
        let weightedSum = 0;
        let totalWeight = 0;

        for (const [dim, config] of Object.entries(this.dimensions)) {
            const rating = dimensions[dim];
            if (rating && rating >= 1 && rating <= 5) {
                weightedSum += rating * config.weight;
                totalWeight += config.weight;
            }
        }

        return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : 0;
    },

    // Check if user is a verified reviewer
    isVerifiedReviewer: async function(walletAddress) {
        const reputation = this.state.userReputation.get(walletAddress);
        return reputation?.verified_reviewer || false;
    },

    // Update project aggregate ratings
    updateProjectAggregateRatings: async function(projectId) {
        try {
            if (typeof supabaseClient === 'undefined') return;

            // Get all ratings for the project
            const { data: ratings } = await supabaseClient
                .from('comprehensive_ratings')
                .select('*')
                .eq('project_id', projectId);

            if (!ratings || ratings.length === 0) return;

            // Calculate weighted averages
            const aggregates = this.calculateWeightedAggregates(ratings);

            // Update project aggregate ratings
            await supabaseClient
                .from('project_aggregate_ratings')
                .upsert({
                    project_id: projectId,
                    overall_rating: aggregates.overall,
                    dimension_ratings: aggregates.dimensions,
                    total_ratings: ratings.length,
                    verified_ratings: aggregates.verifiedCount,
                    average_helpfulness: aggregates.avgHelpfulness,
                    recommendation_percentage: aggregates.recommendationPercentage,
                    rating_distribution: aggregates.distribution,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'project_id' });

            // Also update the main projects table for backward compatibility
            await supabaseClient
                .from('projects')
                .update({
                    rating_avg: aggregates.overall,
                    rating_count: ratings.length,
                    average_rating: aggregates.overall
                })
                .eq('id', projectId);

        } catch (error) {
            console.error('Failed to update aggregate ratings:', error);
        }
    },

    // Calculate weighted aggregates from ratings
    calculateWeightedAggregates: function(ratings) {
        let totalWeight = 0;
        let weightedSums = {};
        let verifiedCount = 0;
        let recommendationCount = 0;
        let helpfulnessSum = 0;
        let distribution = [0, 0, 0, 0, 0]; // 1-star to 5-star counts

        // Initialize dimension sums
        Object.keys(this.dimensions).forEach(dim => {
            weightedSums[dim] = 0;
        });

        ratings.forEach(rating => {
            // Get user reputation multiplier
            const userReputation = this.state.userReputation.get(rating.user_wallet);
            const reputationLevel = userReputation?.level || this.reputation.levels.novice;
            const weight = reputationLevel.multiplier;

            totalWeight += weight;

            // Aggregate dimension ratings
            if (rating.dimensions) {
                Object.entries(rating.dimensions).forEach(([dim, value]) => {
                    if (weightedSums.hasOwnProperty(dim)) {
                        weightedSums[dim] += value * weight;
                    }
                });
            }

            // Count verified ratings
            if (rating.verified) verifiedCount++;

            // Count recommendations
            if (rating.recommended) recommendationCount++;

            // Sum helpfulness
            helpfulnessSum += rating.helpful_votes || 0;

            // Distribution
            const overallRating = Math.round(rating.overall_rating);
            if (overallRating >= 1 && overallRating <= 5) {
                distribution[overallRating - 1]++;
            }
        });

        // Calculate averages
        const avgDimensions = {};
        Object.keys(weightedSums).forEach(dim => {
            avgDimensions[dim] = totalWeight > 0 ? 
                Math.round((weightedSums[dim] / totalWeight) * 10) / 10 : 0;
        });

        return {
            overall: avgDimensions.overall || 0,
            dimensions: avgDimensions,
            verifiedCount,
            avgHelpfulness: ratings.length > 0 ? helpfulnessSum / ratings.length : 0,
            recommendationPercentage: ratings.length > 0 ? 
                Math.round((recommendationCount / ratings.length) * 100) : 0,
            distribution
        };
    },

    // Show comprehensive rating modal
    showRatingModal: function(projectId, projectName) {
        // Remove existing modal
        const existingModal = document.getElementById('comprehensive-rating-modal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.id = 'comprehensive-rating-modal';
        modal.className = 'rating-modal';
        
        const existingRating = this.state.userRatings.get(projectId);
        const isEdit = !!existingRating;

        modal.innerHTML = `
            <div class="rating-modal-overlay" onclick="ComprehensiveRating.closeRatingModal()">
                <div class="rating-modal-content" onclick="event.stopPropagation()">
                    <div class="rating-modal-header">
                        <h2>
                            <span class="rating-icon">⭐</span>
                            ${isEdit ? 'Edit' : 'Rate'} ${projectName}
                        </h2>
                        <button onclick="ComprehensiveRating.closeRatingModal()" class="modal-close">&times;</button>
                    </div>
                    
                    <div class="rating-modal-body">
                        <form id="comprehensive-rating-form" onsubmit="ComprehensiveRating.handleRatingSubmit(event, '${projectId}')">
                            <!-- Dimension Ratings -->
                            <div class="rating-section">
                                <h3>Rating Dimensions</h3>
                                <div class="dimensions-grid">
                                    ${Object.entries(this.dimensions).map(([key, config]) => `
                                        <div class="dimension-rating">
                                            <div class="dimension-header">
                                                <span class="dimension-icon">${config.icon}</span>
                                                <div class="dimension-info">
                                                    <label>${config.name}</label>
                                                    <p class="dimension-description">${config.description}</p>
                                                </div>
                                            </div>
                                            <div class="star-rating" data-dimension="${key}">
                                                ${[1,2,3,4,5].map(i => `
                                                    <i class="fas fa-star star ${existingRating?.dimensions[key] >= i ? 'filled' : ''}" 
                                                       data-rating="${i}" 
                                                       onclick="ComprehensiveRating.setDimensionRating('${key}', ${i})"></i>
                                                `).join('')}
                                                <span class="rating-value">${existingRating?.dimensions[key] || 0}</span>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>

                            <!-- Overall Calculated Rating -->
                            <div class="rating-section">
                                <h3>Overall Rating</h3>
                                <div class="overall-rating-display">
                                    <div class="overall-stars" id="overall-stars">
                                        ${[1,2,3,4,5].map(i => `
                                            <i class="fas fa-star star large"></i>
                                        `).join('')}
                                    </div>
                                    <span class="overall-value" id="overall-value">0.0</span>
                                    <p class="overall-note">Calculated from dimension ratings above</p>
                                </div>
                            </div>

                            <!-- Detailed Review -->
                            <div class="rating-section">
                                <h3>Detailed Review</h3>
                                
                                <div class="review-field">
                                    <label for="rating-comment">Your Review</label>
                                    <textarea 
                                        id="rating-comment" 
                                        name="comment" 
                                        placeholder="Share your experience with this project..."
                                        maxlength="1000"
                                    >${existingRating?.comment || ''}</textarea>
                                    <div class="char-count">
                                        <span id="comment-count">0</span>/1000 characters
                                    </div>
                                </div>

                                <div class="pros-cons-grid">
                                    <div class="review-field">
                                        <label for="rating-pros">Pros (Optional)</label>
                                        <textarea 
                                            id="rating-pros" 
                                            name="pros" 
                                            placeholder="What did you like?"
                                            maxlength="300"
                                        >${existingRating?.pros?.join('\\n') || ''}</textarea>
                                    </div>
                                    <div class="review-field">
                                        <label for="rating-cons">Cons (Optional)</label>
                                        <textarea 
                                            id="rating-cons" 
                                            name="cons" 
                                            placeholder="What could be improved?"
                                            maxlength="300"
                                        >${existingRating?.cons?.join('\\n') || ''}</textarea>
                                    </div>
                                </div>
                            </div>

                            <!-- Additional Info -->
                            <div class="rating-section">
                                <h3>Additional Information</h3>
                                
                                <div class="additional-fields">
                                    <div class="field-group">
                                        <label for="use-case">Use Case</label>
                                        <select id="use-case" name="useCase">
                                            <option value="">Select your use case</option>
                                            <option value="development">Development/Building</option>
                                            <option value="investment">Investment/Trading</option>
                                            <option value="personal">Personal Use</option>
                                            <option value="business">Business Application</option>
                                            <option value="research">Research/Learning</option>
                                        </select>
                                    </div>
                                    
                                    <div class="field-group">
                                        <label for="experience-level">Your Experience Level</label>
                                        <select id="experience-level" name="experienceLevel">
                                            <option value="beginner">Beginner</option>
                                            <option value="intermediate" selected>Intermediate</option>
                                            <option value="advanced">Advanced</option>
                                            <option value="expert">Expert</option>
                                        </select>
                                    </div>
                                </div>

                                <div class="checkbox-field">
                                    <label class="checkbox-label">
                                        <input 
                                            type="checkbox" 
                                            id="recommended" 
                                            name="recommended" 
                                            ${existingRating?.recommended !== false ? 'checked' : ''}
                                        >
                                        I would recommend this project to others
                                    </label>
                                </div>
                            </div>

                            <!-- Submit Button -->
                            <div class="rating-actions">
                                <button type="button" onclick="ComprehensiveRating.closeRatingModal()" class="btn btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" class="btn btn-primary" id="submit-rating-btn">
                                    <span class="btn-text">${isEdit ? 'Update' : 'Submit'} Rating</span>
                                    <span class="btn-loading hidden"><i class="fas fa-spinner fa-spin"></i></span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Setup character count for comment
        const commentTextarea = document.getElementById('rating-comment');
        const commentCount = document.getElementById('comment-count');
        
        const updateCommentCount = () => {
            commentCount.textContent = commentTextarea.value.length;
        };
        
        commentTextarea.addEventListener('input', updateCommentCount);
        updateCommentCount();

        // Update overall rating display
        this.updateOverallRatingDisplay();

        // Show modal
        setTimeout(() => modal.classList.add('show'), 10);
    },

    // Set dimension rating
    setDimensionRating: function(dimension, rating) {
        const container = document.querySelector(`[data-dimension="${dimension}"]`);
        if (!container) return;

        // Update stars
        const stars = container.querySelectorAll('.star');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('filled');
            } else {
                star.classList.remove('filled');
            }
        });

        // Update value display
        const valueDisplay = container.querySelector('.rating-value');
        if (valueDisplay) {
            valueDisplay.textContent = rating;
        }

        // Update overall rating
        this.updateOverallRatingDisplay();
    },

    // Update overall rating display
    updateOverallRatingDisplay: function() {
        const dimensions = {};
        
        // Collect current dimension ratings
        Object.keys(this.dimensions).forEach(dim => {
            const container = document.querySelector(`[data-dimension="${dim}"]`);
            if (container) {
                const filledStars = container.querySelectorAll('.star.filled').length;
                if (filledStars > 0) {
                    dimensions[dim] = filledStars;
                }
            }
        });

        // Calculate overall rating
        const overallRating = this.calculateOverallRating(dimensions);

        // Update overall display
        const overallStars = document.getElementById('overall-stars');
        const overallValue = document.getElementById('overall-value');
        
        if (overallStars && overallValue) {
            const stars = overallStars.querySelectorAll('.star');
            stars.forEach((star, index) => {
                if (index < Math.round(overallRating)) {
                    star.classList.add('filled');
                } else {
                    star.classList.remove('filled');
                }
            });
            
            overallValue.textContent = overallRating.toFixed(1);
        }
    },

    // Handle rating form submission
    handleRatingSubmit: async function(event, projectId) {
        event.preventDefault();
        
        const submitBtn = document.getElementById('submit-rating-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');
        
        try {
            // Show loading state
            btnText.classList.add('hidden');
            btnLoading.classList.remove('hidden');
            submitBtn.disabled = true;

            // Collect form data
            const formData = new FormData(event.target);
            const dimensions = {};
            
            // Get dimension ratings
            Object.keys(this.dimensions).forEach(dim => {
                const container = document.querySelector(`[data-dimension="${dim}"]`);
                if (container) {
                    const filledStars = container.querySelectorAll('.star.filled').length;
                    if (filledStars > 0) {
                        dimensions[dim] = filledStars;
                    }
                }
            });

            // Validate that we have at least the required dimensions
            if (!dimensions.overall || !dimensions.technical || !dimensions.usability) {
                throw new Error('Please rate at least Overall Quality, Technical Merit, and User Experience');
            }

            const ratingData = {
                dimensions,
                comment: formData.get('comment')?.trim() || null,
                pros: formData.get('pros')?.trim().split('\n').filter(p => p.trim()) || [],
                cons: formData.get('cons')?.trim().split('\n').filter(c => c.trim()) || [],
                useCase: formData.get('useCase') || null,
                experienceLevel: formData.get('experienceLevel') || 'intermediate',
                recommended: formData.get('recommended') === 'on'
            };

            // Submit rating
            await this.submitRating(projectId, ratingData);

            // Show success
            if (typeof showToast === 'function') {
                showToast('Rating submitted successfully!', 'success');
            }

            // Close modal
            this.closeRatingModal();

        } catch (error) {
            console.error('Rating submission error:', error);
            if (typeof showToast === 'function') {
                showToast(error.message || 'Failed to submit rating', 'error');
            }
        } finally {
            // Reset button state
            btnText.classList.remove('hidden');
            btnLoading.classList.add('hidden');
            submitBtn.disabled = false;
        }
    },

    // Close rating modal
    closeRatingModal: function() {
        const modal = document.getElementById('comprehensive-rating-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    },

    // Update project rating display in the main UI
    updateProjectRatingDisplay: function(projectId) {
        // This would update the rating display in project cards
        // Implementation depends on the existing UI structure
        const projectCards = document.querySelectorAll(`[onclick*="${projectId}"]`);
        projectCards.forEach(card => {
            const ratingElement = card.querySelector('.rating');
            if (ratingElement) {
                // Update the rating display with comprehensive data
                this.renderProjectRating(ratingElement, projectId);
            }
        });
    },

    // Render project rating in a container
    renderProjectRating: async function(container, projectId) {
        try {
            if (typeof supabaseClient === 'undefined') return;

            // Get aggregate rating data
            const { data: aggregateRating } = await supabaseClient
                .from('project_aggregate_ratings')
                .select('*')
                .eq('project_id', projectId)
                .single();

            if (!aggregateRating) return;

            container.innerHTML = `
                <div class="comprehensive-rating-display">
                    <div class="main-rating">
                        <div class="stars">
                            ${[1,2,3,4,5].map(i => `
                                <i class="fas fa-star ${i <= Math.round(aggregateRating.overall_rating) ? 'filled' : ''}"></i>
                            `).join('')}
                        </div>
                        <span class="rating-value">${aggregateRating.overall_rating.toFixed(1)}</span>
                        <span class="rating-count">(${aggregateRating.total_ratings})</span>
                    </div>
                    <div class="rating-breakdown">
                        <div class="dimension-mini">
                            <span title="Technical Merit">🔧 ${aggregateRating.dimension_ratings.technical?.toFixed(1) || 'N/A'}</span>
                            <span title="User Experience">👤 ${aggregateRating.dimension_ratings.usability?.toFixed(1) || 'N/A'}</span>
                            <span title="Community Support">👥 ${aggregateRating.dimension_ratings.community?.toFixed(1) || 'N/A'}</span>
                        </div>
                        <div class="recommendation-rate">
                            ${aggregateRating.recommendation_percentage}% recommend
                        </div>
                    </div>
                </div>
            `;

            // Add click handler to show detailed ratings
            container.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showDetailedRatings(projectId);
            });

        } catch (error) {
            console.warn('Failed to render project rating:', error);
        }
    },

    // Show detailed ratings modal
    showDetailedRatings: async function(projectId) {
        // Implementation for showing all ratings for a project
        // This would show a modal with all user ratings, breakdowns, etc.
    },

    // Setup event listeners
    setupEventListeners: function() {
        // Override existing rating functionality
        const originalRateProject = window.rateProject;
        if (originalRateProject) {
            window.rateProject = (event, projectId, rating) => {
                event.stopPropagation();
                
                if (!walletAddress) {
                    if (typeof showToast === 'function') {
                        showToast('Please connect your wallet to rate projects', 'warning');
                    }
                    return;
                }

                // Show comprehensive rating modal instead
                const projectElement = event.target.closest('.card');
                const projectName = projectElement?.querySelector('h3')?.textContent || 'Project';
                this.showRatingModal(projectId, projectName);
            };
        }
    },

    // Create rating UI components
    createRatingUI: function() {
        this.addRatingStyles();
    },

    // Add CSS styles for the rating system
    addRatingStyles: function() {
        if (document.getElementById('comprehensive-rating-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'comprehensive-rating-styles';
        styles.textContent = `
            .rating-modal {
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
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .rating-modal.show {
                opacity: 1;
            }

            .rating-modal-content {
                background: var(--theme-primary);
                border-radius: 12px;
                max-width: 700px;
                width: 100%;
                max-height: 90vh;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                border: 1px solid var(--theme-border);
            }

            .rating-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 1px solid var(--theme-border);
                background: var(--theme-secondary);
            }

            .rating-modal-header h2 {
                margin: 0;
                color: var(--theme-text);
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .rating-icon {
                font-size: 1.5rem;
            }

            .rating-modal-body {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
            }

            .rating-section {
                margin-bottom: 30px;
            }

            .rating-section h3 {
                margin: 0 0 15px 0;
                color: var(--theme-text);
                font-size: 1.1rem;
                border-bottom: 1px solid var(--theme-border);
                padding-bottom: 8px;
            }

            .dimensions-grid {
                display: grid;
                gap: 20px;
            }

            .dimension-rating {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px;
                background: var(--theme-card);
                border-radius: 8px;
                border: 1px solid var(--theme-border);
            }

            .dimension-header {
                display: flex;
                align-items: center;
                gap: 12px;
                flex: 1;
            }

            .dimension-icon {
                font-size: 1.3rem;
                width: 30px;
                text-align: center;
            }

            .dimension-info {
                flex: 1;
            }

            .dimension-info label {
                font-weight: 500;
                color: var(--theme-text);
                display: block;
                margin-bottom: 4px;
            }

            .dimension-description {
                margin: 0;
                color: var(--theme-text-secondary);
                font-size: 0.85rem;
                line-height: 1.3;
            }

            .star-rating {
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .star-rating .star {
                color: #374151;
                cursor: pointer;
                transition: color 0.2s ease;
                font-size: 1.2rem;
            }

            .star-rating .star:hover,
            .star-rating .star.filled {
                color: #F59E0B;
            }

            .star-rating .star.large {
                font-size: 1.8rem;
            }

            .rating-value {
                margin-left: 8px;
                color: var(--theme-text);
                font-weight: 500;
                min-width: 20px;
            }

            .overall-rating-display {
                text-align: center;
                padding: 20px;
                background: var(--theme-card);
                border-radius: 8px;
                border: 1px solid var(--theme-border);
            }

            .overall-stars {
                margin-bottom: 10px;
            }

            .overall-value {
                font-size: 2rem;
                font-weight: bold;
                color: var(--theme-accent);
                margin: 0 10px;
            }

            .overall-note {
                margin: 8px 0 0 0;
                color: var(--theme-text-secondary);
                font-size: 0.875rem;
                font-style: italic;
            }

            .review-field {
                margin-bottom: 20px;
            }

            .review-field label {
                display: block;
                margin-bottom: 8px;
                color: var(--theme-text);
                font-weight: 500;
            }

            .review-field textarea {
                width: 100%;
                min-height: 100px;
                padding: 12px;
                background: var(--theme-primary);
                border: 1px solid var(--theme-border);
                border-radius: 6px;
                color: var(--theme-text);
                font-family: inherit;
                resize: vertical;
            }

            .review-field textarea:focus {
                outline: none;
                border-color: var(--theme-accent);
            }

            .char-count {
                text-align: right;
                color: var(--theme-text-secondary);
                font-size: 0.8rem;
                margin-top: 4px;
            }

            .pros-cons-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
            }

            .additional-fields {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 20px;
            }

            .field-group label {
                display: block;
                margin-bottom: 8px;
                color: var(--theme-text);
                font-weight: 500;
            }

            .field-group select {
                width: 100%;
                padding: 10px;
                background: var(--theme-primary);
                border: 1px solid var(--theme-border);
                border-radius: 6px;
                color: var(--theme-text);
            }

            .checkbox-field {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .checkbox-label {
                display: flex;
                align-items: center;
                gap: 10px;
                color: var(--theme-text);
                cursor: pointer;
            }

            .checkbox-label input[type="checkbox"] {
                transform: scale(1.2);
                accent-color: var(--theme-accent);
            }

            .rating-actions {
                display: flex;
                justify-content: flex-end;
                gap: 15px;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid var(--theme-border);
            }

            .comprehensive-rating-display {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .main-rating {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .main-rating .stars .star {
                color: #374151;
                font-size: 1rem;
            }

            .main-rating .stars .star.filled {
                color: #F59E0B;
            }

            .rating-breakdown {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 0.8rem;
                color: var(--theme-text-secondary);
            }

            .dimension-mini {
                display: flex;
                gap: 8px;
            }

            .dimension-mini span {
                padding: 2px 4px;
                background: var(--theme-secondary);
                border-radius: 3px;
                font-size: 0.75rem;
            }

            .recommendation-rate {
                font-weight: 500;
                color: var(--theme-accent);
            }

            @media (max-width: 768px) {
                .rating-modal-content {
                    margin: 10px;
                    max-width: calc(100vw - 20px);
                }

                .dimensions-grid {
                    gap: 15px;
                }

                .dimension-rating {
                    flex-direction: column;
                    gap: 10px;
                    align-items: flex-start;
                }

                .star-rating {
                    align-self: center;
                }

                .pros-cons-grid,
                .additional-fields {
                    grid-template-columns: 1fr;
                    gap: 15px;
                }

                .rating-actions {
                    flex-direction: column;
                }
            }
        `;

        document.head.appendChild(styles);
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        ComprehensiveRating.init();
    });
} else {
    ComprehensiveRating.init();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComprehensiveRating;
}