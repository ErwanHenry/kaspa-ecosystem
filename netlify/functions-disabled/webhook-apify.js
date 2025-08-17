const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Verify webhook secret if configured
    const webhookSecret = process.env.APIFY_WEBHOOK_SECRET;
    if (webhookSecret && event.headers['x-apify-webhook-secret'] !== webhookSecret) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    const payload = JSON.parse(event.body);
    const { projectId, data } = payload;

    if (!projectId || !data) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing projectId or data' })
      };
    }

    // Update project with scraped data
    const updateData = {
      last_scraped_at: new Date().toISOString(),
      scrape_status: 'completed'
    };

    // Map scraped data to database fields
    if (data.github) {
      updateData.github_stars = data.github.stars;
      updateData.github_forks = data.github.forks;
      updateData.github_issues = data.github.issues;
      updateData.github_last_commit = data.github.lastCommit;
    }

    if (data.twitter) {
      updateData.twitter_followers = data.twitter.followers;
    }

    if (data.discord) {
      updateData.discord_members = data.discord.members;
    }

    // Update project in database
    const { error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId);

    if (error) {
      console.error('Error updating project:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to update project' })
      };
    }

    // Update scraping queue
    await supabase
      .from('scraping_queue')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('project_id', projectId)
      .eq('status', 'processing');

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Project updated successfully' })
    };
  } catch (error) {
    console.error('Webhook error:', error);
    
    // Update scraping queue with error
    if (payload?.projectId) {
      await supabase
        .from('scraping_queue')
        .update({
          status: 'failed',
          last_error: error.message,
          completed_at: new Date().toISOString()
        })
        .eq('project_id', payload.projectId)
        .eq('status', 'processing');
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
