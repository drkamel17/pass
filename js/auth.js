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

// Forgot password form handler
document.getElementById('forgotPasswordForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('resetEmail').value;
    const submitBtn = document.getElementById('resetSubmitBtn');
    
    if (!email) {
        showResetError('Veuillez entrer votre email');
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Envoi...';
    hideResetError();
    hideResetSuccess();
    
    try {
        await auth.recoverPassword(email);
        showResetSuccess('Si ce compte existe, un email de réinitialisation a été envoyé.');
        document.getElementById('forgotPasswordForm').reset();
    } catch (error) {
        console.error('Password reset error:', error);
        showResetError(error.message || 'Erreur lors de la réinitialisation');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Envoyer le lien';
    }
});

// Helper functions for reset form
function showResetError(message) {
    const errorDiv = document.getElementById('resetError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    }
}

function hideResetError() {
    const errorDiv = document.getElementById('resetError');
    if (errorDiv) {
        errorDiv.classList.add('hidden');
    }
}

function showResetSuccess(message) {
    const successDiv = document.getElementById('resetSuccess');
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.classList.remove('hidden');
    }
}

function hideResetSuccess() {
    const successDiv = document.getElementById('resetSuccess');
    if (successDiv) {
        successDiv.classList.add('hidden');
    }
}

// Switch between login and forgot password forms
function showForgotPassword() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('forgotPasswordSection').classList.remove('hidden');
}

function showLoginForm() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('forgotPasswordSection').classList.add('hidden');
    hideResetError();
    hideResetSuccess();
}

// Make available globally
window.logout = logout;
window.showForgotPassword = showForgotPassword;
window.showLoginForm = showLoginForm;

// Toggle password visibility
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const button = input.parentElement.querySelector('.toggle-password');
    const svg = button.querySelector('svg');
    
    if (input.type === 'password') {
        input.type = 'text';
        svg.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.72a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
    } else {
        input.type = 'password';
        svg.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
    }
}

window.togglePasswordVisibility = togglePasswordVisibility;