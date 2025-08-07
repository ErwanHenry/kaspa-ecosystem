-- Script pour ajouter les tables de ratings et commentaires (VERSION CORRIGÉE)

-- 1. Créer la table des ratings
CREATE TABLE IF NOT EXISTS ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_wallet VARCHAR(255) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(project_id, user_wallet)  -- Un utilisateur ne peut noter qu'une fois par projet
);

-- 2. Créer la table des commentaires
CREATE TABLE IF NOT EXISTS comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_wallet VARCHAR(255) NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. Créer la table des signalements de scam
CREATE TABLE IF NOT EXISTS scam_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_wallet VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    evidence_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(project_id, user_wallet)  -- Un utilisateur ne peut signaler qu'une fois par projet
);

-- 4. Activer Row Level Security
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE scam_reports ENABLE ROW LEVEL SECURITY;

-- 5. Créer les politiques de sécurité
-- Lecture publique pour tous
CREATE POLICY "Allow public read ratings" ON ratings
    FOR SELECT USING (true);

CREATE POLICY "Allow public read comments" ON comments
    FOR SELECT USING (true);

CREATE POLICY "Allow public read scam_reports" ON scam_reports
    FOR SELECT USING (true);

-- Insertion publique (les utilisateurs peuvent créer)
CREATE POLICY "Allow public insert ratings" ON ratings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert comments" ON comments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert scam_reports" ON scam_reports
    FOR INSERT WITH CHECK (true);

-- Mise à jour publique pour l'instant (simplifiée)
CREATE POLICY "Allow public update ratings" ON ratings
    FOR UPDATE USING (true);

CREATE POLICY "Allow public update comments" ON comments
    FOR UPDATE USING (true);

-- 6. Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_ratings_project_id ON ratings(project_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_wallet ON ratings(user_wallet);
CREATE INDEX IF NOT EXISTS idx_comments_project_id ON comments(project_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scam_reports_project_id ON scam_reports(project_id);

-- 7. Fonction pour mettre à jour automatiquement les moyennes de rating
CREATE OR REPLACE FUNCTION update_project_rating_avg()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE projects
    SET 
        rating_avg = COALESCE((SELECT AVG(rating)::DECIMAL(2,1) FROM ratings WHERE project_id = NEW.project_id), 0),
        rating_count = COALESCE((SELECT COUNT(*) FROM ratings WHERE project_id = NEW.project_id), 0),
        average_rating = COALESCE((SELECT AVG(rating)::DECIMAL(2,1) FROM ratings WHERE project_id = NEW.project_id), 0)
    WHERE id = NEW.project_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger pour mettre à jour les moyennes automatiquement
DROP TRIGGER IF EXISTS update_rating_avg_on_insert ON ratings;
CREATE TRIGGER update_rating_avg_on_insert
    AFTER INSERT OR UPDATE ON ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_project_rating_avg();

-- 9. Fonction pour mettre à jour le compteur de commentaires
CREATE OR REPLACE FUNCTION update_project_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE projects
        SET comment_count = COALESCE((SELECT COUNT(*) FROM comments WHERE project_id = OLD.project_id), 0)
        WHERE id = OLD.project_id;
        RETURN OLD;
    ELSE
        UPDATE projects
        SET comment_count = COALESCE((SELECT COUNT(*) FROM comments WHERE project_id = NEW.project_id), 0)
        WHERE id = NEW.project_id;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 10. Trigger pour mettre à jour le compteur de commentaires
DROP TRIGGER IF EXISTS update_comment_count_on_change ON comments;
CREATE TRIGGER update_comment_count_on_change
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_project_comment_count();

-- 11. Mettre à jour les compteurs existants
UPDATE projects p
SET 
    rating_avg = COALESCE((SELECT AVG(rating)::DECIMAL(2,1) FROM ratings WHERE project_id = p.id), 0),
    rating_count = COALESCE((SELECT COUNT(*) FROM ratings WHERE project_id = p.id), 0),
    average_rating = COALESCE((SELECT AVG(rating)::DECIMAL(2,1) FROM ratings WHERE project_id = p.id), 0),
    comment_count = COALESCE((SELECT COUNT(*) FROM comments WHERE project_id = p.id), 0);

-- Vérifier que tout est bien créé
SELECT 'Tables créées avec succès!' as status;
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('ratings', 'comments', 'scam_reports')
ORDER BY table_name;
