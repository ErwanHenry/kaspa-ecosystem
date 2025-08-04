const { google } = require('googleapis');

// Cache configuration
let cachedData = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Initialize Google Sheets API
const initGoogleSheets = () => {
  try {
    // Debug: Log environment variables (sans données sensibles)
    console.log('Environment check:');
    console.log('GOOGLE_PROJECT_ID:', process.env.GOOGLE_PROJECT_ID ? 'Set' : 'Missing');
    console.log('SERVICE_ACCOUNT_EMAIL:', process.env.SERVICE_ACCOUNT_EMAIL ? 'Set' : 'Missing');
    console.log('SERVICE_ACCOUNT_KEY:', process.env.SERVICE_ACCOUNT_KEY ? 'Set' : 'Missing');
    console.log('GOOGLE_SHEET_ID:', process.env.GOOGLE_SHEET_ID ? 'Set' : 'Missing');

    if (!process.env.GOOGLE_PROJECT_ID || !process.env.SERVICE_ACCOUNT_EMAIL || 
        !process.env.SERVICE_ACCOUNT_KEY || !process.env.GOOGLE_SHEET_ID) {
      throw new Error('Missing required environment variables');
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        client_email: process.env.SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.SERVICE_ACCOUNT_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    return google.sheets({ version: 'v4', auth });
  } catch (error) {
    console.error('Failed to initialize Google Sheets API:', error.message);
    throw error;
  }
};

// Parse sheet data
const parseSheetData = (rows) => {
  if (!rows || rows.length < 2) return [];

  const data = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[0]) continue;

    data.push({
      id: row[0] || `project-${i}`,
      name: row[1] || '',
      category: row[2] || 'Other',
      description: row[3] || '',
      url: row[4] || '',
      twitter: row[5] || '',
      github: row[6] || '',
      discord: row[7] || '',
      telegram: row[8] || '',
      tags: row[9] ? row[9].split(',').map(tag => tag.trim()) : [],
      added: row[10] || new Date().toISOString().split('T')[0],
      lastUpdated: row[11] || new Date().toISOString().split('T')[0]
    });
  }

  return data;
};

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Check cache
    if (cachedData && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
      console.log('Serving from cache');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(cachedData)
      };
    }

    // Initialize Google Sheets
    console.log('Initializing Google Sheets API...');
    const sheets = initGoogleSheets();
    
    // Fetch data
    console.log('Fetching data from sheet:', process.env.GOOGLE_SHEET_ID);
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Sheet1!A:L',
    });

    console.log('Data fetched successfully');
    const rows = response.data.values;
    const projects = parseSheetData(rows);

    // Handle search query
    const { q, category, tags } = event.queryStringParameters || {};
    let filteredProjects = projects;

    if (q) {
      const searchTerm = q.toLowerCase();
      filteredProjects = filteredProjects.filter(project => 
        project.name.toLowerCase().includes(searchTerm) ||
        project.description.toLowerCase().includes(searchTerm) ||
        project.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    if (category) {
      filteredProjects = filteredProjects.filter(project => 
        project.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim().toLowerCase());
      filteredProjects = filteredProjects.filter(project =>
        tagArray.some(tag => project.tags.map(t => t.toLowerCase()).includes(tag))
      );
    }

    // Update cache
    const responseData = {
      projects: filteredProjects,
      lastUpdate: new Date().toISOString(),
      version: '1.0',
      totalProjects: filteredProjects.length,
      categories: [...new Set(projects.map(p => p.category))].sort()
    };

    if (!q && !category && !tags) {
      cachedData = responseData;
      cacheTimestamp = Date.now();
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(responseData)
    };

  } catch (error) {
    console.error('Detailed error:', error);
    console.error('Error stack:', error.stack);
    
    // Return more detailed error in development
    const errorResponse = {
      error: 'Failed to fetch projects',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        env: {
          hasProjectId: !!process.env.GOOGLE_PROJECT_ID,
          hasEmail: !!process.env.SERVICE_ACCOUNT_EMAIL,
          hasKey: !!process.env.SERVICE_ACCOUNT_KEY,
          hasSheetId: !!process.env.GOOGLE_SHEET_ID
        }
      } : undefined
    };
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify(errorResponse)
    };
  }
};
