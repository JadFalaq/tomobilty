# CLEANUP_PLAN.md (dry-run)

Date: 2025-12-27

## 1) Résumé

Le repo est un “monolithe” qui mélange :

- Frontend Next.js App Router dans `app/` + composants dans `components/` + helpers dans `lib/`.
- Backend Express dans `src/` avec un point d’entrée API recommandé `api/index.js` (script `npm run api:dev`).

Constats principaux (à corriger progressivement, sans casser le build) :

- Deux “Navbars” (et deux philosophies de layout) co-existent : `components/ui/Navbar.tsx` (utilisé par `components/AppShell.tsx` dans `app/layout.tsx`) et `components/Navbar.tsx` (importé dans la majorité des pages). Résultat : incohérence UI + risque de double header / padding.
- Deux tentatives d’API existent côté Next : `app/api/*` (Next Route Handlers) et `app/api/index.js` (Express monolithique) alors que l’API Express réelle tourne via `api/index.js`. `app/api/index.js` semble non-fonctionnel (imports `./routes/*` inexistants).
- Plusieurs dossiers/fichiers sont clairement “prototype / debug / backup” : `backups/`, `app/test-voitures/`, `car_images_by_id/`, `images/`, `prisma/schema.prisma.backup`, `tsconfig.tsbuildinfo`, et des artefacts `.next/`.
- Le client API `lib/api.ts` n’est pas entièrement aligné sur les routes Express actuelles (ex: `oauthGoogle`, `startPhone`, `confirmerReservation`).

Objectif du nettoyage (Phase D) :

- Conserver une seule source de vérité pour le layout (Navbar/Footer), et une seule stratégie d’API (Express via `api/index.js`).
- Archiver tout ce qui est prototype/backup avant suppression finale.

## 2) Mini cartographie

### 2.1 Pages Next.js (App Router)

Routes détectées via `app/**/page.tsx` :

| Route                    | Fichier                              |
| ------------------------ | ------------------------------------ |
| `/`                      | `app/page.tsx`                       |
| `/403`                   | `app/403/page.tsx`                   |
| `/a-propos`              | `app/a-propos/page.tsx`              |
| `/admin`                 | `app/admin/page.tsx`                 |
| `/admin/bookings`        | `app/admin/bookings/page.tsx`        |
| `/admin/cars`            | `app/admin/cars/page.tsx`            |
| `/admin/chat`            | `app/admin/chat/page.tsx`            |
| `/admin/documents`       | `app/admin/documents/page.tsx`       |
| `/admin/loyalty`         | `app/admin/loyalty/page.tsx`         |
| `/admin/maintenance`     | `app/admin/maintenance/page.tsx`     |
| `/admin/notifications`   | `app/admin/notifications/page.tsx`   |
| `/admin/payments`        | `app/admin/payments/page.tsx`        |
| `/admin/promotions`      | `app/admin/promotions/page.tsx`      |
| `/admin/reviews`         | `app/admin/reviews/page.tsx`         |
| `/admin/settings`        | `app/admin/settings/page.tsx`        |
| `/admin/users`           | `app/admin/users/page.tsx`           |
| `/booking/options`       | `app/booking/options/page.tsx`       |
| `/booking/paiement`      | `app/booking/paiement/page.tsx`      |
| `/booking/protection`    | `app/booking/protection/page.tsx`    |
| `/conditions`            | `app/conditions/page.tsx`            |
| `/connexion`             | `app/connexion/page.tsx`             |
| `/contact`               | `app/contact/page.tsx`               |
| `/inscription`           | `app/inscription/page.tsx`           |
| `/loyalty`               | `app/loyalty/page.tsx`               |
| `/mes-reservations`      | `app/mes-reservations/page.tsx`      |
| `/mes-reservations/[id]` | `app/mes-reservations/[id]/page.tsx` |
| `/paiement/annule`       | `app/paiement/annule/page.tsx`       |
| `/paiement/erreur`       | `app/paiement/erreur/page.tsx`       |
| `/paiement/succes`       | `app/paiement/succes/page.tsx`       |
| `/payments/return`       | `app/payments/return/page.tsx`       |
| `/profil`                | `app/profil/page.tsx`                |
| `/test-voitures`         | `app/test-voitures/page.tsx`         |
| `/voitures`              | `app/voitures/page.tsx`              |
| `/voitures/disponibles`  | `app/voitures/disponibles/page.tsx`  |
| `/voitures/[id]`         | `app/voitures/[id]/page.tsx`         |

Layouts détectés :

- Root layout : `app/layout.tsx` (utilise `components/AppShell.tsx` + `components/ChatBot.tsx`)
- Admin layout : `app/admin/layout.tsx`

### 2.2 Composants réellement importés (depuis `app/`)

Imports directs trouvés :

- `components/home/HomeView.tsx` (home)
- `components/cars/CarsPage.tsx` (listing voitures)
- `components/bookings/BookingsPage.tsx` (mes réservations)
- `components/VoitureCard.tsx` (voitures disponibles)
- `components/DateRangePicker.tsx` (détail voiture)
- `components/BookingPriceSummary.tsx` (booking options/protection/paiement)
- `components/PaymentProcessor.tsx` (détail voiture)
- `components/admin/Table.tsx` (quasi toutes les pages admin listées)
- `components/AppShell.tsx` (root layout)
- `components/ChatBot.tsx` (root layout)
- `components/Navbar.tsx` + `components/Footer.tsx` (beaucoup de pages, sauf la home qui a son propre footer inline dans `app/page.tsx`)

Composants présents mais “probablement non utilisés” (aucun import depuis `app/` observé) :

- `components/AnimatedIntro.tsx`
- `components/VideoIntro.tsx`
- `components/PaymentProviderSelector.tsx`
- `components/admin/*` sauf `components/admin/Table.tsx` (à confirmer en Phase B quand on refactor le frontend)
- `components/ui/SectionTitle.tsx` (utilisé par des composants, pas importé directement par `app/`)
- `components/ui/Navbar.tsx` (utilisé indirectement via `components/AppShell.tsx`)

### 2.3 Backend Express (routes réelles)

Entrée API utilisée par scripts :

- `api/index.js` (script `npm run api:dev` / `npm run api:start`)

Routes montées dans `api/index.js` :

- `/api/auth` → `src/routes/auth.routes.js`
- `/api/users` → `src/routes/user.routes.js`
- `/api/cars` → `src/routes/car.routes.js`
- `/api/bookings` → `src/routes/booking.routes.js`
- `/api/loyalty` → `src/routes/loyalty.routes.js`
- `/api/payments` → `src/routes/payment.routes.js`
- `/api/contracts` → `src/routes/contract.routes.js`
- `/api/reviews` → `src/routes/review.routes.js`
- `/api/admin` → `src/routes/admin.routes.complete.js`
- `/api/test` → `src/routes/test.routes.js`
- `/api/protections` → `src/routes/protection.routes.js`
- `/api/pickup-sites` → `src/routes/pickupsite.routes.js`

Résumé des endpoints clés (non exhaustif mais couvrant les features FRONT) :

- Auth (`src/routes/auth.routes.js`)
  - `POST /api/auth/register` + alias `POST /api/auth/inscription`
  - `POST /api/auth/login` + alias `POST /api/auth/connexion`
  - `POST /api/auth/send-phone-code`, `POST /api/auth/verify-phone`
  - `POST /api/auth/google`
  - `GET /api/auth/me`, `PUT /api/auth/profile`
- Cars (`src/routes/car.routes.js`)
  - `GET /api/cars`, `GET /api/cars/:id`, `GET /api/cars/available`, `GET /api/cars/:id/availability`
- Bookings (`src/routes/booking.routes.js`)
  - `POST /api/bookings` (création)
  - `GET /api/bookings/me`, `GET /api/bookings/me/:bookingId`
  - `DELETE /api/bookings/me/:bookingId`
  - `POST /api/bookings/:bookingId/confirm-agence`
  - `POST /api/bookings/quote`
- Protections (`src/routes/protection.routes.js`)
  - `GET /api/protections`
- Pickup sites (`src/routes/pickupsite.routes.js`)
  - `GET /api/pickup-sites`
- Payments (`src/routes/payment.routes.js`)
  - `POST /api/payments/create`
  - `GET|POST /api/payments/return`
  - `GET /api/payments/providers/info`

Routes backend potentiellement “dead code” (présentes mais non montées dans `api/index.js`) :

- `src/routes/webhook.routes.js` (pas de `/api/webhooks` monté)
- `src/routes/admin.routes.js` (non utilisé; l’API admin réelle est `admin.routes.complete.js`)

### 2.4 Next API routes (à clarifier)

Présents dans `app/api/` :

- `app/api/route.js` (health/info Next)
- `app/api/auth/inscription/route.js` (semble non aligné avec l’arborescence, imports relatifs vers `app/api/config/*` inexistants)
- `app/api/index.js` (Express “monolithique Vercel” qui référence `./routes/*` inexistants)

Conclusion : pour éviter conflit et confusion, la source de vérité API doit être `api/index.js` (Express) et `app/api/*` doit être soit supprimé/archivé, soit réduit à des endpoints Next réellement utilisés (Phase D).

## 3) Plan de nettoyage (dry-run)

Convention d’archive proposée :

- `/_archive/2025-12-27_phaseA/…` (avec sous-dossiers `frontend/`, `backend/`, `assets/`, `misc/`)

### 3.1 KEEP (garder)

- `app/` (frontend Next.js)
- `components/` (source des composants)
- `lib/` (client API + utils)
- `src/` (backend Express)
- `api/index.js` (entrée API Express)
- `prisma/migrations/**` + `prisma/schema.prisma`
- `public/` (assets servis par Next)
- `scripts/` (scripts utilitaires)
- `docs/` (docs d’intégration)
- `README.md`, `ARCHITECTURE.md` (à raffiner en Phase D)

### 3.2 MOVE_TO_ARCHIVE (avant toute suppression)

Prototypes / debug / backups :

- `backups/stripe-backup-1766578927473/` (backup Stripe)
- `app/test-voitures/` (page debug API)
- `car_images_by_id/` (duplique `public/cars/` et non référencé)
- `images/` (logos potentiellement dupliqués avec `public/`)
- `database/*.loo` (fichiers de modélisation, si plus utilisés)

API Next “monolithique” potentiellement cassée :

- `app/api/index.js` (Express “Vercel” non fonctionnel)
- `app/api/auth/inscription/route.js` (imports relatifs incohérents)

Fichiers “backup/artefacts” :

- `prisma/schema.prisma.backup`
- `.next/` (si présent dans le repo; sinon à ignorer localement)
- `tsconfig.tsbuildinfo`

Code backend probablement non utilisé (à confirmer via recherche d’imports) :

- `src/routes/webhook.routes.js` + `src/controllers/webhook.controller.js` (si réellement non montés)
- `src/routes/admin.routes.js`

### 3.3 DELETE (seulement après archive + validation)

- Artefacts build : `.next/**` (si commités), `tsconfig.tsbuildinfo`
- Fichiers “\*.old” dans `.next/cache/**` (artefacts)

## 4) Risques + comment tester

### Risques identifiés

- Frontend : double système de navigation (RootLayout via `AppShell` + pages qui injectent `components/Navbar.tsx` + `pt-[72px]` global) → collisions UI.
- API : `lib/api.ts` contient des chemins non alignés avec Express (`authAPI.oauthGoogle`, `authAPI.startPhone`, `reservationsAPI.confirmerReservation`) → erreurs 404 / flux incomplet.
- Sécurité : présence de `.env` à la racine (risque de commit de secrets). À traiter en Phase D (sans exposer de secrets).
- Next API : `app/api/index.js` et `app/api/auth/inscription/route.js` peuvent casser si importés/activés par mégarde.

### Tests/commandes à exécuter après Phase A (aucun code déplacé dans cette phase)

Frontend :

- `npm run lint`
- `npm run build`

Backend :

- `npm run test`
- `npm run api:dev`
  - Tester rapidement : `GET http://localhost:5000/api/health`
  - Tester rapidement : `GET http://localhost:5000/api/cars`
