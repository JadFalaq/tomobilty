# 🏗️ Architecture du Projet Tommobilty

## 📋 Vue d'ensemble

**Tommobilty** est une plateforme de location de voitures de luxe au Maroc, construite avec une architecture **Full-Stack moderne** utilisant Next.js pour le frontend et Express.js pour le backend API.

---

## 🎯 Stack Technique

### Frontend
- **Framework:** Next.js 14 (App Router)
- **UI Library:** React 18
- **Styling:** TailwindCSS + CSS Modules
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **HTTP Client:** Axios
- **PDF Generation:** jsPDF

### Backend
- **Framework:** Express.js
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Authentication:** JWT + Google OAuth + Twilio SMS
- **Payment:** Stripe
- **Email:** Nodemailer
- **File Upload:** Multer
- **Validation:** Joi + Express Validator

### DevOps & Tools
- **Version Control:** Git
- **Package Manager:** npm
- **Testing:** Jest
- **Linting:** ESLint
- **Type Checking:** TypeScript

---

## 📁 Structure du Projet

```
tommobilty/
│
├── 📂 app/                          # Next.js App Router (Frontend)
│   ├── 403/                         # Page erreur 403 Forbidden
│   ├── a-propos/                    # Page À propos
│   ├── admin/                       # Dashboard administrateur
│   │   ├── bookings/                # Gestion des réservations
│   │   ├── cars/                    # Gestion des voitures
│   │   ├── chat/                    # Chat admin
│   │   ├── documents/               # Gestion documents
│   │   ├── loyalty/                 # Programme fidélité
│   │   ├── maintenance/             # Maintenance véhicules
│   │   ├── notifications/           # Notifications
│   │   ├── payments/                # Gestion paiements
│   │   ├── promotions/              # Promotions
│   │   ├── reviews/                 # Avis clients
│   │   ├── settings/                # Paramètres
│   │   ├── users/                   # Gestion utilisateurs
│   │   ├── layout.tsx               # Layout admin avec auth
│   │   └── page.tsx                 # Dashboard principal
│   │
│   ├── api/                         # API Routes Next.js
│   │   ├── stripe/                  # Webhooks Stripe
│   │   └── webhook/                 # Autres webhooks
│   │
│   ├── booking/                     # Processus de réservation
│   │   ├── options/                 # Options supplémentaires
│   │   ├── paiement/                # Page paiement
│   │   └── protection/              # Assurances
│   │
│   ├── conditions/                  # Conditions générales
│   ├── connexion/                   # Page connexion
│   ├── contact/                     # Page contact
│   ├── inscription/                 # Page inscription
│   ├── loyalty/                     # Programme fidélité client
│   ├── mes-reservations/            # Réservations utilisateur
│   │   └── [id]/                    # Détails réservation
│   │
│   ├── paiement/                    # Pages paiement
│   │   ├── annule/                  # Paiement annulé
│   │   ├── erreur/                  # Erreur paiement
│   │   └── succes/                  # Paiement réussi
│   │
│   ├── payments/return/             # Retour paiement
│   ├── profil/                      # Profil utilisateur
│   ├── voitures/                    # Catalogue voitures
│   │   ├── [id]/                    # Détails voiture
│   │   ├── disponibles/             # Voitures disponibles
│   │   └── page.tsx                 # Liste voitures
│   │
│   ├── globals.css                  # Styles globaux
│   ├── layout.tsx                   # Layout racine
│   └── page.tsx                     # Page d'accueil
│
├── 📂 components/                   # Composants React réutilisables
│   ├── admin/                       # Composants admin
│   │   ├── AdminBookingsList.tsx
│   │   ├── AdminCarsList.tsx
│   │   ├── AdminPaymentsList.tsx
│   │   ├── AdminReviewsList.tsx
│   │   ├── AdminUsersList.tsx
│   │   └── MaintenanceScheduler.tsx
│   │
│   ├── bookings/                    # Composants réservations
│   │   └── BookingsPage.tsx
│   │
│   ├── cars/                        # Composants voitures
│   │   └── CarsPage.tsx
│   │
│   ├── home/                        # Composants page accueil
│   │   └── HomeView.tsx
│   │
│   ├── loyalty/                     # Composants fidélité
│   │   ├── LoyaltyBenefits.tsx
│   │   ├── LoyaltyHistory.tsx
│   │   ├── LoyaltyOverview.tsx
│   │   ├── LoyaltyRewards.tsx
│   │   ├── LoyaltyTiers.tsx
│   │   └── PointsCalculator.tsx
│   │
│   ├── ui/                          # Composants UI génériques
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── input.tsx
│   │
│   ├── AnimatedIntro.tsx            # Animation intro
│   ├── AppShell.tsx                 # Shell application
│   ├── BookingPriceSummary.tsx      # Résumé prix réservation
│   ├── ChatBot.tsx                  # Chatbot assistance
│   ├── DateRangePicker.tsx          # Sélecteur dates
│   ├── Footer.tsx                   # Pied de page
│   ├── Navbar.tsx                   # Barre navigation
│   ├── PaymentProcessor.tsx         # Processeur paiement
│   ├── PaymentProviderSelector.tsx  # Sélecteur mode paiement
│   ├── VideoIntro.tsx               # Vidéo intro
│   └── VoitureCard.tsx              # Carte voiture
│
├── 📂 src/                          # Backend Express.js
│   ├── controllers/                 # Contrôleurs API
│   │   ├── admin/                   # Contrôleurs admin
│   │   │   ├── analytics.controller.js
│   │   │   ├── booking.controller.js
│   │   │   ├── car.controller.js
│   │   │   ├── chat.controller.js
│   │   │   ├── dashboard.controller.js
│   │   │   ├── document.controller.js
│   │   │   ├── kpi.controller.js
│   │   │   ├── loyalty.controller.js
│   │   │   ├── maintenance.controller.js
│   │   │   ├── notification.controller.js
│   │   │   ├── payment.controller.js
│   │   │   ├── promotion.controller.js
│   │   │   ├── review.controller.js
│   │   │   ├── settings.controller.js
│   │   │   ├── stats.controller.js
│   │   │   └── user.controller.js
│   │   │
│   │   ├── auth.controller.js       # Authentification
│   │   ├── booking.controller.js    # Réservations
│   │   ├── car.controller.js        # Voitures
│   │   ├── contract.controller.js   # Contrats
│   │   ├── loyalty.controller.js    # Fidélité
│   │   ├── payment.controller.js    # Paiements
│   │   ├── protection.controller.js # Assurances
│   │   ├── review.controller.js     # Avis
│   │   ├── user.controller.js       # Utilisateurs
│   │   └── webhook.controller.js    # Webhooks
│   │
│   ├── routes/                      # Routes API
│   │   ├── admin.routes.complete.js # Routes admin complètes
│   │   ├── admin.routes.js          # Routes admin
│   │   ├── auth.routes.js           # Routes auth
│   │   ├── booking.routes.js        # Routes réservations
│   │   ├── car.routes.js            # Routes voitures
│   │   ├── contract.routes.js       # Routes contrats
│   │   ├── loyalty.routes.js        # Routes fidélité
│   │   ├── payment.routes.js        # Routes paiements
│   │   ├── pickupsite.routes.js     # Routes sites retrait
│   │   ├── protection.routes.js     # Routes assurances
│   │   ├── review.routes.js         # Routes avis
│   │   ├── test.routes.js           # Routes test
│   │   ├── user.routes.js           # Routes utilisateurs
│   │   └── webhook.routes.js        # Routes webhooks
│   │
│   ├── services/                    # Services métier
│   │   ├── providers/               # Providers externes
│   │   │   ├── cmi.provider.js      # CMI Payment
│   │   │   ├── email.provider.js    # Email service
│   │   │   ├── sms.provider.js      # SMS service
│   │   │   └── stripe.provider.js   # Stripe
│   │   │
│   │   ├── availability.service.js  # Disponibilité
│   │   ├── booking.service.js       # Réservations
│   │   ├── contract.service.js      # Contrats
│   │   ├── invoice.service.js       # Factures
│   │   ├── loyalty.service.js       # Fidélité
│   │   ├── loyalty.mock.service.js  # Mock fidélité
│   │   ├── mock.service.js          # Mock data
│   │   ├── notification.service.js  # Notifications
│   │   └── payment.service.js       # Paiements
│   │
│   ├── middlewares/                 # Middlewares Express
│   │   ├── auth.middleware.js       # Auth JWT
│   │   ├── error.middleware.js      # Gestion erreurs
│   │   ├── rate-limit.middleware.js # Rate limiting
│   │   ├── role.middleware.js       # Vérification rôles
│   │   ├── upload.middleware.js     # Upload fichiers
│   │   └── validation.middleware.js # Validation données
│   │
│   ├── utils/                       # Utilitaires
│   │   ├── date.utils.js
│   │   ├── email.utils.js
│   │   ├── jwt.utils.js
│   │   ├── pdf.utils.js
│   │   ├── price.utils.js
│   │   └── validation.utils.js
│   │
│   ├── config/                      # Configuration
│   │   ├── database.config.js
│   │   ├── email.config.js
│   │   └── stripe.config.js
│   │
│   ├── errors/                      # Erreurs personnalisées
│   │   ├── AppError.js
│   │   └── ValidationError.js
│   │
│   └── __tests__/                   # Tests unitaires
│       └── services/
│
├── 📂 lib/                          # Bibliothèques frontend
│   ├── api.ts                       # Client API Axios
│   ├── loyaltyAPI.js                # API fidélité
│   ├── mockData.ts                  # Données mock
│   └── utils.ts                     # Utilitaires frontend
│
├── 📂 prisma/                       # Base de données
│   ├── migrations/                  # Migrations DB
│   ├── schema.prisma                # Schéma Prisma
│   ├── migrate-*.js                 # Scripts migration
│   └── seed-*.js                    # Scripts seed
│
├── 📂 public/                       # Fichiers statiques
│   ├── cars/                        # Images voitures
│   ├── uploads/                     # Uploads utilisateurs
│   ├── videos/                      # Vidéos
│   ├── logo.png                     # Logo (ancien)
│   ├── logo_new.png                 # Logo avec bg noir
│   ├── logo_without_bg.png          # Logo sans bg
│   └── logobg.png                   # Logo bg
│
├── 📂 api/                          # API Express standalone
│   └── index.js                     # Point d'entrée API
│
├── 📂 scripts/                      # Scripts utilitaires
│   ├── populate-car-brands.js
│   ├── populate-car-categories.js
│   └── populate-car-examples.js
│
├── 📂 backups/                      # Sauvegardes
│
├── 📄 front_end.jsx                 # ⚠️ Ancien prototype (non utilisé)
│
├── 📄 .env                          # Variables d'environnement
├── 📄 .env.local.example            # Exemple env
├── 📄 next.config.js                # Config Next.js
├── 📄 tailwind.config.ts            # Config Tailwind
├── 📄 tsconfig.json                 # Config TypeScript
├── 📄 package.json                  # Dépendances
└── 📄 vercel.json                   # Config Vercel

```

---

## 🔄 Flux de Données

### 1. Architecture Client-Serveur

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Pages      │  │  Components  │  │   Lib/API    │      │
│  │   (app/)     │→ │ (components/)│→ │   (lib/)     │      │
│  └──────────────┘  └──────────────┘  └──────┬───────┘      │
└────────────────────────────────────────────┼────────────────┘
                                              │
                                    HTTP/HTTPS (Axios)
                                              │
┌─────────────────────────────────────────────┼────────────────┐
│                        BACKEND (Express)     ▼                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Routes     │→ │ Controllers  │→ │   Services   │      │
│  │ (src/routes) │  │(src/controllers)│(src/services)│      │
│  └──────────────┘  └──────────────┘  └──────┬───────┘      │
└────────────────────────────────────────────┼────────────────┘
                                              │
                                         Prisma ORM
                                              │
┌─────────────────────────────────────────────▼────────────────┐
│                    DATABASE (PostgreSQL)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │  Users   │ │   Cars   │ │ Bookings │ │ Payments │  ...  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└───────────────────────────────────────────────────────────────┘
```

### 2. Flux d'une Réservation

```
1. Client sélectionne voiture → /voitures/[id]
2. Choisit dates → DateRangePicker
3. Ajoute options → /booking/options
4. Sélectionne assurance → /booking/protection
5. Paiement → /booking/paiement → PaymentProcessor
6. API Backend → booking.controller.js → booking.service.js
7. Création réservation → Prisma → PostgreSQL
8. Notification email → notification.service.js
9. Redirection → /paiement/succes
```

---

## 🔐 Authentification & Autorisation

### Méthodes d'authentification
1. **Email/Password** - Classique avec JWT
2. **Google OAuth** - Connexion Google
3. **SMS/Phone** - Twilio OTP

### Rôles utilisateurs
- **CLIENT** - Utilisateur standard
- **ADMIN** - Administrateur complet
- **MANAGER** - Gestionnaire (si implémenté)

### Protection des routes
- **Frontend:** Vérification localStorage + redirection
- **Backend:** Middleware JWT + vérification rôle

---

## 💳 Système de Paiement

### Providers supportés
1. **Stripe** - Paiement carte international
2. **CMI** - Paiement local Maroc
3. **Cash** - Paiement sur place

### Flux paiement
```
Client → PaymentProviderSelector → PaymentProcessor
  → Stripe/CMI API → Webhook → payment.controller.js
  → Mise à jour statut → Notification client
```

---

## 🎁 Programme Fidélité

### Système de points
- **Bronze** - 0-999 points
- **Silver** - 1000-2999 points
- **Gold** - 3000-4999 points
- **Platinum** - 5000+ points

### Gains de points
- Réservation complétée
- Avis laissé
- Parrainage
- Bonus événements

---

## 📊 Base de Données (Prisma Schema)

### Modèles principaux
- **User** - Utilisateurs
- **Car** - Voitures
- **Brand** - Marques
- **Category** - Catégories
- **Booking** - Réservations
- **Payment** - Paiements
- **Invoice** - Factures
- **Review** - Avis
- **LoyaltyAccount** - Comptes fidélité
- **LoyaltyTransaction** - Transactions points
- **Maintenance** - Maintenance véhicules
- **Contract** - Contrats location

---

## 🚀 Scripts NPM

```bash
# Frontend (Next.js)
npm run dev          # Démarrer dev server
npm run build        # Build production
npm run start        # Démarrer production
npm run lint         # Linter

# Backend (Express)
npm run api:dev      # Démarrer API dev
npm run api:start    # Démarrer API production

# Database (Prisma)
npm run prisma:generate  # Générer client Prisma
npm run prisma:migrate   # Exécuter migrations
npm run prisma:studio    # Ouvrir Prisma Studio
npm run prisma:push      # Push schema

# Tests
npm run test         # Exécuter tests
npm run test:watch   # Tests en mode watch
npm run test:coverage # Coverage tests
```

---

## 🌐 Variables d'Environnement

### Essentielles
```env
# Database
DATABASE_URL="postgresql://..."

# JWT
JWT_SECRET="..."
JWT_EXPIRES_IN="7d"

# Stripe
STRIPE_SECRET_KEY="sk_..."
STRIPE_PUBLISHABLE_KEY="pk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Twilio SMS
TWILIO_ACCOUNT_SID="..."
TWILIO_AUTH_TOKEN="..."
TWILIO_PHONE_NUMBER="..."

# Email (Nodemailer)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="..."
EMAIL_PASSWORD="..."

# CMI Payment
CMI_MERCHANT_ID="..."
CMI_API_KEY="..."

# App
NEXT_PUBLIC_API_URL="http://localhost:3000"
NODE_ENV="development"
```

---

## 📝 Notes Importantes

### ⚠️ Fichiers obsolètes
- **`front_end.jsx`** - Ancien prototype React standalone (45KB)
  - Non utilisé dans l'application actuelle
  - Peut être archivé ou supprimé

### 🔧 Maintenance
- Migrations DB dans `prisma/migrations/`
- Backups dans `backups/`
- Scripts utilitaires dans `scripts/`

### 🎨 Design System
- **Couleurs principales:** Noir (#000000), Rouge (#ff003c)
- **Typographie:** Font-black, italic, uppercase
- **Animations:** Framer Motion
- **Responsive:** Mobile-first avec Tailwind

---

## 🔗 Intégrations Externes

1. **Stripe** - Paiements internationaux
2. **CMI** - Paiements Maroc
3. **Google OAuth** - Authentification
4. **Twilio** - SMS OTP
5. **Nodemailer** - Emails transactionnels
6. **Unsplash** - Images (à remplacer par images locales)

---

## 📚 Documentation Additionnelle

- `README.md` - Documentation générale
- `ADMIN_COMPLETE_GUIDE.md` - Guide admin
- `ADMIN_SYSTEM_DOCUMENTATION.md` - Documentation système admin
- `README_BOOKING_SYSTEM.md` - Système de réservation
- `README_MIGRATION_CMI.md` - Migration CMI

---

## 🎯 Prochaines Étapes Recommandées

1. ✅ Remplacer images Unsplash par images locales
2. ✅ Archiver/Supprimer `front_end.jsx`
3. 🔄 Optimiser les images (Next.js Image Optimization)
4. 🔄 Ajouter tests E2E (Playwright/Cypress)
5. 🔄 Documenter API avec Swagger
6. 🔄 Mettre en place CI/CD
7. 🔄 Monitoring et logs (Sentry, LogRocket)

---

**Dernière mise à jour:** 27 Décembre 2025
**Version:** 1.0.0
**Auteur:** Équipe Tommobilty
