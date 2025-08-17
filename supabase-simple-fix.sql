-- 🔧 Simple Fix for Column Conflict Error
-- This minimal script only adds missing columns safely

-- ============================================
-- STEP 1: CHECK EXISTING STRUCTURE
-- ============================================

SELECT 'Checking existing table structure...' as status;

-- Show current projects columns
SELECT 
    'projects table columns:' as info,
    string_agg(column_name, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns 
WHERE table_name = 'projects';

-- Show current categories columns  
SELECT 
    'categories table columns:' as info,
    string_agg(column_name, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns 
WHERE table_name = 'categories';

-- ============================================
-- STEP 2: ADD ONLY MISSING COLUMNS
-- ============================================

-- Fix categories table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='active') THEN
        ALTER TABLE categories ADD COLUMN active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added active column to categories';
    ELSE
        RAISE NOTICE 'Categories active column already exists';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='icon') THEN
        ALTER TABLE categories ADD COLUMN icon VARCHAR(50);
        RAISE NOTICE 'Added icon column to categories';
    ELSE
        RAISE NOTICE 'Categories icon column already exists';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='color') THEN
        ALTER TABLE categories ADD COLUMN color VARCHAR(7) DEFAULT '#49EACB';
        RAISE NOTICE 'Added color column to categories';
    ELSE
        RAISE NOTICE 'Categories color column already exists';
    END IF;
END $$;

-- Fix projects table - ONLY add active column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='active') THEN
        ALTER TABLE projects ADD COLUMN active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added active column to projects';
    ELSE
        RAISE NOTICE 'Projects active column already exists';
    END IF;
END $$;

-- Update existing data
UPDATE projects SET active = true WHERE active IS NULL;
UPDATE categories SET active = true WHERE active IS NULL;

-- Update categories with icons if missing
UPDATE categories SET 
    icon = CASE 
        WHEN name ILIKE '%defi%' THEN '💰'
        WHEN name ILIKE '%dex%' THEN '🔄' 
        WHEN name ILIKE '%nft%' THEN '🎨'
        WHEN name ILIKE '%game%' THEN '🎮'
        WHEN name ILIKE '%infra%' THEN '🏗️'
        WHEN name ILIKE '%wallet%' THEN '👛'
        ELSE '📦'
    END,
    color = CASE
        WHEN name ILIKE '%defi%' THEN '#FF6B35'
        WHEN name ILIKE '%dex%' THEN '#4F46E5'
        WHEN name ILIKE '%nft%' THEN '#EC4899'
        WHEN name ILIKE '%game%' THEN '#10B981'
        WHEN name ILIKE '%infra%' THEN '#6366F1'
        WHEN name ILIKE '%wallet%' THEN '#8B5CF6'
        ELSE '#49EACB'
    END
WHERE icon IS NULL OR color IS NULL;

-- ============================================
-- STEP 3: SHOW FINAL STATUS
-- ============================================

SELECT 'Setup completed!' as status;

-- Show updated structures
SELECT 
    'projects table now has:' as info,
    string_agg(column_name, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns 
WHERE table_name = 'projects';

SELECT 
    'categories table now has:' as info,
    string_agg(column_name, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns 
WHERE table_name = 'categories';

SELECT 
    'Active projects:' as metric,
    COUNT(*)::text as value
FROM projects 
WHERE active = true;

SELECT 
    'Active categories:' as metric,
    COUNT(*)::text as value
FROM categories 
WHERE active = true;