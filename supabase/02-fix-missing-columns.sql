-- Script pour ajouter les colonnes manquantes aux tables existantes

-- 1. Vérifier quelles colonnes existent dans projects
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Ajouter les colonnes manquantes à projects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS slug VARCHAR(200) UNIQUE,
ADD COLUMN IF NOT EXISTS submitter_id UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS github_stars INTEGER,
ADD COLUMN IF NOT EXISTS github_forks INTEGER,
ADD COLUMN IF NOT EXISTS discord_members INTEGER,
ADD COLUMN IF NOT EXISTS telegram VARCHAR(500),
ADD COLUMN IF NOT EXISTS last_scraped_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Générer les slugs pour les projets existants
UPDATE projects 
SET slug = LOWER(REPLACE(REPLACE(title, ' ', '-'), '.', ''))
WHERE slug IS NULL;

-- 4. Mettre à jour les policies pour inclure la condition active
DROP POLICY IF EXISTS "Public read projects" ON projects;
CREATE POLICY "Public read active projects" 
    ON projects FOR SELECT 
    USING (active = true OR active IS NULL);

-- 5. Ajouter les colonnes manquantes à profiles si nécessaire
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user',
ADD COLUMN IF NOT EXISTS reputation INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 6. Ajouter les colonnes manquantes à wallet_ratings
ALTER TABLE wallet_ratings
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 7. Créer un trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Appliquer le trigger à toutes les tables
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wallet_ratings_updated_at ON wallet_ratings;
CREATE TRIGGER update_wallet_ratings_updated_at 
    BEFORE UPDATE ON wallet_ratings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Vérification finale
SELECT 
    'Colonnes ajoutées avec succès!' as status,
    COUNT(*) as total_projects,
    COUNT(*) FILTER (WHERE active = true) as active_projects,
    COUNT(*) FILTER (WHERE featured = true) as featured_projects
FROM projects;
