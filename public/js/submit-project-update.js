// Updated category mapping for submit form
const CATEGORY_MAPPING = {
    'wallet': 'wallets',      // Form value -> DB slug
    'exchange': 'other',      // No exchange category, use other
    'mining': 'mining',
    'defi': 'defi',
    'nft': 'nfts',
    'tool': 'tools',
    'community': 'education', // Community projects under education
    'other': 'other'
};

// Override the original submitProject function to handle category mapping
const originalSubmitProject = window.submitProject;
window.submitProject = async function(event) {
    event.preventDefault();
    
    // Check wallet again
    if (!app?.walletManager?.isConnected()) {
        app.showToast('Wallet disconnected. Please reconnect.', 'error');
        return;
    }
    
    const form = event.target;
    const submitBtn = form.querySelector('#submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    
    // Show loading state
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline-flex';
    
    try {
        // Get form data
        const formData = new FormData(form);
        
        // Map form category to DB slug
        const formCategory = formData.get('category');
        const categorySlug = CATEGORY_MAPPING[formCategory] || 'other';
        
        // Get category ID from categories table
        const { data: category } = await supabaseClient
            .from('categories')
            .select('id')
            .eq('slug', categorySlug)
            .single();
        
        if (!category) {
            throw new Error('Invalid category selected');
        }
        
        // Get user profile or create one
        const walletAddress = app.walletManager.getAddress();
        let { data: profile } = await supabaseClient
            .from('profiles')
            .select('id')
            .eq('wallet_address', walletAddress)
            .single();
        
        if (!profile) {
            // Create profile if it doesn't exist
            const { data: newProfile, error: profileError } = await supabaseClient
                .from('profiles')
                .insert({
                    wallet_address: walletAddress,
                    wallet_type: app.walletManager.walletType || 'kasware',
                    username: walletAddress.substring(0, 8) + '...',
                    role: 'user'
                })
                .select()
                .single();
            
            if (profileError) throw profileError;
            profile = newProfile;
        }
        
        // Prepare project data
        const projectData = {
            title: formData.get('title').trim(),
            description: formData.get('description').trim(),
            website: formData.get('website').trim(),
            logo_url: formData.get('logo_url')?.trim() || null,
            twitter: formData.get('twitter')?.trim() || null,
            github: formData.get('github')?.trim() || null,
            discord: formData.get('discord')?.trim() || null,
            telegram: formData.get('telegram')?.trim() || null,
            category_id: category.id,
            submitter_id: profile.id,
            active: true,
            featured: false
        };
        
        // Generate slug from title
        projectData.slug = projectData.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        
        // Check if project already exists
        const { data: existing } = await supabaseClient
            .from('projects')
            .select('id')
            .eq('website', projectData.website)
            .single();
        
        if (existing) {
            throw new Error('A project with this website already exists');
        }
        
        // Submit to Supabase
        const { data: newProject, error } = await supabaseClient
            .from('projects')
            .insert([projectData])
            .select()
            .single();
        
        if (error) throw error;
        
        // Success!
        showSubmitSuccess(newProject);
        
        // Refresh projects list
        if (app.loadProjects) {
            await app.loadProjects();
        }
        
        // Log activity
        await supabaseClient
            .from('activity_logs')
            .insert({
                action: 'project_submitted',
                metadata: {
                    project_id: newProject.id,
                    project_title: newProject.title,
                    category: categorySlug,
                    submitter: walletAddress
                }
            });
        
    } catch (error) {
        console.error('Error submitting project:', error);
        app.showToast(error.message || 'Failed to submit project', 'error');
        
        // Reset button
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
};
