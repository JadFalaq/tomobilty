# Tomobilty - Plateforme de Location de Voitures au Maroc

Tomobilty est une plateforme web complète de location de voitures au Maroc, développée avec Next.js (frontend) et Node.js/Express (backend), avec un système de réservation synchronisé pour éviter les conflits.

## 🚀 Fonctionnalités

### Pour les Clients
- **Catalogue de voitures** : Parcourir et filtrer les voitures disponibles
- **Réservation en ligne** : Système de réservation avec vérification de disponibilité en temps réel
- **Système de verrouillage** : Prévention des doubles réservations grâce à un système de verrous temporaires
- **Gestion des réservations** : Voir, confirmer et annuler ses réservations
- **Authentification sécurisée** : Inscription et connexion avec JWT
- **Profil utilisateur** : Gestion des informations personnelles

### Pour les Administrateurs
- **Gestion des voitures** : Ajouter, modifier et supprimer des véhicules
- **Gestion des réservations** : Voir toutes les réservations et mettre à jour leur statut
- **Tableau de bord** : Vue d'ensemble de l'activité

### Fonctionnalités Techniques
- **Synchronisation des réservations** : Système de verrouillage pour éviter les conflits
- **Validation des dates** : Vérification automatique de la disponibilité
- **Calcul automatique des prix** : Prix total calculé selon la durée et les options
- **Interface responsive** : Design adaptatif pour mobile, tablette et desktop
- **API RESTful** : Backend structuré avec Express.js

## 🛠️ Technologies Utilisées

### Frontend
- **Next.js 14** : Framework React pour le rendu côté serveur
- **TypeScript** : Typage statique pour plus de sécurité
- **Tailwind CSS** : Framework CSS utilitaire pour le design
- **Lucide React** : Bibliothèque d'icônes moderne
- **Axios** : Client HTTP pour les appels API

### Backend
- **Node.js** : Environnement d'exécution JavaScript
- **Express.js** : Framework web minimaliste
- **MongoDB** : Base de données NoSQL
- **Mongoose** : ODM pour MongoDB
- **JWT** : Authentification par tokens
- **bcryptjs** : Hachage des mots de passe

## 📦 Installation

### Prérequis
- Node.js (v18 ou supérieur)
- MongoDB (local ou Atlas)
- npm ou yarn

### 1. Cloner le projet
```bash
cd tomobilty
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configuration de l'environnement
Créez un fichier `.env` à la racine du projet :

```env
# Base de données MongoDB
MONGODB_URI=mongodb://localhost:27017/tomobilty

# JWT Secret pour l'authentification
JWT_SECRET=votre_secret_jwt_tres_securise_ici_changez_moi

# Configuration du serveur
PORT=5000
NODE_ENV=development

# URL du frontend (pour CORS)
FRONTEND_URL=http://localhost:3000
```

### 4. Démarrer MongoDB
Si vous utilisez MongoDB en local :
```bash
mongod
```

### 5. Lancer l'application

#### Option 1 : Démarrer frontend et backend ensemble
```bash
npm run dev:all
```

#### Option 2 : Démarrer séparément

Terminal 1 - Backend :
```bash
npm run server
```

Terminal 2 - Frontend :
```bash
npm run dev
```

### 6. Accéder à l'application
- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:5000

## 📁 Structure du Projet

```
tomobilty/
├── app/                          # Pages Next.js
│   ├── page.tsx                  # Page d'accueil
│   ├── voitures/                 # Pages des voitures
│   │   ├── page.tsx              # Liste des voitures
│   │   └── [id]/page.tsx         # Détails et réservation
│   ├── connexion/page.tsx        # Page de connexion
│   ├── inscription/page.tsx      # Page d'inscription
│   ├── mes-reservations/page.tsx # Réservations de l'utilisateur
│   ├── layout.tsx                # Layout principal
│   └── globals.css               # Styles globaux
├── backend/                      # Backend Node.js/Express
│   ├── config/                   # Configuration
│   │   └── db.js                 # Connexion MongoDB
│   ├── controllers/              # Contrôleurs
│   │   ├── authController.js     # Authentification
│   │   ├── voitureController.js  # Gestion des voitures
│   │   └── reservationController.js # Gestion des réservations
│   ├── middleware/               # Middlewares
│   │   └── authMiddleware.js     # Protection des routes
│   ├── models/                   # Modèles Mongoose
│   │   ├── User.js               # Modèle utilisateur
│   │   ├── Voiture.js            # Modèle voiture
│   │   └── Reservation.js        # Modèle réservation
│   ├── routes/                   # Routes API
│   │   ├── authRoutes.js
│   │   ├── voitureRoutes.js
│   │   └── reservationRoutes.js
│   └── server.js                 # Point d'entrée du serveur
├── components/                   # Composants React
│   ├── Navbar.tsx                # Barre de navigation
│   ├── Footer.tsx                # Pied de page
│   └── VoitureCard.tsx           # Carte de voiture
├── lib/                          # Utilitaires
│   ├── api.ts                    # Configuration Axios et API
│   └── utils.ts                  # Fonctions utilitaires
├── package.json                  # Dépendances
├── tsconfig.json                 # Configuration TypeScript
├── tailwind.config.ts            # Configuration Tailwind
└── README.md                     # Documentation
```

## 🔐 API Endpoints

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
  { email: "admin@tomobilty.ma" },
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
- Email : contact@tomobilty.ma
- Site web : https://tomobilty.ma

---

Développé avec ❤️ pour faciliter la location de voitures au Maroc
