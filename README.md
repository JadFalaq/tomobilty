# Tommobilty - Plateforme de Location de Voitures au Maroc

Tommobilty est une plateforme web complète de location de voitures au Maroc, développée avec Next.js (frontend) et Node.js/Express (backend), avec un système de réservation synchronisé pour éviter les conflits.

## 🚀 Fonctionnalités


### Frontend
- **Next.js 14** : Framework React avec App Router
- **TypeScript** : Typage statique pour une meilleure robustesse
- **Tailwind CSS** : Framework CSS utilitaire
- **Lucide React** : Icônes modernes et cohérentes

### Backend (Architecture Monolithique)
- **Node.js** : Runtime JavaScript côté serveur
- **Express.js** : Framework web minimaliste
- **Prisma** : ORM moderne avec 26 modèles de données
- **PostgreSQL** : Base de données relationnelle (Supabase)
- **JWT** : Authentification par tokens
- **Stripe** : Traitement des paiements
- **jsPDF** : Génération de contrats PDF
- **Nodemailer** : Envoi d'emails
- **bcryptjs** : Hachage des mots de passe

### Infrastructure
- **Vercel** : Déploiement serverless
- **Supabase** : Base de données PostgreSQL managée

## Installation et Configuration

### Prérequis
- Node.js 18+ 
- npm ou yarn
- Compte Supabase (PostgreSQL)
- Compte Stripe (paiements)

### Installation

1. **Cloner le repository**
```bash
git clone [URL_DU_REPO]
cd tommobilty
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration de l'environnement**
```bash
cp .env.example .env
```

Remplir les variables d'environnement dans `.env` :
```env
# Base de données PostgreSQL (Supabase)
DATABASE_URL="postgresql://postgres:password@db.project.supabase.co:5432/postgres"

# JWT Secret
JWT_SECRET="votre_secret_jwt_tres_securise_ici"

# Configuration serveur
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Supabase Configuration
SUPABASE_URL=https://your_project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key

# Email Configuration (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Twilio Configuration (SMS)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

4. **Configuration de la base de données**
```bash
# Générer le client Prisma
npm run prisma:generate

# Appliquer le schéma à la base de données
npm run prisma:push

# (Optionnel) Ouvrir Prisma Studio
npm run prisma:studio
```

5. **Initialiser le système**
```bash
# Initialiser les données par défaut (niveaux fidélité, statuts, etc.)
curl -X POST http://localhost:5000/api/admin/system/initialize
```

### Authentification
- `POST /api/auth/inscription` - Créer un compte
- `POST /api/auth/connexion` - Se connecter
- `GET /api/auth/profil` - Obtenir le profil (protégé)
- `PUT /api/auth/profil` - Mettre à jour le profil (protégé)

### Voitures
- `GET /api/voitures` - Liste des voitures (avec filtres)
- `GET /api/voitures/:id` - Détails d'une voiture
- `POST /api/voitures/:id/disponibilite` - Vérifier la disponibilité
- `POST /api/voitures` - Créer une voiture (admin)
- `PUT /api/voitures/:id` - Modifier une voiture (admin)
- `DELETE /api/voitures/:id` - Supprimer une voiture (admin)

### Réservations
- `POST /api/reservations` - Créer une réservation (protégé)
- `PUT /api/reservations/:id/confirmer` - Confirmer une réservation (protégé)
- `GET /api/reservations/mes-reservations` - Mes réservations (protégé)
- `GET /api/reservations` - Toutes les réservations (admin)
- `GET /api/reservations/:id` - Détails d'une réservation (protégé)
- `PUT /api/reservations/:id/annuler` - Annuler une réservation (protégé)
- `PUT /api/reservations/:id/statut` - Mettre à jour le statut (admin)

## 🔒 Système de Synchronisation

Le système de réservation utilise plusieurs mécanismes pour éviter les conflits :

1. **Verrous temporaires** : Lors de la création d'une réservation, un verrou de 10 minutes est placé
2. **Transactions MongoDB** : Utilisation de transactions pour garantir la cohérence
3. **Vérification de disponibilité** : Contrôle en temps réel avant chaque réservation
4. **Index de base de données** : Optimisation des requêtes de vérification

## 🎨 Personnalisation

### Couleurs
Les couleurs principales peuvent être modifiées dans `tailwind.config.ts` :
```typescript
colors: {
  primary: {
    // Vos couleurs personnalisées
  }
}
```

### Logo et Branding
- Modifier le logo dans `components/Navbar.tsx`
- Changer le nom dans les métadonnées de `app/layout.tsx`

## 📝 Données de Test

Pour tester l'application, vous pouvez créer des données de test :

### Créer un utilisateur admin
Connectez-vous à MongoDB et exécutez :
```javascript
db.users.updateOne(
  { email: "admin@tommobilty.ma" },
  { $set: { role: "admin" } }
)
```

### Ajouter des voitures
Utilisez l'API ou créez directement dans MongoDB des documents de voitures.

## 🚀 Déploiement

### Frontend (Vercel)
```bash
npm run build
vercel deploy
```

### Backend (Heroku, Railway, etc.)
1. Configurer les variables d'environnement
2. Déployer le dossier `backend/`
3. Mettre à jour `NEXT_PUBLIC_API_URL` dans le frontend

### Base de données (MongoDB Atlas)
1. Créer un cluster sur MongoDB Atlas
2. Mettre à jour `MONGODB_URI` avec l'URL de connexion

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
1. Fork le projet
2. Créer une branche (`git checkout -b feature/amelioration`)
3. Commit vos changements (`git commit -m 'Ajout d'une fonctionnalité'`)
4. Push vers la branche (`git push origin feature/amelioration`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT.

## 📧 Contact

Pour toute question ou suggestion :
- Email : contact@tommobilty.ma
- Site web : https://tommobilty.ma

---

Développé avec ❤️ pour faciliter la location de voitures au Maroc
