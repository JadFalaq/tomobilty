# Backend Integration Guide - Tomobila Car Rental

## Overview
This frontend is now fully integrated with your backend API contracts. All endpoints from your backend documentation have been implemented.

## Architecture

### 1. API Client (`src/utils/apiClient.js`)
- Axios-based HTTP client with automatic token refresh
- Intercepts 401 errors and refreshes access tokens automatically
- Stores tokens in localStorage
- Handles authentication flow seamlessly

### 2. Services Layer
All backend domains have dedicated service modules:

- **`src/services/auth.service.js`** - Authentication (login, register, logout, profile management)
- **`src/services/car.service.js`** - Car listings, search, availability, brands, categories
- **`src/services/booking.service.js`** - Booking creation, management, cancellation, invoices
- **`src/services/payment.service.js`** - Payment creation, status, provider info
- **`src/services/loyalty.service.js`** - Loyalty points, tiers, rewards, transactions
- **`src/services/protection.service.js`** - Insurance/protection plans
- **`src/services/pickupsite.service.js`** - Pickup/return locations
- **`src/services/review.service.js`** - Car reviews and ratings

### 3. Context & Hooks

**Authentication Context** (`src/contexts/AuthContext.jsx`)
- Manages user authentication state
- Provides login, register, logout functions
- Auto-refreshes user profile on mount

**Custom Hooks**
- `useCars()` - Fetch cars with filters
- `useCarDetails()` - Get single car details
- `useCategories()` - Get car categories
- `useBrands()` - Get car brands
- `useBookings()` - Fetch user bookings
- `useBookingDetails()` - Get single booking

### 4. Utilities
- **`src/utils/dateUtils.js`** - Date formatting and manipulation for API
- **`src/config/api.config.js`** - API configuration and constants

## Environment Setup

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update `.env` with your backend URL:
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_PAYMENT_RETURN_URL=http://localhost:5173/payment/return
```

## API Endpoints Implemented

### Auth Domain
- ✅ POST `/api/auth/register` - User registration
- ✅ POST `/api/auth/login` - User login
- ✅ POST `/api/auth/logout` - User logout
- ✅ POST `/api/auth/refresh-token` - Token refresh (automatic)
- ✅ GET `/api/auth/me` - Get current user profile
- ✅ PUT `/api/auth/profile` - Update profile
- ✅ PUT `/api/auth/change-password` - Change password
- ✅ POST `/api/auth/verify-email` - Email verification
- ✅ POST `/api/auth/resend-verification` - Resend verification email
- ✅ POST `/api/auth/google` - Google OAuth

### Cars Domain
- ✅ GET `/api/cars` - List cars with filters
- ✅ GET `/api/cars/search` - Search cars
- ✅ GET `/api/cars/available` - Get available cars for date range
- ✅ GET `/api/cars/:id` - Get car details
- ✅ GET `/api/cars/:id/availability` - Check car availability
- ✅ GET `/api/cars/brands` - Get all brands
- ✅ GET `/api/cars/categories` - Get all categories

### Bookings Domain
- ✅ POST `/api/bookings/check-availability` - Check availability
- ✅ POST `/api/bookings/calculate-price` - Calculate booking price
- ✅ POST `/api/bookings` - Create booking
- ✅ GET `/api/bookings/me` - Get user bookings
- ✅ GET `/api/bookings/me/:bookingId` - Get booking details
- ✅ DELETE `/api/bookings/me/:bookingId` - Cancel booking
- ✅ GET `/api/bookings/me/:bookingId/invoice` - Download invoice
- ✅ POST `/api/bookings/:bookingId/apply-loyalty` - Apply loyalty points
- ✅ POST `/api/bookings/:bookingId/confirm-agence` - Confirm agency payment
- ✅ GET `/api/bookings/:bookingId/contract` - Get contract

### Payments Domain
- ✅ GET `/api/payments/providers/info` - Get payment provider info
- ✅ POST `/api/payments/create` - Create payment session
- ✅ GET `/api/payments/:id` - Get payment details
- ✅ GET `/api/payments/booking/:bookingId` - Get booking payments
- ✅ POST `/api/payments/:id/cancel` - Cancel payment

### Loyalty Domain
- ✅ GET `/api/loyalty/tiers` - Get loyalty tiers
- ✅ GET `/api/loyalty/me` - Get user loyalty account
- ✅ POST `/api/loyalty/calculate-points` - Calculate points
- ✅ POST `/api/loyalty/redeem-points` - Redeem points
- ✅ GET `/api/loyalty/rewards` - Get available rewards
- ✅ POST `/api/loyalty/redeem-reward` - Redeem reward
- ✅ GET `/api/loyalty/transactions` - Get loyalty transactions
- ✅ POST `/api/loyalty/calculate-discount` - Calculate loyalty discount

### Other Domains
- ✅ GET `/api/protections` - Get protection plans
- ✅ GET `/api/pickup-sites` - Get pickup locations
- ✅ GET `/api/reviews` - Get reviews
- ✅ GET `/api/reviews/car/:carId` - Get car reviews
- ✅ POST `/api/reviews` - Create review
- ✅ GET `/api/reviews/my-reviews` - Get user reviews
- ✅ PUT `/api/reviews/:id` - Update review
- ✅ DELETE `/api/reviews/:id` - Delete review

## Key Features Implemented

### 1. Authentication Flow
- Login/Register with email & password
- Automatic token refresh on 401 errors
- Persistent authentication (localStorage)
- User profile management
- Google OAuth ready (frontend integration complete)

### 2. Car Browsing
- Category-based filtering
- Real-time availability checking
- Price range filters
- Transmission, seats, fuel type filters
- Car details with images and pricing

### 3. Booking Management
- Create bookings with date validation
- View booking history
- Download invoices (PDF)
- Cancel bookings
- Apply loyalty points to bookings

### 4. Payment Integration
- Create payment sessions
- Support for multiple payment providers (CMI, Stripe)
- Payment status tracking
- Idempotent payment creation (reuses pending sessions)

### 5. Loyalty System
- View loyalty points and tier
- Calculate points for bookings
- Redeem points for discounts
- View transaction history
- Redeem rewards

## Error Handling

All API calls return a consistent format:
```javascript
{
  success: boolean,
  data?: any,
  error?: {
    code: string,
    message: string,
    details?: any
  }
}
```

Error codes are defined in `src/config/api.config.js` and match your backend contract.

## Usage Examples

### Login
```javascript
import { useAuth } from './contexts/AuthContext';

function LoginComponent() {
  const { login } = useAuth();
  
  const handleLogin = async () => {
    const result = await login('user@example.com', 'password');
    if (result.success) {
      // User is logged in, tokens stored automatically
    } else {
      // Handle error: result.error.message
    }
  };
}
```

### Fetch Cars
```javascript
import { carService } from './services/car.service';

const result = await carService.getCars({
  category_id: 1,
  date_debut: '2025-02-10',
  date_fin: '2025-02-15',
  prix_max: 2000
});

if (result.success) {
  const cars = result.cars;
  const pagination = result.pagination;
}
```

### Create Booking
```javascript
import { bookingService } from './services/booking.service';

const result = await bookingService.createBooking({
  carId: 5,
  dateDebut: '2025-03-01',
  dateFin: '2025-03-05',
  pickupSiteId: 1,
  returnSiteId: 2,
  modePaiement: 'EN_LIGNE',
  protectionId: 2
});

if (result.success) {
  const booking = result.booking;
  // Proceed to payment
}
```

### Create Payment
```javascript
import { paymentService } from './services/payment.service';

const result = await paymentService.createPayment({
  bookingId: 101,
  amount: 1200,
  currency: 'MAD'
});

if (result.success) {
  // Redirect to payment.session_url
  window.location.href = result.payment.session_url;
}
```

## Date Handling

All dates sent to the API are in ISO-8601 format:
```javascript
import { formatDateForAPI } from './utils/dateUtils';

const isoDate = formatDateForAPI('2025-02-10'); // Returns ISO string
const isoDate2 = formatDateForAPI(new Date()); // Converts Date to ISO
```

Display dates use French locale:
```javascript
import { formatDateForDisplay } from './utils/dateUtils';

const display = formatDateForDisplay('2025-02-10T10:00:00Z'); 
// Returns: "10 févr. 2025"
```

## Token Management

Tokens are automatically managed:
- Access token stored in `localStorage` as `tomobila_access_token`
- Refresh token stored as `tomobila_refresh_token`
- User data stored as `tomobila_user`
- Automatic refresh on 401 errors
- Automatic logout on refresh failure

## Running the Application

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Backend Requirements

Your backend must:
1. Be running on the URL specified in `.env`
2. Return responses in the format specified in your API contracts
3. Handle CORS for the frontend origin
4. Support the `/api` base path

## Next Steps

1. **Configure Backend URL**: Update `.env` with your actual backend URL
2. **Test Authentication**: Try login/register flows
3. **Test Car Browsing**: Browse cars and check availability
4. **Test Booking Flow**: Create a test booking
5. **Test Payment**: Complete a payment flow
6. **Add Error Boundaries**: Consider adding React error boundaries for better UX
7. **Add Loading States**: Enhance loading indicators throughout the app
8. **Add Toast Notifications**: Consider adding a toast library for better feedback

## Troubleshooting

### CORS Errors
Ensure your backend allows requests from `http://localhost:5173` (or your frontend URL)

### 401 Errors
Check that tokens are being sent correctly. Open DevTools > Network to inspect requests.

### Network Errors
Verify the backend is running and the `VITE_API_BASE_URL` is correct.

### Token Refresh Loop
If you see infinite refresh attempts, check that your backend's refresh endpoint is working correctly.

## Support

All backend contracts from your documentation have been implemented. If you encounter issues:
1. Check the browser console for errors
2. Check the Network tab in DevTools
3. Verify the backend response format matches the contracts
4. Ensure all required fields are being sent in requests
