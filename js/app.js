// Dashboard functionality

let passwords = [];
let editingId = null;
const modal = document.getElementById('modal');

// Initialize dashboard
async function initDashboard() {
    // Set user email
    const email = localStorage.getItem('email') || 'Utilisateur';
    document.getElementById('userEmail').textContent = email;
    
    // Load passwords
    await loadPasswords();
}

// Load passwords from Supabase
async function loadPasswords() {
    try {
        passwords = await passwords.getAll();
        renderPasswords();
        document.getElementById('passwordCount').textContent = passwords.length;
    } catch (error) {
        console.error('Error loading passwords:', error);
        showToast('Erreur lors du chargement des mots de passe');
    }
}

// Render passwords to the grid
function renderPasswords() {
    const container = document.getElementById('passwordsList');
    const emptyState = document.getElementById('emptyState');
    
    if (passwords.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    container.innerHTML = passwords.map(p => `
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

// Toggle password visibility
function togglePassword() {
    const input = document.getElementById('password');
    input.type = input.type === 'password' ? 'text' : 'password';
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
    
    if (!siteName || !username || !password) {
        showToast('Veuillez remplir tous les champs');
        return;
    }
    
    try {
        // Encrypt password
        const encryptedPassword = await encryptData(password, masterKey);
        
        const data = {
            site_name: siteName,
            site_url: siteUrl,
            username: username,
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
    const entry = passwords.find(p => p.id === id);
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
    const entry = passwords.find(p => p.id === id);
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
window.logout = logout;