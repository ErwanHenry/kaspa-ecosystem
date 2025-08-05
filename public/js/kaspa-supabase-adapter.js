// Adapter pour connecter le nouveau frontend avec Supabase
class KaspaSupabaseAdapter {
    constructor() {
        this.db = null;
        this.initSupabase();
    }

    initSupabase() {
        // Utilise le client Supabase déjà configuré
        this.db = supabaseClient;
    }

    // Remplace IndexedDB par Supabase
    async init() {
        // Vérifier l'authentification
        const { data: { session } } = await this.db.auth.getSession();
        return session;
    }

    async addProject(project) {
        const { data, error } = await this.db
            .from('projects')
            .insert({
                title: project.name,
                description: project.description,
                category_id: await this.getCategoryId(project.category),
                website: project.url,
                logo_url: project.logo,
                twitter: project.twitter,
                github: project.github,
                discord: project.discord,
                active: true,
                featured: project.featured || false
            })
            .select();
        
        if (error) throw error;
        return data[0];
    }

    async getProjects() {
        const { data, error } = await this.db
            .from('projects')
            .select(`
                *,
                categories(name, slug),
                project_stats(average_rating, rating_count, comment_count)
            `)
            .eq('active', true)
            .order('featured', { ascending: false })
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Transformer pour correspondre au format attendu
        return data.map(p => ({
            id: p.id,
            name: p.title,
            category: p.categories?.slug || 'other',
            description: p.description,
            url: p.website,
            logo: p.logo_url,
            twitter: p.twitter,
            github: p.github,
            discord: p.discord,
            featured: p.featured,
            verified: p.verified || false,
            avgRating: p.project_stats?.average_rating || 0,
            ratingCount: p.project_stats?.rating_count || 0
        }));
    }

    async addRating(rating) {
        const { data: user } = await this.db.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await this.db
            .from('project_ratings')
            .upsert({
                project_id: rating.projectId,
                user_id: user.user.id,
                rating: rating.rating
            });
        
        if (error) throw error;

        // Ajouter un commentaire si fourni
        if (rating.comment) {
            await this.db
                .from('project_comments')
                .insert({
                    project_id: rating.projectId,
                    user_id: user.user.id,
                    content: rating.comment,
                    metadata: { scamWarning: rating.scamWarning }
                });
        }

        return data;
    }

    async getRatings(projectId) {
        const { data, error } = await this.db
            .from('project_ratings')
            .select(`
                *,
                profiles(username, avatar_url)
            `)
            .eq('project_id', projectId);
        
        if (error) throw error;
        
        return data.map(r => ({
            id: r.id,
            projectId: r.project_id,
            walletAddress: r.profiles?.username || 'Anonymous',
            rating: r.rating,
            timestamp: r.created_at
        }));
    }

    async getCategoryId(slug) {
        const { data, error } = await this.db
            .from('categories')
            .select('id')
            .eq('slug', slug)
            .single();
        
        if (error) {
            // Créer la catégorie si elle n'existe pas
            const { data: newCat } = await this.db
                .from('categories')
                .insert({ 
                    name: this.formatCategory(slug), 
                    slug: slug 
                })
                .select()
                .single();
            return newCat.id;
        }
        
        return data.id;
    }

    formatCategory(slug) {
        const categories = {
            defi: 'DeFi',
            wallet: 'Wallet',
            exchange: 'Exchange',
            nft: 'NFT',
            mining: 'Mining',
            tool: 'Tool',
            game: 'Gaming',
            other: 'Other'
        };
        return categories[slug] || slug;
    }

    // Auth avec wallet
    async connectWallet(address) {
        // Créer ou connecter un utilisateur basé sur l'adresse wallet
        const { data, error } = await this.db.auth.signInWithOAuth({
            provider: 'google', // Ou utiliser un custom provider
            options: {
                redirectTo: window.location.origin,
                scopes: 'email',
                queryParams: {
                    wallet_address: address
                }
            }
        });
        
        return data;
    }
}

// Remplacer l'instance KaspaEcosystemDB
window.KaspaSupabaseAdapter = KaspaSupabaseAdapter;
