// Script to migrate data from Google Sheets to Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client with service key for admin access
const supabaseUrl = process.env.SUPABASE_URL || 'https://kxdngctxlxrbjhdtztuu.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
    console.error('SUPABASE_SERVICE_KEY is required for migration');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Sample data - replace with actual Google Sheets data
const categories = [
    { name: 'DeFi', slug: 'defi', icon: '💰', description: 'Decentralized Finance projects' },
    { name: 'Gaming', slug: 'gaming', icon: '🎮', description: 'Gaming and NFT projects' },
    { name: 'Infrastructure', slug: 'infrastructure', icon: '🔧', description: 'Core infrastructure and tools' },
    { name: 'Wallets', slug: 'wallets', icon: '👛', description: 'Wallet applications' },
    { name: 'Mining', slug: 'mining', icon: '⛏️', description: 'Mining pools and software' },
    { name: 'Exchanges', slug: 'exchanges', icon: '📊', description: 'Trading platforms' },
    { name: 'Analytics', slug: 'analytics', icon: '📈', description: 'Data and analytics tools' },
    { name: 'Community', slug: 'community', icon: '👥', description: 'Community projects' }
];

async function migrateCategories() {
    console.log('Migrating categories...');
    
    for (const category of categories) {
        const { data, error } = await supabase
            .from('categories')
            .upsert(category, { onConflict: 'slug' });
        
        if (error) {
            console.error('Error inserting category:', category.name, error);
        } else {
            console.log('✓ Category migrated:', category.name);
        }
    }
}

async function migrateProjects(projectsData) {
    console.log('\nMigrating projects...');
    
    // Get category mapping
    const { data: categoriesDb } = await supabase
        .from('categories')
        .select('id, slug');
    
    const categoryMap = {};
    categoriesDb.forEach(cat => {
        categoryMap[cat.slug] = cat.id;
    });
    
    for (const project of projectsData) {
        // Map category name to ID
        const categorySlug = project.category?.toLowerCase().replace(/\s+/g, '-') || 'community';
        const categoryId = categoryMap[categorySlug];
        
        const projectData = {
            title: project.title,
            description: project.description,
            category_id: categoryId,
            website: project.website,
            github: project.github,
            twitter: project.twitter,
            discord: project.discord,
            telegram: project.telegram,
            featured: project.featured || false,
            active: true,
            tags: project.tags ? project.tags.split(',').map(t => t.trim()) : []
        };
        
        const { data, error } = await supabase
            .from('projects')
            .insert(projectData);
        
        if (error) {
            console.error('Error inserting project:', project.title, error);
        } else {
            console.log('✓ Project migrated:', project.title);
        }
    }
}

async function runMigration() {
    console.log('Starting Supabase migration...');
    
    try {
        // Migrate categories first
        await migrateCategories();
        
        // Load projects data from Google Sheets or JSON file
        // For now, using sample data
        const sampleProjects = [
            {
                title: 'Kaspa Wallet',
                description: 'Official Kaspa wallet with advanced features',
                category: 'Wallets',
                website: 'https://wallet.kaspanet.io',
                github: 'https://github.com/kaspanet/kaspa-wallet',
                featured: true
            },
            {
                title: 'KaspaMiner',
                description: 'Efficient mining software for Kaspa',
                category: 'Mining',
                website: 'https://kaspaminer.com',
                github: 'https://github.com/kaspaminer/miner'
            },
            // Add more projects here or load from external source
        ];
        
        await migrateProjects(sampleProjects);
        
        console.log('\nMigration completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

// Run the migration
runMigration();
