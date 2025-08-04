// Configuration Supabase
const SUPABASE_URL = 'https://kaspa-ecosystem.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZG5nY3R4bHhyYmpoZHR6dHV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNDU3MzYsImV4cCI6MjA2OTkyMTczNn0.N_jgf3Q2R98-FqsYpz7sns9CwOnViuQBXFoA0TcmWSM';

// Initialiser le client Supabase
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
