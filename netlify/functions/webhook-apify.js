// Webhook pour recevoir les données d'Apify
// Utilise la clé service_role car c'est côté serveur

const { createClient } = require('@supabase/supabase-js');

// Ces variables viennent de Netlify Environment Variables
const supabase = createClient(
  process.env.SUPABASE_URL,      // Depuis Netlify env vars
  process.env.SUPABASE_SERVICE_KEY // Clé service_role (privée)
);

exports.handler = async (event, context) => {
  // Vérifier la méthode
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const data = JSON.parse(event.body);
    
    // Valider les données
    if (!data.project_data || !data.project_data.name) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid project data' })
      };
    }

    // Nettoyer et formater les données
    const projectData = {
      name: data.project_data.name.substring(0, 100),
      category: data.project_data.category || 'Other',
      description: data.project_data.description?.substring(0, 500),
      url: data.project_data.url,
      twitter: data.project_data.twitter?.replace('@', ''),
      github: data.project_data.github,
      tags: Array.isArray(data.project_data.tags) ? 
            data.project_data.tags.slice(0, 10) : [],
      sourceUrl: data.project_data.sourceUrl
    };

    // Insérer dans la table submissions
    const { error } = await supabase
      .from('submissions')
      .insert({
        project_data: projectData,
        submitted_by: 'apify-scraper',
        submission_type: 'scraper',
        admin_notes: `Scraped from: ${data.project_data.sourceUrl}`
      });

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true,
        message: 'Project submitted for review'
      })
    };

  } catch (error) {
    console.error('Webhook error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};
