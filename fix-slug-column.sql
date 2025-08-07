-- Script pour ajouter la colonne slug manquante

-- 1. Ajouter la colonne slug à la table projects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- 2. Générer des slugs pour les projets existants
UPDATE projects 
SET slug = LOWER(
    REGEXP_REPLACE(
        REGEXP_REPLACE(
            REGEXP_REPLACE(title, '[^a-zA-Z0-9\s-]', '', 'g'),  -- Supprimer caractères spéciaux
            '\s+', '-', 'g'  -- Remplacer espaces par tirets
        ),
        '-+', '-', 'g'  -- Supprimer tirets multiples
    )
)
WHERE slug IS NULL AND title IS NOT NULL;

-- 3. Créer un index sur slug pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);

-- 4. Vérifier le résultat
SELECT 
    'Colonnes de la table projects:' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'projects' 
ORDER BY ordinal_position;
