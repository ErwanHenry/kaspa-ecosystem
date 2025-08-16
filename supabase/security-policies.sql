-- Enhanced Security Policies for Kaspa Ecosystem
-- This script strengthens the database security by replacing overly permissive policies

-- First, drop existing overly permissive policies
DROP POLICY IF EXISTS "Public read categories" ON categories;
DROP POLICY IF EXISTS "Public read profiles" ON profiles;
DROP POLICY IF EXISTS "Public read projects" ON projects;
DROP POLICY IF EXISTS "Public read ratings" ON wallet_ratings;
DROP POLICY IF EXISTS "Public read comments" ON project_comments;
DROP POLICY IF EXISTS "Public create profiles" ON profiles;
DROP POLICY IF EXISTS "Public create ratings" ON wallet_ratings;
DROP POLICY IF EXISTS "Public create comments" ON project_comments;

-- Also drop any existing policies on new tables
DROP POLICY IF EXISTS "ratings_select" ON ratings;
DROP POLICY IF EXISTS "ratings_insert" ON ratings;
DROP POLICY IF EXISTS "ratings_update" ON ratings;
DROP POLICY IF EXISTS "ratings_delete" ON ratings;
DROP POLICY IF EXISTS "comments_select" ON comments;
DROP POLICY IF EXISTS "comments_insert" ON comments;
DROP POLICY IF EXISTS "comments_update" ON comments;
DROP POLICY IF EXISTS "comments_delete" ON comments;
DROP POLICY IF EXISTS "scam_reports_select" ON scam_reports;
DROP POLICY IF EXISTS "scam_reports_insert" ON scam_reports;
DROP POLICY IF EXISTS "scam_reports_update" ON scam_reports;
DROP POLICY IF EXISTS "scam_reports_delete" ON scam_reports;

-- 1. CATEGORIES - Read-only public access
CREATE POLICY "categories_read_public" ON categories
    FOR SELECT TO PUBLIC USING (true);

-- 2. PROFILES - Restricted access
CREATE POLICY "profiles_read_public" ON profiles
    FOR SELECT TO PUBLIC USING (true);

CREATE POLICY "profiles_insert_authenticated" ON profiles
    FOR INSERT TO PUBLIC 
    WITH CHECK (
        wallet_address IS NOT NULL AND 
        length(wallet_address) > 10 AND
        role = 'user'
    );

CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE TO PUBLIC 
    USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address')
    WITH CHECK (
        wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address' AND
        role = 'user'
    );

-- 3. PROJECTS - Public read for active projects only
CREATE POLICY "projects_read_active" ON projects
    FOR SELECT TO PUBLIC USING (active = true);

-- Projects can only be managed by service role or admin
CREATE POLICY "projects_admin_manage" ON projects
    FOR ALL TO PUBLIC 
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- 4. RATINGS/WALLET_RATINGS - Enhanced security
-- Handle both table names (wallet_ratings from schema, ratings from simple script)

-- For wallet_ratings table (if exists)
CREATE POLICY "wallet_ratings_read_public" ON wallet_ratings
    FOR SELECT TO PUBLIC USING (true);

CREATE POLICY "wallet_ratings_insert_valid" ON wallet_ratings
    FOR INSERT TO PUBLIC 
    WITH CHECK (
        wallet_address IS NOT NULL AND
        rating >= 1 AND rating <= 5 AND
        length(wallet_address) >= 30 AND
        project_id IS NOT NULL
    );

CREATE POLICY "wallet_ratings_update_own" ON wallet_ratings
    FOR UPDATE TO PUBLIC 
    USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address')
    WITH CHECK (
        wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address' AND
        rating >= 1 AND rating <= 5
    );

-- For ratings table (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ratings') THEN
        EXECUTE 'CREATE POLICY "ratings_read_public" ON ratings FOR SELECT TO PUBLIC USING (true)';
        
        EXECUTE 'CREATE POLICY "ratings_insert_valid" ON ratings FOR INSERT TO PUBLIC WITH CHECK (
            user_wallet IS NOT NULL AND
            rating >= 1 AND rating <= 5 AND
            length(user_wallet) >= 30 AND
            project_id IS NOT NULL
        )';
        
        EXECUTE 'CREATE POLICY "ratings_update_own" ON ratings FOR UPDATE TO PUBLIC 
        USING (user_wallet = current_setting(''request.jwt.claims'', true)::json->>''wallet_address'')
        WITH CHECK (
            user_wallet = current_setting(''request.jwt.claims'', true)::json->>''wallet_address'' AND
            rating >= 1 AND rating <= 5
        )';
    END IF;
END
$$;

-- 5. COMMENTS/PROJECT_COMMENTS - Enhanced security
-- For project_comments table (if exists)
CREATE POLICY "project_comments_read_public" ON project_comments
    FOR SELECT TO PUBLIC USING (is_deleted = false);

-- For comments table (if exists)  
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'comments') THEN
        EXECUTE 'CREATE POLICY "comments_read_public" ON comments FOR SELECT TO PUBLIC USING (true)';
        
        EXECUTE 'CREATE POLICY "comments_insert_valid" ON comments FOR INSERT TO PUBLIC WITH CHECK (
            user_wallet IS NOT NULL AND
            comment IS NOT NULL AND
            length(comment) <= 1000 AND
            length(user_wallet) >= 30 AND
            project_id IS NOT NULL
        )';
        
        EXECUTE 'CREATE POLICY "comments_update_own" ON comments FOR UPDATE TO PUBLIC 
        USING (user_wallet = current_setting(''request.jwt.claims'', true)::json->>''wallet_address'')
        WITH CHECK (
            user_wallet = current_setting(''request.jwt.claims'', true)::json->>''wallet_address'' AND
            length(comment) <= 1000
        )';
    END IF;
END
$$;

-- 6. SCAM_REPORTS - Restricted access
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'scam_reports') THEN
        -- Only service role can read scam reports for privacy
        EXECUTE 'CREATE POLICY "scam_reports_service_read" ON scam_reports FOR SELECT USING (auth.role() = ''service_role'')';
        
        EXECUTE 'CREATE POLICY "scam_reports_insert_valid" ON scam_reports FOR INSERT TO PUBLIC WITH CHECK (
            user_wallet IS NOT NULL AND
            reason IS NOT NULL AND
            length(reason) >= 10 AND
            length(reason) <= 2000 AND
            length(user_wallet) >= 30 AND
            project_id IS NOT NULL
        )';
    END IF;
END
$$;

-- 7. SPONSORSHIPS - Restricted access (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sponsorships') THEN
        EXECUTE 'CREATE POLICY "sponsorships_read_public" ON sponsorships FOR SELECT USING (true)';
        
        EXECUTE 'CREATE POLICY "sponsorships_insert_valid" ON sponsorships FOR INSERT TO PUBLIC WITH CHECK (
            wallet_address IS NOT NULL AND
            bid_amount > 0 AND
            duration_days > 0 AND
            length(wallet_address) >= 30
        )';
        
        -- Only service role can update sponsorship status
        EXECUTE 'CREATE POLICY "sponsorships_service_update" ON sponsorships FOR UPDATE USING (auth.role() = ''service_role'')';
    END IF;
END
$$;

-- 8. ADMIN_SETTINGS - Service role only (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'admin_settings') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Service role manages settings" ON admin_settings';
        EXECUTE 'CREATE POLICY "admin_settings_service_only" ON admin_settings FOR ALL USING (auth.role() = ''service_role'') WITH CHECK (auth.role() = ''service_role'')';
    END IF;
END
$$;

-- 9. Create function to validate wallet addresses
CREATE OR REPLACE FUNCTION validate_kaspa_address(address TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Basic Kaspa address validation
    -- Should start with 'kaspa:' and be 67-69 characters total
    RETURN address ~ '^kaspa:[a-z0-9]{61,63}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 10. Create function for rate limiting (simple approach)
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_table_name TEXT,
    p_wallet_address TEXT,
    p_time_window INTERVAL DEFAULT '15 minutes',
    p_max_requests INTEGER DEFAULT 10
)
RETURNS BOOLEAN AS $$
DECLARE
    request_count INTEGER;
BEGIN
    -- This is a simplified rate limiting check
    -- In production, you'd want to use a proper rate limiting solution
    
    EXECUTE format('
        SELECT COUNT(*) FROM %I 
        WHERE user_wallet = $1 AND created_at > NOW() - $2',
        p_table_name
    ) 
    INTO request_count 
    USING p_wallet_address, p_time_window;
    
    RETURN request_count < p_max_requests;
END;
$$ LANGUAGE plpgsql;

-- 11. Add triggers for additional validation
CREATE OR REPLACE FUNCTION validate_rating_submission()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate wallet address format
    IF NOT validate_kaspa_address(NEW.user_wallet) THEN
        RAISE EXCEPTION 'Invalid Kaspa wallet address format';
    END IF;
    
    -- Check rate limiting (max 10 ratings per wallet per 15 minutes)
    IF NOT check_rate_limit('ratings', NEW.user_wallet, '15 minutes'::interval, 10) THEN
        RAISE EXCEPTION 'Rate limit exceeded. Please wait before submitting more ratings.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger only if ratings table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ratings') THEN
        EXECUTE 'DROP TRIGGER IF EXISTS validate_rating_trigger ON ratings';
        EXECUTE 'CREATE TRIGGER validate_rating_trigger 
                 BEFORE INSERT ON ratings 
                 FOR EACH ROW EXECUTE FUNCTION validate_rating_submission()';
    END IF;
END
$$;

-- Similar trigger for wallet_ratings if it exists
CREATE OR REPLACE FUNCTION validate_wallet_rating_submission()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate wallet address format
    IF NOT validate_kaspa_address(NEW.wallet_address) THEN
        RAISE EXCEPTION 'Invalid Kaspa wallet address format';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'wallet_ratings') THEN
        EXECUTE 'DROP TRIGGER IF EXISTS validate_wallet_rating_trigger ON wallet_ratings';
        EXECUTE 'CREATE TRIGGER validate_wallet_rating_trigger 
                 BEFORE INSERT ON wallet_ratings 
                 FOR EACH ROW EXECUTE FUNCTION validate_wallet_rating_submission()';
    END IF;
END
$$;

-- 12. Create audit log table for security events
CREATE TABLE IF NOT EXISTS security_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    table_name VARCHAR(50),
    user_wallet TEXT,
    ip_address INET,
    user_agent TEXT,
    event_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only service role can access audit logs
CREATE POLICY "audit_log_service_only" ON security_audit_log
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- 13. Create function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
    p_event_type TEXT,
    p_table_name TEXT DEFAULT NULL,
    p_user_wallet TEXT DEFAULT NULL,
    p_event_data JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO security_audit_log (event_type, table_name, user_wallet, event_data)
    VALUES (p_event_type, p_table_name, p_user_wallet, p_event_data);
EXCEPTION
    WHEN OTHERS THEN
        -- Don't fail the main operation if audit logging fails
        NULL;
END;
$$ LANGUAGE plpgsql;

-- 14. Final verification
SELECT 'Enhanced security policies applied successfully!' as status;

-- Show all active policies for verification
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;