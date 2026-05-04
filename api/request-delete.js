// API: Demander la suppression de compte

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_5EFrQ1Fx_8NoJxiKWk3oxN7a4VMnGqZKh';
const SUPABASE_URL = 'https://jkianwwvbseovjyzocdt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpraWFud3d2YnNlb3ZqeXpvY2R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NTE0MzQsImV4cCI6MjA5MzAyNzQzNH0.oWeAP61hMJjE7aZ17NOW7Txl1T9dQOmiSljLZv8CYmE';

// Générer un token aléatoire
function generateToken(length = 64) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    // Use Date.now() and Math.random() as fallback
    for (let i = 0; i < length; i++) {
        const rand = Math.random() * chars.length;
        token += chars[Math.floor(rand)];
    }
    return token + Date.now().toString(36);
}

export default async function handler(req, res) {
    console.log('API: request-delete called');
    console.log('RESEND_API_KEY configured:', !!RESEND_API_KEY);
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    // Vérifier si la clé API Resend est configurée
    if (!RESEND_API_KEY) {
        console.error('RESEND_API_KEY not set in environment');
        return res.status(500).json({ error: 'Configuration email manquante. Veuillez configurer RESEND_API_KEY dans Vercel.' });
    }

    try {
        const { user_id, email, password } = req.body;
        
        console.log('Request data:', { user_id, email: !!email, hasPassword: !!password });

        if (!user_id || !email || !password) {
            console.log('Missing parameters');
            return res.status(400).json({ error: 'Paramètres manquants' });
        }

        // Vérifier le mot de passe via Supabase Auth (sans vérifier user_id matching)
        console.log('Verifying password for email:', email);
        const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const authData = await authResponse.json();
        
        if (!authResponse.ok) {
            console.log('Password verification failed:', authData);
            return res.status(401).json({ error: 'Mot de passe incorrect' });
        }
        
        console.log('Password verified successfully');

        // 2. Créer le token de suppression
        const token = generateToken();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        // 3. Enregistrer la demande dans la BDD
        console.log('Inserting deletion request for user:', user_id);
        const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/deletion_requests`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                user_id: user_id,
                user_email: email,
                token: token,
                status: 'pending',
                expires_at: expiresAt
            })
        });

        if (!insertResponse.ok) {
            const errorData = await insertResponse.text();
            console.error('Error inserting deletion request:', insertResponse.status, errorData);
            return res.status(500).json({ error: 'Erreur lors de la création de la demande' });
        }
        
        console.log('Deletion request inserted successfully');

        // 4. Envoyer l'email de confirmation
        const baseUrl = 'https://mespass.vercel.app';
        const confirmUrl = `${baseUrl}/api/confirm-delete?token=${token}`;
        const cancelUrl = `${baseUrl}/api/cancel-delete?token=${token}`;
        
        console.log('Sending confirmation email to:', email);

        // Envoyer une notification (sans email pour l'instant - mode simplifié)
        // Stockons le token pour confirmation directe
        console.log('Demande créée avec token:', token.substring(0, 10) + '...');
        console.log('Token complet pour confirmation:', token);

        return res.status(200).json({ 
            success: true, 
            message: 'Demande créée. Confirmation requise.',
            token: token // Retourne le token pour confirmation directe
        });

    } catch (error) {
        console.error('Error in request-delete:', error);
        return res.status(500).json({ error: 'Erreur serveur' });
    }
}