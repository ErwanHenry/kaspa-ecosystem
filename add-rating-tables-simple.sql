-- Script SIMPLIFIÉ pour ajouter les tables de ratings et commentaires
-- Cette version n'utilise pas de politiques RLS complexes

-- 1. Supprimer les tables existantes si elles existent (pour un clean install)
DROP TABLE IF EXISTS scam_reports CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS ratings CASCADE;

-- 2. Créer la table des ratings
CREATE TABLE ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_wallet VARCHAR(255) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(project_id, user_wallet)
);

-- 3. Créer la table des commentaires
CREATE TABLE comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_wallet VARCHAR(255) NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 4. Créer la table des signalements de scam
CREATE TABLE scam_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_wallet VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    evidence_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(project_id, user_wallet)
);

-- 5. Activer Row Level Security
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE scam_reports ENABLE ROW LEVEL SECURITY;

-- 6. Créer des politiques SIMPLES (tout public pour le moment)
-- Pour ratings
DROP POLICY IF EXISTS "ratings_select" ON ratings;
DROP POLICY IF EXISTS "ratings_insert" ON ratings;
DROP POLICY IF EXISTS "ratings_update" ON ratings;
DROP POLICY IF EXISTS "ratings_delete" ON ratings;

CREATE POLICY "ratings_select" ON ratings FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "ratings_insert" ON ratings FOR INSERT TO PUBLIC WITH CHECK (true);
CREATE POLICY "ratings_update" ON ratings FOR UPDATE TO PUBLIC USING (true);
CREATE POLICY "ratings_delete" ON ratings FOR DELETE TO PUBLIC USING (true);

-- Pour comments
DROP POLICY IF EXISTS "comments_select" ON comments;
DROP POLICY IF EXISTS "comments_insert" ON comments;
DROP POLICY IF EXISTS "comments_update" ON comments;
DROP POLICY IF EXISTS "comments_delete" ON comments;

CREATE POLICY "comments_select" ON comments FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "comments_insert" ON comments FOR INSERT TO PUBLIC WITH CHECK (true);
CREATE POLICY "comments_update" ON comments FOR UPDATE TO PUBLIC USING (true);
CREATE POLICY "comments_delete" ON comments FOR DELETE TO PUBLIC USING (true);

-- Pour scam_reports
DROP POLICY IF EXISTS "scam_reports_select" ON scam_reports;
DROP POLICY IF EXISTS "scam_reports_insert" ON scam_reports;
DROP POLICY IF EXISTS "scam_reports_update" ON scam_reports;
DROP POLICY IF EXISTS "scam_reports_delete" ON scam_reports;

CREATE POLICY "scam_reports_select" ON scam_reports FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "scam_reports_insert" ON scam_reports FOR INSERT TO PUBLIC WITH CHECK (true);
CREATE POLICY "scam_reports_update" ON scam_reports FOR UPDATE TO PUBLIC USING (true);
CREATE POLICY "scam_reports_delete" ON scam_reports FOR DELETE TO PUBLIC USING (true);

-- 7. Créer des index
CREATE INDEX idx_ratings_project_id ON ratings(project_id);
CREATE INDEX idx_ratings_user_wallet ON ratings(user_wallet);
CREATE INDEX idx_comments_project_id ON comments(project_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX idx_scam_reports_project_id ON scam_reports(project_id);

-- 8. Fonction pour mettre à jour les moyennes
CREATE OR REPLACE FUNCTION update_project_rating_avg()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE projects
    SET 
        rating_avg = COALESCE((SELECT AVG(rating)::DECIMAL(2,1) FROM ratings WHERE project_id = NEW.project_id), 0),
        rating_count = COALESCE((SELECT COUNT(*)::INTEGER FROM ratings WHERE project_id = NEW.project_id), 0),
        average_rating = COALESCE((SELECT AVG(rating)::DECIMAL(2,1) FROM ratings WHERE project_id = NEW.project_id), 0)
    WHERE id = NEW.project_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Trigger pour les ratings
DROP TRIGGER IF EXISTS trigger_update_rating_avg ON ratings;
CREATE TRIGGER trigger_update_rating_avg
    AFTER INSERT OR UPDATE ON ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_project_rating_avg();

-- 10. Fonction pour mettre à jour le compteur de commentaires
CREATE OR REPLACE FUNCTION update_project_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE projects
        SET comment_count = COALESCE((SELECT COUNT(*)::INTEGER FROM comments WHERE project_id = OLD.project_id), 0)
        WHERE id = OLD.project_id;
        RETURN OLD;
    ELSE
        UPDATE projects
        SET comment_count = COALESCE((SELECT COUNT(*)::INTEGER FROM comments WHERE project_id = NEW.project_id), 0)
        WHERE id = NEW.project_id;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 11. Trigger pour les commentaires
DROP TRIGGER IF EXISTS trigger_update_comment_count ON comments;
CREATE TRIGGER trigger_update_comment_count
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_project_comment_count();

-- 12. Initialiser les compteurs pour les projets existants
UPDATE projects SET 
    rating_avg = 0,
    rating_count = 0,
    average_rating = 0,
    comment_count = 0
WHERE rating_avg IS NULL 
   OR rating_count IS NULL 
   OR average_rating IS NULL 
   OR comment_count IS NULL;

-- 13. Vérification finale
SELECT 'SUCCESS: Tables créées!' as status;

SELECT 
    'ratings' as table_name,
    COUNT(*) as row_count,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'ratings') as column_count
UNION ALL
SELECT 
    'comments',
    COUNT(*),
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'comments')
FROM comments
UNION ALL
SELECT 
    'scam_reports',
    COUNT(*),
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'scam_reports')
FROM scam_reports;
