-- Add wallet support to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wallet_address TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wallet_type TEXT;

-- Create wallet-based ratings table
CREATE TABLE IF NOT EXISTS wallet_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    signature TEXT, -- Wallet signature for verification
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, wallet_address)
);

-- Enable RLS
ALTER TABLE wallet_ratings ENABLE ROW LEVEL SECURITY;

-- Policies for wallet ratings
CREATE POLICY "Anyone can view wallet ratings"
    ON wallet_ratings FOR SELECT
    USING (true);

CREATE POLICY "Anyone can create wallet ratings"
    ON wallet_ratings FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update their own wallet ratings"
    ON wallet_ratings FOR UPDATE
    USING (wallet_address = current_setting('app.wallet_address', true));

-- Function to get or create profile by wallet
CREATE OR REPLACE FUNCTION get_or_create_wallet_profile(
    p_wallet_address TEXT,
    p_wallet_type TEXT DEFAULT NULL
)
RETURNS profiles AS $$
DECLARE
    v_profile profiles;
BEGIN
    -- Try to get existing profile
    SELECT * INTO v_profile
    FROM profiles
    WHERE wallet_address = p_wallet_address;
    
    -- If not found, create new one
    IF NOT FOUND THEN
        INSERT INTO profiles (
            wallet_address,
            wallet_type,
            username,
            role
        ) VALUES (
            p_wallet_address,
            p_wallet_type,
            'kaspa_' || SUBSTRING(p_wallet_address, 7, 6),
            'user'
        )
        RETURNING * INTO v_profile;
    END IF;
    
    RETURN v_profile;
END;
$$ LANGUAGE plpgsql;

-- View for project stats including wallet ratings
CREATE OR REPLACE VIEW project_wallet_stats AS
SELECT 
    p.id,
    p.title,
    COUNT(DISTINCT wr.wallet_address) as rating_count,
    AVG(wr.rating)::NUMERIC(3,2) as average_rating,
    COUNT(DISTINCT CASE WHEN wr.comment IS NOT NULL THEN wr.wallet_address END) as comment_count
FROM projects p
LEFT JOIN wallet_ratings wr ON p.id = wr.project_id
GROUP BY p.id, p.title;

-- Index for performance
CREATE INDEX idx_wallet_ratings_project ON wallet_ratings(project_id);
CREATE INDEX idx_wallet_ratings_wallet ON wallet_ratings(wallet_address);
