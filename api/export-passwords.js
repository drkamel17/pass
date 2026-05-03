// API Vercel pour exporter les mots de passe par email via Resend

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SUPABASE_URL = 'https://jkianwwvbseovjyzocdt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpraWFud3d2YnNlb3ZqeXpvY2R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NTE0MzQsImV4cCI6MjA5MzAyNzQzNH0.oWeAP61hMJjE7aZ17NOW7Txl1T9dQOmiSljLZv8CYmE';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    try {
        const { email, filename, content, format } = req.body;

        if (!email || !filename || !content) {
            return res.status(400).json({ error: 'Paramètres manquants' });
        }

        // Envoyer l'email avec Resend
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'SecurePass Export <onboarding@resend.dev>',
                to: [email],
                subject: `Export de vos mots de passe - Format ${format.toUpperCase()}`,
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                    </head>
                    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #667eea;">Export de vos mots de passe</h2>
                        <p>Vous avez demandé un export de vos mots de passe au format <strong>${format.toUpperCase()}</strong>.</p>
                        
                        <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin: 20px 0;">
                            <strong>⚠️ Important :</strong> Ce fichier contient vos mots de passe en clair. 
                            Assurez-vous de le supprimer après utilisation.
                        </div>
                        
                        <p style="color: #666; font-size: 14px;">
                            Date d'export : ${new Date().toLocaleString('fr-FR', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                        
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        
                        <p style="color: #999; font-size: 12px;">
                            Cet email a été envoyé par SecurePass. Si vous n'avez pas demandé cet export, 
                            contactez immédiatement le support.
                        </p>
                    </body>
                    </html>
                `,
                attachments: [{
                    filename: filename,
                    content: content // Already base64 encoded
                }]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Resend error:', data);
            return res.status(500).json({ error: data.message || 'Erreur lors de l\'envoi de l\'email' });
        }

        // Logger l'export dans Supabase
        const userId = req.body.user_id;
        if (userId) {
            await fetch(`${SUPABASE_URL}/rest/v1/export_logs`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                },
                body: JSON.stringify({
                    user_id: userId,
                    format: format
                })
            });
        }

        return res.status(200).json({ 
            success: true, 
            message: 'Email envoyé avec succès',
            emailId: data.id 
        });

    } catch (error) {
        console.error('Export error:', error);
        return res.status(500).json({ error: 'Erreur serveur' });
    }
}