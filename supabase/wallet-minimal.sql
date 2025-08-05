-- Script minimal pour faire fonctionner la connexion wallet

-- 1. Ajouter colonnes wallet à profiles (si pas déjà fait)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS wallet_address TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS wallet_type TEXT;

-- 2. Créer table wallet_ratings simple
DROP TABLE IF EXISTS wallet_ratings CASCADE;

CREATE TABLE wallet_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    signature TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, wallet_address)
);

-- 3. RLS simple
ALTER TABLE wallet_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read wallet ratings"
    ON wallet_ratings FOR SELECT
    USING (true);

CREATE POLICY "Public write wallet ratings"
    ON wallet_ratings FOR INSERT
    WITH CHECK (true);

-- 4. Index basique
CREATE INDEX idx_wr_project ON wallet_ratings(project_id);

-- 5. Fonction simple pour créer/récupérer profil
CREATE OR REPLACE FUNCTION get_wallet_profile(p_wallet_address TEXT)
RETURNS TABLE(
    id UUID,
    username TEXT,
    wallet_address TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    -- D'abord essayer de récupérer
    RETURN QUERY
    SELECT p.id, p.username, p.wallet_address, p.created_at
    FROM profiles p
    WHERE p.wallet_address = p_wallet_address;
    
    -- Si pas trouvé, créer
    IF NOT FOUND THEN
        RETURN QUERY
        INSERT INTO profiles (username, wallet_address, role)
        VALUES (
            'kaspa_' || SUBSTRING(p_wallet_address, 7, 6),
            p_wallet_address,
            'user'
        )
        RETURNING id, username, wallet_address, created_at;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 6. Vue simple pour stats
CREATE OR REPLACE VIEW project_stats_simple AS
SELECT 
    p.id,
    p.title,
    COUNT(wr.id) as ratings_count,
    COALESCE(AVG(wr.rating), 0) as avg_rating
FROM projects p
LEFT JOIN wallet_ratings wr ON p.id = wr.project_id
GROUP BY p.id, p.title;

-- Test
SELECT 'Tables créées avec succès!' as status;
