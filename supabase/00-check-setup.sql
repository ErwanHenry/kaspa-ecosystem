-- Script de vérification de l'installation
-- Exécutez ceci pour voir ce qui existe déjà

-- 1. Vérifier les extensions PostgreSQL
SELECT 
    'Extensions installées:' as info,
    extname, 
    extversion 
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'pgcrypto');

-- 2. Vérifier les tables existantes
SELECT 
    'Tables existantes:' as info,
    table_name,
    CASE 
        WHEN table_name IN ('categories', 'profiles', 'projects', 'wallet_ratings') 
        THEN '✅ OK' 
        ELSE '⚠️' 
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 3. Vérifier les colonnes de la table profiles
SELECT 
    'Colonnes de profiles:' as info,
    column_name, 
    data_type,
    CASE 
        WHEN column_name = 'wallet_address' THEN '✅ Wallet OK'
        ELSE '' 
    END as note
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 4. Compter les données
SELECT 
    'Statistiques:' as info,
    'Categories' as table_name, COUNT(*) as count FROM categories
UNION ALL
SELECT '', 'Projects', COUNT(*) FROM projects
UNION ALL
SELECT '', 'Profiles', COUNT(*) FROM profiles
UNION ALL
SELECT '', 'Ratings', COUNT(*) FROM wallet_ratings;

-- 5. Vérifier si uuid-ossp est activé
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
        RAISE NOTICE 'Extension uuid-ossp manquante! Exécutez: CREATE EXTENSION IF NOT EXISTS "uuid-ossp";';
    END IF;
END$$;
