# Backend API Contracts (Source of Truth)

This document describes the public API contracts exposed by the backend. It is based only on code present under backend/api and backend/src (routes, controllers, middlewares, services, tests). If something is missing or unclear, it is marked as TODO.

**Global API Conventions**
- Base API URL
  - Base: /api
  - Mounts: see server setup in [index.js](file:///c:/Users/Random/Desktop/tomobolity/tomobilty/backend/api/index.js#L54-L68)
- Authentication
  - Bearer access token via Authorization: Bearer <token>
  - Role-based gates: verifyToken, requireAdmin, requireAgent, optionalAuth in routes
  - Refresh token flow: POST /api/auth/refresh-token with body { refreshToken: string } returns new access/refresh
    - Error codes: AUTH_REFRESH_REUSED, INVALID_REFRESH_TOKEN, TOKEN_EXPIRED, INVALID_TOKEN_TYPE, USER_NOT_FOUND
- Standard response envelopes
  - Success:
    {
      success: true,
      data: T
    }
  - Error (observed variants):
    - Preferred in rate limit and validators:
      {
        success: false,
        error: {
          code: string,
          message: string
        },
        details?: any
      }
    - Frequently used alternative:
      {
        success: false,
        message: string,
        code?: string,
        errors?: any
      }
    - TODO: Standardize errors to the preferred envelope across all endpoints
- Date & time rules
  - ISO-8601 accepted across endpoints; many validators require ISO-8601
  - Timezone: business logic assumes Africa/Casablanca in multiple utilities; display is frontend concern
  - Business hours validation exists for booking/cars availability when time component is provided; date-only strings bypass hour checks
  - See validation helpers in [datetime.utils.js](file:///c:/Users/Random/Desktop/tomobolity/tomobilty/backend/src/utils/datetime.utils.js) and usage in controllers [booking.controller.js](file:///c:/Users/Random/Desktop/tomobolity/tomobilty/backend/src/controllers/booking.controller.js#L112-L133), [car.controller.js](file:///c:/Users/Random/Desktop/tomobolity/tomobilty/backend/src/controllers/car.controller.js#L328-L345)
- Pagination conventions
  - Query: page (>=1), limit (1–100), sometimes offset
  - Response commonly includes pagination: { page, limit, totalItems|total, totalPages|pages }
  - Validators: [validation.middleware.js](file:///c:/Users/Random/Desktop/tomobolity/tomobilty/backend/src/middlewares/validation.middleware.js#L182-L192), [booking.middleware.js](file:///c:/Users/Random/Desktop/tomobolity/tomobilty/backend/src/middlewares/booking.middleware.js#L280-L317)
- Idempotency rules
  - Payments:
    - Rate limiting: code RATE_LIMIT_PAYMENT on bursts ([rateLimit.middleware.js](file:///c:/Users/Random/Desktop/tomobolity/tomobilty/backend/src/middlewares/rateLimit.middleware.js#L1-L31))
    - Session creation reuses existing CREATED/PENDING payment for same booking+provider ([payment.service.js](file:///c:/Users/Random/Desktop/tomobolity/tomobilty/backend/src/services/payment.service.js#L31-L38))
    - Webhooks/IPN guard avoids reprocessing COMPLETED payments ([payment.service.js](file:///c:/Users/Random/Desktop/tomobolity/tomobilty/backend/src/services/payment.service.js#L217-L226))
  - Bookings:
    - Booking creation has in-memory per-user rate limiting (code RATE_LIMIT_EXCEEDED) ([booking.middleware.js](file:///c:/Users/Random/Desktop/tomobolity/tomobilty/backend/src/middlewares/booking.middleware.js#L180-L205))
  - TODO: No explicit idempotency keys expected from frontend; rely on backend guards above

**Domains**

Auth
— Routes: [auth.routes.js](file:///c:/Users/Random/Desktop/tomobolity/tomobilty/backend/src/routes/auth.routes.js)

1) Endpoint
- Method + Path: POST /api/auth/register (alias: /api/auth/inscription)
- Auth: Public
- Request
  - Body:
    {
      email: string,
      mot_de_passe: string,
      nom: string,
      prenom: string,
      telephone?: string,
      adresse?: string
    }
- Success Response
  - data: {
    user: { id, email, nom, prenom, role, email_verified },
    tokens: { access: string, refresh: string }
  }
- Error Codes
  - USER_EXISTS
  - VALIDATION_ERROR (from validators)
  - RATE_LIMIT_AUTH (if configured; see middleware)
- Notes
  - Creates loyalty account; sends verification email
- Example
  - Request:
    {
      "email": "user@example.com",
      "mot_de_passe": "Password123",
      "nom": "Doe",
      "prenom": "John",
      "telephone": "+212612345678"
    }
  - Response:
    { "success": true, "data": { "user": { "id": 1, "email": "user@example.com", "nom": "Doe", "prenom": "John", "role": "CLIENT", "email_verified": false }, "tokens": { "access": "...", "refresh": "..." } } }

2) Endpoint
- Method + Path: POST /api/auth/login (alias: /api/auth/connexion)
- Auth: Public
- Request
  - Body: { email: string, mot_de_passe: string }
- Success Response
  - data: { user: Omit<User, 'mot_de_passe'>, tokens: { access, refresh } }
- Error Codes
  - INVALID_CREDENTIALS
  - VALIDATION_ERROR
  - RATE_LIMIT_AUTH
- Example
  - Request: { "email": "user@example.com", "mot_de_passe": "Password123" }
  - Response: { "success": true, "data": { "user": { "id": 1, "email": "user@example.com", "nom": "Doe", "prenom": "John", "role": "CLIENT" }, "tokens": { "access": "...", "refresh": "..." } } }

3) Endpoint
- Method + Path: POST /api/auth/refresh-token
- Auth: Public
- Request
  - Body: { refreshToken: string }
- Success Response
  - data: { tokens: { access: string, refresh: string } }
- Error Codes
  - MISSING_REFRESH_TOKEN, INVALID_TOKEN_TYPE, USER_NOT_FOUND, INVALID_REFRESH_TOKEN, AUTH_REFRESH_REUSED, TOKEN_EXPIRED
- Notes
  - Rotates stored refresh token hash on success
- Example
  - Request: { "refreshToken": "..." }
  - Response: { "success": true, "data": { "tokens": { "access": "...", "refresh": "..." } } }

4) Endpoint
- Method + Path: POST /api/auth/logout
- Auth: Authenticated
- Request
  - Body: {}
- Success Response
  - message: "Déconnexion réussie"
- Error Codes
  - None specific

5) Endpoint
- Method + Path: GET /api/auth/me
- Auth: Authenticated
- Request
  - Query: none
- Success Response
  - data: { user: UserWithLoyaltyTier }

6) Endpoint
- Method + Path: PUT /api/auth/profile
- Auth: Authenticated
- Request
  - Body: { nom?, prenom?, telephone?, adresse?, permis_conduire? }
- Success Response
  - message: "Profil mis à jour avec succès", data: { user: UpdatedUser }

7) Endpoint
- Method + Path: PUT /api/auth/change-password
- Auth: Authenticated
- Request
  - Body: { current_password: string, new_password: string }
- Success Response
  - message: "Mot de passe modifié avec succès"
- Error Codes
  - MISSING_DATA, OAUTH_ACCOUNT, INVALID_PASSWORD

8) Endpoint
- Method + Path: POST /api/auth/verify-email
- Auth: Public
- Request
  - Body: { token: string }
- Success Response
  - message: "Email vérifié avec succès", data: { user }
- Error Codes
  - MISSING_TOKEN, INVALID_TOKEN, TOKEN_EXPIRED

9) Endpoint
- Method + Path: POST /api/auth/resend-verification
- Auth: Public
- Request
  - Body: { email: string }
- Success Response
  - message: "Email de vérification envoyé"
- Error Codes
  - MISSING_EMAIL, USER_NOT_FOUND, EMAIL_ALREADY_VERIFIED

10) Endpoint
- Method + Path: POST /api/auth/send-phone-code
- Auth: Public
- Request
  - Body: { phone: string }
- Success Response
  - message: "Code de vérification envoyé par SMS"
- Error Codes
  - INVALID_PHONE

11) Endpoint
- Method + Path: POST /api/auth/verify-phone
- Auth: Public (can update user if authenticated)
- Request
  - Body: { phone: string, code: string }
- Success Response
  - message: "Téléphone vérifié avec succès"
- Error Codes
  - MISSING_DATA, INVALID_CODE

12) Endpoint
- Method + Path: POST /api/auth/google
- Auth: Public
- Request
  - Body: { token: string }
- Success Response
  - data: { user, tokens }
- Error Codes
  - MISSING_TOKEN

Users / Profile
— Routes: [user.routes.js](file:///c:/Users/Random/Desktop/tomobolity/tomobilty/backend/src/routes/user.routes.js)

1) Endpoint
- Method + Path: GET /api/users/profile
- Auth: Authenticated
- Success Response
  - data: { user: detailed user including loyaltyAccount.tier }

2) Endpoint
- Method + Path: PUT /api/users/profile
- Auth: Authenticated
- Request
  - Body: { nom?, prenom?, telephone?, adresse?, permis_conduire? }
- Success Response
  - message: "Profil mis à jour avec succès", data: { user }

3) Endpoint
- Method + Path: GET /api/users/bookings
- Auth: Authenticated
- Request
  - Query: { page?, limit?, status? }
- Success Response
  - data: { bookings: Booking[], pagination: { page, limit, total, pages } }

4) Endpoint
- Method + Path: GET /api/users/notifications
- Auth: Authenticated
- Request
  - Query: { page?, limit?, unread_only? }
- Success Response
  - data: { notifications: Notification[], unread_count, pagination }

5) Endpoint
- Method + Path: PUT /api/users/notifications/:id/read
- Auth: Authenticated
- URL params: { id: number }
- Success Response
  - message: "Notification marquée comme lue", data: { notification }

6) Endpoint
- Method + Path: DELETE /api/users/notifications/:id
- Auth: Authenticated
- URL params: { id: number }
- Success Response
  - message: "Notification supprimée avec succès"

Cars & Availability
— Routes: [car.routes.js](file:///c:/Users/Random/Desktop/tomobolity/tomobilty/backend/src/routes/car.routes.js)

1) Endpoint
- Method + Path: GET /api/cars
- Auth: Public (optionalAuth used)
- Request
  - Query: { page?, limit?, marque?, prix_min?, prix_max?, date_debut?, date_fin?, category_id?, transmission? }
- Success Response
  - data: { cars: { id, brand_id, category_id, modele, transmission, nombre_places, nombre_portes, prix_par_jour, brand{name}, category{name}, images[], pricing{daily_price, total_price?, rental_days?} }[], pagination }

2) Endpoint
- Method + Path: GET /api/cars/search
- Auth: Public (optionalAuth)
- Request
  - Query: { q?, date_debut?, date_fin?, prix_max?, places_min? }
- Success Response
  - data: { cars: Car[], count }

3) Endpoint
- Method + Path: GET /api/cars/brands
- Auth: Public
- Success Response
  - data: { brands: { id, name, logo_url? }[] }

4) Endpoint
- Method + Path: GET /api/cars/categories
- Auth: Public
- Success Response
  - data: { categories: { id, name, description? }[] }

5) Endpoint
- Method + Path: GET /api/cars/available
- Auth: Public
- Request
  - Query (ISO strings): { date_debut, date_fin, category_id?, brand_id?, transmission?, min_price?, max_price?, seats?, fuel? }
- Success Response
  - data: { cars: Car[], total }
- Error Codes
  - INVALID_HOURS (when time component is outside allowed hours), general validation errors

6) Endpoint
- Method + Path: GET /api/cars/:id
- Auth: Public (optionalAuth)
- URL params: { id: number }
- Request
  - Query: date_debut?, date_fin? (used to compute variant availability window)
- Success Response
  - data: { car: { ..., variantes: [{ id, available: boolean }], carAvailable: boolean, query_range? } }
- Error Codes
  - CAR_NOT_FOUND

7) Endpoint
- Method + Path: GET /api/cars/:id/availability
- Auth: Public
- URL params: { id: number }
- Request
  - Query: { date_debut, date_fin } (ISO-8601)
- Success Response
  - data: { available: boolean, reason?: string }
- Error Codes
  - MISSING_DATES, INVALID_DATES, INVALID_HOURS, CAR_NOT_FOUND

Bookings
— Routes: [booking.routes.js](file:///c:/Users/Random/Desktop/tomobolity/tomobilty/backend/src/routes/booking.routes.js)

1) Endpoint
- Method + Path: POST /api/bookings/check-availability
- Auth: Public
- Request
  - Body: { variante_car_id: number, date_debut: string(ISO), date_fin: string(ISO) }
- Success Response
  - data: { available?: boolean or availability payload from service }
- Error Codes
  - Heures invalides (message), end_date must be after start (message)
- Notes
  - Validates hours only if time component is present
- Example
  - Request: { "variante_car_id": 12, "date_debut": "2025-02-10", "date_fin": "2025-02-12" }
  - Response: { "success": true, "data": { "available": true } }

2) Endpoint
- Method + Path: POST /api/bookings/calculate-price
- Auth: Public
- Request
  - Body: { variante_car_id: number, date_debut: ISO, date_fin: ISO, insurance_id?: number, additional_drivers?: Array }
- Success Response
  - data: pricing object from bookingService.calculateBookingPrice
- Example
  - Request: { "variante_car_id": 12, "date_debut": "2025-02-10", "date_fin": "2025-02-12" }

3) Endpoint
- Method + Path: POST /api/bookings
- Auth: Authenticated
- Request
  - Body: {
      car_id: number,
      date_debut: ISO,
      date_fin: ISO,
      lieu_prise_en_charge?: string,
      lieu_retour?: string,
      pickup_site_id?: number,
      return_site_id?: number,
      mode_paiement?: "EN_LIGNE" | "EN_AGENCE",
      protection_id?: number,
      additional_drivers?: [{ nom, prenom, permis_numero, permis_date }]
    }
- Success Response
  - status: 201, data: booking creation result from bookingService.createBooking
- Error Codes
  - CAR_NOT_AVAILABLE, INVALID_BOOKING_DATES, RATE_LIMIT_EXCEEDED; validation messages for fields
- Notes
  - Controller normalizes provided dates and resolves pickup/return site IDs to names
- Example
  - Request: { "car_id": 5, "date_debut": "2025-03-01", "date_fin": "2025-03-05", "pickup_site_id": 1, "return_site_id": 2, "mode_paiement": "EN_LIGNE" }

4) Endpoint
- Method + Path: GET /api/bookings/me
- Auth: Authenticated
- Request
  - Query: { page?, limit? , status?, q? }
- Success Response
  - data: { items: { id, date_debut, date_fin, prix_total, status{name}, mode_paiement, date_creation, car{ id, modele, brand{name}, primaryImage? }, is_paid, has_invoice, invoice_number? }[], pagination }

5) Endpoint
- Method + Path: GET /api/bookings/me/:bookingId
- Auth: Authenticated
- URL params: { bookingId: number }
- Success Response
  - data: { booking: detailed projection with car, protection, payment/invoice summary, breakdown_lines, caution_amount, flags }

6) Endpoint
- Method + Path: GET /api/bookings/me/:bookingId/invoice
- Auth: Authenticated
- URL params: { bookingId: number }
- Success Response
  - Sends file if invoice.pdf_path exists; otherwise 404 with message

7) Endpoint
- Method + Path: DELETE /api/bookings/me/:bookingId
- Auth: Authenticated
- URL params: { bookingId: number }
- Success Response
  - data: { booking: updated to status ANNULE, prix_total adjusted, breakdown_lines updated }
- Error Codes
  - BOOKING_NOT_CANCELLABLE

8) Endpoint
- Method + Path: GET /api/bookings/user/:userId?
- Auth: Authenticated
- Request
  - Query: { date_from?, date_to?, limit?, offset? }
- Success Response
  - data: { bookings: Booking[], pagination: { limit, offset, total } }
- Notes
  - Enforces ownership unless Admin

9) Endpoint
- Method + Path: GET /api/bookings/:bookingId
- Auth: Authenticated
- Success Response
  - data: { booking }

10) Endpoint
- Method + Path: PUT /api/bookings/:bookingId
- Auth: Authenticated
- Notes
  - Only status EN_ATTENTE is allowed for updates
- Success Response
  - message: "Réservation mise à jour avec succès", data: { booking }

11) Endpoint
- Method + Path: DELETE /api/bookings/:bookingId
- Auth: Authenticated
- Notes
  - Allowed statuses: EN_ATTENTE, EN_COURS
- Success Response
  - message: "Réservation annulée avec succès", data: result from bookingService.cancelBooking

12) Endpoint
- Method + Path: POST /api/bookings/:bookingId/start
- Auth: Authenticated + Admin only
- Success Response
  - message: "Location démarrée avec succès", data: result from bookingService.startRental

13) Endpoint
- Method + Path: POST /api/bookings/:bookingId/complete
- Auth: Authenticated + Admin only
- Success Response
  - message: "Location terminée avec succès", data: result from bookingService.completeRental

14) Endpoint
- Method + Path: POST /api/bookings/quote
- Auth: Public
- Notes
  - Returns a pricing quote; shape aligns with bookingService.getQuote
- TODO: Document exact schema when stabilized

15) Endpoint
- Method + Path: POST /api/bookings/:bookingId/apply-loyalty
- Auth: Authenticated
- Request
  - Body: { points_to_redeem: number }
- Success Response
  - message or data indicating discount applied via metadata
- Error Codes
  - Points/ownership validations

16) Endpoint
- Method + Path: POST /api/bookings/:bookingId/confirm-agence
- Auth: Authenticated
- Notes
  - Confirms booking for agency payment (offline)
- Success Response
  - message: "CONFIRM_AGENCE"
  - TODO: Schema details

17) Endpoint
- Method + Path: GET /api/bookings/:bookingId/contract
- Auth: Authenticated
- Success Response
  - data: { contract } if exists, or 404 message

18) Endpoint
- Method + Path: GET /api/bookings/:bookingId/invoice
- Auth: Authenticated
- Success Response
  - data: { invoice } if exists, or 404 message

Payments
— Routes: [payment.routes.js](file:///c:/Users/Random/Desktop/tomobolity/tomobilty/backend/src/routes/payment.routes.js)

1) Endpoint
- Method + Path: GET /api/payments/providers/info
- Auth: Public
- Success Response
  - data: { current_provider: string, available_providers: ProviderInfo[] }

2) Endpoint
- Method + Path: GET /api/payments/return (also POST /api/payments/return)
- Auth: Public
- Request
  - Query/body: provider? (defaults to env PAYMENT_PROVIDER)
- Success Response
  - Redirect or JSON { status, message, booking_id?, payment_id?, redirect_url }
- Notes
  - On success, attempts booking confirmation; redirect_url computed per status

3) Endpoint
- Method + Path: POST /api/payments/cmi/ipn
- Auth: Public (guarded by IP allowlist if set)
- Request
  - Body: application/x-www-form-urlencoded raw payload
- Success Response
  - 'OK' string, or provider-specific ACK
- Error Codes
  - WEBHOOK_IP_BLOCKED (403)
- Notes
  - Idempotent processing; confirms booking on COMPLETED

4) Endpoint
- Method + Path: POST /api/payments/stripe/webhook
- Auth: Public (guarded by IP allowlist if set)
- Request
  - Body: application/json raw payload; uses Stripe signature
- Success Response
  - { received: true } or error JSON

5) Endpoint
- Method + Path: POST /api/payments/create
- Auth: Authenticated
- Request
  - Body: { booking_id: number, amount: number, currency?: "MAD"|"EUR"|"USD", provider?: string }
- Success Response
  - data: { payment_id, session_id, session_url?, provider_ref, amount, currency, provider }
- Error Codes
  - BOOKING_NOT_FOUND, ALREADY_PAID, RATE_LIMIT_PAYMENT, VALIDATION_ERROR
- Notes
  - Idempotent reuse of pending payment session; rate limited
- Example
  - Request: { "booking_id": 101, "amount": 1200, "currency": "MAD" }

6) Endpoint
- Method + Path: GET /api/payments/:id
- Auth: Authenticated
- Success Response
  - data: { payment: Payment, provider_details?, metadata? }
- Error Codes
  - 403 unauthorized if payment not owned and not Admin

7) Endpoint
- Method + Path: GET /api/payments/booking/:bookingId
- Auth: Authenticated
- Success Response
  - data: { payments: Payment[] }
- Error Codes
  - BOOKING_NOT_FOUND if booking not owned (non-Admin)

8) Endpoint
- Method + Path: POST /api/payments/:id/cancel
- Auth: Authenticated
- Success Response
  - message: "Paiement annulé avec succès", data: { payment }
- Error Codes
  - 403 unauthorized; invalid state messages ("Cannot cancel payment with status ...")

9) Endpoint
- Method + Path: POST /api/payments/:id/refund
- Auth: Admin only
- Request
  - Body: { amount?: number, reason?: string }
- Success Response
  - message: "Remboursement créé avec succès", data: { refund, provider_refund, original_payment }

Loyalty / Pricing
— Routes: [loyalty.routes.js](file:///c:/Users/Random/Desktop/tomobolity/tomobilty/backend/src/routes/loyalty.routes.js)

1) Endpoint
- Method + Path: GET /api/loyalty/tiers
- Auth: Public
- Success Response
  - data: { tiers: Tier[] }

2) Endpoint
- Method + Path: GET /api/loyalty/me (alias: /api/loyalty/account and /api/loyalty/account/:userId)
- Auth: Authenticated
- Success Response
  - data: LoyaltyInfo for requested user, ownership enforced unless Admin

3) Endpoint
- Method + Path: POST /api/loyalty/calculate-points
- Auth: Authenticated
- Request
  - Body: { bookingAmount: number, userId?: number }
- Success Response
  - data: pointsCalculation

4) Endpoint
- Method + Path: POST /api/loyalty/add-points
- Auth: Admin only
- Request
  - Body: { userId: number, points: number, bookingId?: number, description?: string }
- Success Response
  - message: "Points ajoutés avec succès", data: result

5) Endpoint
- Method + Path: POST /api/loyalty/redeem-points
- Auth: Authenticated
- Request
  - Body: { userId?: number, points: number, description?: string }
- Success Response
  - message: "Points échangés avec succès", data: result
- Error Codes
  - INSUFFICIENT_POINTS (via controller error handler)

6) Endpoint
- Method + Path: GET /api/loyalty/rewards
- Auth: Authenticated
- Request
  - Query: userId?
- Success Response
  - data: { rewards: Reward[] }

7) Endpoint
- Method + Path: POST /api/loyalty/redeem-reward
- Auth: Authenticated
- Request
  - Body: { userId?: number, rewardId: number }
- Success Response
  - message: "Récompense échangée avec succès", data: result

8) Endpoint
- Method + Path: GET /api/loyalty/transactions (alias: /api/loyalty/transactions/:userId)
- Auth: Authenticated
- Request
  - Query: { limit?, page? }
- Success Response
  - data: { transactions: Transaction[], pagination }

9) Endpoint
- Method + Path: POST /api/loyalty/calculate-discount
- Auth: Authenticated
- Request
  - Body: { userId?: number, bookingAmount: number }
- Success Response
  - data: { discount_amount, booking_amount, final_amount }

Protection
— Routes: [protection.routes.js](file:///c:/Users/Random/Desktop/tomobolity/tomobilty/backend/src/routes/protection.routes.js)

1) Endpoint
- Method + Path: GET /api/protections
- Auth: Public
- Success Response
  - data: { protections: { id, name, frais_par_jour, ... }[] }

Pickup Sites
— Routes: [pickupsite.routes.js](file:///c:/Users/Random/Desktop/tomobolity/tomobilty/backend/src/routes/pickupsite.routes.js)

1) Endpoint
- Method + Path: GET /api/pickup-sites
- Auth: Public
- Success Response
  - data: { items: [{ id, nom }], total }

Contracts
— Routes: [contract.routes.js](file:///c:/Users/Random/Desktop/tomobolity/tomobilty/backend/src/routes/contract.routes.js)

1) Endpoint
- Method + Path: GET /api/contracts/booking/:bookingId
- Auth: Authenticated
- Success Response
-  data: { contract } or error CONTRACT_NOT_FOUND / BOOKING_NOT_FOUND

2) Endpoint
- Method + Path: POST /api/contracts/booking/:bookingId/generate
- Auth: Authenticated
- Request
  - Body: { template_id?: number }
- Success Response
  - data: { contract, contract_number }
- Error Codes
  - BOOKING_NOT_FOUND, BOOKING_NOT_CONFIRMED, CONTRACT_EXISTS, MISSING_LICENSE_INFO, CONTRACT_GENERATION_ERROR

3) Endpoint
- Method + Path: GET /api/contracts/:id/download
- Auth: Authenticated
- Success Response
  - Sends PDF; errors: CONTRACT_NOT_FOUND, CONTRACT_FILE_NOT_FOUND

Reviews
— Routes: [review.routes.js](file:///c:/Users/Random/Desktop/tomobolity/tomobilty/backend/src/routes/review.routes.js)

1) Endpoint
- Method + Path: GET /api/reviews
- Auth: Public (optionalAuth)
- Request
  - Query: { page?, limit?, rating?, verified_only? }
- Success Response
  - data: { reviews, average_rating, pagination }

2) Endpoint
- Method + Path: GET /api/reviews/car/:carId
- Auth: Public (optionalAuth)
- Request
  - URL params: { carId: number }, Query: { page?, limit? }
- Success Response
  - data: { reviews, average_rating, rating_distribution, pagination }

3) Endpoint
- Method + Path: POST /api/reviews
- Auth: Authenticated
- Request
  - Body: { car_id?: number, rating: 1..5, comment?: string }
- Success Response
  - message: "Avis créé avec succès", data: { review }
- Error Codes
  - NO_COMPLETED_BOOKING, REVIEW_EXISTS, VALIDATION_ERROR

4) Endpoint
- Method + Path: GET /api/reviews/my-reviews
- Auth: Authenticated
- Request
  - Query: { page?, limit? }
- Success Response
  - data: { reviews, pagination }

5) Endpoint
- Method + Path: PUT /api/reviews/:id
- Auth: Authenticated
- Request
  - Body: { rating?, comment? }
- Success Response
  - message: "Avis mis à jour avec succès", data: { review }

6) Endpoint
- Method + Path: DELETE /api/reviews/:id
- Auth: Authenticated
- Success Response
  - message: "Avis supprimé avec succès"

Admin (Selected)
— Routes: [admin.routes.complete.js](file:///c:/Users/Random/Desktop/tomobolity/tomobilty/backend/src/routes/admin.routes.complete.js)
- All Admin endpoints require Authorization and Admin role
- Representative endpoints:
  - GET /api/admin/stats → dashboard stats
  - GET /api/admin/users, GET /api/admin/users/:id, POST /api/admin/users, PUT /api/admin/users/:id, DELETE /api/admin/users/:id
  - GET /api/admin/cars, GET /api/admin/cars/:id, POST /api/admin/cars, PUT /api/admin/cars/:id, DELETE /api/admin/cars/:id
  - GET /api/admin/bookings, GET /api/admin/bookings/:id, POST /api/admin/bookings, PUT /api/admin/bookings/:id, DELETE /api/admin/bookings/:id
  - GET /api/admin/payments, GET /api/admin/payments/:id, POST /api/admin/payments, PUT /api/admin/payments/:id, DELETE /api/admin/payments/:id
  - GET /api/admin/invoices, GET /api/admin/invoices/:id, POST /api/admin/invoices, PUT /api/admin/invoices/:id, DELETE /api/admin/invoices/:id
  - GET /api/admin/reviews, GET /api/admin/reviews/:id, POST /api/admin/reviews, PUT /api/admin/reviews/:id, DELETE /api/admin/reviews/:id
- TODO: Provide full schemas for each Admin endpoint as needed by frontend screens

Health & System
— Routes: [health.routes.js](file:///c:/Users/Random/Desktop/tomobolity/tomobilty/backend/src/routes/health.routes.js), [webhook.routes.js](file:///c:/Users/Random/Desktop/tomobolity/tomobilty/backend/src/routes/webhook.routes.js)

1) Endpoint
- Method + Path: GET /api/health
- Auth: Public
- Success Response
  - data: { status: "ok" }

2) Endpoint
- Method + Path: POST /api/webhooks/stripe
- Auth: Public (signature verified by Stripe)
- Request
  - Raw application/json, Stripe signature header
- Success Response
  - { success: true, message: "Webhook processed successfully" } or error JSON
- Notes
  - Multiple event types handled; booking confirmation on relevant events
- TODO: Frontend rarely calls this; primarily provider → backend

**Critical Flows**

Auth Flow
- Steps
  - Login → receive access and refresh
  - Use access token in Authorization: Bearer for protected endpoints
  - When access expires, call POST /api/auth/refresh-token with current refresh
  - Retry original request with new access token
  - Logout via POST /api/auth/logout (revokes stored refresh hash)
- Error handling
  - Handle error.code (e.g., INVALID_CREDENTIALS, AUTH_REFRESH_REUSED, TOKEN_EXPIRED)

Availability → Booking → Payment Flow
- Steps
  - Search cars: GET /api/cars or /api/cars/search with date range
  - Select variant: GET /api/cars/:id includes variantes with availability flags
  - Create booking (EN_ATTENTE): POST /api/bookings with normalized dates and optional pickup/return sites
  - Create payment session (idempotent): POST /api/payments/create; reuse pending session if present
  - Provider redirect / IPN / webhook:
    - Browser: GET/POST /api/payments/return
    - IPN: POST /api/payments/cmi/ipn (x-www-form-urlencoded)
    - Webhook: POST /api/payments/stripe/webhook
  - Booking becomes EN_COURS: confirmed via bookingService.confirmBooking on COMPLETED payments
- Side effects
  - Post-payment workflow: contract/invoice/notifications/loyalty handled server-side (see services)
- Notes
  - Payment confirmation is asynchronous; frontend must poll or rely on redirect status

Booking Auto-Cancellation Flow
- Steps
  - Pending booking EN_ATTENTE expires after BOOKING_PAYMENT_TIMEOUT_MINUTES (env) without completed payments
  - Background job sets status_name to ANNULE and restores availability
  - Job: [cancelExpiredBookings.js](file:///c:/Users/Random/Desktop/tomobolity/tomobilty/backend/src/jobs/cancelExpiredBookings.js)

**Frontend Guarantees**
- If a car appears with carAvailable: true in GET /api/cars/:id, at least one variant has no conflicts for the queried dates
- Frontend must never compute availability; use endpoints for availability and pricing
- Payment confirmation is asynchronous; rely on redirect and/or poll GET /api/payments/:id or GET /api/bookings/me/:bookingId
- Error handling must rely on error.code when provided; otherwise, use HTTP status + message
- Use ISO-8601 dates; when including time, ensure within business hours or use date-only to bypass hour validation

**References**
- Server mounts: [index.js](file:///c:/Users/Random/Desktop/tomobolity/tomobilty/backend/api/index.js#L54-L68)
- Auth: [auth.routes.js](file:///c:/Users/Random/Desktop/tomobolity/tomobilty/backend/src/routes/auth.routes.js), [auth.controller.js](file:///c:/Users/Random/Desktop/tomobolity/tomobilty/backend/src/controllers/auth.controller.js)
- Users: [user.routes.js](file:///c:/Users/Random/Desktop/tomobolity/tomobilty/backend/src/routes/user.routes.js), [user.controller.js](file:///c:/Users/Random/Desktop/tomobolity/tomobilty/backend/src/controllers/user.controller.js)
- Cars: [car.routes.js](file:///c:/Users/Random/Desktop/tomobolity/tomobilty/backend/src/routes/car.routes.js), [car.controller.js](file:///c:/Users/Random/Desktop/tomobolity/tomobilty/backend/src/controllers/car.controller.js)
- Bookings: [booking.routes.js](file:///c:/Users/Random/Desktop/tomobolity/tomobilty/backend/src/routes/booking.routes.js), [booking.controller.js](file:///c:/Users/Random/Desktop/tomobolity/tomobilty/backend/src/controllers/booking.controller.js)
- Payments: [payment.routes.js](file:///c:/Users/Random/Desktop/tomobolity/tomobilty/backend/src/routes/payment.routes.js), [payment.controller.js](file:///c:/Users/Random/Desktop/tomobolity/tomobilty/backend/src/controllers/payment.controller.js), [payment.service.js](file:///c:/Users/Random/Desktop/tomobolity/tomobilty/backend/src/services/payment.service.js)
- Loyalty: [loyalty.routes.js](file:///c:/Users/Random/Desktop/tomobolity/tomobilty/backend/src/routes/loyalty.routes.js), [loyalty.controller.js](file:///c:/Users/Random/Desktop/tomobolity/tomobilty/backend/src/controllers/loyalty.controller.js)
- Contracts: [contract.routes.js](file:///c:/Users/Random/Desktop/tomobolity/tomobilty/backend/src/routes/contract.routes.js), [contract.controller.js](file:///c:/Users/Random/Desktop/tomobolity/tomobilty/backend/src/controllers/contract.controller.js)
- Webhooks: [webhook.routes.js](file:///c:/Users/Random/Desktop/tomobolity/tomobilty/backend/src/routes/webhook.routes.js), [webhook.controller.js](file:///c:/Users/Random/Desktop/tomobolity/tomobilty/backend/src/controllers/webhook.controller.js)
- Errors: [booking.errors.js](file:///c:/Users/Random/Desktop/tomobolity/tomobilty/backend/src/errors/booking.errors.js), [loyalty.errors.js](file:///c:/Users/Random/Desktop/tomobolity/tomobilty/backend/src/errors/loyalty.errors.js)

