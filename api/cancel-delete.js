// API: Annuler la demande de suppression de compte

const SUPABASE_URL = 'https://jkianwwvbseovjyzocdt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpraWFud3d2YnNlb3ZqeXpvY2R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NTE0MzQsImV4cCI6MjA5MzAyNzQzNH0.oWeAP61hMJjE7aZ17NOW7Txl1T9dQOmiSljLZv8CYmE';

export default async function handler(req, res) {
    console.log('API: cancel-delete called');
    
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
        
        // 2. Mettre à jour le statut à 'cancelled'
        const updateResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/deletion_requests?id=eq.${requestData.id}`,
            {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                },
                body: JSON.stringify({ 
                    status: 'cancelled',
                    cancelled_at: new Date().toISOString()
                })
            }
        );

        console.log('Demande annulée pour user_id:', requestData.user_id);

        // Rediriger vers le dashboard avec message
        return res.redirect('/dashboard.html?message=suppression_annulee');

    } catch (error) {
        console.error('Error in cancel-delete:', error);
        return res.redirect('/dashboard.html?error=erreur_serveur');
    }
}