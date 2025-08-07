-- Script pour analyser la structure exacte de votre base de données

-- 1. Lister toutes les tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Structure de la table projects
SELECT 
    '--- PROJECTS TABLE STRUCTURE ---' as info;
    
SELECT 
    ordinal_position as "#",
    column_name as "Column Name",
    data_type as "Type",
    character_maximum_length as "Max Length",
    is_nullable as "Nullable",
    column_default as "Default"
FROM information_schema.columns 
WHERE table_name = 'projects' 
ORDER BY ordinal_position;

-- 3. Exemple de données
SELECT 
    '--- SAMPLE DATA FROM PROJECTS ---' as info;
    
SELECT * FROM projects LIMIT 2;

-- 4. Compter les enregistrements
SELECT 
    '--- RECORD COUNTS ---' as info;
    
SELECT 
    'Projects' as table_name,
    COUNT(*) as count 
FROM projects;
