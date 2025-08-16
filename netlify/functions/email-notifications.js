const { createClient } = require('@supabase/supabase-js');
const { withErrorHandling, validateRequest, parseJsonBody } = require('./error-handler');

// Initialize Supabase
const initSupabase = () => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Supabase configuration missing');
    }
    
    return createClient(supabaseUrl, supabaseServiceKey);
};

// Email service configuration
const getEmailService = () => {
    const service = process.env.EMAIL_SERVICE || 'sendgrid';
    
    switch (service) {
        case 'sendgrid':
            return require('@sendgrid/mail');
        case 'resend':
            return require('resend');
        default:
            throw new Error('Unsupported email service');
    }
};

// Email templates
const emailTemplates = {
    project_update: {
        subject: '📢 Project Update: {{project_title}}',
        template: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0F172A; color: #CBD5E1;">
                <div style="background: linear-gradient(135deg, #49EACB 0%, #0D9488 100%); padding: 30px; text-align: center;">
                    <h1 style="margin: 0; color: #0F172A; font-size: 24px;">{{project_title}} Update</h1>
                    <p style="margin: 10px 0 0 0; color: #1E293B; font-size: 16px;">New updates available in the Kaspa Ecosystem</p>
                </div>
                
                <div style="padding: 30px; background: #1E293B;">
                    <div style="margin-bottom: 20px;">
                        <img src="{{project_logo}}" alt="{{project_title}}" style="width: 64px; height: 64px; border-radius: 8px; object-fit: cover;">
                    </div>
                    
                    <h2 style="color: #49EACB; margin: 0 0 15px 0;">What's New?</h2>
                    <div style="background: #0F172A; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        {{update_content}}
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <h3 style="color: #CBD5E1; margin: 0 0 10px 0;">Project Stats</h3>
                        <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                            {{#if github_stars}}<span style="color: #64748B;">⭐ {{github_stars}} stars</span>{{/if}}
                            {{#if average_rating}}<span style="color: #64748B;">⭐ {{average_rating}}/5.0 rating</span>{{/if}}
                            {{#if rating_count}}<span style="color: #64748B;">👥 {{rating_count}} reviews</span>{{/if}}
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{{project_url}}" style="display: inline-block; background: #49EACB; color: #0F172A; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                            View Project
                        </a>
                    </div>
                </div>
                
                <div style="background: #334155; padding: 20px; text-align: center; color: #64748B; font-size: 12px;">
                    <p style="margin: 0 0 10px 0;">You're receiving this because you're subscribed to updates for {{project_title}}</p>
                    <p style="margin: 0;">
                        <a href="{{unsubscribe_url}}" style="color: #49EACB; text-decoration: none;">Unsubscribe</a> | 
                        <a href="{{preferences_url}}" style="color: #49EACB; text-decoration: none;">Manage Preferences</a>
                    </p>
                </div>
            </div>
        `
    },
    
    weekly_digest: {
        subject: '📊 Weekly Kaspa Ecosystem Digest',
        template: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0F172A; color: #CBD5E1;">
                <div style="background: linear-gradient(135deg, #49EACB 0%, #0D9488 100%); padding: 30px; text-align: center;">
                    <h1 style="margin: 0; color: #0F172A; font-size: 24px;">Weekly Ecosystem Digest</h1>
                    <p style="margin: 10px 0 0 0; color: #1E293B;">{{week_range}}</p>
                </div>
                
                <div style="padding: 30px; background: #1E293B;">
                    <h2 style="color: #49EACB; margin: 0 0 20px 0;">🔥 Trending This Week</h2>
                    {{#each trending_projects}}
                    <div style="background: #0F172A; padding: 15px; border-radius: 8px; margin-bottom: 15px; display: flex; align-items: center; gap: 15px;">
                        <img src="{{logo_url}}" alt="{{title}}" style="width: 48px; height: 48px; border-radius: 6px; object-fit: cover;">
                        <div style="flex: 1;">
                            <h3 style="margin: 0 0 5px 0; color: #CBD5E1;">{{title}}</h3>
                            <p style="margin: 0; color: #64748B; font-size: 14px;">{{description}}</p>
                            <div style="margin-top: 8px; font-size: 12px; color: #49EACB;">
                                ⭐ {{github_stars}} stars • 👥 {{rating_count}} reviews
                            </div>
                        </div>
                    </div>
                    {{/each}}
                    
                    <h2 style="color: #49EACB; margin: 30px 0 20px 0;">📈 Ecosystem Stats</h2>
                    <div style="background: #0F172A; padding: 20px; border-radius: 8px;">
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
                            <div style="text-align: center;">
                                <div style="font-size: 24px; font-weight: bold; color: #49EACB;">{{total_projects}}</div>
                                <div style="color: #64748B; font-size: 14px;">Total Projects</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 24px; font-weight: bold; color: #49EACB;">{{new_projects}}</div>
                                <div style="color: #64748B; font-size: 14px;">New This Week</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 24px; font-weight: bold; color: #49EACB;">{{total_ratings}}</div>
                                <div style="color: #64748B; font-size: 14px;">Community Reviews</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 24px; font-weight: bold; color: #49EACB;">{{active_developers}}</div>
                                <div style="color: #64748B; font-size: 14px;">Active Developers</div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{{ecosystem_url}}" style="display: inline-block; background: #49EACB; color: #0F172A; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                            Explore Ecosystem
                        </a>
                    </div>
                </div>
                
                <div style="background: #334155; padding: 20px; text-align: center; color: #64748B; font-size: 12px;">
                    <p style="margin: 0 0 10px 0;">You're receiving this weekly digest from Kaspa Ecosystem</p>
                    <p style="margin: 0;">
                        <a href="{{unsubscribe_url}}" style="color: #49EACB; text-decoration: none;">Unsubscribe</a> | 
                        <a href="{{preferences_url}}" style="color: #49EACB; text-decoration: none;">Manage Preferences</a>
                    </p>
                </div>
            </div>
        `
    },

    new_project_alert: {
        subject: '🆕 New Project Added: {{project_title}}',
        template: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0F172A; color: #CBD5E1;">
                <div style="background: linear-gradient(135deg, #49EACB 0%, #0D9488 100%); padding: 30px; text-align: center;">
                    <h1 style="margin: 0; color: #0F172A; font-size: 24px;">New Project Alert</h1>
                    <p style="margin: 10px 0 0 0; color: #1E293B;">{{project_title}} just joined the ecosystem!</p>
                </div>
                
                <div style="padding: 30px; background: #1E293B;">
                    <div style="background: #0F172A; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                            <img src="{{project_logo}}" alt="{{project_title}}" style="width: 64px; height: 64px; border-radius: 8px; object-fit: cover;">
                            <div>
                                <h2 style="margin: 0 0 5px 0; color: #49EACB;">{{project_title}}</h2>
                                <span style="background: #334155; color: #CBD5E1; padding: 4px 8px; border-radius: 4px; font-size: 12px;">{{category_name}}</span>
                            </div>
                        </div>
                        
                        <p style="color: #CBD5E1; line-height: 1.6; margin: 0;">{{project_description}}</p>
                        
                        {{#if github_url}}
                        <div style="margin-top: 15px;">
                            <a href="{{github_url}}" style="color: #49EACB; text-decoration: none; font-size: 14px;">
                                <i>🔗 View on GitHub</i>
                            </a>
                        </div>
                        {{/if}}
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{{project_url}}" style="display: inline-block; background: #49EACB; color: #0F172A; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-right: 10px;">
                            View Project
                        </a>
                        <a href="{{rate_url}}" style="display: inline-block; background: transparent; color: #49EACB; border: 1px solid #49EACB; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                            Rate Project
                        </a>
                    </div>
                </div>
                
                <div style="background: #334155; padding: 20px; text-align: center; color: #64748B; font-size: 12px;">
                    <p style="margin: 0 0 10px 0;">You're receiving this because you're subscribed to new project alerts</p>
                    <p style="margin: 0;">
                        <a href="{{unsubscribe_url}}" style="color: #49EACB; text-decoration: none;">Unsubscribe</a> | 
                        <a href="{{preferences_url}}" style="color: #49EACB; text-decoration: none;">Manage Preferences</a>
                    </p>
                </div>
            </div>
        `
    }
};

// Subscription management
const subscriptionTypes = {
    PROJECT_UPDATES: 'project_updates',
    WEEKLY_DIGEST: 'weekly_digest',
    NEW_PROJECTS: 'new_projects',
    FEATURED_PROJECTS: 'featured_projects',
    SECURITY_ALERTS: 'security_alerts'
};

// Template rendering
const renderTemplate = (templateContent, data) => {
    let rendered = templateContent;
    
    // Simple template replacement
    Object.entries(data).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        rendered = rendered.replace(regex, value || '');
    });
    
    // Handle conditional blocks {{#if condition}}...{{/if}}
    rendered = rendered.replace(/{{#if (\w+)}}(.*?){{\/if}}/gs, (match, condition, content) => {
        return data[condition] ? content : '';
    });
    
    // Handle loops {{#each array}}...{{/each}}
    rendered = rendered.replace(/{{#each (\w+)}}(.*?){{\/each}}/gs, (match, arrayName, content) => {
        const array = data[arrayName];
        if (!Array.isArray(array)) return '';
        
        return array.map(item => {
            let itemContent = content;
            Object.entries(item).forEach(([key, value]) => {
                const regex = new RegExp(`{{${key}}}`, 'g');
                itemContent = itemContent.replace(regex, value || '');
            });
            return itemContent;
        }).join('');
    });
    
    return rendered;
};

// Send email function
const sendEmail = async (to, templateKey, data) => {
    const template = emailTemplates[templateKey];
    if (!template) {
        throw new Error(`Template ${templateKey} not found`);
    }
    
    const emailService = process.env.EMAIL_SERVICE || 'sendgrid';
    const subject = renderTemplate(template.subject, data);
    const html = renderTemplate(template.template, data);
    
    if (emailService === 'sendgrid') {
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        
        const msg = {
            to,
            from: process.env.FROM_EMAIL || 'notifications@kaspa-ecosystem.com',
            subject,
            html
        };
        
        await sgMail.send(msg);
    } else if (emailService === 'resend') {
        const { Resend } = require('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        await resend.emails.send({
            from: process.env.FROM_EMAIL || 'notifications@kaspa-ecosystem.com',
            to,
            subject,
            html
        });
    } else {
        throw new Error('Unsupported email service');
    }
};

const handler = async (event, context, requestContext) => {
    const method = event.httpMethod;
    const path = event.path.split('/').pop();
    
    const supabase = initSupabase();
    
    if (method === 'POST') {
        switch (path) {
            case 'subscribe':
                return await handleSubscribe(supabase, event);
            case 'unsubscribe':
                return await handleUnsubscribe(supabase, event);
            case 'send-update':
                return await handleSendUpdate(supabase, event);
            case 'send-digest':
                return await handleSendDigest(supabase, event);
            default:
                throw new Error('Invalid endpoint');
        }
    } else if (method === 'GET') {
        switch (path) {
            case 'preferences':
                return await handleGetPreferences(supabase, event);
            case 'subscriptions':
                return await handleGetSubscriptions(supabase, event);
            default:
                throw new Error('Invalid endpoint');
        }
    } else {
        validateRequest(event, { allowedMethods: ['GET', 'POST'] });
    }
};

// Handle subscription
const handleSubscribe = async (supabase, event) => {
    const body = parseJsonBody(event);
    const { email, wallet_address, subscription_types, preferences } = body;
    
    if (!email || (!wallet_address && !subscription_types)) {
        throw new Error('Email and either wallet_address or subscription_types required');
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
    }
    
    // Create or update subscription
    const subscriptionData = {
        email,
        wallet_address: wallet_address || null,
        subscription_types: subscription_types || [subscriptionTypes.WEEKLY_DIGEST],
        preferences: preferences || {
            frequency: 'weekly',
            categories: [],
            languages: []
        },
        verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
        .from('email_subscriptions')
        .upsert(subscriptionData, { onConflict: 'email' })
        .select()
        .single();
        
    if (error) throw error;
    
    // Send verification email
    const verificationToken = generateVerificationToken();
    await supabase
        .from('email_verifications')
        .upsert({
            email,
            token: verificationToken,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        });
    
    // Send welcome email with verification
    const verificationUrl = `${process.env.URL || 'https://kaspa-ecosystem.netlify.app'}/verify-email?token=${verificationToken}`;
    
    // For now, just return success (verification email would be sent here)
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            message: 'Subscription created successfully',
            verification_required: true,
            verification_url: verificationUrl
        })
    };
};

// Handle unsubscribe
const handleUnsubscribe = async (supabase, event) => {
    const body = parseJsonBody(event);
    const { email, token, subscription_type } = body;
    
    if (!email && !token) {
        throw new Error('Email or unsubscribe token required');
    }
    
    let query = supabase.from('email_subscriptions');
    
    if (token) {
        // Verify unsubscribe token
        const { data: tokenData } = await supabase
            .from('unsubscribe_tokens')
            .select('email')
            .eq('token', token)
            .single();
            
        if (!tokenData) {
            throw new Error('Invalid unsubscribe token');
        }
        
        query = query.eq('email', tokenData.email);
    } else {
        query = query.eq('email', email);
    }
    
    if (subscription_type) {
        // Remove specific subscription type
        const { data: current } = await query.select('subscription_types').single();
        if (current) {
            const updatedTypes = current.subscription_types.filter(type => type !== subscription_type);
            await query.update({ subscription_types: updatedTypes });
        }
    } else {
        // Complete unsubscribe
        await query.update({ active: false, updated_at: new Date().toISOString() });
    }
    
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            message: 'Unsubscribed successfully'
        })
    };
};

// Handle project update notification
const handleSendUpdate = async (supabase, event) => {
    const body = parseJsonBody(event);
    const { project_id, update_content, send_to_subscribers = true } = body;
    
    if (!project_id || !update_content) {
        throw new Error('Project ID and update content required');
    }
    
    // Get project details
    const { data: project, error: projectError } = await supabase
        .from('enhanced_project_stats')
        .select('*')
        .eq('id', project_id)
        .single();
        
    if (projectError || !project) {
        throw new Error('Project not found');
    }
    
    if (!send_to_subscribers) {
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ message: 'Update logged without sending notifications' })
        };
    }
    
    // Get subscribers for project updates
    const { data: subscribers } = await supabase
        .from('email_subscriptions')
        .select('email')
        .contains('subscription_types', [subscriptionTypes.PROJECT_UPDATES])
        .eq('verified', true)
        .eq('active', true);
    
    if (!subscribers || subscribers.length === 0) {
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ message: 'No subscribers to notify' })
        };
    }
    
    // Send emails to subscribers
    const emailPromises = subscribers.map(sub => {
        const unsubscribeToken = generateUnsubscribeToken(sub.email);
        
        return sendEmail(sub.email, 'project_update', {
            project_title: project.title,
            project_logo: project.logo_url || `${process.env.URL}/images/default-logo.png`,
            update_content,
            github_stars: project.github_stars,
            average_rating: project.average_rating,
            rating_count: project.rating_count,
            project_url: `${process.env.URL}?project=${project.slug || project.id}`,
            unsubscribe_url: `${process.env.URL}/unsubscribe?token=${unsubscribeToken}`,
            preferences_url: `${process.env.URL}/email-preferences?email=${encodeURIComponent(sub.email)}`
        });
    });
    
    await Promise.allSettled(emailPromises);
    
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            message: `Update notification sent to ${subscribers.length} subscribers`
        })
    };
};

// Handle weekly digest
const handleSendDigest = async (supabase, event) => {
    // Get trending projects
    const { data: trendingProjects } = await supabase
        .rpc('get_trending_projects', { limit_count: 5 });
    
    // Get ecosystem stats
    const [
        { count: totalProjects },
        { count: newProjects },
        { count: totalRatings }
    ] = await Promise.all([
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('*', { count: 'exact', head: true })
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('ratings').select('*', { count: 'exact', head: true })
    ]);
    
    // Get weekly digest subscribers
    const { data: subscribers } = await supabase
        .from('email_subscriptions')
        .select('email')
        .contains('subscription_types', [subscriptionTypes.WEEKLY_DIGEST])
        .eq('verified', true)
        .eq('active', true);
    
    if (!subscribers || subscribers.length === 0) {
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ message: 'No digest subscribers' })
        };
    }
    
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date();
    
    // Send digest emails
    const emailPromises = subscribers.map(sub => {
        const unsubscribeToken = generateUnsubscribeToken(sub.email);
        
        return sendEmail(sub.email, 'weekly_digest', {
            week_range: `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`,
            trending_projects: trendingProjects || [],
            total_projects: totalProjects || 0,
            new_projects: newProjects || 0,
            total_ratings: totalRatings || 0,
            active_developers: Math.floor((totalProjects || 0) * 0.3), // Estimate
            ecosystem_url: process.env.URL || 'https://kaspa-ecosystem.netlify.app',
            unsubscribe_url: `${process.env.URL}/unsubscribe?token=${unsubscribeToken}`,
            preferences_url: `${process.env.URL}/email-preferences?email=${encodeURIComponent(sub.email)}`
        });
    });
    
    await Promise.allSettled(emailPromises);
    
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            message: `Weekly digest sent to ${subscribers.length} subscribers`
        })
    };
};

// Generate verification token
const generateVerificationToken = () => {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) +
           Date.now().toString(36);
};

// Generate unsubscribe token
const generateUnsubscribeToken = (email) => {
    return Buffer.from(`${email}:${Date.now()}`).toString('base64');
};

module.exports.handler = withErrorHandling(handler);