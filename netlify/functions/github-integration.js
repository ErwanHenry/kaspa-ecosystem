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

// Extract GitHub repo info from URL
const parseGitHubUrl = (url) => {
    if (!url) return null;
    
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) return null;
    
    return {
        owner: match[1],
        repo: match[2].replace(/\.git$/, '')
    };
};

// Fetch GitHub repository data
const fetchGitHubData = async (owner, repo) => {
    try {
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;
        const response = await fetch(apiUrl, {
            headers: {
                'User-Agent': 'Kaspa-Ecosystem-Bot',
                'Accept': 'application/vnd.github.v3+json',
                ...(process.env.GITHUB_TOKEN && {
                    'Authorization': `token ${process.env.GITHUB_TOKEN}`
                })
            }
        });
        
        if (!response.ok) {
            if (response.status === 404) {
                return { error: 'Repository not found' };
            }
            if (response.status === 403) {
                return { error: 'Rate limit exceeded' };
            }
            throw new Error(`GitHub API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Fetch additional data
        const [releases, contributors, languages] = await Promise.all([
            fetchGitHubReleases(owner, repo),
            fetchGitHubContributors(owner, repo),
            fetchGitHubLanguages(owner, repo)
        ]);
        
        return {
            id: data.id,
            name: data.name,
            full_name: data.full_name,
            description: data.description,
            html_url: data.html_url,
            homepage: data.homepage,
            language: data.language,
            languages: languages,
            stargazers_count: data.stargazers_count,
            watchers_count: data.watchers_count,
            forks_count: data.forks_count,
            open_issues_count: data.open_issues_count,
            created_at: data.created_at,
            updated_at: data.updated_at,
            pushed_at: data.pushed_at,
            size: data.size,
            default_branch: data.default_branch,
            topics: data.topics || [],
            license: data.license ? {
                key: data.license.key,
                name: data.license.name,
                spdx_id: data.license.spdx_id
            } : null,
            archived: data.archived,
            disabled: data.disabled,
            private: data.private,
            latest_release: releases.latest,
            total_releases: releases.total,
            contributors_count: contributors.count,
            top_contributors: contributors.top,
            activity_score: calculateActivityScore(data),
            health_score: calculateHealthScore(data, contributors.count)
        };
    } catch (error) {
        console.error('Error fetching GitHub data:', error);
        return { error: error.message };
    }
};

// Fetch GitHub releases
const fetchGitHubReleases = async (owner, repo) => {
    try {
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases`, {
            headers: {
                'User-Agent': 'Kaspa-Ecosystem-Bot',
                ...(process.env.GITHUB_TOKEN && {
                    'Authorization': `token ${process.env.GITHUB_TOKEN}`
                })
            }
        });
        
        if (!response.ok) return { latest: null, total: 0 };
        
        const releases = await response.json();
        return {
            latest: releases[0] || null,
            total: releases.length
        };
    } catch (error) {
        return { latest: null, total: 0 };
    }
};

// Fetch GitHub contributors
const fetchGitHubContributors = async (owner, repo) => {
    try {
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contributors?per_page=10`, {
            headers: {
                'User-Agent': 'Kaspa-Ecosystem-Bot',
                ...(process.env.GITHUB_TOKEN && {
                    'Authorization': `token ${process.env.GITHUB_TOKEN}`
                })
            }
        });
        
        if (!response.ok) return { count: 0, top: [] };
        
        const contributors = await response.json();
        return {
            count: contributors.length,
            top: contributors.slice(0, 5).map(c => ({
                login: c.login,
                avatar_url: c.avatar_url,
                contributions: c.contributions
            }))
        };
    } catch (error) {
        return { count: 0, top: [] };
    }
};

// Fetch repository languages
const fetchGitHubLanguages = async (owner, repo) => {
    try {
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, {
            headers: {
                'User-Agent': 'Kaspa-Ecosystem-Bot',
                ...(process.env.GITHUB_TOKEN && {
                    'Authorization': `token ${process.env.GITHUB_TOKEN}`
                })
            }
        });
        
        if (!response.ok) return {};
        
        return await response.json();
    } catch (error) {
        return {};
    }
};

// Calculate activity score based on recent activity
const calculateActivityScore = (repoData) => {
    const now = new Date();
    const lastPush = new Date(repoData.pushed_at);
    const daysSinceLastPush = Math.floor((now - lastPush) / (1000 * 60 * 60 * 24));
    
    let score = 100;
    
    // Deduct points based on inactivity
    if (daysSinceLastPush > 30) score -= 20;
    if (daysSinceLastPush > 90) score -= 30;
    if (daysSinceLastPush > 180) score -= 30;
    if (daysSinceLastPush > 365) score -= 20;
    
    // Add points for stars and forks
    score += Math.min(repoData.stargazers_count / 10, 20);
    score += Math.min(repoData.forks_count / 5, 10);
    
    return Math.max(0, Math.min(100, Math.round(score)));
};

// Calculate health score
const calculateHealthScore = (repoData, contributorsCount) => {
    let score = 50;
    
    // Documentation
    if (repoData.description) score += 10;
    if (repoData.homepage) score += 5;
    
    // License
    if (repoData.license) score += 10;
    
    // Community
    score += Math.min(contributorsCount * 2, 15);
    score += Math.min(repoData.stargazers_count / 20, 10);
    
    // Issues management
    const issueRatio = repoData.open_issues_count / Math.max(repoData.stargazers_count, 1);
    if (issueRatio < 0.1) score += 10;
    else if (issueRatio > 0.5) score -= 10;
    
    return Math.max(0, Math.min(100, Math.round(score)));
};

// Update project with GitHub data
const updateProjectGitHubData = async (supabase, projectId, githubData) => {
    const updateData = {
        github_id: githubData.id,
        github_stars: githubData.stargazers_count,
        github_forks: githubData.forks_count,
        github_watchers: githubData.watchers_count,
        github_issues: githubData.open_issues_count,
        github_language: githubData.language,
        github_languages: githubData.languages,
        github_topics: githubData.topics,
        github_license: githubData.license,
        github_created_at: githubData.created_at,
        github_updated_at: githubData.updated_at,
        github_pushed_at: githubData.pushed_at,
        github_size: githubData.size,
        github_contributors_count: githubData.contributors_count,
        github_releases_count: githubData.total_releases,
        github_latest_release: githubData.latest_release,
        github_activity_score: githubData.activity_score,
        github_health_score: githubData.health_score,
        github_archived: githubData.archived,
        github_last_sync: new Date().toISOString()
    };
    
    const { data, error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', projectId)
        .select()
        .single();
        
    if (error) throw error;
    return data;
};

const handler = async (event, context, requestContext) => {
    validateRequest(event, { 
        allowedMethods: ['GET', 'POST'],
        requireAuth: event.httpMethod === 'POST' 
    });
    
    const supabase = initSupabase();
    
    if (event.httpMethod === 'GET') {
        // Sync all projects with GitHub URLs
        const { data: projects, error } = await supabase
            .from('projects')
            .select('id, title, github')
            .not('github', 'is', null)
            .neq('github', '');
            
        if (error) throw error;
        
        const results = [];
        for (const project of projects) {
            const repoInfo = parseGitHubUrl(project.github);
            if (repoInfo) {
                const githubData = await fetchGitHubData(repoInfo.owner, repoInfo.repo);
                if (!githubData.error) {
                    try {
                        await updateProjectGitHubData(supabase, project.id, githubData);
                        results.push({
                            project_id: project.id,
                            title: project.title,
                            status: 'success',
                            data: githubData
                        });
                    } catch (error) {
                        results.push({
                            project_id: project.id,
                            title: project.title,
                            status: 'error',
                            error: error.message
                        });
                    }
                } else {
                    results.push({
                        project_id: project.id,
                        title: project.title,
                        status: 'error',
                        error: githubData.error
                    });
                }
            }
        }
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                message: 'GitHub sync completed',
                synced_projects: results.length,
                results
            })
        };
    }
    
    if (event.httpMethod === 'POST') {
        // Sync specific project
        const body = parseJsonBody(event);
        const { project_id, github_url } = body;
        
        if (!project_id) {
            throw new Error('Project ID is required');
        }
        
        // Get project
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('id, title, github')
            .eq('id', project_id)
            .single();
            
        if (projectError || !project) {
            throw new Error('Project not found');
        }
        
        const githubUrl = github_url || project.github;
        const repoInfo = parseGitHubUrl(githubUrl);
        
        if (!repoInfo) {
            throw new Error('Invalid GitHub URL');
        }
        
        const githubData = await fetchGitHubData(repoInfo.owner, repoInfo.repo);
        
        if (githubData.error) {
            throw new Error(`GitHub API error: ${githubData.error}`);
        }
        
        const updatedProject = await updateProjectGitHubData(supabase, project_id, githubData);
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                message: 'Project GitHub data updated successfully',
                project: updatedProject,
                github_data: githubData
            })
        };
    }
};

module.exports.handler = withErrorHandling(handler);