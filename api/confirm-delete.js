// API: Confirmer la suppression de compte

const SUPABASE_URL = 'https://jkianwwvbseovjyzocdt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpraWFud3d2YnNlb3ZqeXpvY2R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NTE0MzQsImV4cCI6MjA5MzAyNzQzNH0.oWeAP61hMJjE7aZ17NOW7Txl1T9dQOmiSljLZv8CYmE';
// Service role key from environment variable
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req, res) {
    console.log('API: confirm-delete called');
    console.log('Service key configured:', !!SUPABASE_SERVICE_KEY);
        
        if (!SUPABASE_SERVICE_KEY) {
            console.error('ERREUR: SUPABASE_SERVICE_KEY non défini dans les variables environment');
        }
    
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    try {
        // Récupérer le token depuis l'URL
        const url = new URL(req.url, 'https://mespass.vercel.app');
        const token = url.searchParams.get('token');

        if (!token) {
            return res.redirect('/dashboard.html?error=token_manquant');
        }

        // 1. Vérifier le token dans la BDD
        const checkResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/deletion_requests?token=eq.${token}&status=eq.pending`,
            {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            }
        );

        const requests = await checkResponse.json();
        
        if (!requests || requests.length === 0) {
            return res.redirect('/dashboard.html?error=token_invalide');
        }

        const requestData = requests[0];
        
        // Vérifier si le token a expiré
        if (new Date(requestData.expires_at) < new Date()) {
            // Marquer comme expiré
            await fetch(
                `${SUPABASE_URL}/rest/v1/deletion_requests?id=eq.${requestData.id}`,
                {
                    method: 'PATCH',
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${SUPABASE_KEY}`
                    },
                    body: JSON.stringify({ status: 'expired' })
                }
            );
            return res.redirect('/dashboard.html?error=token_expire');
        }

        const userId = requestData.user_id;
        console.log('Confirmation pour user_id:', userId);

        // 2. Supprimer tous les mots de passe de l'utilisateur
        const deletePasswordsResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/passwords?user_id=eq.${userId}`,
            {
                method: 'DELETE',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            }
        );

console.log('Mots de passe supprimés:', deletePasswordsResponse.ok);

        if (!deletePasswordsResponse.ok) {
            console.error('Failed to delete passwords:', await deletePasswordsResponse.text());
            return res.redirect('/dashboard.html?error=echec_suppression_mots_passe');
        }

        // 3. Supprimer les demandes de suppression
        await fetch(
            `${SUPABASE_URL}/rest/v1/deletion_requests?user_id=eq.${userId}`,
            {
                method: 'DELETE',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            }
        );

        // 4. Supprimer l'utilisateur via l'API Admin
        console.log('Tentative de suppression du compte utilisateur:', userId);
        
        let userDeleted = false;
        
        // Essayer avec le service role key seulement si disponible
        if (SUPABASE_SERVICE_KEY) {
            const deleteUserResponse = await fetch(
                `${SUPABASE_URL}/auth/v1/admin/users/${userId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'apikey': SUPABASE_SERVICE_KEY,
                        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log('Résultat suppression utilisateur:', deleteUserResponse.status);
            userDeleted = deleteUserResponse.ok;
        } else {
            console.log('SUPABASE_SERVICE_KEY non configuré - suppression du compte utilisateur ignorée');
        }

        // Rediriger vers la page de connexion
        if (userDeleted) {
            console.log('Suppression complète réussie');
            return res.redirect('/index.html?message=compte_supprime');
        } else {
            console.log('Suppression mots de passe réussie, compte utilisateur non supprimé (clé service manquante ou invalide)');
            return res.redirect('/index.html?message=mots_de_passe_supprimes');
        }

    } catch (error) {
        console.error('Error in confirm-delete:', error);
        return res.redirect('/dashboard.html?error=erreur_serveur');
    }
}