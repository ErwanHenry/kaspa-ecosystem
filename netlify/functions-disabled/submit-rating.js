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
    
    // Basic Kaspa address validation - starts with kaspa: and has correct length
    if (!/^kaspa:[a-z0-9]{61,63}$/.test(address)) {
        throw new Error('Invalid Kaspa wallet address format');
    }
    
    return address;
};

const validateRating = (rating) => {
    const numRating = parseInt(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
        throw new Error('Rating must be a number between 1 and 5');
    }
    return numRating;
};

const validateComment = (comment) => {
    if (comment !== null && comment !== undefined) {
        if (typeof comment !== 'string') {
            throw new Error('Comment must be a string');
        }
        if (comment.length > 1000) {
            throw new Error('Comment must be less than 1000 characters');
        }
        return comment.trim() || null;
    }
    return null;
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
        const rating = validateRating(body.rating);
        const comment = validateComment(body.comment);
        
        // Sanitize comment if provided
        const sanitizedComment = comment ? sanitizeInput(comment) : null;
        
        // Initialize Supabase
        const supabase = initSupabase();
        
        // Check if project exists
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
        
        // Insert or update rating
        const { data: ratingData, error: ratingError } = await supabase
            .from('ratings')
            .upsert({
                project_id: projectId,
                user_wallet: walletAddress,
                rating: rating,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();
            
        if (ratingError) {
            console.error('Rating insert/update error:', ratingError);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    error: 'Failed to save rating',
                    message: 'Unable to process rating at this time'
                })
            };
        }
        
        // Insert comment if provided
        if (sanitizedComment) {
            const { error: commentError } = await supabase
                .from('comments')
                .insert({
                    project_id: projectId,
                    user_wallet: walletAddress,
                    comment: sanitizedComment,
                    created_at: new Date().toISOString()
                });
                
            if (commentError) {
                console.error('Comment insert error:', commentError);
                // Don't fail the entire request if comment fails
            }
        }
        
        // Return success response
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true,
                message: 'Rating submitted successfully',
                rating: {
                    id: ratingData.id,
                    rating: ratingData.rating,
                    project_title: project.title
                }
            })
        };
        
    } catch (error) {
        console.error('Submit rating error:', error);
        
        let statusCode = 500;
        let message = 'Internal server error';
        
        if (error.message.includes('Invalid') || error.message.includes('required') || 
            error.message.includes('must be')) {
            statusCode = 400;
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