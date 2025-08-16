const { createClient } = require('@supabase/supabase-js');
const { withErrorHandling, validateRequest } = require('./error-handler');

// Initialize Supabase
const initSupabase = () => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration missing');
    }
    
    return createClient(supabaseUrl, supabaseAnonKey);
};

// RSS feed generators
const generateRSSFeed = (data) => {
    const { title, description, link, items } = data;
    const pubDate = new Date().toUTCString();
    
    let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
<channel>
    <title>${escapeXml(title)}</title>
    <description>${escapeXml(description)}</description>
    <link>${escapeXml(link)}</link>
    <atom:link href="${escapeXml(link)}" rel="self" type="application/rss+xml"/>
    <language>en-US</language>
    <lastBuildDate>${pubDate}</lastBuildDate>
    <generator>Kaspa Ecosystem RSS Generator</generator>
    <image>
        <url>${escapeXml(link)}/images/kaspa-logo.png</url>
        <title>${escapeXml(title)}</title>
        <link>${escapeXml(link)}</link>
        <width>144</width>
        <height>144</height>
    </image>
`;

    items.forEach(item => {
        rss += `
    <item>
        <title>${escapeXml(item.title)}</title>
        <description>${escapeXml(item.description)}</description>
        <link>${escapeXml(item.link)}</link>
        <guid isPermaLink="true">${escapeXml(item.link)}</guid>
        <pubDate>${item.pubDate}</pubDate>
        ${item.category ? `<category>${escapeXml(item.category)}</category>` : ''}
        ${item.author ? `<dc:creator>${escapeXml(item.author)}</dc:creator>` : ''}
        ${item.enclosure ? `<enclosure url="${escapeXml(item.enclosure.url)}" type="${item.enclosure.type}" length="${item.enclosure.length}"/>` : ''}
    </item>`;
    });

    rss += `
</channel>
</rss>`;

    return rss;
};

// Generate Atom feed
const generateAtomFeed = (data) => {
    const { title, description, link, items } = data;
    const updated = new Date().toISOString();
    
    let atom = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
    <title>${escapeXml(title)}</title>
    <subtitle>${escapeXml(description)}</subtitle>
    <link href="${escapeXml(link)}" rel="alternate" type="text/html"/>
    <link href="${escapeXml(link)}" rel="self" type="application/atom+xml"/>
    <id>${escapeXml(link)}</id>
    <updated>${updated}</updated>
    <rights>© ${new Date().getFullYear()} Kaspa Ecosystem</rights>
    <generator>Kaspa Ecosystem Atom Generator</generator>
`;

    items.forEach(item => {
        atom += `
    <entry>
        <title>${escapeXml(item.title)}</title>
        <id>${escapeXml(item.link)}</id>
        <link href="${escapeXml(item.link)}" type="text/html"/>
        <updated>${item.updated || item.pubDate}</updated>
        <summary type="html">${escapeXml(item.description)}</summary>
        ${item.category ? `<category term="${escapeXml(item.category)}"/>` : ''}
        ${item.author ? `<author><name>${escapeXml(item.author)}</name></author>` : ''}
    </entry>`;
    });

    atom += `
</feed>`;

    return atom;
};

// JSON Feed generator
const generateJSONFeed = (data) => {
    const { title, description, link, items } = data;
    
    const jsonFeed = {
        version: "https://jsonfeed.org/version/1.1",
        title: title,
        description: description,
        home_page_url: link,
        feed_url: `${link}/feed.json`,
        language: "en-US",
        favicon: `${link}/favicon.ico`,
        icon: `${link}/images/kaspa-logo.png`,
        items: items.map(item => ({
            id: item.link,
            title: item.title,
            content_html: item.description,
            url: item.link,
            date_published: item.pubDate,
            date_modified: item.updated || item.pubDate,
            tags: item.category ? [item.category] : [],
            author: item.author ? { name: item.author } : undefined
        }))
    };
    
    return JSON.stringify(jsonFeed, null, 2);
};

// Escape XML special characters
const escapeXml = (str) => {
    if (!str) return '';
    return str.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

// Format description for feeds
const formatDescription = (project) => {
    let description = `<p>${escapeXml(project.description || 'No description available')}</p>`;
    
    if (project.github_stars || project.average_rating || project.category_name) {
        description += '<p><strong>Stats:</strong><br/>';
        if (project.github_stars) description += `⭐ ${project.github_stars} GitHub stars<br/>`;
        if (project.average_rating) description += `🌟 ${project.average_rating}/5.0 community rating (${project.rating_count} reviews)<br/>`;
        if (project.category_name) description += `📁 Category: ${project.category_name}<br/>`;
        if (project.github_language) description += `💻 Language: ${project.github_language}<br/>`;
        description += '</p>';
    }
    
    if (project.website || project.github) {
        description += '<p><strong>Links:</strong><br/>';
        if (project.website) description += `🌐 <a href="${project.website}">Website</a><br/>`;
        if (project.github) description += `💻 <a href="${project.github}">GitHub</a><br/>`;
        description += '</p>';
    }
    
    return description;
};

const handler = async (event, context, requestContext) => {
    validateRequest(event, { allowedMethods: ['GET'] });
    
    const supabase = initSupabase();
    const path = event.path.split('/').pop();
    const queryParams = event.queryStringParameters || {};
    const format = queryParams.format || 'rss'; // rss, atom, json
    
    const baseUrl = process.env.URL || 'https://kaspa-ecosystem.netlify.app';
    
    try {
        switch (path) {
            case 'projects':
                return await handleProjectsFeed(supabase, format, baseUrl, queryParams);
            case 'trending':
                return await handleTrendingFeed(supabase, format, baseUrl, queryParams);
            case 'new-projects':
                return await handleNewProjectsFeed(supabase, format, baseUrl, queryParams);
            case 'updates':
                return await handleUpdatesFeed(supabase, format, baseUrl, queryParams);
            case 'category':
                return await handleCategoryFeed(supabase, format, baseUrl, queryParams);
            default:
                return await handleMainFeed(supabase, format, baseUrl, queryParams);
        }
    } catch (error) {
        throw error;
    }
};

// Main ecosystem feed
const handleMainFeed = async (supabase, format, baseUrl, queryParams) => {
    const limit = Math.min(parseInt(queryParams.limit) || 20, 100);
    
    const { data: projects, error } = await supabase
        .from('enhanced_project_stats')
        .select('*')
        .eq('active', true)
        .order('overall_score', { ascending: false })
        .limit(limit);
        
    if (error) throw error;
    
    const feedData = {
        title: 'Kaspa Ecosystem - All Projects',
        description: 'Discover and explore projects building on the Kaspa blockchain',
        link: baseUrl,
        items: projects.map(project => ({
            title: project.title,
            description: formatDescription(project),
            link: `${baseUrl}?project=${project.slug || project.id}`,
            pubDate: new Date(project.created_at).toUTCString(),
            updated: new Date(project.updated_at).toISOString(),
            category: project.category_name,
            author: 'Kaspa Ecosystem'
        }))
    };
    
    return generateFeedResponse(feedData, format);
};

// Trending projects feed
const handleTrendingFeed = async (supabase, format, baseUrl, queryParams) => {
    const limit = Math.min(parseInt(queryParams.limit) || 10, 50);
    
    const { data: projects, error } = await supabase
        .rpc('get_trending_projects', { limit_count: limit });
        
    if (error) throw error;
    
    // Get full project details
    const projectIds = projects.map(p => p.project_id);
    const { data: fullProjects } = await supabase
        .from('enhanced_project_stats')
        .select('*')
        .in('id', projectIds);
        
    const feedData = {
        title: 'Kaspa Ecosystem - Trending Projects',
        description: 'The most trending and active projects in the Kaspa ecosystem',
        link: `${baseUrl}/trending`,
        items: fullProjects.map(project => ({
            title: `🔥 ${project.title}`,
            description: `<p><strong>Trending Project!</strong></p>${formatDescription(project)}`,
            link: `${baseUrl}?project=${project.slug || project.id}`,
            pubDate: new Date(project.github_pushed_at || project.updated_at).toUTCString(),
            updated: new Date(project.github_pushed_at || project.updated_at).toISOString(),
            category: project.category_name,
            author: 'Kaspa Ecosystem'
        }))
    };
    
    return generateFeedResponse(feedData, format);
};

// New projects feed
const handleNewProjectsFeed = async (supabase, format, baseUrl, queryParams) => {
    const limit = Math.min(parseInt(queryParams.limit) || 10, 50);
    const days = Math.min(parseInt(queryParams.days) || 30, 90);
    
    const { data: projects, error } = await supabase
        .from('enhanced_project_stats')
        .select('*')
        .eq('active', true)
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);
        
    if (error) throw error;
    
    const feedData = {
        title: 'Kaspa Ecosystem - New Projects',
        description: `New projects added to the Kaspa ecosystem in the last ${days} days`,
        link: `${baseUrl}/new`,
        items: projects.map(project => ({
            title: `🆕 ${project.title}`,
            description: `<p><strong>New Project Added!</strong></p>${formatDescription(project)}`,
            link: `${baseUrl}?project=${project.slug || project.id}`,
            pubDate: new Date(project.created_at).toUTCString(),
            updated: new Date(project.created_at).toISOString(),
            category: project.category_name,
            author: 'Kaspa Ecosystem'
        }))
    };
    
    return generateFeedResponse(feedData, format);
};

// Category-specific feed
const handleCategoryFeed = async (supabase, format, baseUrl, queryParams) => {
    const category = queryParams.category;
    if (!category) {
        throw new Error('Category parameter required');
    }
    
    const limit = Math.min(parseInt(queryParams.limit) || 20, 100);
    
    const { data: projects, error } = await supabase
        .from('enhanced_project_stats')
        .select('*')
        .eq('active', true)
        .eq('category_slug', category)
        .order('overall_score', { ascending: false })
        .limit(limit);
        
    if (error) throw error;
    
    const categoryName = projects[0]?.category_name || category;
    
    const feedData = {
        title: `Kaspa Ecosystem - ${categoryName} Projects`,
        description: `Projects in the ${categoryName} category of the Kaspa ecosystem`,
        link: `${baseUrl}?category=${category}`,
        items: projects.map(project => ({
            title: project.title,
            description: formatDescription(project),
            link: `${baseUrl}?project=${project.slug || project.id}`,
            pubDate: new Date(project.created_at).toUTCString(),
            updated: new Date(project.updated_at).toISOString(),
            category: project.category_name,
            author: 'Kaspa Ecosystem'
        }))
    };
    
    return generateFeedResponse(feedData, format);
};

// Project updates feed (placeholder - would need update tracking)
const handleUpdatesFeed = async (supabase, format, baseUrl, queryParams) => {
    const limit = Math.min(parseInt(queryParams.limit) || 20, 100);
    
    // For now, show recently updated projects (GitHub activity)
    const { data: projects, error } = await supabase
        .from('enhanced_project_stats')
        .select('*')
        .eq('active', true)
        .not('github_pushed_at', 'is', null)
        .order('github_pushed_at', { ascending: false })
        .limit(limit);
        
    if (error) throw error;
    
    const feedData = {
        title: 'Kaspa Ecosystem - Project Updates',
        description: 'Recent updates and activity from Kaspa ecosystem projects',
        link: `${baseUrl}/updates`,
        items: projects.map(project => ({
            title: `📝 ${project.title} - Recent Update`,
            description: `<p><strong>Recent GitHub Activity</strong></p>${formatDescription(project)}<p><em>Last updated: ${new Date(project.github_pushed_at).toLocaleDateString()}</em></p>`,
            link: `${baseUrl}?project=${project.slug || project.id}`,
            pubDate: new Date(project.github_pushed_at).toUTCString(),
            updated: new Date(project.github_pushed_at).toISOString(),
            category: project.category_name,
            author: 'Kaspa Ecosystem'
        }))
    };
    
    return generateFeedResponse(feedData, format);
};

// Generate appropriate feed response
const generateFeedResponse = (feedData, format) => {
    let content, contentType;
    
    switch (format) {
        case 'atom':
            content = generateAtomFeed(feedData);
            contentType = 'application/atom+xml';
            break;
        case 'json':
            content = generateJSONFeed(feedData);
            contentType = 'application/feed+json';
            break;
        case 'rss':
        default:
            content = generateRSSFeed(feedData);
            contentType = 'application/rss+xml';
            break;
    }
    
    return {
        statusCode: 200,
        headers: {
            'Content-Type': `${contentType}; charset=utf-8`,
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
            'X-Content-Type-Options': 'nosniff'
        },
        body: content
    };
};

module.exports.handler = withErrorHandling(handler);