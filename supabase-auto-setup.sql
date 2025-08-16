-- 🗄️ Complete Supabase Setup Script
-- Run this single script to set up all tables, functions, and policies

-- Start transaction
BEGIN;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENHANCED CATEGORIES SETUP
-- ============================================

-- Create categories table if not exists
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7) DEFAULT '#49EACB',
    project_count INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert enhanced categories
INSERT INTO categories (name, slug, description, icon, color, active) VALUES
    ('DeFi', 'defi', 'Decentralized Finance protocols and applications', '💰', '#FF6B35', true),
    ('DEX', 'dex', 'Decentralized exchanges and trading platforms', '🔄', '#4F46E5', true),
    ('NFT', 'nft', 'Non-Fungible Token platforms and marketplaces', '🎨', '#EC4899', true),
    ('Gaming', 'gaming', 'Blockchain games and gaming platforms', '🎮', '#10B981', true),
    ('Infrastructure', 'infrastructure', 'Core blockchain infrastructure and tools', '🏗️', '#6366F1', true),
    ('Wallet', 'wallet', 'Digital wallets and key management solutions', '👛', '#8B5CF6', true),
    ('Analytics', 'analytics', 'Blockchain analytics and data visualization', '📊', '#F59E0B', true),
    ('Security', 'security', 'Security tools, auditing, and monitoring', '🔐', '#EF4444', true),
    ('Education', 'education', 'Educational resources and learning platforms', '📚', '#06B6D4', true),
    ('Tools', 'tools', 'Developer tools and utilities', '🛠️', '#84CC16', true),
    ('Social', 'social', 'Social platforms and community tools', '👥', '#F97316', true),
    ('Bridge', 'bridge', 'Cross-chain bridges and interoperability', '🌉', '#14B8A6', true),
    ('Mining', 'mining', 'Mining tools and pool management', '⛏️', '#A855F7', true),
    ('Explorer', 'explorer', 'Blockchain explorers and search tools', '🔍', '#3B82F6', true),
    ('Marketplace', 'marketplace', 'Digital marketplaces and e-commerce', '🛒', '#DC2626', true),
    ('DAO', 'dao', 'Decentralized Autonomous Organizations', '🏛️', '#7C3AED', true)
ON CONFLICT (slug) DO UPDATE SET
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    updated_at = NOW();

-- ============================================
-- PROJECTS TABLE ENHANCEMENTS
-- ============================================

-- Ensure projects table has all required columns
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id),
ADD COLUMN IF NOT EXISTS github_stars INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS github_forks INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS github_commits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS github_issues INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS github_pushed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS github_language VARCHAR(50),
ADD COLUMN IF NOT EXISTS github_health_score DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS activity_score DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS trending_score DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS overall_score DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sponsor_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS slug VARCHAR(200),
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS documentation_url TEXT,
ADD COLUMN IF NOT EXISTS whitepaper_url TEXT;

-- Create or update projects view with category information
CREATE OR REPLACE VIEW enhanced_project_stats AS
SELECT 
    p.*,
    c.name as category_name,
    c.slug as category_slug,
    c.icon as category_icon,
    c.color as category_color,
    COALESCE(r.rating_avg, 0) as average_rating,
    COALESCE(r.rating_count, 0) as rating_count,
    COALESCE(com.comment_count, 0) as comment_count
FROM projects p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN (
    SELECT 
        project_id,
        AVG(rating) as rating_avg,
        COUNT(*) as rating_count
    FROM ratings 
    GROUP BY project_id
) r ON p.id = r.project_id
LEFT JOIN (
    SELECT 
        project_id,
        COUNT(*) as comment_count
    FROM comments 
    GROUP BY project_id
) com ON p.id = com.project_id;

-- ============================================
-- EMAIL SUBSCRIPTIONS SYSTEM
-- ============================================

-- Create email subscriptions table
CREATE TABLE IF NOT EXISTS email_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    wallet_address TEXT,
    subscription_types TEXT[] DEFAULT ARRAY['weekly_digest'],
    preferences JSONB DEFAULT '{}',
    verified BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create email verification tokens table
CREATE TABLE IF NOT EXISTS email_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    verified BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unsubscribe tokens table
CREATE TABLE IF NOT EXISTS unsubscribe_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    used BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMPREHENSIVE RATING SYSTEM
-- ============================================

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
    rating_distribution INTEGER[] DEFAULT ARRAY[0,0,0,0,0],
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

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(active) WHERE active = true;

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category_id);
CREATE INDEX IF NOT EXISTS idx_projects_active ON projects(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_projects_verified ON projects(verified) WHERE verified = true;
CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_projects_overall_score ON projects(overall_score);
CREATE INDEX IF NOT EXISTS idx_projects_github_stars ON projects(github_stars);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);

-- Rating system indexes
CREATE INDEX IF NOT EXISTS idx_comprehensive_ratings_project ON comprehensive_ratings(project_id);
CREATE INDEX IF NOT EXISTS idx_comprehensive_ratings_user ON comprehensive_ratings(user_wallet);
CREATE INDEX IF NOT EXISTS idx_comprehensive_ratings_verified ON comprehensive_ratings(verified) WHERE verified = true;
CREATE INDEX IF NOT EXISTS idx_comprehensive_ratings_created ON comprehensive_ratings(created_at);
CREATE INDEX IF NOT EXISTS idx_comprehensive_ratings_rating ON comprehensive_ratings(overall_rating);

CREATE INDEX IF NOT EXISTS idx_project_aggregate_ratings_project ON project_aggregate_ratings(project_id);
CREATE INDEX IF NOT EXISTS idx_project_aggregate_ratings_overall ON project_aggregate_ratings(overall_rating);

CREATE INDEX IF NOT EXISTS idx_user_reputation_wallet ON user_reputation_scores(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_reputation_score ON user_reputation_scores(reputation_score);

-- Email system indexes
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_email ON email_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_active ON email_subscriptions(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_verified ON email_subscriptions(verified) WHERE verified = true;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE comprehensive_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_aggregate_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reputation_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE rating_helpfulness ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE unsubscribe_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Categories - public read
DROP POLICY IF EXISTS "public_read_categories" ON categories;
CREATE POLICY "public_read_categories" ON categories FOR SELECT USING (true);

-- Projects - public read, authenticated users can submit
DROP POLICY IF EXISTS "public_read_projects" ON projects;
CREATE POLICY "public_read_projects" ON projects FOR SELECT USING (true);

DROP POLICY IF EXISTS "authenticated_insert_projects" ON projects;
CREATE POLICY "authenticated_insert_projects" ON projects 
    FOR INSERT WITH CHECK (auth.jwt() IS NOT NULL);

-- Comprehensive ratings - public read, users manage own
DROP POLICY IF EXISTS "public_read_comprehensive_ratings" ON comprehensive_ratings;
CREATE POLICY "public_read_comprehensive_ratings" ON comprehensive_ratings FOR SELECT USING (true);

DROP POLICY IF EXISTS "users_insert_own_ratings" ON comprehensive_ratings;
CREATE POLICY "users_insert_own_ratings" ON comprehensive_ratings
    FOR INSERT WITH CHECK (auth.jwt() ->> 'wallet_address' = user_wallet);

DROP POLICY IF EXISTS "users_update_own_ratings" ON comprehensive_ratings;
CREATE POLICY "users_update_own_ratings" ON comprehensive_ratings
    FOR UPDATE USING (auth.jwt() ->> 'wallet_address' = user_wallet);

-- Project aggregate ratings - public read
DROP POLICY IF EXISTS "public_read_aggregate_ratings" ON project_aggregate_ratings;
CREATE POLICY "public_read_aggregate_ratings" ON project_aggregate_ratings FOR SELECT USING (true);

-- User reputation - public read
DROP POLICY IF EXISTS "public_read_reputation_scores" ON user_reputation_scores;
CREATE POLICY "public_read_reputation_scores" ON user_reputation_scores FOR SELECT USING (true);

-- Rating helpfulness - public read, authenticated vote
DROP POLICY IF EXISTS "public_read_helpfulness" ON rating_helpfulness;
CREATE POLICY "public_read_helpfulness" ON rating_helpfulness FOR SELECT USING (true);

DROP POLICY IF EXISTS "authenticated_vote_helpfulness" ON rating_helpfulness;
CREATE POLICY "authenticated_vote_helpfulness" ON rating_helpfulness
    FOR INSERT WITH CHECK (auth.jwt() ->> 'wallet_address' = voter_wallet);

-- Email subscriptions - users manage own
DROP POLICY IF EXISTS "users_manage_own_subscriptions" ON email_subscriptions;
CREATE POLICY "users_manage_own_subscriptions" ON email_subscriptions
    FOR ALL USING (auth.jwt() ->> 'email' = email);

-- Service role has full access to all tables
DROP POLICY IF EXISTS "service_role_full_access_categories" ON categories;
CREATE POLICY "service_role_full_access_categories" ON categories
    FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_full_access_projects" ON projects;
CREATE POLICY "service_role_full_access_projects" ON projects
    FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_full_access_ratings" ON comprehensive_ratings;
CREATE POLICY "service_role_full_access_ratings" ON comprehensive_ratings
    FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_manage_aggregate_ratings" ON project_aggregate_ratings;
CREATE POLICY "service_role_manage_aggregate_ratings" ON project_aggregate_ratings
    FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_manage_reputation" ON user_reputation_scores;
CREATE POLICY "service_role_manage_reputation" ON user_reputation_scores
    FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_manage_helpfulness" ON rating_helpfulness;
CREATE POLICY "service_role_manage_helpfulness" ON rating_helpfulness
    FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_manage_subscriptions" ON email_subscriptions;
CREATE POLICY "service_role_manage_subscriptions" ON email_subscriptions
    FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_manage_verifications" ON email_verifications;
CREATE POLICY "service_role_manage_verifications" ON email_verifications
    FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_manage_unsubscribe" ON unsubscribe_tokens;
CREATE POLICY "service_role_manage_unsubscribe" ON unsubscribe_tokens
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

-- Function to update project category counts
CREATE OR REPLACE FUNCTION update_category_project_counts()
RETURNS VOID AS $$
BEGIN
    UPDATE categories SET project_count = (
        SELECT COUNT(*) 
        FROM projects 
        WHERE category_id = categories.id 
        AND active = true
    );
END;
$$ LANGUAGE plpgsql;

-- Function to calculate trending projects
CREATE OR REPLACE FUNCTION get_trending_projects(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    project_id UUID,
    trending_score DECIMAL,
    github_activity DECIMAL,
    community_engagement DECIMAL,
    recent_ratings INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        (
            -- GitHub activity (30%)
            (COALESCE(p.github_stars, 0) * 0.001 + 
             CASE WHEN p.github_pushed_at > NOW() - INTERVAL '30 days' THEN 1.0 ELSE 0.3 END) * 0.3 +
            -- Community engagement (25%) 
            (COALESCE(p.rating_count, 0) * 0.1 + COALESCE(cr.recent_ratings, 0) * 0.2) * 0.25 +
            -- Rating momentum (20%)
            (COALESCE(p.rating_avg, 0) / 5.0) * 0.2 +
            -- Recency bonus (15%)
            (1.0 - EXTRACT(DAYS FROM (NOW() - p.created_at)) / 90.0) * 0.15 +
            -- View velocity (10%)
            (COALESCE(p.views, 0) / GREATEST(EXTRACT(DAYS FROM (NOW() - p.created_at)), 1)) * 0.001 * 0.1
        )::DECIMAL as trending_score,
        (COALESCE(p.github_stars, 0) * 0.001)::DECIMAL as github_activity,
        (COALESCE(p.rating_count, 0) * 0.1)::DECIMAL as community_engagement,
        COALESCE(cr.recent_ratings, 0)::INTEGER as recent_ratings
    FROM projects p
    LEFT JOIN (
        SELECT 
            project_id,
            COUNT(*) as recent_ratings
        FROM comprehensive_ratings 
        WHERE created_at > NOW() - INTERVAL '30 days'
        GROUP BY project_id
    ) cr ON p.id = cr.project_id
    WHERE p.active = true
    ORDER BY trending_score DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_comprehensive_ratings_updated_at ON comprehensive_ratings;
CREATE TRIGGER update_comprehensive_ratings_updated_at 
    BEFORE UPDATE ON comprehensive_ratings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_email_subscriptions_updated_at ON email_subscriptions;
CREATE TRIGGER update_email_subscriptions_updated_at 
    BEFORE UPDATE ON email_subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA FOR TESTING
-- ============================================

-- Insert sample projects if none exist
INSERT INTO projects (
    name, description, url, category_id, github, active, verified,
    github_stars, rating_avg, rating_count, views
) 
SELECT 
    'Sample DeFi Protocol', 
    'A sample decentralized finance protocol for testing', 
    'https://example-defi.com',
    c.id,
    'https://github.com/example/defi-protocol',
    true,
    true,
    156,
    4.2,
    8,
    342
FROM categories c WHERE c.slug = 'defi'
AND NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Sample DeFi Protocol');

INSERT INTO projects (
    name, description, url, category_id, github, active, verified,
    github_stars, rating_avg, rating_count, views
) 
SELECT 
    'Kaspa Explorer Plus', 
    'Enhanced blockchain explorer with advanced analytics', 
    'https://example-explorer.com',
    c.id,
    'https://github.com/example/kaspa-explorer',
    true,
    false,
    89,
    3.8,
    12,
    678
FROM categories c WHERE c.slug = 'explorer'
AND NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Kaspa Explorer Plus');

-- Insert sample user reputation
INSERT INTO user_reputation_scores (wallet_address, reputation_score, rating_count, verified_reviewer) 
VALUES 
    ('kaspa:qzk0d4y8jxl6q2nxvv5s5z6t4h4w6r3q4y8j0x9l6', 750, 25, true),
    ('kaspa:qaz1s2d3f4g5h6j7k8l9q0w1e2r3t4y5u6i7o8p9', 420, 15, false)
ON CONFLICT (wallet_address) DO NOTHING;

-- Update category project counts
SELECT update_category_project_counts();

-- Commit transaction
COMMIT;

-- Final success message
SELECT 
    'Kaspa Ecosystem database setup completed successfully!' as status,
    (SELECT COUNT(*) FROM categories WHERE active = true) as active_categories,
    (SELECT COUNT(*) FROM projects WHERE active = true) as active_projects,
    'All tables, indexes, policies, and functions created' as details;