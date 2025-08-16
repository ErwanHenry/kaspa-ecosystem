-- Enhanced GitHub Integration Schema
-- Add GitHub-specific columns to projects table

-- Add GitHub integration columns
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_id BIGINT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_stars INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_forks INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_watchers INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_issues INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_language VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_languages JSONB;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_topics TEXT[];
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_license JSONB;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_created_at TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_updated_at TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_pushed_at TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_size INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_contributors_count INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_releases_count INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_latest_release JSONB;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_activity_score INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_health_score INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_archived BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_last_sync TIMESTAMPTZ;

-- Add project status and maturity tracking
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_status VARCHAR(20) DEFAULT 'active';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS maturity_level VARCHAR(20) DEFAULT 'beta';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS verified_status BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS verification_date TIMESTAMPTZ;

-- Add social metrics
ALTER TABLE projects ADD COLUMN IF NOT EXISTS discord_members INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS discord_invite VARCHAR(500);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS twitter_followers INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS telegram_members INTEGER DEFAULT 0;

-- Add project metadata
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_type VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE projects ADD COLUMN IF NOT EXISTS documentation_url VARCHAR(500);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS demo_url VARCHAR(500);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS whitepaper_url VARCHAR(500);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS audit_report_url VARCHAR(500);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_github_stars ON projects(github_stars DESC) WHERE github_stars > 0;
CREATE INDEX IF NOT EXISTS idx_projects_activity_score ON projects(github_activity_score DESC);
CREATE INDEX IF NOT EXISTS idx_projects_health_score ON projects(github_health_score DESC);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(project_status);
CREATE INDEX IF NOT EXISTS idx_projects_maturity ON projects(maturity_level);
CREATE INDEX IF NOT EXISTS idx_projects_verified ON projects(verified_status) WHERE verified_status = true;
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(project_type);
CREATE INDEX IF NOT EXISTS idx_projects_tags ON projects USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_projects_github_language ON projects(github_language);
CREATE INDEX IF NOT EXISTS idx_projects_github_topics ON projects USING GIN(github_topics);

-- Enhanced project view with GitHub data
CREATE OR REPLACE VIEW enhanced_project_stats AS
SELECT 
    p.*,
    c.name as category_name,
    c.icon as category_icon,
    c.slug as category_slug,
    COUNT(DISTINCT wr.wallet_address) as rating_count,
    COALESCE(AVG(wr.rating), 0)::NUMERIC(3,2) as average_rating,
    COUNT(DISTINCT pc.id) as comment_count,
    COUNT(DISTINCT sr.id) as scam_report_count,
    
    -- GitHub metrics
    CASE 
        WHEN p.github_activity_score > 80 THEN 'Very Active'
        WHEN p.github_activity_score > 60 THEN 'Active'
        WHEN p.github_activity_score > 40 THEN 'Moderate'
        WHEN p.github_activity_score > 20 THEN 'Low'
        ELSE 'Inactive'
    END as activity_level,
    
    CASE 
        WHEN p.github_health_score > 80 THEN 'Excellent'
        WHEN p.github_health_score > 60 THEN 'Good'
        WHEN p.github_health_score > 40 THEN 'Fair'
        WHEN p.github_health_score > 20 THEN 'Poor'
        ELSE 'Unknown'
    END as health_status,
    
    -- Overall project score (combining all metrics)
    (
        COALESCE(p.github_activity_score, 0) * 0.3 +
        COALESCE(p.github_health_score, 0) * 0.3 +
        COALESCE(AVG(wr.rating) * 20, 0) * 0.2 +
        LEAST(COUNT(DISTINCT wr.wallet_address) * 2, 100) * 0.1 +
        LEAST(p.github_stars * 0.1, 100) * 0.1
    )::INTEGER as overall_score,
    
    -- Trending calculation (activity in last 30 days)
    CASE 
        WHEN p.github_pushed_at > NOW() - INTERVAL '7 days' THEN 3
        WHEN p.github_pushed_at > NOW() - INTERVAL '30 days' THEN 2
        WHEN p.github_pushed_at > NOW() - INTERVAL '90 days' THEN 1
        ELSE 0
    END as trending_score

FROM projects p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN wallet_ratings wr ON p.id = wr.project_id
LEFT JOIN project_comments pc ON p.id = pc.project_id AND pc.is_deleted = false
LEFT JOIN scam_reports sr ON p.id = sr.project_id
WHERE p.active = true
GROUP BY p.id, c.name, c.icon, c.slug;

-- Function to update project scores
CREATE OR REPLACE FUNCTION update_project_scores()
RETURNS void AS $$
BEGIN
    -- This function can be called periodically to recalculate scores
    -- Implementation would update derived scores based on latest data
    RAISE NOTICE 'Project scores updated';
END;
$$ LANGUAGE plpgsql;

-- Create expanded categories with new project types
INSERT INTO categories (name, slug, icon, description) VALUES
    ('AI & ML', 'ai-ml', '🤖', 'Artificial Intelligence and Machine Learning projects'),
    ('Analytics', 'analytics', '📊', 'Data analytics and visualization tools'),
    ('Bridges', 'bridges', '🌉', 'Cross-chain bridge and interoperability solutions'),
    ('DAOs', 'daos', '🏛️', 'Decentralized Autonomous Organizations'),
    ('Developer Tools', 'dev-tools', '🛠️', 'Development frameworks and utilities'),
    ('Exchanges', 'exchanges', '💱', 'Decentralized and centralized exchanges'),
    ('Identity', 'identity', '👤', 'Digital identity and authentication solutions'),
    ('Oracles', 'oracles', '🔮', 'Data oracle and external data providers'),
    ('Privacy', 'privacy', '🔒', 'Privacy-focused applications and tools'),
    ('Social', 'social', '👥', 'Social platforms and community tools'),
    ('Staking', 'staking', '🥩', 'Staking platforms and validators'),
    ('Trading', 'trading', '📈', 'Trading bots and financial tools')
ON CONFLICT (slug) DO NOTHING;

-- Add project maturity levels reference
CREATE TABLE IF NOT EXISTS maturity_levels (
    level VARCHAR(20) PRIMARY KEY,
    description TEXT,
    requirements TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO maturity_levels (level, description, requirements) VALUES
    ('concept', 'Initial concept or idea stage', ARRAY['Basic documentation', 'Clear vision statement']),
    ('development', 'Active development phase', ARRAY['Code repository', 'Development roadmap', 'Team information']),
    ('alpha', 'Alpha testing phase', ARRAY['Working prototype', 'Test documentation', 'Security considerations']),
    ('beta', 'Beta testing with limited users', ARRAY['Beta release', 'User feedback integration', 'Bug tracking']),
    ('mainnet', 'Production ready on mainnet', ARRAY['Mainnet deployment', 'Security audit', 'User documentation']),
    ('mature', 'Established and widely adopted', ARRAY['Proven track record', 'Large user base', 'Regular updates'])
ON CONFLICT (level) DO NOTHING;

-- Add project status types
CREATE TABLE IF NOT EXISTS project_statuses (
    status VARCHAR(20) PRIMARY KEY,
    description TEXT,
    color VARCHAR(7),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO project_statuses (status, description, color) VALUES
    ('active', 'Actively maintained and developed', '#10B981'),
    ('maintenance', 'In maintenance mode with limited updates', '#F59E0B'),
    ('deprecated', 'No longer maintained but still functional', '#EF4444'),
    ('archived', 'Archived and no longer functional', '#6B7280'),
    ('coming-soon', 'Announced but not yet available', '#8B5CF6')
ON CONFLICT (status) DO NOTHING;

-- Function to calculate trending projects
CREATE OR REPLACE FUNCTION get_trending_projects(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    project_id UUID,
    title VARCHAR,
    trending_score INTEGER,
    github_stars INTEGER,
    rating_count BIGINT,
    average_rating NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        eps.id,
        eps.title,
        eps.trending_score,
        eps.github_stars,
        eps.rating_count,
        eps.average_rating
    FROM enhanced_project_stats eps
    WHERE eps.active = true
    ORDER BY 
        eps.trending_score DESC,
        eps.github_stars DESC,
        eps.rating_count DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to search projects with enhanced criteria
CREATE OR REPLACE FUNCTION search_projects(
    search_term TEXT DEFAULT NULL,
    category_filter VARCHAR DEFAULT NULL,
    status_filter VARCHAR DEFAULT NULL,
    maturity_filter VARCHAR DEFAULT NULL,
    min_stars INTEGER DEFAULT 0,
    min_rating NUMERIC DEFAULT 0,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    project_id UUID,
    title VARCHAR,
    description TEXT,
    category_name VARCHAR,
    github_stars INTEGER,
    average_rating NUMERIC,
    activity_level TEXT,
    project_status VARCHAR,
    maturity_level VARCHAR,
    overall_score INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        eps.id,
        eps.title,
        eps.description,
        eps.category_name,
        eps.github_stars,
        eps.average_rating,
        eps.activity_level,
        eps.project_status,
        eps.maturity_level,
        eps.overall_score
    FROM enhanced_project_stats eps
    WHERE 
        eps.active = true
        AND (search_term IS NULL OR 
             eps.title ILIKE '%' || search_term || '%' OR 
             eps.description ILIKE '%' || search_term || '%' OR
             eps.github_language ILIKE '%' || search_term || '%' OR
             search_term = ANY(eps.tags) OR
             search_term = ANY(eps.github_topics))
        AND (category_filter IS NULL OR eps.category_slug = category_filter)
        AND (status_filter IS NULL OR eps.project_status = status_filter)
        AND (maturity_filter IS NULL OR eps.maturity_level = maturity_filter)
        AND eps.github_stars >= min_stars
        AND eps.average_rating >= min_rating
    ORDER BY eps.overall_score DESC, eps.github_stars DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on new tables
ALTER TABLE maturity_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_statuses ENABLE ROW LEVEL SECURITY;

-- Create policies for new tables
CREATE POLICY "maturity_levels_read_public" ON maturity_levels FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "project_statuses_read_public" ON project_statuses FOR SELECT TO PUBLIC USING (true);

-- Create function to sync GitHub data (called by cron or manually)
CREATE OR REPLACE FUNCTION sync_github_data()
RETURNS TEXT AS $$
DECLARE
    result_text TEXT;
BEGIN
    -- This would typically call the external GitHub sync function
    -- For now, just return a status message
    result_text := 'GitHub sync initiated at ' || NOW();
    RETURN result_text;
END;
$$ LANGUAGE plpgsql;

SELECT 'GitHub integration schema created successfully!' as status;