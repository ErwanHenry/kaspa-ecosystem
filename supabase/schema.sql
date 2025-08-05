-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table (same as before)
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects table with enhanced fields
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    website TEXT,
    github TEXT,
    twitter TEXT,
    discord TEXT,
    telegram TEXT,
    medium TEXT,
    youtube TEXT,
    logo_url TEXT,
    featured BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    launch_date DATE,
    tags TEXT[],
    team_size INTEGER,
    funding_status TEXT,
    
    -- Apify scraping fields
    last_scraped_at TIMESTAMPTZ,
    scrape_status TEXT,
    github_stars INTEGER,
    github_forks INTEGER,
    github_issues INTEGER,
    github_last_commit TIMESTAMPTZ,
    twitter_followers INTEGER,
    discord_members INTEGER,
    
    -- SEO and metadata
    meta_description TEXT,
    og_image_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    avatar_url TEXT,
    bio TEXT,
    website TEXT,
    twitter TEXT,
    github TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
    reputation INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project ratings table
CREATE TABLE IF NOT EXISTS project_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- Project comments table
CREATE TABLE IF NOT EXISTS project_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES project_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comment votes table
CREATE TABLE IF NOT EXISTS comment_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id UUID REFERENCES project_comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- Scraping queue table
CREATE TABLE IF NOT EXISTS scraping_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    priority INTEGER DEFAULT 5,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    attempts INTEGER DEFAULT 0,
    last_error TEXT,
    scheduled_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    session_id TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_projects_category ON projects(category_id);
CREATE INDEX idx_projects_featured ON projects(featured) WHERE featured = true;
CREATE INDEX idx_projects_active ON projects(active) WHERE active = true;
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_ratings_project ON project_ratings(project_id);
CREATE INDEX idx_ratings_user ON project_ratings(user_id);
CREATE INDEX idx_comments_project ON project_comments(project_id);
CREATE INDEX idx_comments_user ON project_comments(user_id);
CREATE INDEX idx_comments_parent ON project_comments(parent_id);
CREATE INDEX idx_analytics_project ON analytics_events(project_id);
CREATE INDEX idx_analytics_created ON analytics_events(created_at DESC);

-- Create views for aggregated data
CREATE OR REPLACE VIEW project_stats AS
SELECT 
    p.id,
    p.title,
    COUNT(DISTINCT r.id) as rating_count,
    AVG(r.rating)::NUMERIC(3,2) as average_rating,
    COUNT(DISTINCT c.id) as comment_count,
    p.github_stars,
    p.twitter_followers,
    p.discord_members
FROM projects p
LEFT JOIN project_ratings r ON p.id = r.project_id
LEFT JOIN project_comments c ON p.id = c.project_id AND c.is_deleted = false
GROUP BY p.id;

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Profiles: Public read, authenticated update own profile
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Ratings: Public read, authenticated users can rate
CREATE POLICY "Ratings are viewable by everyone"
    ON project_ratings FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create ratings"
    ON project_ratings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings"
    ON project_ratings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ratings"
    ON project_ratings FOR DELETE
    USING (auth.uid() = user_id);

-- Comments: Public read, authenticated create/update/delete own
CREATE POLICY "Comments are viewable by everyone"
    ON project_comments FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create comments"
    ON project_comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
    ON project_comments FOR UPDATE
    USING (auth.uid() = user_id);

-- Comment votes: Public read, authenticated vote
CREATE POLICY "Comment votes are viewable by everyone"
    ON comment_votes FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can vote"
    ON comment_votes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can change their vote"
    ON comment_votes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can remove their vote"
    ON comment_votes FOR DELETE
    USING (auth.uid() = user_id);

-- Analytics: Insert only for authenticated users
CREATE POLICY "Anyone can insert analytics"
    ON analytics_events FOR INSERT
    WITH CHECK (true);

-- Functions and triggers
-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ratings_updated_at BEFORE UPDATE ON project_ratings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON project_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update comment vote counts
CREATE OR REPLACE FUNCTION update_comment_votes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE project_comments
        SET 
            upvotes = (SELECT COUNT(*) FROM comment_votes WHERE comment_id = NEW.comment_id AND vote_type = 'upvote'),
            downvotes = (SELECT COUNT(*) FROM comment_votes WHERE comment_id = NEW.comment_id AND vote_type = 'downvote')
        WHERE id = NEW.comment_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE project_comments
        SET 
            upvotes = (SELECT COUNT(*) FROM comment_votes WHERE comment_id = OLD.comment_id AND vote_type = 'upvote'),
            downvotes = (SELECT COUNT(*) FROM comment_votes WHERE comment_id = OLD.comment_id AND vote_type = 'downvote')
        WHERE id = OLD.comment_id;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_comment_vote_counts
AFTER INSERT OR UPDATE OR DELETE ON comment_votes
    FOR EACH ROW EXECUTE FUNCTION update_comment_votes();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

