const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const APIFY_ACTOR_ID = process.env.APIFY_ACTOR_ID || 'kaspa-scrapper';

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Check authorization (you can add more security here)
        const authHeader = event.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'Unauthorized' })
            };
        }

        // Get projects that need scraping
        const { data: projects, error } = await supabase
            .from('projects')
            .select('id, title, website, github, twitter, discord')
            .eq('active', true)
            .not('website', 'is', null);

        if (error) throw error;

        const results = [];

        // Trigger Apify for each project
        for (const project of projects) {
            try {
                // Check if already in queue
                const { data: existingQueue } = await supabase
                    .from('scraping_queue')
                    .select('id')
                    .eq('project_id', project.id)
                    .in('status', ['pending', 'processing'])
                    .single();

                if (existingQueue) {
                    results.push({
                        projectId: project.id,
                        status: 'already_queued'
                    });
                    continue;
                }

                // Add to queue
                await supabase
                    .from('scraping_queue')
                    .insert({
                        project_id: project.id,
                        priority: 5,
                        status: 'pending'
                    });

                // Trigger Apify Actor
                const apifyResponse = await fetch(
                    `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/runs`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${APIFY_TOKEN}`
                        },
                        body: JSON.stringify({
                            input: {
                                projectId: project.id,
                                urls: {
                                    website: project.website,
                                    github: project.github,
                                    twitter: project.twitter,
                                    discord: project.discord
                                }
                            },
                            webhooks: [
                                {
                                    eventTypes: ['ACTOR.RUN.SUCCEEDED'],
                                    requestUrl: `${process.env.URL}/.netlify/functions/webhook-apify`,
                                    payloadTemplate: `{
                                        "projectId": "${project.id}",
                                        "data": {{resource}}
                                    }`
                                }
                            ]
                        })
                    }
                );

                const apifyData = await apifyResponse.json();

                results.push({
                    projectId: project.id,
                    status: 'triggered',
                    runId: apifyData.data?.id
                });

                // Update queue with run ID
                await supabase
                    .from('scraping_queue')
                    .update({
                        status: 'processing',
                        metadata: { apifyRunId: apifyData.data?.id }
                    })
                    .eq('project_id', project.id);

            } catch (projectError) {
                console.error(`Error processing project ${project.id}:`, projectError);
                results.push({
                    projectId: project.id,
                    status: 'error',
                    error: projectError.message
                });
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                processed: results.length,
                results
            })
        };

    } catch (error) {
        console.error('Trigger error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};
