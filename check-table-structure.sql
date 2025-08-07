-- Script pour vérifier la structure exacte de la table projects

-- 1. Afficher toutes les colonnes de la table projects
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
ORDER BY ordinal_position;

-- 2. Afficher quelques exemples de données
SELECT * FROM projects LIMIT 3;
