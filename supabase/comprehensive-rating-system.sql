-- Comprehensive Rating System for Kaspa Ecosystem
-- Multi-dimensional ratings with reputation-weighted scoring

-- Create comprehensive ratings table
CREATE TABLE IF NOT EXISTS comprehensive_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_wallet TEXT NOT NULL,
    overall_rating DECIMAL(3,2) NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    dimensions JSONB NOT NULL DEFAULT '{}',
    comment TEXT,
    pros TEXT[],
    cons TEXT[],
    recommended BOOLEAN DEFAULT true,
    use_case VARCHAR(50),
    experience_level VARCHAR(20) DEFAULT 'intermediate',
    helpful_votes INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_user_project_rating UNIQUE(project_id, user_wallet)
);

-- Create project aggregate ratings table
CREATE TABLE IF NOT EXISTS project_aggregate_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    overall_rating DECIMAL(3,2) NOT NULL DEFAULT 0,
    dimension_ratings JSONB NOT NULL DEFAULT '{}',
    total_ratings INTEGER DEFAULT 0,
    verified_ratings INTEGER DEFAULT 0,
    average_helpfulness DECIMAL(4,2) DEFAULT 0,
    recommendation_percentage INTEGER DEFAULT 0,
    rating_distribution INTEGER[] DEFAULT ARRAY[0,0,0,0,0], -- 1-star to 5-star counts
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_project_aggregate UNIQUE(project_id)
);

-- Create user reputation scores table
CREATE TABLE IF NOT EXISTS user_reputation_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT NOT NULL UNIQUE,
    reputation_score INTEGER DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    avg_helpfulness DECIMAL(4,2) DEFAULT 0,
    verified_reviewer BOOLEAN DEFAULT false,
    account_created_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    badges TEXT[] DEFAULT ARRAY[]::TEXT[],
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create rating helpfulness votes table
CREATE TABLE IF NOT EXISTS rating_helpfulness (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rating_id UUID NOT NULL REFERENCES comprehensive_ratings(id) ON DELETE CASCADE,
    voter_wallet TEXT NOT NULL,
    helpful BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_vote_per_user UNIQUE(rating_id, voter_wallet)
);

-- Create rating moderation table
CREATE TABLE IF NOT EXISTS rating_moderation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rating_id UUID NOT NULL REFERENCES comprehensive_ratings(id) ON DELETE CASCADE,
    moderator_wallet TEXT NOT NULL,
    action VARCHAR(20) NOT NULL, -- 'approve', 'flag', 'hide', 'delete'
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create rating analytics table for tracking
CREATE TABLE IF NOT EXISTS rating_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    new_ratings INTEGER DEFAULT 0,
    avg_rating DECIMAL(3,2) DEFAULT 0,
    rating_trend VARCHAR(10), -- 'up', 'down', 'stable'
    engagement_score DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_project_date UNIQUE(project_id, date)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_comprehensive_ratings_project ON comprehensive_ratings(project_id);
CREATE INDEX IF NOT EXISTS idx_comprehensive_ratings_user ON comprehensive_ratings(user_wallet);
CREATE INDEX IF NOT EXISTS idx_comprehensive_ratings_verified ON comprehensive_ratings(verified) WHERE verified = true;
CREATE INDEX IF NOT EXISTS idx_comprehensive_ratings_created ON comprehensive_ratings(created_at);
CREATE INDEX IF NOT EXISTS idx_comprehensive_ratings_rating ON comprehensive_ratings(overall_rating);

CREATE INDEX IF NOT EXISTS idx_project_aggregate_ratings_project ON project_aggregate_ratings(project_id);
CREATE INDEX IF NOT EXISTS idx_project_aggregate_ratings_overall ON project_aggregate_ratings(overall_rating);

CREATE INDEX IF NOT EXISTS idx_user_reputation_wallet ON user_reputation_scores(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_reputation_score ON user_reputation_scores(reputation_score);
CREATE INDEX IF NOT EXISTS idx_user_reputation_verified ON user_reputation_scores(verified_reviewer) WHERE verified_reviewer = true;

CREATE INDEX IF NOT EXISTS idx_rating_helpfulness_rating ON rating_helpfulness(rating_id);
CREATE INDEX IF NOT EXISTS idx_rating_helpfulness_voter ON rating_helpfulness(voter_wallet);

CREATE INDEX IF NOT EXISTS idx_rating_analytics_project_date ON rating_analytics(project_id, date);

-- Enable RLS
ALTER TABLE comprehensive_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_aggregate_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reputation_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE rating_helpfulness ENABLE ROW LEVEL SECURITY;
ALTER TABLE rating_moderation ENABLE ROW LEVEL SECURITY;
ALTER TABLE rating_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Comprehensive ratings - users can see all, edit own
CREATE POLICY "public_read_comprehensive_ratings" ON comprehensive_ratings
    FOR SELECT USING (true);

CREATE POLICY "users_insert_own_ratings" ON comprehensive_ratings
    FOR INSERT WITH CHECK (auth.jwt() ->> 'wallet_address' = user_wallet);

CREATE POLICY "users_update_own_ratings" ON comprehensive_ratings
    FOR UPDATE USING (auth.jwt() ->> 'wallet_address' = user_wallet);

-- Service role has full access
CREATE POLICY "service_role_full_access_ratings" ON comprehensive_ratings
    FOR ALL USING (auth.role() = 'service_role');

-- Project aggregate ratings - public read, service role write
CREATE POLICY "public_read_aggregate_ratings" ON project_aggregate_ratings
    FOR SELECT USING (true);

CREATE POLICY "service_role_manage_aggregate_ratings" ON project_aggregate_ratings
    FOR ALL USING (auth.role() = 'service_role');

-- User reputation scores - public read, service role write
CREATE POLICY "public_read_reputation_scores" ON user_reputation_scores
    FOR SELECT USING (true);

CREATE POLICY "service_role_manage_reputation" ON user_reputation_scores
    FOR ALL USING (auth.role() = 'service_role');

-- Rating helpfulness - public read, authenticated users vote
CREATE POLICY "public_read_helpfulness" ON rating_helpfulness
    FOR SELECT USING (true);

CREATE POLICY "authenticated_vote_helpfulness" ON rating_helpfulness
    FOR INSERT WITH CHECK (auth.jwt() ->> 'wallet_address' = voter_wallet);

CREATE POLICY "service_role_manage_helpfulness" ON rating_helpfulness
    FOR ALL USING (auth.role() = 'service_role');

-- Rating moderation - only service role
CREATE POLICY "service_role_manage_moderation" ON rating_moderation
    FOR ALL USING (auth.role() = 'service_role');

-- Rating analytics - public read, service role write
CREATE POLICY "public_read_analytics" ON rating_analytics
    FOR SELECT USING (true);

CREATE POLICY "service_role_manage_analytics" ON rating_analytics
    FOR ALL USING (auth.role() = 'service_role');

-- Functions for rating calculations

-- Function to calculate user reputation score
CREATE OR REPLACE FUNCTION calculate_user_reputation(user_wallet_param TEXT)
RETURNS INTEGER AS $$
DECLARE
    rating_count_score INTEGER;
    helpfulness_score INTEGER;
    verification_score INTEGER;
    activity_score INTEGER;
    quality_score INTEGER;
    total_score INTEGER;
BEGIN
    -- Get user's rating statistics
    SELECT 
        COUNT(*) as rating_count,
        COALESCE(AVG(helpful_votes), 0) as avg_helpfulness,
        COUNT(CASE WHEN verified = true THEN 1 END) as verified_count,
        COUNT(CASE WHEN LENGTH(comment) > 100 THEN 1 END) as detailed_count
    INTO rating_count_score, helpfulness_score, verification_score, quality_score
    FROM comprehensive_ratings 
    WHERE user_wallet = user_wallet_param;

    -- Calculate component scores
    rating_count_score := LEAST(1000, rating_count_score * 10);
    helpfulness_score := LEAST(500, helpfulness_score * 50);
    verification_score := verification_score * 20;
    quality_score := quality_score * 15;
    
    -- Activity score based on recent activity
    SELECT CASE 
        WHEN MAX(created_at) > NOW() - INTERVAL '30 days' THEN 200
        WHEN MAX(created_at) > NOW() - INTERVAL '90 days' THEN 100
        WHEN MAX(created_at) > NOW() - INTERVAL '180 days' THEN 50
        ELSE 0
    END INTO activity_score
    FROM comprehensive_ratings 
    WHERE user_wallet = user_wallet_param;

    total_score := rating_count_score + helpfulness_score + verification_score + quality_score + activity_score;
    
    RETURN total_score;
END;
$$ LANGUAGE plpgsql;

-- Function to update project aggregate ratings
CREATE OR REPLACE FUNCTION update_project_aggregate_ratings(project_id_param UUID)
RETURNS VOID AS $$
DECLARE
    total_ratings INTEGER;
    weighted_sum DECIMAL;
    total_weight DECIMAL;
    overall_avg DECIMAL;
    dimension_avgs JSONB := '{}';
    verified_count INTEGER;
    recommendation_count INTEGER;
    helpfulness_avg DECIMAL;
    distribution INTEGER[];
    dim_name TEXT;
    dim_sum DECIMAL;
    dim_weight DECIMAL;
BEGIN
    -- Get all ratings for the project
    SELECT COUNT(*) INTO total_ratings
    FROM comprehensive_ratings cr
    WHERE cr.project_id = project_id_param;

    IF total_ratings = 0 THEN
        -- Delete aggregate record if no ratings
        DELETE FROM project_aggregate_ratings WHERE project_id = project_id_param;
        RETURN;
    END IF;

    -- Calculate weighted overall rating
    SELECT 
        COALESCE(SUM(cr.overall_rating * urs.reputation_score), 0),
        COALESCE(SUM(urs.reputation_score), 0)
    INTO weighted_sum, total_weight
    FROM comprehensive_ratings cr
    LEFT JOIN user_reputation_scores urs ON cr.user_wallet = urs.wallet_address
    WHERE cr.project_id = project_id_param;

    -- Use simple average if no reputation data
    IF total_weight = 0 THEN
        SELECT AVG(overall_rating) INTO overall_avg
        FROM comprehensive_ratings
        WHERE project_id = project_id_param;
    ELSE
        overall_avg := weighted_sum / total_weight;
    END IF;

    -- Calculate dimension averages
    FOR dim_name IN SELECT unnest(ARRAY['overall', 'technical', 'usability', 'community', 'documentation', 'security']) LOOP
        SELECT 
            COALESCE(SUM((dimensions->>dim_name)::DECIMAL * urs.reputation_score), 0),
            COALESCE(SUM(urs.reputation_score), 0)
        INTO dim_sum, dim_weight
        FROM comprehensive_ratings cr
        LEFT JOIN user_reputation_scores urs ON cr.user_wallet = urs.wallet_address
        WHERE cr.project_id = project_id_param 
        AND dimensions ? dim_name
        AND (dimensions->>dim_name)::DECIMAL > 0;

        IF dim_weight > 0 THEN
            dimension_avgs := dimension_avgs || jsonb_build_object(dim_name, ROUND(dim_sum / dim_weight, 2));
        END IF;
    END LOOP;

    -- Count verified ratings
    SELECT COUNT(*) INTO verified_count
    FROM comprehensive_ratings
    WHERE project_id = project_id_param AND verified = true;

    -- Count recommendations
    SELECT COUNT(*) INTO recommendation_count
    FROM comprehensive_ratings
    WHERE project_id = project_id_param AND recommended = true;

    -- Calculate average helpfulness
    SELECT AVG(helpful_votes) INTO helpfulness_avg
    FROM comprehensive_ratings
    WHERE project_id = project_id_param;

    -- Calculate rating distribution
    SELECT ARRAY[
        COUNT(CASE WHEN overall_rating >= 1 AND overall_rating < 2 THEN 1 END),
        COUNT(CASE WHEN overall_rating >= 2 AND overall_rating < 3 THEN 1 END),
        COUNT(CASE WHEN overall_rating >= 3 AND overall_rating < 4 THEN 1 END),
        COUNT(CASE WHEN overall_rating >= 4 AND overall_rating < 5 THEN 1 END),
        COUNT(CASE WHEN overall_rating = 5 THEN 1 END)
    ] INTO distribution
    FROM comprehensive_ratings
    WHERE project_id = project_id_param;

    -- Upsert aggregate ratings
    INSERT INTO project_aggregate_ratings (
        project_id,
        overall_rating,
        dimension_ratings,
        total_ratings,
        verified_ratings,
        average_helpfulness,
        recommendation_percentage,
        rating_distribution,
        updated_at
    ) VALUES (
        project_id_param,
        COALESCE(overall_avg, 0),
        dimension_avgs,
        total_ratings,
        verified_count,
        COALESCE(helpfulness_avg, 0),
        CASE WHEN total_ratings > 0 THEN ROUND((recommendation_count::DECIMAL / total_ratings) * 100) ELSE 0 END,
        distribution,
        NOW()
    )
    ON CONFLICT (project_id) DO UPDATE SET
        overall_rating = EXCLUDED.overall_rating,
        dimension_ratings = EXCLUDED.dimension_ratings,
        total_ratings = EXCLUDED.total_ratings,
        verified_ratings = EXCLUDED.verified_ratings,
        average_helpfulness = EXCLUDED.average_helpfulness,
        recommendation_percentage = EXCLUDED.recommendation_percentage,
        rating_distribution = EXCLUDED.rating_distribution,
        updated_at = EXCLUDED.updated_at;

    -- Also update main projects table for backward compatibility
    UPDATE projects SET
        rating_avg = COALESCE(overall_avg, 0),
        rating_count = total_ratings,
        average_rating = COALESCE(overall_avg, 0)
    WHERE id = project_id_param;

END;
$$ LANGUAGE plpgsql;

-- Function to update user reputation
CREATE OR REPLACE FUNCTION update_user_reputation(user_wallet_param TEXT)
RETURNS VOID AS $$
DECLARE
    reputation_score INTEGER;
    rating_count INTEGER;
    avg_helpfulness DECIMAL;
    verified_count INTEGER;
BEGIN
    -- Calculate reputation score
    reputation_score := calculate_user_reputation(user_wallet_param);

    -- Get additional stats
    SELECT 
        COUNT(*),
        AVG(helpful_votes),
        COUNT(CASE WHEN verified = true THEN 1 END)
    INTO rating_count, avg_helpfulness, verified_count
    FROM comprehensive_ratings
    WHERE user_wallet = user_wallet_param;

    -- Upsert reputation record
    INSERT INTO user_reputation_scores (
        wallet_address,
        reputation_score,
        rating_count,
        avg_helpfulness,
        verified_reviewer,
        last_activity_at,
        updated_at
    ) VALUES (
        user_wallet_param,
        reputation_score,
        rating_count,
        COALESCE(avg_helpfulness, 0),
        verified_count > 0,
        NOW(),
        NOW()
    )
    ON CONFLICT (wallet_address) DO UPDATE SET
        reputation_score = EXCLUDED.reputation_score,
        rating_count = EXCLUDED.rating_count,
        avg_helpfulness = EXCLUDED.avg_helpfulness,
        verified_reviewer = EXCLUDED.verified_reviewer,
        last_activity_at = EXCLUDED.last_activity_at,
        updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql;

-- Function to get trending projects based on rating activity
CREATE OR REPLACE FUNCTION get_trending_projects_by_ratings(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    project_id UUID,
    trending_score DECIMAL,
    recent_ratings INTEGER,
    rating_momentum DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cr.project_id,
        (
            -- Recent rating activity (30 days)
            (COUNT(CASE WHEN cr.created_at > NOW() - INTERVAL '30 days' THEN 1 END) * 2.0) +
            -- Rating quality trend
            (AVG(cr.overall_rating) * 0.5) +
            -- Helpfulness factor
            (AVG(cr.helpful_votes) * 0.3)
        ) as trending_score,
        COUNT(CASE WHEN cr.created_at > NOW() - INTERVAL '30 days' THEN 1 END)::INTEGER as recent_ratings,
        CASE 
            WHEN COUNT(CASE WHEN cr.created_at > NOW() - INTERVAL '7 days' THEN 1 END) > 
                 COUNT(CASE WHEN cr.created_at > NOW() - INTERVAL '14 days' AND cr.created_at <= NOW() - INTERVAL '7 days' THEN 1 END)
            THEN 1.0
            ELSE 0.5
        END as rating_momentum
    FROM comprehensive_ratings cr
    WHERE cr.created_at > NOW() - INTERVAL '90 days'
    GROUP BY cr.project_id
    HAVING COUNT(*) >= 3  -- Minimum ratings threshold
    ORDER BY trending_score DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get top rated projects by dimension
CREATE OR REPLACE FUNCTION get_top_projects_by_dimension(
    dimension_name TEXT,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    project_id UUID,
    dimension_rating DECIMAL,
    total_ratings INTEGER,
    verified_ratings INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        par.project_id,
        (par.dimension_ratings->>dimension_name)::DECIMAL as dimension_rating,
        par.total_ratings,
        par.verified_ratings
    FROM project_aggregate_ratings par
    WHERE par.dimension_ratings ? dimension_name
    AND par.total_ratings >= 5  -- Minimum ratings threshold
    ORDER BY (par.dimension_ratings->>dimension_name)::DECIMAL DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Triggers to maintain data consistency

-- Trigger to update aggregate ratings when comprehensive rating changes
CREATE OR REPLACE FUNCTION trigger_update_aggregate_ratings()
RETURNS TRIGGER AS $$
BEGIN
    -- Update project aggregate ratings
    PERFORM update_project_aggregate_ratings(COALESCE(NEW.project_id, OLD.project_id));
    
    -- Update user reputation
    PERFORM update_user_reputation(COALESCE(NEW.user_wallet, OLD.user_wallet));
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comprehensive_ratings_update_aggregates
    AFTER INSERT OR UPDATE OR DELETE ON comprehensive_ratings
    FOR EACH ROW EXECUTE FUNCTION trigger_update_aggregate_ratings();

-- Trigger to update helpfulness count when votes change
CREATE OR REPLACE FUNCTION trigger_update_helpfulness_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update helpful_votes count in comprehensive_ratings
    UPDATE comprehensive_ratings 
    SET helpful_votes = (
        SELECT COUNT(*) 
        FROM rating_helpfulness 
        WHERE rating_id = NEW.rating_id AND helpful = true
    )
    WHERE id = NEW.rating_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rating_helpfulness_update_count
    AFTER INSERT OR UPDATE OR DELETE ON rating_helpfulness
    FOR EACH ROW EXECUTE FUNCTION trigger_update_helpfulness_count();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comprehensive_ratings_updated_at 
    BEFORE UPDATE ON comprehensive_ratings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER project_aggregate_ratings_updated_at 
    BEFORE UPDATE ON project_aggregate_ratings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER user_reputation_scores_updated_at 
    BEFORE UPDATE ON user_reputation_scores 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for rating statistics
CREATE OR REPLACE VIEW rating_statistics AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    p.category,
    par.overall_rating,
    par.total_ratings,
    par.verified_ratings,
    par.recommendation_percentage,
    par.dimension_ratings,
    par.rating_distribution,
    CASE 
        WHEN par.total_ratings >= 20 THEN 'high_confidence'
        WHEN par.total_ratings >= 5 THEN 'medium_confidence'
        ELSE 'low_confidence'
    END as confidence_level,
    par.updated_at as last_rating_update
FROM projects p
LEFT JOIN project_aggregate_ratings par ON p.id = par.project_id;

-- Create view for user reputation leaderboard
CREATE OR REPLACE VIEW reputation_leaderboard AS
SELECT 
    urs.wallet_address,
    urs.reputation_score,
    urs.rating_count,
    urs.avg_helpfulness,
    urs.verified_reviewer,
    CASE 
        WHEN urs.reputation_score >= 5000 THEN 'Legend'
        WHEN urs.reputation_score >= 1500 THEN 'Authority'
        WHEN urs.reputation_score >= 500 THEN 'Expert'
        WHEN urs.reputation_score >= 100 THEN 'Experienced'
        ELSE 'Novice'
    END as reputation_level,
    urs.badges,
    urs.last_activity_at
FROM user_reputation_scores urs
ORDER BY urs.reputation_score DESC;

-- Insert initial data for testing
INSERT INTO user_reputation_scores (wallet_address, reputation_score, rating_count, verified_reviewer) 
VALUES 
    ('kaspa:qzk0d4y8jxl6q2nxvv5s5z6t4h4w6r3q4y8j0x9l6', 750, 25, true),
    ('kaspa:qaz1s2d3f4g5h6j7k8l9q0w1e2r3t4y5u6i7o8p9', 420, 15, false),
    ('kaspa:qpl9ok8ijn7uhb6ygv5cf4dx3sz2aw1qe0rr9', 1200, 45, true)
ON CONFLICT (wallet_address) DO NOTHING;

SELECT 'Comprehensive rating system created successfully!' as status;