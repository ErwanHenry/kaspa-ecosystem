// Configuration Supabase pour Kaspa Ecosystem
// IMPORTANT: Utilisez uniquement la clé 'anon' ici (jamais la service_role)

// Remplacez ces valeurs par les vôtres depuis Supabase > Settings > API
const SUPABASE_URL = 'https://xyzxyzxyz.supabase.co'; // Votre Project URL
const SUPABASE_ANON_KEY = 'eyJhbGc...'; // Votre clé 'anon (public)'

// Initialiser le client Supabase
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('Supabase client initialized');
