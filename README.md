# SecurePass Web Application

Application web de gestion de mots de passe avec chiffrement AES-256-GCM.

## Fonctionnalités

- 🔐 Chiffrement AES-256-GCM côté client
- 🔑 Master Password pour sécuriser les données
- 📱 Interface moderne et responsive
- ☁️ Stockage Supabase (PostgreSQL)
- 🔍 Recherche de mots de passe
- 🎲 Générateur de mots de passe sécurisés

## Déploiement sur Vercel

### Méthode 1: Via Vercel CLI

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
cd web-static
vercel
```

### Méthode 2: Via GitHub

1. Créer un dépôt GitHub avec le dossier `web-static`
2. Aller sur [vercel.com](https://vercel.com)
3. "New Project" → Import GitHub
4. Sélectionner le dépôt
5. Framework Preset: "Other"
6. Deploy!

## Structure des fichiers

```
web-static/
├── index.html          # Page de connexion
├── signup.html         # Page d'inscription
├── dashboard.html      # Tableau de bord
├── styles.css          # Styles CSS
├── vercel.json         # Configuration Vercel
├── js/
│   ├── supabase.js     # Client Supabase
│   ├── crypto.js       # Cryptographie
│   ├── auth.js         # Authentification
│   └── app.js          # Application principale
```

## Variables d'environnement (optionnel)

Si vous utilisez votre propre projet Supabase :

1. Modifier `SUPABASE_URL` et `SUPABASE_KEY` dans `js/supabase.js`

## Sécurité

- Le mot de passe maître ne quitte jamais le navigateur
- Les mots de passe sont chiffrés avec AES-256-GCM
- PBKDF2 avec 100,000 itérations pour la dérivation de clé
- Session gérée via Supabase Auth