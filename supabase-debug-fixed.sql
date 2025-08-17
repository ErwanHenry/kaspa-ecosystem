-- 🗄️ Kaspa Ecosystem - Debug Fixed Version
-- This version fixes the "column active does not exist" error

-- ============================================
-- STEP 1: DIAGNOSTIC - CHECK EXISTING STRUCTURE
-- ============================================

-- Check what columns exist in projects table
SELECT 
    'projects table columns:' as info,
    string_agg(column_name, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns 
WHERE table_name = 'projects';

-- Check what columns exist in categories table  
SELECT 
    'categories table columns:' as info,
    string_agg(column_name, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns 
WHERE table_name = 'categories';

-- ============================================
-- STEP 2: FIX CATEGORIES TABLE FIRST
-- ============================================

-- Add missing columns to categories table
DO $$ 
BEGIN
    -- Add icon column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='icon') THEN
        ALTER TABLE categories ADD COLUMN icon VARCHAR(50);
        RAISE NOTICE 'Added icon column to categories';
    END IF;
    
    -- Add color column if not exists  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='color') THEN
        ALTER TABLE categories ADD COLUMN color VARCHAR(7) DEFAULT '#49EACB';
        RAISE NOTICE 'Added color column to categories';
    END IF;
    
    -- Add project_count column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='project_count') THEN
        ALTER TABLE categories ADD COLUMN project_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added project_count column to categories';
    END IF;
    
    -- Add active column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='active') THEN
        ALTER TABLE categories ADD COLUMN active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added active column to categories';
    END IF;
END $$;

-- ============================================
-- STEP 3: FIX PROJECTS TABLE
-- ============================================

-- Add missing columns to projects table
DO $$ 
BEGIN
    -- Add active column FIRST (this is what's causing the error)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='active') THEN
        ALTER TABLE projects ADD COLUMN active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added active column to projects';
    END IF;
    
    -- Add category_id if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='category_id') THEN
        ALTER TABLE projects ADD COLUMN category_id UUID;
        -- Add foreign key constraint separately
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='categories') THEN
            ALTER TABLE projects ADD CONSTRAINT fk_projects_category 
            FOREIGN KEY (category_id) REFERENCES categories(id);
        END IF;
        RAISE NOTICE 'Added category_id column to projects';
    END IF;
    
    -- Add GitHub-related columns only if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='github_stars') THEN
        ALTER TABLE projects ADD COLUMN github_stars INTEGER DEFAULT 0;
        RAISE NOTICE 'Added github_stars column to projects';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='github_forks') THEN
        ALTER TABLE projects ADD COLUMN github_forks INTEGER DEFAULT 0;
        RAISE NOTICE 'Added github_forks column to projects';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='github_commits') THEN
        ALTER TABLE projects ADD COLUMN github_commits INTEGER DEFAULT 0;
        RAISE NOTICE 'Added github_commits column to projects';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='github_pushed_at') THEN
        ALTER TABLE projects ADD COLUMN github_pushed_at TIMESTAMPTZ;
        RAISE NOTICE 'Added github_pushed_at column to projects';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='verified') THEN
        ALTER TABLE projects ADD COLUMN verified BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added verified column to projects';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='featured') THEN
        ALTER TABLE projects ADD COLUMN featured BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added featured column to projects';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='slug') THEN
        ALTER TABLE projects ADD COLUMN slug VARCHAR(200);
        RAISE NOTICE 'Added slug column to projects';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='logo_url') THEN
        ALTER TABLE projects ADD COLUMN logo_url TEXT;
        RAISE NOTICE 'Added logo_url column to projects';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='overall_score') THEN
        ALTER TABLE projects ADD COLUMN overall_score DECIMAL(5,2) DEFAULT 0;
        RAISE NOTICE 'Added overall_score column to projects';
    END IF;
    
    -- Skip rating_count and rating_avg as they likely already exist
    RAISE NOTICE 'Skipping rating_count and rating_avg columns (likely already exist)';
END $$;

-- Update all existing projects to be active by default
UPDATE projects SET active = true WHERE active IS NULL;

-- ============================================
-- STEP 4: UPDATE EXISTING CATEGORIES DATA
-- ============================================

-- Update existing categories with icons and colors
UPDATE categories SET 
    icon = CASE 
        WHEN name ILIKE '%defi%' OR name ILIKE '%finance%' THEN '💰'
        WHEN name ILIKE '%dex%' OR name ILIKE '%exchange%' THEN '🔄' 
        WHEN name ILIKE '%nft%' THEN '🎨'
        WHEN name ILIKE '%game%' OR name ILIKE '%gaming%' THEN '🎮'
        WHEN name ILIKE '%infrastructure%' OR name ILIKE '%infra%' THEN '🏗️'
        WHEN name ILIKE '%wallet%' THEN '👛'
        WHEN name ILIKE '%analytic%' OR name ILIKE '%data%' THEN '📊'
        WHEN name ILIKE '%security%' OR name ILIKE '%audit%' THEN '🔐'
        WHEN name ILIKE '%education%' OR name ILIKE '%learning%' THEN '📚'
        WHEN name ILIKE '%tool%' OR name ILIKE '%utility%' THEN '🛠️'
        WHEN name ILIKE '%social%' THEN '👥'
        WHEN name ILIKE '%bridge%' THEN '🌉'
        WHEN name ILIKE '%mining%' OR name ILIKE '%pool%' THEN '⛏️'
        WHEN name ILIKE '%explorer%' THEN '🔍'
        WHEN name ILIKE '%marketplace%' OR name ILIKE '%market%' THEN '🛒'
        WHEN name ILIKE '%dao%' THEN '🏛️'
        ELSE '📦'
    END,
    color = CASE
        WHEN name ILIKE '%defi%' OR name ILIKE '%finance%' THEN '#FF6B35'
        WHEN name ILIKE '%dex%' OR name ILIKE '%exchange%' THEN '#4F46E5'
        WHEN name ILIKE '%nft%' THEN '#EC4899'
        WHEN name ILIKE '%game%' OR name ILIKE '%gaming%' THEN '#10B981'
        WHEN name ILIKE '%infrastructure%' OR name ILIKE '%infra%' THEN '#6366F1'
        WHEN name ILIKE '%wallet%' THEN '#8B5CF6'
        WHEN name ILIKE '%analytic%' OR name ILIKE '%data%' THEN '#F59E0B'
        WHEN name ILIKE '%security%' OR name ILIKE '%audit%' THEN '#EF4444'
        WHEN name ILIKE '%education%' OR name ILIKE '%learning%' THEN '#06B6D4'
        WHEN name ILIKE '%tool%' OR name ILIKE '%utility%' THEN '#84CC16'
        WHEN name ILIKE '%social%' THEN '#F97316'
        WHEN name ILIKE '%bridge%' THEN '#14B8A6'
        WHEN name ILIKE '%mining%' OR name ILIKE '%pool%' THEN '#A855F7'
        WHEN name ILIKE '%explorer%' THEN '#3B82F6'
        WHEN name ILIKE '%marketplace%' OR name ILIKE '%market%' THEN '#DC2626'
        WHEN name ILIKE '%dao%' THEN '#7C3AED'
        ELSE '#49EACB'
    END,
    active = true
WHERE icon IS NULL OR color IS NULL;

-- Insert new categories only if they don't exist
INSERT INTO categories (name, slug, description, icon, color, active) 
VALUES 
    ('Social', 'social', 'Social platforms and community tools', '👥', '#F97316', true),
    ('Bridge', 'bridge', 'Cross-chain bridges and interoperability', '🌉', '#14B8A6', true),
    ('Mining', 'mining', 'Mining tools and pool management', '⛏️', '#A855F7', true),
    ('Explorer', 'explorer', 'Blockchain explorers and search tools', '🔍', '#3B82F6', true),
    ('Marketplace', 'marketplace', 'Digital marketplaces and e-commerce', '🛒', '#DC2626', true),
    ('DAO', 'dao', 'Decentralized Autonomous Organizations', '🏛️', '#7C3AED', true)
ON CONFLICT (name) DO UPDATE SET
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    description = EXCLUDED.description,
    active = EXCLUDED.active;

-- ============================================
-- STEP 5: CREATE NEW TABLES SAFELY
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

-- Create comprehensive ratings table
CREATE TABLE IF NOT EXISTS comprehensive_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
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

-- Add foreign key constraint safely
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'comprehensive_ratings_project_id_fkey'
    ) THEN
        ALTER TABLE comprehensive_ratings 
        ADD CONSTRAINT comprehensive_ratings_project_id_fkey 
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create project aggregate ratings table
CREATE TABLE IF NOT EXISTS project_aggregate_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    overall_rating DECIMAL(3,2) NOT NULL DEFAULT 0,
    dimension_ratings JSONB NOT NULL DEFAULT '{}',
    total_ratings INTEGER DEFAULT 0,
    verified_ratings INTEGER DEFAULT 0,
    recommendation_percentage INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_project_aggregate UNIQUE(project_id)
);

-- Add foreign key constraint safely
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'project_aggregate_ratings_project_id_fkey'
    ) THEN
        ALTER TABLE project_aggregate_ratings 
        ADD CONSTRAINT project_aggregate_ratings_project_id_fkey 
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
    END IF;
END $$;

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
-- STEP 6: CREATE INDEXES SAFELY
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
-- STEP 7: ENABLE RLS AND CREATE POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY; 
ALTER TABLE comprehensive_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_aggregate_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reputation_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies safely
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
    
    -- Service role full access
    DROP POLICY IF EXISTS "service_role_full_access_categories" ON categories;
    CREATE POLICY "service_role_full_access_categories" ON categories FOR ALL USING (auth.role() = 'service_role');
    
    DROP POLICY IF EXISTS "service_role_full_access_projects" ON projects;
    CREATE POLICY "service_role_full_access_projects" ON projects FOR ALL USING (auth.role() = 'service_role');
    
    DROP POLICY IF EXISTS "service_role_full_access_ratings" ON comprehensive_ratings;
    CREATE POLICY "service_role_full_access_ratings" ON comprehensive_ratings FOR ALL USING (auth.role() = 'service_role');

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Some policies may already exist, continuing...';
END $$;

-- ============================================
-- STEP 8: CREATE ENHANCED VIEW SAFELY
-- ============================================

-- Create view safely handling existing and new columns
CREATE OR REPLACE VIEW enhanced_project_stats AS
SELECT 
    p.*,
    c.name as category_name,
    c.slug as category_slug,
    c.icon as category_icon,
    c.color as category_color,
    -- Use existing project rating columns if they exist, otherwise 0
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='rating_avg') 
        THEN COALESCE(p.rating_avg, 0) 
        ELSE 0 
    END as average_rating,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='rating_count') 
        THEN COALESCE(p.rating_count, 0) 
        ELSE 0 
    END as rating_count,
    -- Always default comment count to 0 for now
    0 as comment_count
FROM projects p
LEFT JOIN categories c ON p.category_id = c.id;

-- ============================================
-- STEP 9: UPDATE DATA SAFELY
-- ============================================

-- Update category project counts safely
UPDATE categories SET project_count = (
    SELECT COUNT(*) 
    FROM projects 
    WHERE category_id = categories.id 
    AND active = true
) WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='active');

-- ============================================
-- STEP 10: FINAL VERIFICATION
-- ============================================

-- Show final status
SELECT 
    'Setup completed successfully!' as status,
    (SELECT COUNT(*) FROM categories WHERE active = true) as active_categories,
    (SELECT COUNT(*) FROM projects WHERE active = true) as active_projects,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('comprehensive_ratings', 'project_aggregate_ratings', 'user_reputation_scores', 'email_subscriptions')) as new_tables_created;

-- Show updated table structures
SELECT 
    'projects table now has these columns:' as info,
    string_agg(column_name, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns 
WHERE table_name = 'projects';

SELECT 
    'categories table now has these columns:' as info,
    string_agg(column_name, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns 
WHERE table_name = 'categories';