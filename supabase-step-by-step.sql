-- 🗄️ Kaspa Ecosystem - Step by Step Setup
-- Run each section separately if you encounter any errors

-- ============================================
-- STEP 1: ENHANCE EXISTING CATEGORIES TABLE
-- ============================================

-- Add missing columns to categories table
DO $$ 
BEGIN
    -- Add icon column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='icon') THEN
        ALTER TABLE categories ADD COLUMN icon VARCHAR(50);
    END IF;
    
    -- Add color column if not exists  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='color') THEN
        ALTER TABLE categories ADD COLUMN color VARCHAR(7) DEFAULT '#49EACB';
    END IF;
    
    -- Add project_count column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='project_count') THEN
        ALTER TABLE categories ADD COLUMN project_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add active column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='active') THEN
        ALTER TABLE categories ADD COLUMN active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Update existing categories with new data
UPDATE categories SET 
    icon = CASE 
        WHEN name = 'DeFi' THEN '💰'
        WHEN name = 'DEX' THEN '🔄' 
        WHEN name = 'NFT' THEN '🎨'
        WHEN name = 'Gaming' THEN '🎮'
        WHEN name = 'Infrastructure' THEN '🏗️'
        WHEN name = 'Wallet' THEN '👛'
        WHEN name = 'Analytics' THEN '📊'
        WHEN name = 'Security' THEN '🔐'
        WHEN name = 'Education' THEN '📚'
        WHEN name = 'Tools' THEN '🛠️'
        ELSE '📦'
    END,
    color = CASE
        WHEN name = 'DeFi' THEN '#FF6B35'
        WHEN name = 'DEX' THEN '#4F46E5'
        WHEN name = 'NFT' THEN '#EC4899'
        WHEN name = 'Gaming' THEN '#10B981'
        WHEN name = 'Infrastructure' THEN '#6366F1'
        WHEN name = 'Wallet' THEN '#8B5CF6'
        WHEN name = 'Analytics' THEN '#F59E0B'
        WHEN name = 'Security' THEN '#EF4444'
        WHEN name = 'Education' THEN '#06B6D4'
        WHEN name = 'Tools' THEN '#84CC16'
        ELSE '#49EACB'
    END,
    active = true
WHERE icon IS NULL;

-- Insert new categories only if they don't exist
INSERT INTO categories (name, slug, description, icon, color, active) 
SELECT 'Social', 'social', 'Social platforms and community tools', '👥', '#F97316', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'social');

INSERT INTO categories (name, slug, description, icon, color, active) 
SELECT 'Bridge', 'bridge', 'Cross-chain bridges and interoperability', '🌉', '#14B8A6', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'bridge');

INSERT INTO categories (name, slug, description, icon, color, active) 
SELECT 'Mining', 'mining', 'Mining tools and pool management', '⛏️', '#A855F7', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'mining');

INSERT INTO categories (name, slug, description, icon, color, active) 
SELECT 'Explorer', 'explorer', 'Blockchain explorers and search tools', '🔍', '#3B82F6', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'explorer');

INSERT INTO categories (name, slug, description, icon, color, active) 
SELECT 'Marketplace', 'marketplace', 'Digital marketplaces and e-commerce', '🛒', '#DC2626', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'marketplace');

INSERT INTO categories (name, slug, description, icon, color, active) 
SELECT 'DAO', 'dao', 'Decentralized Autonomous Organizations', '🏛️', '#7C3AED', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'dao');

-- ============================================
-- STEP 2: ENHANCE PROJECTS TABLE
-- ============================================

-- Add missing columns to projects table
DO $$ 
BEGIN
    -- Add category_id if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='category_id') THEN
        ALTER TABLE projects ADD COLUMN category_id UUID REFERENCES categories(id);
    END IF;
    
    -- Add GitHub-related columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='github_stars') THEN
        ALTER TABLE projects ADD COLUMN github_stars INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='github_forks') THEN
        ALTER TABLE projects ADD COLUMN github_forks INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='verified') THEN
        ALTER TABLE projects ADD COLUMN verified BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='slug') THEN
        ALTER TABLE projects ADD COLUMN slug VARCHAR(200);
    END IF;
END $$;

-- ============================================
-- STEP 3: EMAIL SUBSCRIPTIONS SYSTEM
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

-- ============================================
-- STEP 4: COMPREHENSIVE RATING SYSTEM
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
    recommendation_percentage INTEGER DEFAULT 0,
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
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 5: ENABLE ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY; 
ALTER TABLE comprehensive_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_aggregate_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reputation_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (public read access)
DO $$ 
BEGIN
    -- Categories - public read
    DROP POLICY IF EXISTS "public_read_categories" ON categories;
    CREATE POLICY "public_read_categories" ON categories FOR SELECT USING (true);
    
    -- Projects - public read  
    DROP POLICY IF EXISTS "public_read_projects" ON projects;
    CREATE POLICY "public_read_projects" ON projects FOR SELECT USING (true);
    
    -- Ratings - public read
    DROP POLICY IF EXISTS "public_read_comprehensive_ratings" ON comprehensive_ratings;
    CREATE POLICY "public_read_comprehensive_ratings" ON comprehensive_ratings FOR SELECT USING (true);
    
    -- Aggregate ratings - public read
    DROP POLICY IF EXISTS "public_read_aggregate_ratings" ON project_aggregate_ratings;
    CREATE POLICY "public_read_aggregate_ratings" ON project_aggregate_ratings FOR SELECT USING (true);
    
    -- Reputation - public read
    DROP POLICY IF EXISTS "public_read_reputation_scores" ON user_reputation_scores;
    CREATE POLICY "public_read_reputation_scores" ON user_reputation_scores FOR SELECT USING (true);
    
    -- Service role full access to all tables
    DROP POLICY IF EXISTS "service_role_full_access_categories" ON categories;
    CREATE POLICY "service_role_full_access_categories" ON categories FOR ALL USING (auth.role() = 'service_role');
    
    DROP POLICY IF EXISTS "service_role_full_access_projects" ON projects;
    CREATE POLICY "service_role_full_access_projects" ON projects FOR ALL USING (auth.role() = 'service_role');
    
    DROP POLICY IF EXISTS "service_role_full_access_ratings" ON comprehensive_ratings;
    CREATE POLICY "service_role_full_access_ratings" ON comprehensive_ratings FOR ALL USING (auth.role() = 'service_role');
    
    DROP POLICY IF EXISTS "service_role_manage_aggregate_ratings" ON project_aggregate_ratings;
    CREATE POLICY "service_role_manage_aggregate_ratings" ON project_aggregate_ratings FOR ALL USING (auth.role() = 'service_role');
    
    DROP POLICY IF EXISTS "service_role_manage_reputation" ON user_reputation_scores;
    CREATE POLICY "service_role_manage_reputation" ON user_reputation_scores FOR ALL USING (auth.role() = 'service_role');
    
    DROP POLICY IF EXISTS "service_role_manage_subscriptions" ON email_subscriptions;
    CREATE POLICY "service_role_manage_subscriptions" ON email_subscriptions FOR ALL USING (auth.role() = 'service_role');

EXCEPTION WHEN OTHERS THEN
    -- If policies already exist, continue
    NULL;
END $$;

-- ============================================
-- STEP 6: CREATE INDEXES FOR PERFORMANCE  
-- ============================================

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(active) WHERE active = true;

-- Projects indexes  
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category_id);
CREATE INDEX IF NOT EXISTS idx_projects_active ON projects(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_projects_verified ON projects(verified) WHERE verified = true;

-- Rating system indexes
CREATE INDEX IF NOT EXISTS idx_comprehensive_ratings_project ON comprehensive_ratings(project_id);
CREATE INDEX IF NOT EXISTS idx_comprehensive_ratings_user ON comprehensive_ratings(user_wallet);

-- ============================================
-- STEP 7: CREATE ENHANCED PROJECT VIEW
-- ============================================

-- Create view with category information
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

-- Update category project counts
UPDATE categories SET project_count = (
    SELECT COUNT(*) 
    FROM projects 
    WHERE category_id = categories.id 
    AND active = true
);

-- Success message
SELECT 
    'Step-by-step setup completed successfully!' as status,
    (SELECT COUNT(*) FROM categories WHERE active = true) as active_categories,
    (SELECT COUNT(*) FROM projects WHERE active = true) as active_projects;