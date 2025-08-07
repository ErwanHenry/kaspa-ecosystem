-- Script de configuration de la base de données Kaspa Ecosystem
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Créer la table des catégories
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Insérer les catégories de base
INSERT INTO categories (name, slug) VALUES 
    ('Wallets', 'wallets'),
    ('Mining', 'mining'),
    ('DeFi', 'defi'),
    ('NFTs', 'nfts'),
    ('Infrastructure', 'infrastructure'),
    ('Education', 'education'),
    ('Tools', 'tools'),
    ('Other', 'other')
ON CONFLICT (slug) DO NOTHING;

-- 3. Si la table projects existe déjà avec une colonne 'categories' (texte),
-- nous devons la migrer vers category_id
-- D'abord, ajoutons la colonne category_id si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'category_id') THEN
        ALTER TABLE projects ADD COLUMN category_id INTEGER;
    END IF;
END $$;

-- 4. Migrer les données existantes (si vous avez des catégories en texte)
-- Adaptez cette partie selon vos données actuelles
UPDATE projects SET category_id = 
    CASE 
        WHEN categories = 'Wallets' OR categories = 'wallets' THEN 1
        WHEN categories = 'Mining' OR categories = 'mining' THEN 2
        WHEN categories = 'DeFi' OR categories = 'defi' THEN 3
        WHEN categories = 'NFTs' OR categories = 'nfts' THEN 4
        WHEN categories = 'Infrastructure' OR categories = 'infrastructure' THEN 5
        WHEN categories = 'Education' OR categories = 'education' THEN 6
        WHEN categories = 'Tools' OR categories = 'tools' THEN 7
        ELSE 8 -- Other
    END
WHERE category_id IS NULL AND categories IS NOT NULL;

-- 5. Ajouter la contrainte de clé étrangère
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'projects_category_id_fkey'
    ) THEN
        ALTER TABLE projects 
        ADD CONSTRAINT projects_category_id_fkey 
        FOREIGN KEY (category_id) 
        REFERENCES categories(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- 6. Créer la table sponsorships si elle n'existe pas
CREATE TABLE IF NOT EXISTS sponsorships (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    sponsor_wallet VARCHAR(255),
    sponsor_email VARCHAR(255),
    amount DECIMAL(10, 2),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

-- 7. Ajouter des colonnes manquantes à projects si nécessaire
DO $$ 
BEGIN
    -- Ajouter submitter_wallet
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'submitter_wallet') THEN
        ALTER TABLE projects ADD COLUMN submitter_wallet VARCHAR(255);
    END IF;
    
    -- Ajouter submitter_email
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'submitter_email') THEN
        ALTER TABLE projects ADD COLUMN submitter_email VARCHAR(255);
    END IF;
    
    -- Ajouter views
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'views') THEN
        ALTER TABLE projects ADD COLUMN views INTEGER DEFAULT 0;
    END IF;
    
    -- Ajouter average_rating
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'average_rating') THEN
        ALTER TABLE projects ADD COLUMN average_rating DECIMAL(2, 1) DEFAULT 0.0;
    END IF;
    
    -- Ajouter comment_count
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'comment_count') THEN
        ALTER TABLE projects ADD COLUMN comment_count INTEGER DEFAULT 0;
    END IF;
    
    -- Ajouter les liens sociaux
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'twitter') THEN
        ALTER TABLE projects ADD COLUMN twitter VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'github') THEN
        ALTER TABLE projects ADD COLUMN github VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'discord') THEN
        ALTER TABLE projects ADD COLUMN discord VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'telegram') THEN
        ALTER TABLE projects ADD COLUMN telegram VARCHAR(255);
    END IF;
END $$;

-- 8. Activer Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsorships ENABLE ROW LEVEL SECURITY;

-- 9. Créer les politiques pour permettre la lecture publique
CREATE POLICY "Allow public read categories" ON categories
    FOR SELECT USING (true);

CREATE POLICY "Allow public read projects" ON projects
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert projects" ON projects
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read sponsorships" ON sponsorships
    FOR SELECT USING (true);

-- 10. Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_projects_category_id ON projects(category_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sponsorships_project_id ON sponsorships(project_id);
CREATE INDEX IF NOT EXISTS idx_sponsorships_active ON sponsorships(is_active, end_date);

-- Afficher un résumé
SELECT 'Categories créées:' as info, COUNT(*) as count FROM categories
UNION ALL
SELECT 'Projects dans la base:', COUNT(*) FROM projects
UNION ALL
SELECT 'Projects avec category_id:', COUNT(*) FROM projects WHERE category_id IS NOT NULL;
