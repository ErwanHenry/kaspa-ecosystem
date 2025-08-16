const { createClient } = require('@supabase/supabase-js');
const { withErrorHandling, validateRequest, parseJsonBody } = require('./error-handler');

// Initialize Supabase
const initSupabase = () => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration missing');
    }
    
    return createClient(supabaseUrl, supabaseAnonKey);
};

// Validation helpers
const validateSearchParams = (params) => {
    const validated = {};
    
    if (params.q) {
        if (typeof params.q !== 'string' || params.q.length > 100) {
            throw new Error('Search query must be a string with max 100 characters');
        }
        validated.q = params.q.trim();
    }
    
    if (params.category) {
        if (typeof params.category !== 'string' || params.category.length > 50) {
            throw new Error('Category must be a string with max 50 characters');
        }
        validated.category = params.category.trim();
    }
    
    if (params.status) {
        const validStatuses = ['active', 'maintenance', 'deprecated', 'archived', 'coming-soon'];
        if (!validStatuses.includes(params.status)) {
            throw new Error('Invalid project status');
        }
        validated.status = params.status;
    }
    
    if (params.maturity) {
        const validMaturity = ['concept', 'development', 'alpha', 'beta', 'mainnet', 'mature'];
        if (!validMaturity.includes(params.maturity)) {
            throw new Error('Invalid maturity level');
        }
        validated.maturity = params.maturity;
    }
    
    if (params.min_stars) {
        const stars = parseInt(params.min_stars);
        if (isNaN(stars) || stars < 0 || stars > 10000) {
            throw new Error('min_stars must be a number between 0 and 10000');
        }
        validated.min_stars = stars;
    }
    
    if (params.min_rating) {
        const rating = parseFloat(params.min_rating);
        if (isNaN(rating) || rating < 0 || rating > 5) {
            throw new Error('min_rating must be a number between 0 and 5');
        }
        validated.min_rating = rating;
    }
    
    if (params.sort) {
        const validSorts = ['stars', 'rating', 'activity', 'health', 'trending', 'newest', 'updated'];
        if (!validSorts.includes(params.sort)) {
            throw new Error('Invalid sort parameter');
        }
        validated.sort = params.sort;
    }
    
    if (params.limit) {
        const limit = parseInt(params.limit);
        if (isNaN(limit) || limit < 1 || limit > 100) {
            throw new Error('limit must be a number between 1 and 100');
        }
        validated.limit = limit;
    }
    
    if (params.offset) {
        const offset = parseInt(params.offset);
        if (isNaN(offset) || offset < 0) {
            throw new Error('offset must be a non-negative number');
        }
        validated.offset = offset;
    }
    
    return validated;
};

// Build query based on filters
const buildProjectQuery = (supabase, filters) => {
    let query = supabase
        .from('enhanced_project_stats')
        .select(`
            id,
            title,
            slug,
            description,
            logo_url,
            website,
            github,
            twitter,
            discord,
            telegram,
            category_name,
            category_icon,
            category_slug,
            project_status,
            maturity_level,
            verified_status,
            github_stars,
            github_forks,
            github_language,
            github_topics,
            github_activity_score,
            github_health_score,
            github_pushed_at,
            rating_count,
            average_rating,
            comment_count,
            activity_level,
            health_status,
            overall_score,
            trending_score,
            tags,
            project_type,
            created_at,
            updated_at
        `);
    
    // Apply filters
    if (filters.category) {
        query = query.eq('category_slug', filters.category);
    }
    
    if (filters.status) {
        query = query.eq('project_status', filters.status);
    }
    
    if (filters.maturity) {
        query = query.eq('maturity_level', filters.maturity);
    }
    
    if (filters.min_stars) {
        query = query.gte('github_stars', filters.min_stars);
    }
    
    if (filters.min_rating) {
        query = query.gte('average_rating', filters.min_rating);
    }
    
    // Search functionality
    if (filters.q) {
        query = query.or(`title.ilike.%${filters.q}%,description.ilike.%${filters.q}%,github_language.ilike.%${filters.q}%`);
    }
    
    // Sorting
    const sortMap = {
        'stars': 'github_stars.desc.nullslast',
        'rating': 'average_rating.desc.nullslast',
        'activity': 'github_activity_score.desc.nullslast',
        'health': 'github_health_score.desc.nullslast',
        'trending': 'trending_score.desc,github_stars.desc',
        'newest': 'created_at.desc',
        'updated': 'github_pushed_at.desc.nullslast',
        'default': 'overall_score.desc,github_stars.desc'
    };
    
    const sortOrder = sortMap[filters.sort] || sortMap.default;
    query = query.order(sortOrder);
    
    // Pagination
    if (filters.limit) {
        query = query.limit(filters.limit);
    }
    
    if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
    }
    
    return query;
};

const handler = async (event, context, requestContext) => {
    validateRequest(event, { allowedMethods: ['GET'] });
    
    const supabase = initSupabase();
    const params = event.queryStringParameters || {};
    
    try {
        // Handle different endpoints
        const path = event.path.split('/').pop();
        
        switch (path) {
            case 'search':
                return await handleSearch(supabase, params);
            case 'trending':
                return await handleTrending(supabase, params);
            case 'categories':
                return await handleCategories(supabase);
            case 'stats':
                return await handleStats(supabase);
            default:
                return await handleSearch(supabase, params);
        }
        
    } catch (error) {
        throw error;
    }
};

// Handle search with advanced filtering
const handleSearch = async (supabase, params) => {
    const filters = validateSearchParams(params);
    
    const query = buildProjectQuery(supabase, filters);
    const { data: projects, error } = await query;
    
    if (error) throw error;
    
    // Get total count for pagination
    let countQuery = supabase
        .from('enhanced_project_stats')
        .select('*', { count: 'exact', head: true });
    
    if (filters.category) countQuery = countQuery.eq('category_slug', filters.category);
    if (filters.status) countQuery = countQuery.eq('project_status', filters.status);
    if (filters.maturity) countQuery = countQuery.eq('maturity_level', filters.maturity);
    if (filters.min_stars) countQuery = countQuery.gte('github_stars', filters.min_stars);
    if (filters.min_rating) countQuery = countQuery.gte('average_rating', filters.min_rating);
    if (filters.q) {
        countQuery = countQuery.or(`title.ilike.%${filters.q}%,description.ilike.%${filters.q}%,github_language.ilike.%${filters.q}%`);
    }
    
    const { count } = await countQuery;
    
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            projects,
            pagination: {
                total: count,
                limit: filters.limit || 20,
                offset: filters.offset || 0,
                has_more: count > (filters.offset || 0) + (filters.limit || 20)
            },
            filters: filters,
            timestamp: new Date().toISOString()
        })
    };
};

// Handle trending projects
const handleTrending = async (supabase, params) => {
    const limit = Math.min(parseInt(params.limit) || 10, 50);
    
    const { data: projects, error } = await supabase
        .rpc('get_trending_projects', { limit_count: limit });
    
    if (error) throw error;
    
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            trending_projects: projects,
            generated_at: new Date().toISOString(),
            algorithm: 'github_activity + community_engagement + recent_updates'
        })
    };
};

// Handle categories with project counts
const handleCategories = async (supabase) => {
    const { data: categories, error } = await supabase
        .from('categories')
        .select(`
            id,
            name,
            slug,
            icon,
            description,
            projects:projects(count)
        `);
    
    if (error) throw error;
    
    // Get project counts per category
    const categoriesWithCounts = await Promise.all(
        categories.map(async (category) => {
            const { count } = await supabase
                .from('enhanced_project_stats')
                .select('*', { count: 'exact', head: true })
                .eq('category_slug', category.slug);
            
            return {
                ...category,
                project_count: count || 0
            };
        })
    );
    
    // Get maturity levels
    const { data: maturityLevels } = await supabase
        .from('maturity_levels')
        .select('*')
        .order('level');
    
    // Get project statuses
    const { data: projectStatuses } = await supabase
        .from('project_statuses')
        .select('*')
        .order('status');
    
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            categories: categoriesWithCounts,
            maturity_levels: maturityLevels || [],
            project_statuses: projectStatuses || [],
            total_categories: categoriesWithCounts.length
        })
    };
};

// Handle ecosystem statistics
const handleStats = async (supabase) => {
    const [
        { count: totalProjects },
        { count: activeProjects },
        { count: totalRatings },
        { count: verifiedProjects },
        { data: topLanguages },
        { data: recentActivity }
    ] = await Promise.all([
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('active', true),
        supabase.from('wallet_ratings').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('verified_status', true),
        
        // Top programming languages
        supabase
            .from('projects')
            .select('github_language')
            .not('github_language', 'is', null)
            .limit(100),
            
        // Recent activity (projects updated in last 30 days)
        supabase
            .from('projects')
            .select('title, github_pushed_at')
            .gte('github_pushed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
            .order('github_pushed_at', { ascending: false })
            .limit(10)
    ]);
    
    // Process language statistics
    const languageStats = {};
    topLanguages?.forEach(project => {
        if (project.github_language) {
            languageStats[project.github_language] = (languageStats[project.github_language] || 0) + 1;
        }
    });
    
    const sortedLanguages = Object.entries(languageStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([language, count]) => ({ language, count }));
    
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            ecosystem_stats: {
                total_projects: totalProjects || 0,
                active_projects: activeProjects || 0,
                total_ratings: totalRatings || 0,
                verified_projects: verifiedProjects || 0,
                top_languages: sortedLanguages,
                recent_activity: recentActivity || [],
                last_updated: new Date().toISOString()
            }
        })
    };
};

module.exports.handler = withErrorHandling(handler);