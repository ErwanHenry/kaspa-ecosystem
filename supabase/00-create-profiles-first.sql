-- Script pour créer SEULEMENT la table profiles si elle n'existe pas

-- 1. Activer l'extension UUID (nécessaire pour uuid_generate_v4)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Créer la table profiles SEULEMENT si elle n'existe pas
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

-- 3. Activer RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Créer une policy simple pour permettre la lecture
CREATE POLICY "Allow public read profiles" ON profiles
    FOR SELECT USING (true);

-- 5. Créer une policy pour permettre l'insertion
CREATE POLICY "Allow public insert profiles" ON profiles
    FOR INSERT WITH CHECK (true);

-- 6. Vérifier que ça a marché
SELECT 
    'Table profiles créée!' as status,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
    ) as profiles_exists;
