// Dashboard functionality

let passwordsList = [];
let editingId = null;
const modal = document.getElementById('modal');

// Inactivity logout configuration
const INACTIVITY_TIMEOUT = 60; // seconds
const WARNING_TIME = 10; // seconds before logout to show warning

let inactivityTimer = null;
let warningTimer = null;
let showWarningCallback = null;

// Initialize dashboard
async function initDashboard() {
    // Debug: check what's in localStorage
    console.log('=== Dashboard Init ===');
    console.log('user_id:', localStorage.getItem('user_id'));
    console.log('email:', localStorage.getItem('email'));
    console.log('masterKey:', localStorage.getItem('masterKey') ? 'SET' : 'NULL');
    
    // Set user email
    const email = localStorage.getItem('email') || localStorage.getItem('user_id') || 'Utilisateur';
    document.getElementById('userEmail').textContent = email;
    
    // Load passwords
    await loadPasswords();
    
    // Setup inactivity detection
    setupInactivityListeners();
    
    // Start inactivity timer
    startInactivityTimer();
}

// Inactivity timer functions
function startInactivityTimer() {
    // Clear any existing timers
    clearTimers();
    
    console.log('Inactivity timer started - will logout after', INACTIVITY_TIMEOUT, 'seconds');
    
    // Set warning timer
    warningTimer = setTimeout(() => {
        console.log('Warning: logout in', WARNING_TIME, 'seconds');
        showInactivityWarning();
    }, (INACTIVITY_TIMEOUT - WARNING_TIME) * 1000);
    
    // Set logout timer
    inactivityTimer = setTimeout(() => {
        console.log('Inactivity timeout - logging out');
        performLogout();
    }, INACTIVITY_TIMEOUT * 1000);
}

function clearTimers() {
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        inactivityTimer = null;
    }
    if (warningTimer) {
        clearTimeout(warningTimer);
        warningTimer = null;
    }
    // Hide warning if shown
    const warningEl = document.getElementById('inactivityWarning');
    if (warningEl) {
        warningEl.remove();
    }
}

function resetInactivityTimer() {
    if (localStorage.getItem('user_id')) {
        console.log('Activity detected - resetting timer');
        startInactivityTimer();
    }
}

function showInactivityWarning() {
    // Remove existing warning if any
    const existing = document.getElementById('inactivityWarning');
    if (existing) existing.remove();
    
    // Create warning element
    const warning = document.createElement('div');
    warning.id = 'inactivityWarning';
    warning.className = 'inactivity-warning';
    warning.innerHTML = `
        <div class="inactivity-warning-content">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div>
                <strong>Session inactive</strong>
                <p>Déconnexion dans ${WARNING_TIME} secondes. Cliquez pour rester connecté.</p>
            </div>
        </div>
    `;
    
    warning.style.cssText = `
        position: fixed;
        top: 70px;
        left: 50%;
        transform: translateX(-50%);
        background: #fff3cd;
        border: 1px solid #ffc107;
        border-radius: 12px;
        padding: 15px 20px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 15px;
        max-width: 90%;
        animation: slideDown 0.3s ease;
    `;
    
    document.body.appendChild(warning);
    
    // Add click to reset
    warning.addEventListener('click', resetInactivityTimer);
}

function performLogout() {
    localStorage.clear();
    showToast('Session expirée par inactivity');
    window.location.href = 'index.html';
}

// Add event listeners for user activity
function setupInactivityListeners() {
    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
    
    events.forEach(event => {
        document.addEventListener(event, resetInactivityTimer, { passive: true });
    });
    
    console.log('Inactivity listeners set up');
}

// Load passwords from Supabase
async function loadPasswords() {
    const userId = localStorage.getItem('user_id');
    console.log('Loading passwords for user_id:', userId);
    
    try {
        passwordsList = await passwords.getAll();
        console.log('Loaded passwords:', passwordsList.length);
        renderPasswords();
        document.getElementById('passwordCount').textContent = passwordsList.length;
    } catch (error) {
        console.error('Error loading passwords:', error);
        showToast('Erreur lors du chargement des mots de passe');
    }
}

// Render passwords to the grid
function renderPasswords() {
    const container = document.getElementById('passwordsList');
    const emptyState = document.getElementById('emptyState');
    
    if (passwordsList.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    container.innerHTML = passwordsList.map(p => `
        <div class="password-card" data-id="${p.id}">
            <div class="password-card-header">
                <div class="password-icon">${escapeHtml(p.site_name[0].toUpperCase())}</div>
                <div class="password-card-info">
                    <h4>${escapeHtml(p.site_name)}</h4>
                    <small>${escapeHtml(p.username)}</small>
                </div>
            </div>
            <div class="password-card-actions">
                <button class="btn-action btn-copy" onclick="copyPassword('${p.id}')" title="Copier">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                </button>
                <button class="btn-action btn-edit" onclick="editPassword('${p.id}')" title="Modifier">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                </button>
                <button class="btn-action btn-delete" onclick="deletePassword('${p.id}')" title="Supprimer">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

// Search functionality
document.getElementById('searchInput').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    
    document.querySelectorAll('.password-card').forEach(card => {
        const site = card.querySelector('h4').textContent.toLowerCase();
        const user = card.querySelector('small').textContent.toLowerCase();
        
        if (site.includes(query) || user.includes(query)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
});

// Modal functions
function openModal() {
    editingId = null;
    document.getElementById('modalTitle').textContent = 'Ajouter un mot de passe';
    document.getElementById('passwordForm').reset();
    document.getElementById('password').required = true;
    modal.classList.remove('hidden');
}

function closeModal() {
    modal.classList.add('hidden');
    document.getElementById('passwordForm').reset();
    editingId = null;
}

// Toggle password visibility (using the same function from auth.js)
function togglePassword() {
    togglePasswordVisibility('password');
}

// Generate random password
function generatePassword() {
    const password = generateStrongPassword(16);
    document.getElementById('password').value = password;
    document.getElementById('password').type = 'text';
}

// Save password (add or edit)
document.getElementById('passwordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const siteName = document.getElementById('siteName').value;
    const siteUrl = document.getElementById('siteUrl').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const masterKey = localStorage.getItem('masterKey');
    
    if (!masterKey) {
        showToast('Session expirée, Veuillez vous reconnecter');
        window.location.href = 'index.html';
        return;
    }
    
    if (!siteName || !password) {
        showToast('Veuillez remplir le nom du site et le mot de passe');
        return;
    }
    
    try {
        // Encrypt password
        const encryptedPassword = await encryptData(password, masterKey);
        
        const data = {
            site_name: siteName,
            site_url: siteUrl || '',
            username: username || '',
            encrypted_password: encryptedPassword
        };
        
        if (editingId) {
            await passwords.update(editingId, data);
            showToast('Mot de passe mis à jour');
        } else {
            await passwords.create(data);
            showToast('Mot de passe enregistré');
        }
        
        closeModal();
        await loadPasswords();
    } catch (error) {
        console.error('Error saving password:', error);
        showToast('Erreur lors de la sauvegarde');
    }
});

// Edit password
async function editPassword(id) {
    const entry = passwordsList.find(p => p.id === id);
    if (!entry) return;
    
    const masterKey = localStorage.getItem('masterKey');
    if (!masterKey) {
        showToast('Session expirée');
        return;
    }
    
    try {
        // Decrypt password
        const decryptedPassword = await decryptData(entry.encrypted_password, masterKey);
        
        editingId = id;
        document.getElementById('modalTitle').textContent = 'Modifier le mot de passe';
        document.getElementById('siteName').value = entry.site_name;
        document.getElementById('siteUrl').value = entry.site_url || '';
        document.getElementById('username').value = entry.username;
        document.getElementById('password').value = decryptedPassword || '';
        document.getElementById('password').required = false;
        
        modal.classList.remove('hidden');
    } catch (error) {
        console.error('Error decrypting password:', error);
        showToast('Erreur de déchiffrement');
    }
}

// Copy password
async function copyPassword(id) {
    const entry = passwordsList.find(p => p.id === id);
    if (!entry) return;
    
    const masterKey = localStorage.getItem('masterKey');
    if (!masterKey) {
        showToast('Session expirée');
        return;
    }
    
    try {
        const decrypted = await decryptData(entry.encrypted_password, masterKey);
        if (decrypted) {
            await navigator.clipboard.writeText(decrypted);
            showToast('Mot de passe copié!');
        } else {
            showToast('Erreur de déchiffrement');
        }
    } catch (error) {
        console.error('Error copying password:', error);
        showToast('Erreur lors de la copie');
    }
}

// Delete password
async function deletePassword(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce mot de passe?')) return;
    
    try {
        await passwords.delete(id);
        showToast('Mot de passe supprimé');
        await loadPasswords();
    } catch (error) {
        console.error('Error deleting password:', error);
        showToast('Erreur lors de la suppression');
    }
}

// Show toast notification
function showToast(message) {
    const toast = document.getElementById('toast');
    document.getElementById('toastMessage').textContent = message;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Close modal when clicking outside
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

// Make functions globally available
window.openModal = openModal;
window.closeModal = closeModal;
window.togglePassword = togglePassword;
window.generatePassword = generatePassword;
window.editPassword = editPassword;
window.copyPassword = copyPassword;
window.deletePassword = deletePassword;
window.initDashboard = initDashboard;

// Delete Account Functions
function openDeleteAccountModal() {
    const modal = document.getElementById('deleteAccountModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.getElementById('deletePassword').value = '';
        document.getElementById('deleteError').classList.add('hidden');
    }
}

function closeDeleteAccountModal() {
    const modal = document.getElementById('deleteAccountModal');
    if (modal) {
        modal.classList.add('hidden');
        document.getElementById('deletePassword').value = '';
        document.getElementById('deleteError').classList.add('hidden');
    }
}

async function requestAccountDeletion() {
    const password = document.getElementById('deletePassword').value;
    const errorDiv = document.getElementById('deleteError');
    const userId = localStorage.getItem('user_id');
    const email = localStorage.getItem('email');
    
    if (!password) {
        errorDiv.textContent = 'Veuillez entrer votre mot de passe';
        errorDiv.classList.remove('hidden');
        return;
    }
    
    if (!userId || !email) {
        errorDiv.textContent = 'Erreur: session expirée';
        errorDiv.classList.remove('hidden');
        return;
    }
    
    try {
        errorDiv.classList.add('hidden');
        
        const response = await fetch('/api/request-delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: userId,
                email: email,
                password: password
            })
        });
        
        // Handle non-JSON responses
        const text = await response.text();
        let result;
        try {
            result = JSON.parse(text);
        } catch (e) {
            console.error('Non-JSON response:', text);
            result = { error: 'Erreur serveur: ' + response.status };
        }
        
        if (result.success) {
            closeDeleteAccountModal();
            // Afficher la confirmation directement avec le token
            showDeleteConfirmation(result.token);
        } else {
            errorDiv.textContent = result.error || 'Erreur lors de la demande';
            errorDiv.classList.remove('hidden');
        }
        
    } catch (error) {
        console.error('Delete account error:', error);
        errorDiv.textContent = 'Erreur de connexion';
        errorDiv.classList.remove('hidden');
    }
}

function showDeleteConfirmation(token) {
    // Créer un modal de confirmation inline
    const confirmHtml = `
        <div class="modal" id="confirmDeleteModal" style="display: flex;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Confirmer la suppression</h3>
                </div>
                <div class="delete-warning" style="margin-bottom: 20px;">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc3545" stroke-width="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    <div>
                        <strong>Êtes-vous sûr de vouloir supprimer votre compte ?</strong>
                        <p style="margin-top: 8px;">Cette action est irréversible. Tous vos mots de passe seront supprimés.</p>
                    </div>
                </div>
                <div style="margin-bottom: 20px; padding: 15px; background: #e7f3ff; border-radius: 8px;">
                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                        <input type="checkbox" id="downloadBeforeDelete" style="width: 18px; height: 18px;">
                        <span>Télécharger mes mots de passe avant suppression</span>
                    </label>
                </div>
                <div class="format-option" style="margin-bottom: 15px;">
                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; margin-left: 28px;">
                        <input type="radio" name="deleteFormat" value="txt" checked>
                        <span>Format TXT</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; margin-left: 28px;">
                        <input type="radio" name="deleteFormat" value="csv">
                        <span>Format CSV</span>
                    </label>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" onclick="cancelDeleteProcess()">Annuler</button>
                    <button type="button" class="btn-danger" onclick="confirmDeleteAccount('${token}')">
                        Confirmer la suppression
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Ajouter le modal à la page
    document.body.insertAdjacentHTML('beforeend', confirmHtml);
}

async function confirmDeleteAccount(token) {
    try {
        // Vérifier si l'utilisateur veut télécharger avant suppression
        const downloadCheckbox = document.getElementById('downloadBeforeDelete');
        if (downloadCheckbox && downloadCheckbox.checked) {
            // Récupérer le format selected
            const formatRadio = document.querySelector('input[name="deleteFormat"]:checked');
            const format = formatRadio ? formatRadio.value : 'txt';
            
            showToast('Génération du fichier...', 'info');
            
            // Préparer les mots de passe pour export
            const masterKey = localStorage.getItem('masterKey');
            
            if (!masterKey) {
                showToast('Clé maître manquante. Téléchargement annulé.', 'error');
                return;
            }
            
            // Déchiffrer tous les mots de passe
            const decryptedPasswords = [];
            
            for (const p of passwordsList) {
                try {
                    const decrypted = await decryptData(p.encrypted_password, masterKey);
                    decryptedPasswords.push({
                        site_name: p.site_name,
                        site_url: p.site_url,
                        username: p.username,
                        decrypted_password: decrypted || ''
                    });
                } catch (err) {
                    decryptedPasswords.push({
                        site_name: p.site_name,
                        site_url: p.site_url,
                        username: p.username,
                        decrypted_password: '[Erreur]'
                    });
                }
            }
            
            // Générer le contenu
            let content = '';
            if (format === 'txt') {
                content = decryptedPasswords.map(p => {
                    return `Site: ${p.site_name || 'N/A'}\nURL: ${p.site_url || ''}\nEmail: ${p.username || ''}\nMot de passe: ${p.decrypted_password}\n`;
                }).join('\n');
            } else if (format === 'csv') {
                const header = 'Site,URL,Email,Mot de passe\n';
                const rows = decryptedPasswords.map(p => {
                    return `"${(p.site_name || '').replace(/"/g, '""')}","${(p.site_url || '').replace(/"/g, '""')}","${(p.username || '').replace(/"/g, '""')}","${(p.decrypted_password || '').replace(/"/g, '""')}"`;
                }).join('\n');
                content = header + rows;
            }
            
            // Télécharger le fichier
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mots-de-passe-sauvegarde.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showToast('✓ Fichier téléchargé ! Suppression en cours...', 'success');
        }
        
        // Maintenant supprimer le compte
        const response = await fetch('/api/confirm-delete?token=' + token);
        
        // Check if redirected to success (mots_de_passe_supprimes) or error
        if (response.redirected) {
            const redirectUrl = response.url;
            if (redirectUrl.includes('mots_de_passe_supprimes') || redirectUrl.includes('compte_supprime')) {
                localStorage.clear();
                window.location.href = '/index.html?message=compte_supprime';
            } else {
                // Redirected to error page
                window.location.href = redirectUrl;
            }
        } else if (response.ok) {
            localStorage.clear();
            window.location.href = '/index.html?message=compte_supprime';
        } else {
            showToast('Erreur lors de la suppression', 'error');
            cancelDeleteProcess();
        }
    } catch (error) {
        console.error('Confirm delete error:', error);
        showToast('Erreur de connexion', 'error');
        cancelDeleteProcess();
    }
}

function cancelDeleteProcess() {
    const modal = document.getElementById('confirmDeleteModal');
    if (modal) {
        modal.remove();
    }
}

// Make delete account functions globally available
window.openDeleteAccountModal = openDeleteAccountModal;
window.closeDeleteAccountModal = closeDeleteAccountModal;
window.requestAccountDeletion = requestAccountDeletion;
window.showDeleteConfirmation = showDeleteConfirmation;
window.confirmDeleteAccount = confirmDeleteAccount;
window.cancelDeleteProcess = cancelDeleteProcess;

// Make decryptData available for delete confirmation
if (typeof decryptData === 'function') {
    window.decryptData = decryptData;
}

console.log('App.js loaded successfully');