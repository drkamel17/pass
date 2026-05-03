// Export des mots de passe par email

const EXPORT_COOLDOWN = 00 * 00 * 00 * 1000; // 24 heures en millisecondes

// Vérifier si l'export est autorisé (limite 1x par 24h)
function canExport() {
    const lastExport = localStorage.getItem('last_export_time');
    if (!lastExport) return true;
    
    const elapsed = Date.now() - parseInt(lastExport);
    return elapsed >= EXPORT_COOLDOWN;
}

// Obtenir le temps restant avant le prochain export
function getTimeUntilNextExport() {
    const lastExport = localStorage.getItem('last_export_time');
    if (!lastExport) return null;
    
    const elapsed = Date.now() - parseInt(lastExport);
    const remaining = EXPORT_COOLDOWN - elapsed;
    
    if (remaining <= 0) return null;
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}min`;
}

// Générer le contenu du fichier selon le format
function generateExportContent(passwords, format) {
    if (format === 'txt') {
        const content = passwords.map(p => {
            const site = p.site_name || 'N/A';
            const url = p.site_url || '';
            const username = p.username || '';
            const password = p.decrypted_password || '';
            
            let entry = `═══════════════════════════════════════════════════\n`;
            entry += `Site: ${site}\n`;
            if (url) entry += `URL: ${url}\n`;
            if (username) entry += `Email/Username: ${username}\n`;
            entry += `Mot de passe: ${password}\n`;
            entry += `═══════════════════════════════════════════════════\n`;
            
            return entry;
        }).join('\n');
        
        return content;
    }
    
    if (format === 'csv') {
        const header = 'Site,URL,Email/Mot de passe,Mot de passe\n';
        const rows = passwords.map(p => {
            const site = (p.site_name || '').replace(/"/g, '""');
            const url = (p.site_url || '').replace(/"/g, '""');
            const username = (p.username || '').replace(/"/g, '""');
            const password = (p.decrypted_password || '').replace(/"/g, '""');
            
            return `"${site}","${url}","${username}","${password}"`;
        }).join('\n');
        
        return header + rows;
    }
    
    return '';
}

// Convertir string en base64
function stringToBase64(str) {
    return btoa(unescape(encodeURIComponent(str)));
}

// Exporter les mots de passe - Download direct
async function exportPasswords(format) {
    const email = localStorage.getItem('email');
    const userId = localStorage.getItem('user_id');
    const masterKey = localStorage.getItem('masterKey');
    
    if (!email || !userId) {
        showToast('Erreur: session expirée', 'error');
        return;
    }
    
    if (!masterKey) {
        showToast('Erreur: clé maître manquante', 'error');
        return;
    }
    
    // Vérifier la limite de temps
    if (!canExport()) {
        const remaining = getTimeUntilNextExport();
        showToast(`Export déjà effectué. Réessayez dans ${remaining}`, 'error');
        return;
    }
    
    // Vérifier qu'il y a des mots de passe
    if (passwordsList.length === 0) {
        showToast('Aucun mot de passe à exporter', 'error');
        return;
    }
    
    try {
        showToast('Génération du fichier en cours...', 'info');
        
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
                console.error('Erreur déchiffrement:', err);
                decryptedPasswords.push({
                    site_name: p.site_name,
                    site_url: p.site_url,
                    username: p.username,
                    decrypted_password: '[Erreur de déchiffrement]'
                });
            }
        }
        
        // Générer le contenu
        const content = generateExportContent(decryptedPasswords, format);
        const base64Content = stringToBase64(content);
        
        // Nom du fichier
        const timestamp = new Date().toISOString().slice(0, 10);
        const filename = `mots-de-passe-${timestamp}.${format}`;
        
        // Appeler l'API
        // Créer le fichier et le télécharger directement
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        // Créer un lien de téléchargement
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Nettoyer
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Enregistrer le temps de dernier export
        localStorage.setItem('last_export_time', Date.now().toString());
        
        showToast('✓ Fichier téléchargé avec succès !', 'success');
        closeExportModal();
        
    } catch (error) {
        console.error('Export error:', error);
        showToast('Erreur lors de l\'export', 'error');
    }
}

// Ouvrir le modal d'export
function openExportModal() {
    const modal = document.getElementById('exportModal');
    if (modal) {
        modal.classList.remove('hidden');
        updateExportStatus();
    }
}

// Fermer le modal d'export
function closeExportModal() {
    const modal = document.getElementById('exportModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Mettre à jour le statut de l'export (bouton désactivé si trop tôt)
function updateExportStatus() {
    const exportBtn = document.getElementById('confirmExportBtn');
    const statusText = document.getElementById('exportStatusText');
    
    if (canExport()) {
        exportBtn.disabled = false;
        statusText.textContent = '';
    } else {
        exportBtn.disabled = true;
        const remaining = getTimeUntilNextExport();
        statusText.textContent = `Prochain export dans: ${remaining}`;
        statusText.style.color = '#dc3545';
    }
}

// Confirmer l'export avec case à cocher
async function handleExport(format) {
    const checkbox = document.getElementById('exportConfirmCheckbox');
    
    if (!checkbox.checked) {
        showToast('Veuillez confirmer que vous comprenez les risques', 'error');
        return;
    }
    
    await exportPasswords(format);
}