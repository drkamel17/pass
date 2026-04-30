// Cryptographie AES-256-GCM avec Web Crypto API
// Le mot de passe maître ne quitte jamais le navigateur

const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const ITERATIONS = 100000;

// Dériver la clé à partir du mot de passe maître
async function deriveKey(masterPassword, salt) {
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(masterPassword),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: ITERATIONS,
            hash: 'SHA-256'
        },
        passwordKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

// Chiffrer des données
async function encryptData(plaintext, masterPassword) {
    try {
        const encoder = new TextEncoder();
        const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
        const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
        
        const key = await deriveKey(masterPassword, salt);
        
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            encoder.encode(plaintext)
        );
        
        // Combiner salt + iv + données chiffrées
        const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
        combined.set(salt, 0);
        combined.set(iv, salt.length);
        combined.set(new Uint8Array(encrypted), salt.length + iv.length);
        
        // Convertir en base64 pour le stockage
        return btoa(String.fromCharCode(...combined));
    } catch (error) {
        console.error('Encryption error:', error);
        throw error;
    }
}

// Déchiffrer des données
async function decryptData(encryptedData, masterPassword) {
    try {
        // Convertir de base64
        const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
        
        // Extraire salt, iv et données chiffrées
        const salt = combined.slice(0, SALT_LENGTH);
        const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
        const encrypted = combined.slice(SALT_LENGTH + IV_LENGTH);
        
        const key = await deriveKey(masterPassword, salt);
        
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            encrypted
        );
        
        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
    } catch (error) {
        console.error('Decryption error:', error);
        return null;
    }
}

// Générer un mot de passe aléatoire sécurisé
function generateStrongPassword(length = 16) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=';
    const randomValues = crypto.getRandomValues(new Uint8Array(length));
    let password = '';
    
    for (let i = 0; i < length; i++) {
        password += charset[randomValues[i] % charset.length];
    }
    
    return password;
}