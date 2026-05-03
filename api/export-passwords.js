// API Vercel pour exporter les mots de passe par email via Resend

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SUPABASE_URL = 'https://jkianwwvbseovjyzocdt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpraWFud3d2YnNlb3ZqeXpvY2R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NTE0MzQsImV4cCI6MjA5MzAyNzQzNH0.oWeAP61hMJjE7aZ17NOW7Txl1T9dQOmiSljLZv8CYmE';

export default async function handler(req, res) {
    console.log('API called, method:', req.method);
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    // Vérifier si la clé API Resend est configurée
    if (!RESEND_API_KEY) {
        console.error('RESEND_API_KEY not configured');
        return res.status(500).json({ error: 'Configuration email manquante' });
    }

    try {
        const { email, filename, content, format } = req.body;

        if (!email || !filename || !content) {
            return res.status(400).json({ error: 'Paramètres manquants' });
        }
        
        console.log('Sending email to:', email, 'format:', format);

        // Envoyer l'email avec Resend (mode test: seul email autorisé = badrbadora2009@gmail.com)
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'SecurePass Export <onboarding@resend.dev>',
                to: ['badrbadora2009@gmail.com'], // Mode test: uniquement email du compte Resend
                subject: `Export de vos mots de passe - Format ${format.toUpperCase()}`,
                html: `<!DOCTYPE html><html><body><h2>Export de vos mots de passe</h2><p>Format: ${format.toUpperCase()}</p><p>Date: ${new Date().toLocaleString()}</p></body></html>`,
                attachments: [{
                    filename: filename,
                    content: content
                }]
            })
        });

        const data = await response.json();
        console.log('Resend response:', data);

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