-- Email subscription system for Kaspa Ecosystem

-- Create email subscriptions table
CREATE TABLE IF NOT EXISTS email_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    wallet_address TEXT,
    subscription_types TEXT[] DEFAULT ARRAY['weekly_digest'],
    preferences JSONB DEFAULT '{}',
    verified BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create email verification tokens table
CREATE TABLE IF NOT EXISTS email_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    verified BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unsubscribe tokens table
CREATE TABLE IF NOT EXISTS unsubscribe_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    used BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create email campaign logs
CREATE TABLE IF NOT EXISTS email_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_type VARCHAR(50) NOT NULL,
    subject TEXT NOT NULL,
    recipients_count INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'draft',
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create email delivery logs
CREATE TABLE IF NOT EXISTS email_delivery_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES email_campaigns(id),
    recipient_email VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL, -- sent, delivered, bounced, failed
    delivery_id VARCHAR(255),
    error_message TEXT,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_email ON email_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_active ON email_subscriptions(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_verified ON email_subscriptions(verified) WHERE verified = true;
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_types ON email_subscriptions USING GIN(subscription_types);
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires ON email_verifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_unsubscribe_tokens_token ON unsubscribe_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_type ON email_campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_delivery_logs_campaign ON email_delivery_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_delivery_logs_status ON email_delivery_logs(status);

-- Enable RLS
ALTER TABLE email_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE unsubscribe_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_delivery_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Email subscriptions - users can only access their own data
CREATE POLICY "users_can_access_own_subscriptions" ON email_subscriptions
    FOR ALL USING (auth.jwt() ->> 'email' = email);

-- Service role can access all subscription data
CREATE POLICY "service_role_full_access_subscriptions" ON email_subscriptions
    FOR ALL USING (auth.role() = 'service_role');

-- Email verifications - only service role
CREATE POLICY "service_role_manage_verifications" ON email_verifications
    FOR ALL USING (auth.role() = 'service_role');

-- Unsubscribe tokens - only service role
CREATE POLICY "service_role_manage_unsubscribe_tokens" ON unsubscribe_tokens
    FOR ALL USING (auth.role() = 'service_role');

-- Email campaigns - only service role
CREATE POLICY "service_role_manage_campaigns" ON email_campaigns
    FOR ALL USING (auth.role() = 'service_role');

-- Email delivery logs - only service role
CREATE POLICY "service_role_manage_delivery_logs" ON email_delivery_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Functions for email management

-- Function to get subscriber count by type
CREATE OR REPLACE FUNCTION get_subscriber_count(subscription_type TEXT DEFAULT NULL)
RETURNS INTEGER AS $$
BEGIN
    IF subscription_type IS NULL THEN
        RETURN (SELECT COUNT(*) FROM email_subscriptions WHERE active = true AND verified = true);
    ELSE
        RETURN (SELECT COUNT(*) FROM email_subscriptions 
                WHERE active = true AND verified = true 
                AND subscription_type = ANY(subscription_types));
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to clean expired verification tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Clean expired verification tokens
    DELETE FROM email_verifications WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Clean expired unsubscribe tokens
    DELETE FROM unsubscribe_tokens WHERE expires_at < NOW();
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get subscription preferences for a user
CREATE OR REPLACE FUNCTION get_user_subscription_preferences(user_email TEXT)
RETURNS TABLE (
    subscription_type TEXT,
    enabled BOOLEAN,
    last_sent TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        unnest(ARRAY['weekly_digest', 'project_updates', 'new_projects', 'featured_projects', 'security_alerts']) as subscription_type,
        CASE 
            WHEN es.subscription_types IS NULL THEN false
            ELSE unnest(ARRAY['weekly_digest', 'project_updates', 'new_projects', 'featured_projects', 'security_alerts']) = ANY(es.subscription_types)
        END as enabled,
        es.updated_at as last_sent
    FROM email_subscriptions es
    WHERE es.email = user_email
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to update subscription preferences
CREATE OR REPLACE FUNCTION update_subscription_preferences(
    user_email TEXT,
    new_subscription_types TEXT[],
    new_preferences JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE email_subscriptions 
    SET 
        subscription_types = new_subscription_types,
        preferences = COALESCE(new_preferences, preferences),
        updated_at = NOW()
    WHERE email = user_email;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to track email opens (webhook endpoint would call this)
CREATE OR REPLACE FUNCTION track_email_open(delivery_log_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE email_delivery_logs 
    SET 
        opened_at = NOW(),
        status = CASE WHEN status = 'sent' THEN 'opened' ELSE status END
    WHERE id = delivery_log_id AND opened_at IS NULL;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to track email clicks
CREATE OR REPLACE FUNCTION track_email_click(delivery_log_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE email_delivery_logs 
    SET 
        clicked_at = NOW(),
        status = 'clicked'
    WHERE id = delivery_log_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to get email campaign statistics
CREATE OR REPLACE FUNCTION get_campaign_stats(campaign_id_param UUID)
RETURNS TABLE (
    total_sent INTEGER,
    delivered_count INTEGER,
    opened_count INTEGER,
    clicked_count INTEGER,
    bounced_count INTEGER,
    failed_count INTEGER,
    open_rate NUMERIC,
    click_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_sent,
        COUNT(CASE WHEN status IN ('delivered', 'opened', 'clicked') THEN 1 END)::INTEGER as delivered_count,
        COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END)::INTEGER as opened_count,
        COUNT(CASE WHEN clicked_at IS NOT NULL THEN 1 END)::INTEGER as clicked_count,
        COUNT(CASE WHEN status = 'bounced' THEN 1 END)::INTEGER as bounced_count,
        COUNT(CASE WHEN status = 'failed' THEN 1 END)::INTEGER as failed_count,
        CASE 
            WHEN COUNT(CASE WHEN status IN ('delivered', 'opened', 'clicked') THEN 1 END) > 0 
            THEN (COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END)::NUMERIC / COUNT(CASE WHEN status IN ('delivered', 'opened', 'clicked') THEN 1 END)::NUMERIC) * 100
            ELSE 0
        END as open_rate,
        CASE 
            WHEN COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END) > 0 
            THEN (COUNT(CASE WHEN clicked_at IS NOT NULL THEN 1 END)::NUMERIC / COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END)::NUMERIC) * 100
            ELSE 0
        END as click_rate
    FROM email_delivery_logs
    WHERE campaign_id = campaign_id_param;
END;
$$ LANGUAGE plpgsql;

-- Create view for subscription analytics
CREATE OR REPLACE VIEW subscription_analytics AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as new_subscriptions,
    COUNT(CASE WHEN verified = true THEN 1 END) as verified_subscriptions,
    COUNT(CASE WHEN active = false THEN 1 END) as unsubscriptions
FROM email_subscriptions
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Insert default subscription types reference
CREATE TABLE IF NOT EXISTS subscription_types_reference (
    type VARCHAR(50) PRIMARY KEY,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    default_enabled BOOLEAN DEFAULT false,
    frequency VARCHAR(20) DEFAULT 'weekly'
);

INSERT INTO subscription_types_reference (type, display_name, description, default_enabled, frequency) VALUES
    ('weekly_digest', 'Weekly Ecosystem Digest', 'Get a weekly summary of trending projects and ecosystem stats', true, 'weekly'),
    ('project_updates', 'Project Updates', 'Receive notifications when projects you follow have updates', false, 'immediate'),
    ('new_projects', 'New Project Alerts', 'Be notified when new projects join the ecosystem', false, 'immediate'),
    ('featured_projects', 'Featured Project Highlights', 'Get updates about featured and sponsored projects', false, 'weekly'),
    ('security_alerts', 'Security Alerts', 'Important security notifications and audit results', false, 'immediate')
ON CONFLICT (type) DO NOTHING;

-- Create function to generate unsubscribe token
CREATE OR REPLACE FUNCTION generate_unsubscribe_token(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
    token TEXT;
BEGIN
    -- Generate a secure token
    token := encode(gen_random_bytes(32), 'base64');
    
    -- Store the token
    INSERT INTO unsubscribe_tokens (email, token, expires_at)
    VALUES (user_email, token, NOW() + INTERVAL '30 days')
    ON CONFLICT (token) DO NOTHING;
    
    RETURN token;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_subscriptions_updated_at 
    BEFORE UPDATE ON email_subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Schedule cleanup job (this would typically be handled by a cron job or scheduler)
-- For reference only - implement via external scheduler
/*
-- Clean up expired tokens daily
SELECT cron.schedule('cleanup-expired-tokens', '0 2 * * *', 'SELECT cleanup_expired_tokens();');
*/

SELECT 'Email subscription system created successfully!' as status;