// Configuration Supabase - Credentials loaded from environment
let SUPABASE_URL;
let SUPABASE_ANON_KEY;
let supabaseClient;

// Initialize Supabase client with environment variables
async function initializeSupabase() {
    try {
        // Fetch configuration from backend API
        const response = await fetch('/.netlify/functions/get-config');
        if (!response.ok) {
            throw new Error('Failed to load configuration');
        }
        
        const config = await response.json();
        SUPABASE_URL = config.supabaseUrl;
        SUPABASE_ANON_KEY = config.supabaseAnonKey;
        
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            throw new Error('Missing Supabase configuration');
        }
        
        const { createClient } = supabase;
        supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        return supabaseClient;
    } catch (error) {
        console.error('Failed to initialize Supabase:', error);
        throw error;
    }
}

// Get initialized Supabase client
function getSupabaseClient() {
    if (!supabaseClient) {
        throw new Error('Supabase client not initialized. Call initializeSupabase() first.');
    }
    return supabaseClient;
}
