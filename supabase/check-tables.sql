-- Vérifier l'existence des tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('projects', 'profiles', 'categories', 'wallet_ratings', 'project_ratings')
ORDER BY table_name;

-- Vérifier les colonnes de la table profiles
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Compter les projets
SELECT COUNT(*) as total_projects FROM projects;

-- Vérifier si wallet_ratings existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'wallet_ratings'
) as wallet_ratings_exists;
