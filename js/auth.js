// Auth handling for login and signup pages

// Login form handler
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const masterPassword = document.getElementById('masterPassword').value;
    const submitBtn = document.getElementById('submitBtn');
    
    if (!masterPassword) {
        showError('Veuillez entrer votre mot de passe maître');
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Connexion...';
    hideError();
    
    try {
        // Sign in to Supabase
        await auth.signIn(email, password);
        
        // Store master password for encryption
        localStorage.setItem('masterKey', masterPassword);
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error('Login error:', error);
        showError(error.message || 'Erreur de connexion');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Se connecter';
    }
});

// Signup form handler
document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const masterPassword = document.getElementById('masterPassword').value;
    const submitBtn = document.getElementById('submitBtn');
    
    if (password !== confirmPassword) {
        showError('Les mots de passe ne correspondent pas');
        return;
    }
    
    if (masterPassword.length < 8) {
        showError('Le mot de passe maître doit contenir au moins 8 caractères');
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Création...';
    hideError();
    hideSuccess();
    
    try {
        // Sign up with Supabase
        await auth.signUp(email, password);
        
        // If auto-confirmed, sign in
        try {
            await auth.signIn(email, password);
            localStorage.setItem('masterKey', masterPassword);
            window.location.href = 'dashboard.html';
        } catch (loginError) {
            // If login failed, account needs email confirmation
            showSuccess('Compte créé! Vérifiez votre email pour confirmer.');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 3000);
        }
    } catch (error) {
        console.error('Signup error:', error);
        showError(error.message || 'Erreur lors de l\'inscription');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Créer un compte';
    }
});

// Helper functions
function showError(message) {
    const errorDiv = document.getElementById('error');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    }
}

function hideError() {
    const errorDiv = document.getElementById('error');
    if (errorDiv) {
        errorDiv.classList.add('hidden');
    }
}

function showSuccess(message) {
    const successDiv = document.getElementById('success');
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.classList.remove('hidden');
    }
}

function hideSuccess() {
    const successDiv = document.getElementById('success');
    if (successDiv) {
        successDiv.classList.add('hidden');
    }
}

// Logout function (global)
function logout() {
    auth.signOut().then(() => {
        window.location.href = 'index.html';
    });
}