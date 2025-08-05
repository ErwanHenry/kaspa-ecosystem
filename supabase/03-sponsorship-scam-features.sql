-- Tables pour les fonctionnalités de sponsoring et reports de scam

-- 1. Table des sponsorships (enchères pour être featured)
CREATE TABLE IF NOT EXISTS sponsorships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    bid_amount DECIMAL(10,2) NOT NULL,
    duration_days INTEGER NOT NULL DEFAULT 7,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'pending', -- pending, active, expired, cancelled
    transaction_hash TEXT, -- Pour vérifier le paiement on-chain
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table des reports de scam
CREATE TABLE IF NOT EXISTS scam_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    reason TEXT,
    severity VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, wallet_address) -- Un wallet ne peut reporter qu'une fois par projet
);

-- 3. Table des paramètres admin
CREATE TABLE IF NOT EXISTS admin_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Ajouter colonne pour tracker les projets sponsorisés
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS is_sponsored BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sponsor_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS scam_report_count INTEGER DEFAULT 0;

-- 5. Index pour performance
CREATE INDEX IF NOT EXISTS idx_sponsorships_active ON sponsorships(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_sponsorships_project ON sponsorships(project_id);
CREATE INDEX IF NOT EXISTS idx_scam_reports_project ON scam_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_sponsored ON projects(is_sponsored) WHERE is_sponsored = true;

-- 6. RLS Policies
ALTER TABLE sponsorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE scam_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Sponsorships policies
CREATE POLICY "Public read sponsorships" ON sponsorships
    FOR SELECT USING (true);

CREATE POLICY "Wallet owners can create sponsorships" ON sponsorships
    FOR INSERT WITH CHECK (true);

-- Scam reports policies
CREATE POLICY "Public read scam reports" ON scam_reports
    FOR SELECT USING (true);

CREATE POLICY "Anyone can report scams" ON scam_reports
    FOR INSERT WITH CHECK (true);

-- Admin settings - only service role
CREATE POLICY "Service role manages settings" ON admin_settings
    FOR ALL USING (auth.role() = 'service_role');

-- 7. Fonction pour activer un sponsorship
CREATE OR REPLACE FUNCTION activate_sponsorship(p_sponsorship_id UUID)
RETURNS void AS $$
DECLARE
    v_project_id UUID;
    v_duration_days INTEGER;
BEGIN
    -- Récupérer les infos du sponsorship
    SELECT project_id, duration_days INTO v_project_id, v_duration_days
    FROM sponsorships
    WHERE id = p_sponsorship_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sponsorship not found or not pending';
    END IF;
    
    -- Mettre à jour le sponsorship
    UPDATE sponsorships
    SET 
        status = 'active',
        start_date = NOW(),
        end_date = NOW() + (v_duration_days || ' days')::INTERVAL
    WHERE id = p_sponsorship_id;
    
    -- Mettre à jour le projet
    UPDATE projects
    SET 
        is_sponsored = true,
        sponsor_end_date = NOW() + (v_duration_days || ' days')::INTERVAL,
        featured = true
    WHERE id = v_project_id;
END;
$$ LANGUAGE plpgsql;

-- 8. Fonction pour vérifier et expirer les sponsorships
CREATE OR REPLACE FUNCTION check_expired_sponsorships()
RETURNS void AS $$
BEGIN
    -- Expirer les sponsorships
    UPDATE sponsorships
    SET status = 'expired'
    WHERE status = 'active' AND end_date < NOW();
    
    -- Retirer le statut sponsored des projets
    UPDATE projects
    SET 
        is_sponsored = false,
        sponsor_end_date = NULL,
        featured = false
    WHERE is_sponsored = true AND sponsor_end_date < NOW();
END;
$$ LANGUAGE plpgsql;

-- 9. Fonction pour compter les reports de scam
CREATE OR REPLACE FUNCTION update_scam_report_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE projects
    SET scam_report_count = (
        SELECT COUNT(*) FROM scam_reports WHERE project_id = NEW.project_id
    )
    WHERE id = NEW.project_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Trigger pour mettre à jour le compte de reports
CREATE TRIGGER update_project_scam_count
AFTER INSERT ON scam_reports
FOR EACH ROW
EXECUTE FUNCTION update_scam_report_count();

-- 11. Insérer les paramètres par défaut
INSERT INTO admin_settings (key, value, description) VALUES
    ('alert_email', 'admin@kaspa-ecosystem.com', 'Email pour les alertes scam'),
    ('min_bid', '100', 'Enchère minimum en KAS'),
    ('scam_threshold', '5', 'Nombre de reports avant alerte')
ON CONFLICT (key) DO NOTHING;

-- 12. Vue pour les projets avec leurs stats
CREATE OR REPLACE VIEW project_full_stats AS
SELECT 
    p.*,
    c.name as category_name,
    c.icon as category_icon,
    COUNT(DISTINCT wr.wallet_address) as rating_count,
    COALESCE(AVG(wr.rating), 0)::NUMERIC(3,2) as average_rating,
    COUNT(DISTINCT sr.wallet_address) as scam_reports_count,
    CASE 
        WHEN p.is_sponsored AND p.sponsor_end_date > NOW() THEN true
        ELSE false
    END as currently_sponsored,
    s.bid_amount as current_bid
FROM projects p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN wallet_ratings wr ON p.id = wr.project_id
LEFT JOIN scam_reports sr ON p.id = sr.project_id
LEFT JOIN sponsorships s ON p.id = s.project_id AND s.status = 'active'
GROUP BY p.id, c.name, c.icon, s.bid_amount;

-- Vérification
SELECT 
    'Sponsorship & Scam features added!' as status,
    (SELECT COUNT(*) FROM sponsorships) as sponsorships,
    (SELECT COUNT(*) FROM scam_reports) as scam_reports;
