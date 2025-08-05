-- Script complet pour créer toutes les tables nécessaires
-- Exécutez ce script en premier !

-- 1. Créer la table categories
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(10),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Créer la table profiles (utilisateurs)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE,
    email VARCHAR(255) UNIQUE,
    wallet_address TEXT UNIQUE,
    wallet_type VARCHAR(50),
    avatar_url TEXT,
    bio TEXT,
    role VARCHAR(20) DEFAULT 'user',
    reputation INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Créer la table projects
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE,
    description TEXT,
    logo_url TEXT,
    website VARCHAR(500),
    github VARCHAR(500),
    twitter VARCHAR(500),
    discord VARCHAR(500),
    telegram VARCHAR(500),
    category_id UUID REFERENCES categories(id),
    submitter_id UUID REFERENCES profiles(id),
    featured BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    github_stars INTEGER,
    github_forks INTEGER,
    discord_members INTEGER,
    last_scraped_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Créer la table wallet_ratings
CREATE TABLE IF NOT EXISTS wallet_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    signature TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, wallet_address)
);

-- 5. Créer la table project_comments
CREATE TABLE IF NOT EXISTS project_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id),
    parent_id UUID REFERENCES project_comments(id),
    content TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Activer RLS sur toutes les tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_comments ENABLE ROW LEVEL SECURITY;

-- 7. Créer les policies de base (lecture publique)
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Public read projects" ON projects FOR SELECT USING (active = true);
CREATE POLICY "Public read ratings" ON wallet_ratings FOR SELECT USING (true);
CREATE POLICY "Public read comments" ON project_comments FOR SELECT USING (is_deleted = false);

-- 8. Policies pour insertion (tout le monde peut créer)
CREATE POLICY "Public create profiles" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public create ratings" ON wallet_ratings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public create comments" ON project_comments FOR INSERT WITH CHECK (true);

-- 9. Créer les index pour performance
CREATE INDEX idx_projects_category ON projects(category_id);
CREATE INDEX idx_projects_active ON projects(active) WHERE active = true;
CREATE INDEX idx_projects_featured ON projects(featured) WHERE featured = true;
CREATE INDEX idx_wallet_ratings_project ON wallet_ratings(project_id);
CREATE INDEX idx_wallet_ratings_wallet ON wallet_ratings(wallet_address);
CREATE INDEX idx_comments_project ON project_comments(project_id);

-- 10. Insérer les catégories de base
INSERT INTO categories (name, slug, icon, description) VALUES
    ('DeFi', 'defi', '💰', 'Decentralized Finance applications'),
    ('Wallets', 'wallets', '👛', 'Kaspa wallets and key management'),
    ('Mining', 'mining', '⛏️', 'Mining pools and software'),
    ('Tools', 'tools', '🔧', 'Development tools and utilities'),
    ('Games', 'games', '🎮', 'Games built on Kaspa'),
    ('NFTs', 'nfts', '🎨', 'NFT platforms and marketplaces'),
    ('Infrastructure', 'infrastructure', '🏗️', 'Core infrastructure projects'),
    ('Education', 'education', '📚', 'Educational resources'),
    ('Other', 'other', '📦', 'Other projects')
ON CONFLICT (slug) DO NOTHING;

-- 11. Insérer quelques projets d'exemple
INSERT INTO projects (title, slug, description, category_id, website, github, twitter, featured, active) 
SELECT 
    'Kaspa Wallet',
    'kaspa-wallet',
    'Official Kaspa wallet for secure transactions',
    c.id,
    'https://wallet.kaspanet.io',
    'https://github.com/kaspanet/kaspad',
    '@KaspaCurrency',
    true,
    true
FROM categories c WHERE c.slug = 'wallets'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO projects (title, slug, description, category_id, website, twitter, featured, active) 
SELECT 
    'Kasware',
    'kasware',
    'Browser extension wallet for Kaspa blockchain',
    c.id,
    'https://kasware.xyz',
    '@kasware_wallet',
    true,
    true
FROM categories c WHERE c.slug = 'wallets'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO projects (title, slug, description, category_id, website, featured, active) 
SELECT 
    'Kasplex',
    'kasplex',
    'DeFi platform and DEX on Kaspa',
    c.id,
    'https://kasplex.org',
    false,
    true
FROM categories c WHERE c.slug = 'defi'
ON CONFLICT (slug) DO NOTHING;

-- 12. Fonction pour obtenir ou créer un profil wallet
CREATE OR REPLACE FUNCTION get_or_create_wallet_profile(
    p_wallet_address TEXT,
    p_wallet_type TEXT DEFAULT NULL
)
RETURNS profiles AS $$
DECLARE
    v_profile profiles;
BEGIN
    -- Essayer de récupérer le profil existant
    SELECT * INTO v_profile
    FROM profiles
    WHERE wallet_address = p_wallet_address;
    
    -- Si pas trouvé, créer un nouveau
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

-- 13. Vue pour les statistiques des projets
CREATE OR REPLACE VIEW project_stats AS
SELECT 
    p.id,
    p.title,
    p.slug,
    p.description,
    p.logo_url,
    p.website,
    p.github,
    p.twitter,
    p.discord,
    p.featured,
    p.github_stars,
    c.name as category_name,
    c.icon as category_icon,
    COUNT(DISTINCT wr.wallet_address) as rating_count,
    COALESCE(AVG(wr.rating), 0)::NUMERIC(3,2) as average_rating,
    COUNT(DISTINCT pc.id) as comment_count
FROM projects p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN wallet_ratings wr ON p.id = wr.project_id
LEFT JOIN project_comments pc ON p.id = pc.project_id AND pc.is_deleted = false
WHERE p.active = true
GROUP BY p.id, c.name, c.icon;

-- Vérification finale
SELECT 
    'Tables créées avec succès!' as status,
    (SELECT COUNT(*) FROM categories) as total_categories,
    (SELECT COUNT(*) FROM projects) as total_projects;
