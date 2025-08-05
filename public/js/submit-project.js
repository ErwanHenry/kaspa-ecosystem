// Submit Project Functions

// Show submit modal
function showSubmitModal() {
    // Check wallet connection first
    if (!app?.walletManager?.isConnected()) {
        app.showToast('Please connect your wallet first to submit a project', 'warning');
        return;
    }
    
    // Enable the submit button
    const submitBtn = document.querySelector('.submit-project-btn');
    if (submitBtn) {
        submitBtn.disabled = false;
    }
    
    // Show the modal
    const modal = document.getElementById('submit-modal');
    if (modal) {
        modal.classList.add('show');
        // Focus on first input
        setTimeout(() => {
            modal.querySelector('input[name="title"]')?.focus();
        }, 100);
    }
}

// Close modal
function closeModal() {
    const modal = document.getElementById('submit-modal');
    if (modal) {
        modal.classList.remove('show');
        // Reset form
        document.getElementById('submit-project-form')?.reset();
    }
}

// Submit project
async function submitProject(event) {
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
        
        // Get category ID from categories table
        const categorySlug = formData.get('category');
        const { data: category } = await supabaseClient
            .from('categories')
            .select('id')
            .eq('slug', categorySlug)
            .single();
        
        if (!category) {
            throw new Error('Invalid category selected');
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
            submitter_wallet: app.walletManager.getAddress(),
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
        
    } catch (error) {
        console.error('Error submitting project:', error);
        app.showToast(error.message || 'Failed to submit project', 'error');
        
        // Reset button
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
}

// Show success message
function showSubmitSuccess(project) {
    const modalBody = document.querySelector('#submit-modal .modal-body');
    if (!modalBody) return;
    
    modalBody.innerHTML = `
        <div class="submit-success">
            <div class="icon">✅</div>
            <h3>Project Submitted Successfully!</h3>
            <p>Your project "${project.title}" has been submitted and is now live.</p>
            <button class="btn btn-primary" onclick="viewProject('${project.id}')">View Project</button>
            <button class="btn btn-secondary" onclick="closeModal()">Close</button>
        </div>
    `;
}

// View submitted project
function viewProject(projectId) {
    closeModal();
    if (app.showProjectDetails) {
        app.showProjectDetails(projectId);
    }
}

// Enable submit button when wallet is connected
function updateSubmitButton() {
    const submitBtn = document.querySelector('.submit-project-btn');
    if (submitBtn && app?.walletManager?.isConnected()) {
        submitBtn.disabled = false;
        submitBtn.title = 'Submit a new project';
    }
}

// Check wallet connection on load
if (window.app) {
    // Listen for wallet connection changes
    const originalHandleAuthChange = app.handleAuthChange;
    app.handleAuthChange = function(event, session) {
        if (originalHandleAuthChange) {
            originalHandleAuthChange.call(this, event, session);
        }
        updateSubmitButton();
    };
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    updateSubmitButton();
});
