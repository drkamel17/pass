// API: Demander la suppression de compte

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_5EFrQ1Fx_8NoJxiKWk3oxN7a4VMnGqZKh';
const SUPABASE_URL = 'https://jkianwwvbseovjyzocdt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpraWFud3d2YnNlb3ZqeXpvY2R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NTE0MzQsImV4cCI6MjA5MzAyNzQzNH0.oWeAP61hMJjE7aZ17NOW7Txl1T9dQOmiSljLZv8CYmE';

// Générer un token aléatoire
function generateToken(length = 64) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
        token += chars[array[i] % chars.length];
    }
    return token;
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

        const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'SecurePass <onboarding@resend.dev>',
                to: [req.body.email],
                subject: 'Demande de suppression de compte SecurePass',
                html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0; }
                        .btn { display: inline-block; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 10px 5px; font-weight: bold; }
                        .btn-confirm { background: #dc3545; color: white; }
                        .btn-cancel { background: #28a745; color: white; }
                        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Demande de suppression de compte</h1>
                        </div>
                        <div class="content">
                            <p>Une demande de suppression de votre compte SecurePass a été effectuée.</p>
                            
                            <div class="warning">
                                <strong>⚠️ Attention :</strong> Cette action est irréversible. 
                                Tous vos mots de passe seront définitivement supprimés.
                            </div>
                            
                            <p>Cette demande expirera dans <strong>24 heures</strong> si vous ne faites rien.</p>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${confirmUrl}" class="btn btn-confirm">Confirmer la suppression</a>
                                <a href="${cancelUrl}" class="btn btn-cancel">Annuler / Refuser</a>
                            </div>
                            
                            <p style="font-size: 14px; color: #666;">
                                Si vous n'avez pas fait cette demande, ignorez cet email. 
                                Votre compte sera automatiquement préservé.
                            </p>
                        </div>
                        <div class="footer">
                            <p>SecurePass - Gestionnaire de mots de passe</p>
                        </div>
                    </div>
                </body>
                </html>
                `
            })
        });

        const emailData = await emailResponse.json();
        
        if (!emailResponse.ok) {
            console.error('Resend error:', emailData);
            return res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email de confirmation' });
        }

        console.log('Email de confirmation envoyé, token:', token.substring(0, 10) + '...');

        return res.status(200).json({ 
            success: true, 
            message: 'Demande de suppression créée. Consultez votre email pour confirmer.' 
        });

    } catch (error) {
        console.error('Error in request-delete:', error);
        return res.status(500).json({ error: 'Erreur serveur' });
    }
}