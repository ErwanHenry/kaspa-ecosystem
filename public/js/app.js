// État global
let projects = [];
let filteredProjects = [];
let categories = [];

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    loadProjects();
    setupEventListeners();
});

// Configuration des event listeners
function setupEventListeners() {
    document.getElementById('searchInput').addEventListener('input', filterProjects);
    document.getElementById('categoryFilter').addEventListener('change', filterProjects);
}

// Charger les projets depuis Supabase
async function loadProjects() {
    try {
        const { data, error } = await supabaseClient
            .from('projects')
            .select('*')
            .order('rating_avg', { ascending: false });

        if (error) throw error;

        projects = data || [];
        
        // Extraire les catégories
        categories = [...new Set(projects.map(p => p.category))].sort();
        updateCategoryFilter();
        
        filterProjects();
    } catch (error) {
        console.error('Error loading projects:', error);
        showError('Failed to load projects');
    }
}

// Mettre à jour le filtre de catégories
function updateCategoryFilter() {
    const select = document.getElementById('categoryFilter');
    select.innerHTML = '<option value="all">All Categories</option>';
    
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        select.appendChild(option);
    });
}

// Filtrer les projets
function filterProjects() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const selectedCategory = document.getElementById('categoryFilter').value;
    
    filteredProjects = projects.filter(project => {
        const matchesSearch = !searchTerm || 
            project.name.toLowerCase().includes(searchTerm) ||
            (project.description && project.description.toLowerCase().includes(searchTerm)) ||
            (project.tags && project.tags.some(tag => tag.toLowerCase().includes(searchTerm)));
            
        const matchesCategory = selectedCategory === 'all' || project.category === selectedCategory;
        
        return matchesSearch && matchesCategory;
    });
    
    renderProjects();
}

// Afficher les projets
function renderProjects() {
    const grid = document.getElementById('projectsGrid');
    const count = document.getElementById('projectCount');
    
    count.textContent = `Found ${filteredProjects.length} projects`;
    
    if (filteredProjects.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center py-12 text-gray-400">No projects found</div>';
        return;
    }
    
    grid.innerHTML = filteredProjects.map(project => `
        <div onclick="showProjectDetails('${project.id}')" 
             class="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-purple-500 transition-all cursor-pointer group">
            <div class="flex justify-between items-start mb-3">
                <h3 class="text-xl font-semibold text-purple-400 group-hover:text-purple-300">
                    ${escapeHtml(project.name)}
                </h3>
                ${project.verified ? '<span class="bg-green-900 text-green-400 text-xs px-2 py-1 rounded">Verified</span>' : ''}
            </div>
            
            <p class="text-gray-400 text-sm mb-4 line-clamp-2">
                ${escapeHtml(project.description || 'No description available')}
            </p>

            <div class="flex items-center gap-4 mb-4">
                <div class="flex items-center gap-1">
                    <i class="fas fa-star text-yellow-500"></i>
                    <span class="text-sm">${project.rating_avg?.toFixed(1) || '0.0'}</span>
                    <span class="text-xs text-gray-500">(${project.rating_count || 0})</span>
                </div>
                <span class="text-xs bg-gray-700 px-2 py-1 rounded">
                    ${escapeHtml(project.category)}
                </span>
            </div>

            <div class="flex gap-3">
                ${project.url ? `<a href="${project.url}" target="_blank" rel="noopener noreferrer" 
                     onclick="event.stopPropagation()"
                     class="text-gray-400 hover:text-purple-400">
                    <i class="fas fa-external-link-alt"></i>
                </a>` : ''}
                ${project.github ? `<a href="https://github.com/${project.github}" target="_blank" rel="noopener noreferrer"
                     onclick="event.stopPropagation()"
                     class="text-gray-400 hover:text-purple-400">
                    <i class="fab fa-github"></i>
                </a>` : ''}
                ${project.twitter ? `<a href="https://twitter.com/${project.twitter}" target="_blank" rel="noopener noreferrer"
                     onclick="event.stopPropagation()"
                     class="text-gray-400 hover:text-purple-400">
                    <i class="fab fa-twitter"></i>
                </a>` : ''}
            </div>

            ${project.tags && project.tags.length > 0 ? `
                <div class="flex flex-wrap gap-1 mt-4">
                    ${project.tags.slice(0, 3).map(tag => `
                        <span class="text-xs bg-gray-700 text-gray-400 px-2 py-1 rounded">
                            ${escapeHtml(tag)}
                        </span>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Afficher le formulaire de soumission
function showSubmitForm() {
    const modal = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div class="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div class="p-6">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-2xl font-bold text-purple-400">Submit New Project</h2>
                        <button onclick="closeModal()" class="text-gray-400 hover:text-white">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">Project Name *</label>
                            <input type="text" id="submitName" required
                                   class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-purple-500">
                        </div>

                        <div>
                            <label class="block text-sm font-medium mb-2">Category *</label>
                            <select id="submitCategory" required
                                    class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-purple-500">
                                <option value="Core">Core</option>
                                <option value="Wallet">Wallet</option>
                                <option value="DeFi">DeFi</option>
                                <option value="Infrastructure">Infrastructure</option>
                                <option value="Gaming">Gaming</option>
                                <option value="NFT">NFT</option>
                                <option value="Mining">Mining</option>
                                <option value="Tools">Tools</option>
                                <option value="Education">Education</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-sm font-medium mb-2">Description</label>
                            <textarea id="submitDescription" rows="3"
                                      class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-purple-500"></textarea>
                        </div>

                        <div>
                            <label class="block text-sm font-medium mb-2">Website URL</label>
                            <input type="url" id="submitUrl"
                                   class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-purple-500">
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium mb-2">Twitter</label>
                                <input type="text" id="submitTwitter" placeholder="@username"
                                       class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-purple-500">
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-2">GitHub</label>
                                <input type="text" id="submitGithub" placeholder="username/repo"
                                       class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-purple-500">
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium mb-2">Tags (comma separated)</label>
                            <input type="text" id="submitTags" placeholder="defi, wallet, mobile"
                                   class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-purple-500">
                        </div>

                        <div>
                            <label class="block text-sm font-medium mb-2">Your Email (for updates)</label>
                            <input type="email" id="submitEmail"
                                   class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-purple-500">
                        </div>

                        <div class="flex gap-3 pt-4">
                            <button onclick="submitProject()" 
                                    class="flex-1 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors">
                                Submit Project
                            </button>
                            <button onclick="closeModal()"
                                    class="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modals').innerHTML = modal;
}

// Soumettre un projet
async function submitProject() {
    const formData = {
        name: document.getElementById('submitName').value,
        category: document.getElementById('submitCategory').value,
        description: document.getElementById('submitDescription').value,
        url: document.getElementById('submitUrl').value,
        twitter: document.getElementById('submitTwitter').value.replace('@', ''),
        github: document.getElementById('submitGithub').value,
        tags: document.getElementById('submitTags').value.split(',').map(t => t.trim()).filter(t => t),
        submitted_by: document.getElementById('submitEmail').value
    };
    
    if (!formData.name) {
        alert('Please provide a project name');
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from('submissions')
            .insert({
                project_data: formData,
                submitted_by: formData.submitted_by,
                submission_type: 'manual'
            });

        if (error) throw error;

        alert('Project submitted successfully! It will be reviewed soon.');
        closeModal();
        loadProjects();
    } catch (error) {
        console.error('Error submitting project:', error);
        alert('Error submitting project. Please try again.');
    }
}

// Afficher les détails d'un projet
async function showProjectDetails(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    // Charger les commentaires
    const { data: comments } = await supabaseClient
        .from('comments')
        .select('*')
        .eq('project_id', projectId)
        .eq('approved', true)
        .order('created_at', { ascending: false });
    
    const modal = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div class="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div class="p-6">
                    <div class="flex justify-between items-start mb-6">
                        <div>
                            <h2 class="text-3xl font-bold text-purple-400 mb-2">${escapeHtml(project.name)}</h2>
                            <div class="flex items-center gap-4">
                                <span class="bg-gray-700 px-3 py-1 rounded text-sm">${escapeHtml(project.category)}</span>
                                ${project.verified ? '<span class="bg-green-900 text-green-400 text-xs px-2 py-1 rounded">Verified</span>' : ''}
                            </div>
                        </div>
                        <button onclick="closeModal()" class="text-gray-400 hover:text-white">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>

                    <p class="text-gray-300 mb-6">${escapeHtml(project.description || 'No description available')}</p>

                    <!-- Links -->
                    <div class="flex flex-wrap gap-4 mb-8">
                        ${project.url ? `<a href="${project.url}" target="_blank" rel="noopener noreferrer" 
                             class="flex items-center gap-2 text-purple-400 hover:text-purple-300">
                            <i class="fas fa-external-link-alt"></i> Website
                        </a>` : ''}
                        ${project.github ? `<a href="https://github.com/${project.github}" target="_blank" rel="noopener noreferrer"
                             class="flex items-center gap-2 text-purple-400 hover:text-purple-300">
                            <i class="fab fa-github"></i> GitHub
                        </a>` : ''}
                        ${project.twitter ? `<a href="https://twitter.com/${project.twitter}" target="_blank" rel="noopener noreferrer"
                             class="flex items-center gap-2 text-purple-400 hover:text-purple-300">
                            <i class="fab fa-twitter"></i> Twitter
                        </a>` : ''}
                    </div>

                    <!-- Rating Section -->
                    <div class="bg-gray-900 rounded-lg p-6 mb-6">
                        <h3 class="text-xl font-semibold mb-4">Rate this project</h3>
                        <div class="flex items-center gap-4 mb-4">
                            <div class="flex gap-1" id="ratingStars">
                                ${[1, 2, 3, 4, 5].map(star => `
                                    <button onclick="setRating(${star})" class="p-1 text-gray-600 hover:text-yellow-500 rating-star" data-rating="${star}">
                                        <i class="fas fa-star text-2xl"></i>
                                    </button>
                                `).join('')}
                            </div>
                            <div class="flex-1">
                                <input type="email" id="ratingEmail" placeholder="Your email (required)"
                                       class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500">
                            </div>
                            <button onclick="submitRating('${projectId}')"
                                    class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors">
                                Submit Rating
                            </button>
                        </div>
                        <div class="text-sm text-gray-400">
                            Current rating: ${project.rating_avg?.toFixed(1) || '0.0'} (${project.rating_count || 0} votes)
                        </div>
                    </div>

                    <!-- Comments Section -->
                    <div>
                        <h3 class="text-xl font-semibold mb-4">Comments</h3>
                        
                        <!-- Add Comment -->
                        <div class="bg-gray-900 rounded-lg p-4 mb-6">
                            <div class="grid grid-cols-2 gap-4 mb-4">
                                <input type="text" id="commentName" placeholder="Your name"
                                       class="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500">
                                <input type="email" id="commentEmail" placeholder="Your email (optional)"
                                       class="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500">
                            </div>
                            <textarea id="commentText" placeholder="Write your comment..." rows="3"
                                      class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 mb-4"></textarea>
                            <button onclick="submitComment('${projectId}')"
                                    class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                                <i class="fas fa-paper-plane"></i> Submit Comment
                            </button>
                        </div>

                        <!-- Comments List -->
                        <div class="space-y-4">
                            ${comments && comments.length > 0 ? comments.map(comment => `
                                <div class="bg-gray-900 rounded-lg p-4">
                                    <div class="flex justify-between items-start mb-2">
                                        <span class="font-semibold text-purple-400">${escapeHtml(comment.user_name)}</span>
                                        <span class="text-xs text-gray-500">
                                            ${new Date(comment.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p class="text-gray-300">${escapeHtml(comment.comment)}</p>
                                </div>
                            `).join('') : '<p class="text-gray-400 text-center py-4">No comments yet. Be the first!</p>'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modals').innerHTML = modal;
}

// Définir la notation
let currentRating = 0;
function setRating(rating) {
    currentRating = rating;
    document.querySelectorAll('.rating-star').forEach(star => {
        const starRating = parseInt(star.dataset.rating);
        if (starRating <= rating) {
            star.classList.add('text-yellow-500');
            star.classList.remove('text-gray-600');
        } else {
            star.classList.remove('text-yellow-500');
            star.classList.add('text-gray-600');
        }
    });
}

// Soumettre une notation
async function submitRating(projectId) {
    const email = document.getElementById('ratingEmail').value;
    
    if (!email || currentRating === 0) {
        alert('Please provide your email and select a rating');
        return;
    }
    
    try {
        const { error } = await supabaseClient            .from('ratings')
            .upsert({
                project_id: projectId,
                user_email: email,
                rating: currentRating
            });

        if (error) throw error;

        alert('Rating submitted successfully!');
        closeModal();
        loadProjects(); // Recharger pour mettre à jour la moyenne
    } catch (error) {
        console.error('Error submitting rating:', error);
        alert('Error submitting rating. You may have already rated this project.');
    }
}

// Soumettre un commentaire
async function submitComment(projectId) {
    const name = document.getElementById('commentName').value;
    const email = document.getElementById('commentEmail').value;
    const comment = document.getElementById('commentText').value;
    
    if (!name || !comment || comment.length < 10) {
        alert('Please provide your name and a comment (minimum 10 characters)');
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from('comments')
            .insert({
                project_id: projectId,
                user_name: name,
                user_email: email,
                comment: comment
            });

        if (error) throw error;

        alert('Comment submitted! It will appear after moderation.');
        document.getElementById('commentName').value = '';
        document.getElementById('commentEmail').value = '';
        document.getElementById('commentText').value = '';
    } catch (error) {
        console.error('Error submitting comment:', error);
        alert('Error submitting comment.');
    }
}

// Fermer la modal
function closeModal() {
    document.getElementById('modals').innerHTML = '';
    currentRating = 0;
}

// Fonction utilitaire pour échapper le HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text ? text.toString().replace(/[&<>"']/g, m => map[m]) : '';
}

// Afficher les erreurs
function showError(message) {
    console.error(message);
    document.getElementById('projectsGrid').innerHTML = `
        <div class="col-span-full text-center py-12 text-red-400">
            <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
            <p>${message}</p>
        </div>
    `;
}
