// Supabase Configuration
const SUPABASE_URL = 'https://jkianwwvbseovjyzocdt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpraWFud3d2YnNlb3ZqeXpvY2R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NTE0MzQsImV4cCI6MjA5MzAyNzQzNH0.oWeAP61hMJjE7aZ17NOW7Txl1T9dQOmiSljLZv8CYmE';

// Helper function to make requests
async function supabaseFetch(endpoint, options = {}) {
    const url = `${SUPABASE_URL}/rest/v1/${endpoint.replace(/^\//, '')}`;
    
    const headers = {
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': options.prefer || 'return=minimal',
        ...options.headers
    };
    
    // Add authorization if we have a session token
    const sessionToken = localStorage.getItem('access_token');
    if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
    }
    
    try {
        const response = await fetch(url, {
            method: options.method || 'GET',
            headers: headers,
            body: options.body ? JSON.stringify(options.body) : undefined
        });
        
        const data = await response.text();
        
        if (!response.ok) {
            try {
                const error = JSON.parse(data);
                throw new Error(error.message || `Request failed (${response.status})`);
            } catch (e) {
                if (e instanceof SyntaxError) {
                    throw new Error(`Request failed (${response.status})`);
                }
                throw e;
            }
        }
        
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Supabase fetch error:', error);
        throw error;
    }
}

// Auth functions
const auth = {
    async signIn(email, password) {
        const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.msg || 'Erreur de connexion');
        }
        
        // Store tokens
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        localStorage.setItem('user_id', data.user.id);
        localStorage.setItem('email', email);
        
        console.log('Login successful, user_id:', data.user.id);
        
        // Also fetch full user info to confirm
        const userInfo = await auth.getUser();
        console.log('Full user info:', userInfo);
        
        return data;
    },
    
    async signUp(email, password) {
        const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.msg || 'Erreur lors de l\'inscription');
        }
        
        return data;
    },
    
    async recoverPassword(email) {
        // Get the base URL for redirect
        const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '');
        
        const response = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                email,
                redirect_to: baseUrl + '/reset-password.html'
            })
        });
        
        console.log('Password reset requested for:', email);
        console.log('Redirect URL will be:', baseUrl + '/reset-password.html');
        
        // Supabase returns success even if email doesn't exist (security)
        // to prevent email enumeration
        return { success: true, message: 'Si ce compte existe, un email de réinitialisation a été envoyé.' };
    },
    
    async signOut() {
        const response = await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        });
        
        // Clear local storage regardless of response
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_id');
        localStorage.removeItem('masterKey');
        
        return response.ok;
    },
    
    async getUser() {
        const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Not authenticated');
        }
        
        return await response.json();
    }
};

// Password functions
const passwords = {
    async getAll() {
        const userId = localStorage.getItem('user_id');
        console.log('passwords.getAll - userId:', userId);
        if (!userId) return [];
        
        const result = await supabaseFetch(`passwords?user_id=eq.${userId}&order=created_at.desc`);
        console.log('passwords.getAll - result:', result);
        return result;
    },
    
    async create(data) {
        const userId = localStorage.getItem('user_id');
        if (!userId) throw new Error('Not authenticated');
        
        return await supabaseFetch('passwords', {
            method: 'POST',
            body: {
                user_id: userId,
                site_name: data.site_name,
                site_url: data.site_url || '',
                username: data.username,
                encrypted_password: data.encrypted_password
            }
        });
    },
    
    async update(id, data) {
        return await supabaseFetch(`passwords?id=eq.${id}`, {
            method: 'PATCH',
            body: {
                site_name: data.site_name,
                site_url: data.site_url || '',
                username: data.username,
                encrypted_password: data.encrypted_password
            }
        });
    },
    
    async delete(id) {
        return await supabaseFetch(`passwords?id=eq.${id}`, {
            method: 'DELETE'
        });
    }
};