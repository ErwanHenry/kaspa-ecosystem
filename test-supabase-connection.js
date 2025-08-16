// 🧪 Supabase Connection Test
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testConnection() {
    console.log('🧪 Testing Supabase connection...');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
        console.log('❌ Missing environment variables');
        console.log('Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env file');
        console.log('Copy .env.example to .env and fill in your Supabase credentials');
        return;
    }
    
    try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Test basic connection
        console.log('🔍 Testing database connection...');
        const { data, error } = await supabase
            .from('projects')
            .select('count', { count: 'exact', head: true });
            
        if (error) {
            console.log('❌ Connection failed:', error.message);
            console.log('💡 Make sure you have run the SQL setup scripts in Supabase');
        } else {
            console.log('✅ Connection successful!');
            console.log(`📊 Found ${data || 0} projects in database`);
        }
        
        // Test categories
        console.log('🔍 Testing categories table...');
        const { data: categories, error: catError } = await supabase
            .from('categories')
            .select('name')
            .limit(5);
            
        if (!catError && categories) {
            console.log('✅ Categories table accessible');
            console.log(`📁 Sample categories: ${categories.map(c => c.name).join(', ')}`);
        } else if (catError) {
            console.log('⚠️  Categories table not found - run supabase-auto-setup.sql');
        }
        
        // Test comprehensive ratings table
        console.log('🔍 Testing rating system...');
        const { data: ratingTables, error: ratingError } = await supabase
            .from('comprehensive_ratings')
            .select('count', { count: 'exact', head: true });
            
        if (!ratingError) {
            console.log('✅ Rating system tables accessible');
        } else {
            console.log('⚠️  Rating system not set up - run supabase-auto-setup.sql');
        }
        
        console.log('');
        console.log('🎉 Connection test complete!');
        console.log('');
        console.log('📋 Next steps:');
        console.log('   1. If tables are missing, run supabase-auto-setup.sql in Supabase');
        console.log('   2. Deploy to Netlify with: chmod +x deploy-netlify.sh && ./deploy-netlify.sh');
        console.log('   3. Set environment variables in Netlify dashboard');
        
    } catch (error) {
        console.log('❌ Connection test failed:', error.message);
        console.log('💡 Check your Supabase URL and API key');
    }
}

testConnection();