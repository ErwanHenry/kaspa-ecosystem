const { createClient } = require('@supabase/supabase-js');
const { verifyAdminToken } = require('./admin-auth');

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
};

// Initialize Supabase with service role (server-side only)
const initSupabase = () => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Supabase configuration missing');
    }
    
    return createClient(supabaseUrl, supabaseServiceKey);
};

// Validate admin authorization
const validateAdminAuth = (event) => {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Missing or invalid authorization header');
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyAdminToken(token);
    
    if (!decoded || decoded.role !== 'admin') {
        throw new Error('Invalid or expired admin token');
    }
    
    return decoded;
};

// Input validation helpers
const validateId = (id) => {
    if (!id || typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        throw new Error('Invalid ID format');
    }
    return id;
};

const validateProjectData = (data) => {
    const errors = [];
    
    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
        errors.push('Title is required and must be a non-empty string');
    }
    
    if (data.title && data.title.length > 200) {
        errors.push('Title must be less than 200 characters');
    }
    
    if (data.description && data.description.length > 2000) {
        errors.push('Description must be less than 2000 characters');
    }
    
    if (data.website && !/^https?:\/\/.+/.test(data.website)) {
        errors.push('Website must be a valid HTTP/HTTPS URL');
    }
    
    if (data.github && !/^https?:\/\/(www\.)?github\.com\/.+/.test(data.github)) {
        errors.push('GitHub must be a valid GitHub URL');
    }
    
    if (errors.length > 0) {
        throw new Error('Validation errors: ' + errors.join(', '));
    }
    
    return {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        website: data.website || null,
        github: data.github || null,
        twitter: data.twitter || null,
        discord: data.discord || null,
        telegram: data.telegram || null,
        active: typeof data.active === 'boolean' ? data.active : true,
        featured: typeof data.featured === 'boolean' ? data.featured : false
    };
};

exports.handler = async (event, context) => {
    // Handle OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        // Validate admin authorization
        const admin = validateAdminAuth(event);
        
        // Initialize Supabase
        const supabase = initSupabase();
        
        const path = event.path.replace('/.netlify/functions/admin-api/', '').replace('/admin-api/', '');
        const method = event.httpMethod;
        
        switch (path) {
            case 'projects':
                return await handleProjects(supabase, method, event);
            case 'scam-reports':
                return await handleScamReports(supabase, method, event);
            case 'analytics':
                return await handleAnalytics(supabase, method, event);
            default:
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ 
                        error: 'Endpoint not found',
                        message: `Admin API endpoint '${path}' does not exist`
                    })
                };
        }
        
    } catch (error) {
        console.error('Admin API error:', error);
        
        let statusCode = 500;
        let message = 'Internal server error';
        
        if (error.message.includes('authorization') || error.message.includes('token')) {
            statusCode = 401;
            message = 'Unauthorized access';
        } else if (error.message.includes('Validation')) {
            statusCode = 400;
            message = error.message;
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

// Handle project operations
async function handleProjects(supabase, method, event) {
    switch (method) {
        case 'GET':
            const { data: projects, error } = await supabase
                .from('projects')
                .select(`
                    *,
                    categories(name, icon),
                    ratings(rating),
                    comments(id),
                    scam_reports(id)
                `)
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ projects })
            };
            
        case 'POST':
            const projectData = validateProjectData(JSON.parse(event.body || '{}'));
            
            const { data: newProject, error: createError } = await supabase
                .from('projects')
                .insert([projectData])
                .select()
                .single();
                
            if (createError) throw createError;
            
            return {
                statusCode: 201,
                headers,
                body: JSON.stringify({ 
                    project: newProject,
                    message: 'Project created successfully'
                })
            };
            
        case 'PUT':
            const { id, ...updateData } = JSON.parse(event.body || '{}');
            validateId(id);
            const validatedUpdateData = validateProjectData(updateData);
            
            const { data: updatedProject, error: updateError } = await supabase
                .from('projects')
                .update(validatedUpdateData)
                .eq('id', id)
                .select()
                .single();
                
            if (updateError) throw updateError;
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    project: updatedProject,
                    message: 'Project updated successfully'
                })
            };
            
        case 'DELETE':
            const deleteId = event.queryStringParameters?.id;
            validateId(deleteId);
            
            const { error: deleteError } = await supabase
                .from('projects')
                .delete()
                .eq('id', deleteId);
                
            if (deleteError) throw deleteError;
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    message: 'Project deleted successfully'
                })
            };
            
        default:
            return {
                statusCode: 405,
                headers,
                body: JSON.stringify({ error: 'Method not allowed' })
            };
    }
}

// Handle scam reports
async function handleScamReports(supabase, method, event) {
    if (method !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
    
    const { data: reports, error } = await supabase
        .from('scam_reports')
        .select(`
            *,
            projects(title, slug)
        `)
        .order('created_at', { ascending: false });
        
    if (error) throw error;
    
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ reports })
    };
}

// Handle analytics
async function handleAnalytics(supabase, method, event) {
    if (method !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
    
    // Get analytics data
    const [projectsCount, ratingsCount, commentsCount, reportsCount] = await Promise.all([
        supabase.from('projects').select('id', { count: 'exact' }),
        supabase.from('ratings').select('id', { count: 'exact' }),
        supabase.from('comments').select('id', { count: 'exact' }),
        supabase.from('scam_reports').select('id', { count: 'exact' })
    ]);
    
    const analytics = {
        totalProjects: projectsCount.count || 0,
        totalRatings: ratingsCount.count || 0,
        totalComments: commentsCount.count || 0,
        totalReports: reportsCount.count || 0,
        generatedAt: new Date().toISOString()
    };
    
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ analytics })
    };
}