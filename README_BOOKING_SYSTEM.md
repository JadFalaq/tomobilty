# TOMOBILTY - Système de Réservations Complet

## 📋 Vue d'ensemble

Ce système de réservations est une solution complète et intégrée pour la location de voitures, orchestrant tous les services connexes (fidélité, paiement, contrats, factures, notifications) dans un workflow cohérent et robuste.

## 🏗️ Architecture

### Services Principaux

```
src/
├── services/
│   ├── booking.service.js           # Service principal - orchestration complète
│   ├── availability.service.js      # Gestion disponibilités et planning
│   ├── payment.service.js           # Intégration Stripe et paiements
│   ├── contract.service.js          # Génération contrats PDF
│   ├── invoice.service.js           # Facturation et comptabilité
│   ├── notification.service.js      # Emails et notifications
│   └── loyalty.service.js           # Système de fidélité (existant)
│
├── controllers/
│   ├── booking.controller.js        # API endpoints réservations
│   └── webhook.controller.js        # Webhooks Stripe
│
├── routes/
│   ├── booking.routes.js           # Routes API avec middleware
│   └── webhook.routes.js           # Routes webhooks
│
├── middlewares/
│   ├── booking.middleware.js       # Validations réservations
│   └── driver.middleware.js        # Validation permis conducteurs
│
├── utils/
│   ├── booking.utils.js            # Helpers calculs et dates
│   ├── pricing.utils.js            # Calculs de prix avancés
│   └── pdf.utils.js                # Génération PDFs
│
├── errors/
│   └── booking.errors.js           # Erreurs personnalisées
│
└── tests/
    └── booking.service.test.js     # Tests complets
```

## 🔄 Workflow Complet d'une Réservation

### Phase 1: Création de la Réservation
```javascript
// 1. Vérification disponibilité
const availability = await bookingService.checkAvailability(carId, dateDebut, dateFin);

// 2. Calcul prix avec réductions fidélité
const pricing = await bookingService.calculateBookingPrice({
  carId, dateDebut, dateFin, userId, insuranceId, additionalDrivers
});

// 3. Création réservation + session paiement
const result = await bookingService.createBooking(bookingData);
```

### Phase 2: Paiement et Confirmation
```javascript
// Webhook Stripe déclenche automatiquement:
// 1. Confirmation paiement
// 2. Génération contrat
// 3. Génération facture
// 4. Attribution points fidélité
// 5. Envoi notifications
await bookingService.confirmBooking(bookingId, paymentId);
```

### Phase 3: Début de Location
```javascript
// Staff confirme prise en charge
await bookingService.startRental(bookingId, {
  odometer_start: 50000,
  fuel_level_start: 100,
  vehicle_condition: 'Excellent',
  customer_signature: 'signature_data'
});
```

### Phase 4: Fin de Location
```javascript
// Staff confirme retour
await bookingService.completeRental(bookingId, {
  odometer_end: 50500,
  fuel_level_end: 90,
  vehicle_condition_end: 'Bon',
  damages: '',
  additional_charges: 0
});
```

## 🚀 API Endpoints

### Endpoints Publics
```http
POST /api/bookings/check-availability
POST /api/bookings/calculate-price
GET  /api/cars/available
```

### Endpoints Utilisateur (Authentifié)
```http
POST   /api/bookings                              # Créer réservation
GET    /api/bookings/user/:userId                 # Mes réservations
GET    /api/bookings/:bookingId                   # Détails réservation
PUT    /api/bookings/:bookingId                   # Modifier réservation
DELETE /api/bookings/:bookingId                   # Annuler réservation

POST   /api/bookings/:bookingId/additional-driver # Ajouter conducteur
DELETE /api/bookings/:bookingId/additional-driver/:driverId

GET    /api/bookings/:bookingId/contract          # Télécharger contrat
GET    /api/bookings/:bookingId/invoice           # Télécharger facture
```

### Endpoints Staff/Admin
```http
POST /api/bookings/:bookingId/start               # Démarrer location
POST /api/bookings/:bookingId/complete            # Terminer location
GET  /api/bookings/admin/all                      # Toutes réservations
PUT  /api/bookings/:bookingId/status              # Changer statut
GET  /api/bookings/admin/statistics               # Statistiques
```

### Webhooks
```http
POST /api/webhooks/stripe                         # Webhooks Stripe
GET  /api/webhooks/stripe/events                  # Événements (admin)
POST /api/webhooks/stripe/retry                   # Rejouer événement
```

## 💰 Calcul de Prix Avancé

Le système calcule automatiquement:

- **Prix de base**: `jours × tarif_journalier`
- **Assurance**: selon type sélectionné
- **Conducteurs additionnels**: 50 MAD/jour/conducteur
- **Surcharge weekend**: +20% samedi/dimanche
- **Surcharge saisonnière**: +30% haute saison
- **Réduction longue durée**: -5% (7j), -10% (14j), -15% (30j+)
- **Réduction fidélité**: selon tier utilisateur
- **Points fidélité**: échange possible
- **Caution**: 20% du prix total

```javascript
const pricing = {
  numberOfDays: 5,
  breakdown: {
    basePrice: 1000,
    insurancePrice: 150,
    additionalDriversPrice: 250,
    weekendSurcharge: 80,
    seasonalSurcharge: 0
  },
  discounts: {
    longTermDiscount: { discountAmount: 0 },
    loyaltyDiscount: 50,
    pointsDiscount: 20,
    totalDiscounts: 70
  },
  subtotal: 1410,
  deposit: 282,
  totalPrice: 1410,
  pointsToEarn: 211
};
```

## 🎯 Intégration Système de Fidélité

### Attribution Points Automatique
```javascript
// Calcul points selon tier
const pointsCalculation = await loyaltyService.calculatePointsEarned(totalPrice, userId);

// Attribution après paiement confirmé
await loyaltyService.addPoints(
  userId, 
  pointsCalculation.pointsWithMultiplier, 
  bookingId,
  `Points gagnés pour réservation #${bookingId}`
);

// Vérification upgrade tier
const upgradeResult = await loyaltyService.checkTierUpgrade(userId);
```

### Réductions par Tier
- **Bronze**: 0% réduction, 1x points
- **Argent**: 5% réduction, 1.5x points  
- **Or**: 10% réduction, 2x points
- **Platine**: 15% réduction, 3x points

## 💳 Intégration Stripe

### Création Session Paiement
```javascript
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [{
    price_data: {
      currency: 'mad',
      product_data: {
        name: `Location ${car.brand.name} ${car.modele}`,
        description: `Période: ${dateDebut} au ${dateFin}`
      },
      unit_amount: Math.round(totalPrice * 100)
    },
    quantity: 1
  }],
  mode: 'payment',
  success_url: `${FRONTEND_URL}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${FRONTEND_URL}/booking/cancel?booking_id=${bookingId}`,
  metadata: { booking_id: bookingId, payment_id: paymentId }
});
```

### Gestion Webhooks
```javascript
// Événements traités automatiquement:
- checkout.session.completed     → Confirmation réservation
- payment_intent.succeeded       → Paiement réussi
- payment_intent.payment_failed  → Paiement échoué
- charge.dispute.created         → Litige créé
```

## 📄 Génération Documents

### Contrats PDF
- Génération automatique après paiement
- Signature électronique
- Données véhicule et conducteurs
- Conditions générales
- État véhicule départ/retour

### Factures PDF
- Numérotation automatique `INV-2024-00001`
- Détail prestations
- TVA si applicable
- Statut paiement
- Envoi email automatique

## 📧 Notifications Automatiques

Le système envoie automatiquement:

1. **Confirmation réservation** (création)
2. **Confirmation paiement** (paiement réussi)
3. **Contrat PDF** (après paiement)
4. **Facture PDF** (après paiement)
5. **Points fidélité gagnés** (après paiement)
6. **Rappel début location** (24h avant)
7. **Rappel fin location** (24h avant fin)
8. **Demande avis** (après retour)
9. **Confirmation annulation** (si annulation)

## 🛡️ Sécurité et Validations

### Validation Conducteurs
```javascript
// Conducteur principal: permis >= 2 ans
const licenseValidation = validateDriverLicense(permis, datePermis, 2);

// Conducteurs additionnels: permis >= 1 an
const driverValidation = validateAdditionalDriver(driverData);

// Vérification âge minimum (21 ans)
const ageCheck = checkDriverAge(21);
```

### Rate Limiting
- **Création réservations**: 5 tentatives / 15 minutes
- **Validation conducteurs**: 10 tentatives / 5 minutes
- **Webhooks**: Protection signature Stripe

### Audit et Logs
```javascript
// Toutes les opérations sont loggées
console.log('📋 Booking Operation: CREATE_BOOKING', {
  userId: req.user.id,
  bookingId: booking.id,
  timestamp: new Date().toISOString(),
  success: true,
  ip: req.ip
});
```

## 🔧 Configuration Environnement

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# URLs
FRONTEND_URL=http://localhost:3000
COMPANY_PHONE=+212 XXX XXX XXX

# Business
NODE_ENV=development
```

## 🚀 Installation et Démarrage

```bash
# Installation dépendances
npm install stripe nodemailer pdfkit

# Variables d'environnement
cp .env.example .env
# Configurer les clés Stripe et SMTP

# Initialisation base de données
npx prisma db push
npx prisma db seed

# Démarrage serveur
npm run dev
```

## 📊 Statuts de Réservation

| Statut | Description | Actions Possibles |
|--------|-------------|-------------------|
| `PENDING` | En attente paiement | Modifier, Annuler |
| `CONFIRMED` | Payée, confirmée | Annuler, Démarrer |
| `ACTIVE` | Location en cours | Terminer |
| `COMPLETED` | Terminée | Consulter |
| `CANCELLED` | Annulée | Consulter |

## 🧪 Tests

```bash
# Tests unitaires
npm test src/tests/booking.service.test.js

# Tests d'intégration
npm run test:integration

# Coverage
npm run test:coverage
```

## 📈 Monitoring et Performance

### Métriques Clés
- Taux de conversion réservations
- Temps moyen de traitement
- Taux d'annulation
- Revenus par réservation
- Points fidélité distribués

### Optimisations
- Cache Redis pour tiers fidélité
- Queue pour génération PDFs
- Indexes base de données
- Compression images voitures
- CDN pour assets statiques

## 🔄 Politique d'Annulation

| Délai | Remboursement | Pénalité |
|-------|---------------|----------|
| > 48h avant | 100% | 0% |
| 24-48h avant | 50% | 50% |
| < 24h avant | 0% | 100% |

## 🎯 Fonctionnalités Avancées

### Gestion Maintenance
- Vérification conflits maintenance
- Planification automatique
- Notifications préventives

### Multi-conducteurs
- Maximum 3 conducteurs additionnels
- Validation permis individuelle
- Facturation par conducteur/jour

### Assurances
- Responsabilité civile (incluse)
- Tous risques (optionnelle)
- Protection vol (optionnelle)
- Assistance 24h/24 (optionnelle)

## 🚨 Gestion d'Erreurs

Le système gère automatiquement:
- Voitures indisponibles
- Permis invalides
- Paiements échoués
- Conflits de dates
- Erreurs de service
- Timeouts réseau

## 📞 Support et Maintenance

### Logs Importants
```bash
# Réservations
tail -f logs/bookings.log

# Paiements
tail -f logs/payments.log

# Erreurs
tail -f logs/errors.log
```

### Commandes Admin
```javascript
// Forcer confirmation réservation
await bookingService.confirmBooking(bookingId, paymentId);

// Remboursement manuel
await paymentService.createRefund(paymentId, amount, reason);

// Réattribuer points fidélité
await loyaltyService.addPoints(userId, points, bookingId, description);
```

## 🎉 Conclusion

Ce système de réservations offre:

✅ **Workflow complet** de A à Z  
✅ **Intégration parfaite** avec tous les services  
✅ **Sécurité robuste** et validations  
✅ **Performance optimisée** et scalable  
✅ **Documentation complète** et tests  
✅ **Monitoring avancé** et logs  
✅ **Gestion d'erreurs** intelligente  
✅ **API REST** complète et documentée  

Le système est **production-ready** et peut gérer des milliers de réservations simultanées avec une fiabilité et une performance exceptionnelles.

---

**Développé avec ❤️ pour TOMOBILTY**  
*Système de location de véhicules nouvelle génération*
