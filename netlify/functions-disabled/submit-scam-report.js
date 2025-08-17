const { createClient } = require('@supabase/supabase-js');

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
};

// Initialize Supabase client
const initSupabase = () => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration missing');
    }
    
    return createClient(supabaseUrl, supabaseAnonKey);
};

// Validation functions
const validateProjectId = (id) => {
    if (!id || typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        throw new Error('Invalid project ID format');
    }
    return id;
};

const validateWalletAddress = (address) => {
    if (!address || typeof address !== 'string') {
        throw new Error('Wallet address is required');
    }
    
    // Basic Kaspa address validation
    if (!/^kaspa:[a-z0-9]{61,63}$/.test(address)) {
        throw new Error('Invalid Kaspa wallet address format');
    }
    
    return address;
};

const validateReason = (reason) => {
    if (!reason || typeof reason !== 'string') {
        throw new Error('Reason is required');
    }
    
    if (reason.trim().length < 10) {
        throw new Error('Reason must be at least 10 characters long');
    }
    
    if (reason.length > 2000) {
        throw new Error('Reason must be less than 2000 characters');
    }
    
    return reason.trim();
};

const validateEvidenceUrl = (url) => {
    if (url === null || url === undefined || url === '') {
        return null;
    }
    
    if (typeof url !== 'string') {
        throw new Error('Evidence URL must be a string');
    }
    
    if (!/^https?:\/\/.+/.test(url)) {
        throw new Error('Evidence URL must be a valid HTTP/HTTPS URL');
    }
    
    if (url.length > 500) {
        throw new Error('Evidence URL must be less than 500 characters');
    }
    
    return url.trim();
};

const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return input.replace(/[<>\"'&]/g, (match) => {
        const htmlEntities = {
            '<': '&lt;',
            '>': '&gt;',
            '\"': '&quot;',
            \"'\": '&#x27;',
            '&': '&amp;'
        };
        return htmlEntities[match];
    });
};

// Rate limiting helper (simple in-memory store)
const reportAttempts = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REPORTS_PER_WALLET = 5;

const checkRateLimit = (walletAddress) => {
    const now = Date.now();
    const attempts = reportAttempts.get(walletAddress) || [];
    
    // Clean old attempts
    const recentAttempts = attempts.filter(time => now - time < RATE_LIMIT_WINDOW);
    
    if (recentAttempts.length >= MAX_REPORTS_PER_WALLET) {
        throw new Error('Rate limit exceeded. Please wait before submitting more reports.');
    }
    
    // Add current attempt
    recentAttempts.push(now);
    reportAttempts.set(walletAddress, recentAttempts);
};

exports.handler = async (event, context) => {
    // Handle OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Parse and validate input
        const body = JSON.parse(event.body || '{}');
        
        const projectId = validateProjectId(body.project_id);
        const walletAddress = validateWalletAddress(body.user_wallet);
        const reason = validateReason(body.reason);
        const evidenceUrl = validateEvidenceUrl(body.evidence_url);
        
        // Check rate limiting
        checkRateLimit(walletAddress);
        
        // Sanitize inputs
        const sanitizedReason = sanitizeInput(reason);
        const sanitizedEvidenceUrl = evidenceUrl ? sanitizeInput(evidenceUrl) : null;
        
        // Initialize Supabase
        const supabase = initSupabase();
        
        // Check if project exists and is active
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('id, title')
            .eq('id', projectId)
            .eq('active', true)
            .single();
            
        if (projectError || !project) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ 
                    error: 'Project not found',
                    message: 'The specified project does not exist or is not active'
                })
            };
        }
        
        // Check if user has already reported this project
        const { data: existingReport } = await supabase
            .from('scam_reports')
            .select('id')
            .eq('project_id', projectId)
            .eq('user_wallet', walletAddress)
            .single();
            
        if (existingReport) {
            return {
                statusCode: 409,
                headers,
                body: JSON.stringify({ 
                    error: 'Report already exists',
                    message: 'You have already reported this project'
                })
            };
        }
        
        // Insert scam report
        const { data: reportData, error: reportError } = await supabase
            .from('scam_reports')
            .insert({
                project_id: projectId,
                user_wallet: walletAddress,
                reason: sanitizedReason,
                evidence_url: sanitizedEvidenceUrl,
                created_at: new Date().toISOString()
            })
            .select()
            .single();
            
        if (reportError) {
            console.error('Scam report insert error:', reportError);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    error: 'Failed to submit report',
                    message: 'Unable to process report at this time'
                })
            };
        }
        
        // Check if we need to send alert (get total report count for this project)
        const { count: totalReports } = await supabase
            .from('scam_reports')
            .select('*', { count: 'exact' })
            .eq('project_id', projectId);
            
        let alertTriggered = false;
        const alertThreshold = 5; // Could be configurable via environment
        
        if (totalReports >= alertThreshold) {
            try {
                // Trigger alert webhook
                const alertResponse = await fetch(`${process.env.URL}/.netlify/functions/send-scam-alert`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        project_id: projectId,
                        report_count: totalReports
                    })
                });
                
                if (alertResponse.ok) {
                    alertTriggered = true;
                }
            } catch (alertError) {
                console.error('Failed to trigger alert:', alertError);
                // Don't fail the report submission if alert fails
            }
        }
        
        // Return success response
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true,
                message: 'Scam report submitted successfully',
                report: {
                    id: reportData.id,
                    project_title: project.title,
                    total_reports: totalReports,
                    alert_triggered: alertTriggered
                }
            })
        };
        
    } catch (error) {
        console.error('Submit scam report error:', error);
        
        let statusCode = 500;
        let message = 'Internal server error';
        
        if (error.message.includes('Invalid') || error.message.includes('required') || 
            error.message.includes('must be')) {
            statusCode = 400;
            message = error.message;
        } else if (error.message.includes('Rate limit')) {
            statusCode = 429;
            message = error.message;
        } else if (error.message.includes('configuration')) {
            statusCode = 503;
            message = 'Service temporarily unavailable';
        }
        
        return {
            statusCode,
            headers,
            body: JSON.stringify({ 
                error: message,
                timestamp: new Date().toISOString()
            })
        };
    }
};