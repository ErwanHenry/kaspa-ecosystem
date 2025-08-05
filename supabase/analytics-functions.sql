-- Function to get project growth stats
CREATE OR REPLACE FUNCTION get_project_growth_stats()
RETURNS TABLE(
    date DATE,
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(created_at) as date,
        COUNT(*)::BIGINT as count
    FROM projects
    WHERE active = true
    AND created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY date;
END;
$$ LANGUAGE plpgsql;

-- Function to get rating trends
CREATE OR REPLACE FUNCTION get_rating_trends()
RETURNS TABLE(
    week TEXT,
    avg_rating NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        TO_CHAR(DATE_TRUNC('week', created_at), 'MM/DD') as week,
        AVG(rating)::NUMERIC(3,2) as avg_rating
    FROM project_ratings
    WHERE created_at >= CURRENT_DATE - INTERVAL '12 weeks'
    GROUP BY DATE_TRUNC('week', created_at)
    ORDER BY DATE_TRUNC('week', created_at);
END;
$$ LANGUAGE plpgsql;

-- User follows table
CREATE TABLE IF NOT EXISTS user_follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, project_id)
);

-- Notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    new_projects BOOLEAN DEFAULT true,
    followed_updates BOOLEAN DEFAULT true,
    rating_milestones BOOLEAN DEFAULT true,
    weekly_digest BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Activity feed
CREATE TABLE IF NOT EXISTS activity_feed (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- 'new_project', 'rating', 'comment', 'update'
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for new tables
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

-- User follows policies
CREATE POLICY "Users can view all follows"
    ON user_follows FOR SELECT
    USING (true);

CREATE POLICY "Users can manage own follows"
    ON user_follows FOR ALL
    USING (auth.uid() = user_id);

-- Notification preferences policies
CREATE POLICY "Users can view own preferences"
    ON notification_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
    ON notification_preferences FOR ALL
    USING (auth.uid() = user_id);

-- Activity feed policies
CREATE POLICY "Public activity feed"
    ON activity_feed FOR SELECT
    USING (true);

-- Function to get popular projects
CREATE OR REPLACE FUNCTION get_popular_projects(limit_count INT DEFAULT 10)
RETURNS TABLE(
    id UUID,
    title TEXT,
    description TEXT,
    logo_url TEXT,
    rating_count BIGINT,
    avg_rating NUMERIC,
    github_stars INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.description,
        p.logo_url,
        COUNT(DISTINCT r.id) as rating_count,
        AVG(r.rating)::NUMERIC(3,2) as avg_rating,
        p.github_stars
    FROM projects p
    LEFT JOIN project_ratings r ON p.id = r.project_id
    WHERE p.active = true
    GROUP BY p.id
    ORDER BY 
        COUNT(DISTINCT r.id) DESC,
        AVG(r.rating) DESC NULLS LAST,
        p.github_stars DESC NULLS LAST
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS TABLE(
    total_ratings BIGINT,
    total_comments BIGINT,
    total_follows BIGINT,
    reputation INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM project_ratings WHERE user_id = user_uuid),
        (SELECT COUNT(*) FROM project_comments WHERE user_id = user_uuid AND is_deleted = false),
        (SELECT COUNT(*) FROM user_follows WHERE user_id = user_uuid),
        (SELECT COALESCE(reputation, 0) FROM profiles WHERE id = user_uuid);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update activity feed
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'projects' AND TG_OP = 'INSERT' THEN
        INSERT INTO activity_feed (project_id, activity_type, metadata)
        VALUES (NEW.id, 'new_project', jsonb_build_object('title', NEW.title));
    ELSIF TG_TABLE_NAME = 'project_ratings' THEN
        INSERT INTO activity_feed (user_id, project_id, activity_type, metadata)
        VALUES (NEW.user_id, NEW.project_id, 'rating', jsonb_build_object('rating', NEW.rating));
    ELSIF TG_TABLE_NAME = 'project_comments' THEN
        INSERT INTO activity_feed (user_id, project_id, activity_type, metadata)
        VALUES (NEW.user_id, NEW.project_id, 'comment', jsonb_build_object('preview', LEFT(NEW.content, 100)));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply activity triggers
CREATE TRIGGER log_project_activity
AFTER INSERT ON projects
FOR EACH ROW EXECUTE FUNCTION log_activity();

CREATE TRIGGER log_rating_activity
AFTER INSERT ON project_ratings
FOR EACH ROW EXECUTE FUNCTION log_activity();

CREATE TRIGGER log_comment_activity
AFTER INSERT ON project_comments
FOR EACH ROW EXECUTE FUNCTION log_activity();
