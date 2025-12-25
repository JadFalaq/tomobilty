const express = require('express');
const bookingController = require('../controllers/booking.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth.middleware');
const { 
  validateBookingData,
  validateDriverData,
  checkBookingOwnership,
  rateLimitBookingCreation,
  validateBookingStatus,
  validateDateRange,
  validatePagination,
  sanitizeBookingInput,
  logBookingOperation,
  checkBusinessHours
} = require('../middlewares/booking.middleware');
const {
  validateMainDriverLicense,
  validateAdditionalDriverLicense,
  checkDriverAge,
  validateDriverDocuments,
  checkDriverBlacklist,
  rateLimitDriverValidation,
  logDriverValidation
} = require('../middlewares/driver.middleware');

const router = express.Router();

/**
 * Public routes
 */
// POST /api/bookings/check-availability
router.post('/check-availability', 
  bookingController.checkAvailability
);

// POST /api/bookings/calculate-price
router.post('/calculate-price', 
  bookingController.calculatePrice
);

// GET /api/cars/available
router.get('/cars/available', 
  validateDateRange,
  bookingController.getAvailableCars
);

/**
 * Protected routes (User must be authenticated)
 */
// POST /api/bookings - Create new booking
router.post('/', 
  verifyToken,
  validateBookingData,
  sanitizeBookingInput,
  rateLimitBookingCreation,
  logBookingOperation('CREATE_BOOKING'),
  bookingController.createBooking
);

// GET /api/bookings/user/:userId? - Get user bookings
router.get('/user/:userId?', 
  verifyToken,
  validateDateRange,
  validatePagination,
  logBookingOperation('GET_USER_BOOKINGS'),
  bookingController.getUserBookings
);

// GET /api/bookings/:bookingId - Get booking details
router.get('/:bookingId', 
  verifyToken,
  checkBookingOwnership,
  logBookingOperation('GET_BOOKING_DETAILS'),
  bookingController.getBookingById
);

// PUT /api/bookings/:bookingId - Update booking
router.put('/:bookingId', 
  verifyToken,
  checkBookingOwnership,
  validateBookingStatus(['PENDING']),
  sanitizeBookingInput,
  logBookingOperation('UPDATE_BOOKING'),
  bookingController.updateBooking
);

// DELETE /api/bookings/:bookingId - Cancel booking
router.delete('/:bookingId', 
  verifyToken,
  checkBookingOwnership,
  validateBookingStatus(['PENDING', 'CONFIRMED']),
  logBookingOperation('CANCEL_BOOKING'),
  bookingController.cancelBooking
);

// POST /api/bookings/:bookingId/start - Start rental
router.post('/:bookingId/start', 
  verifyToken,
  requireAdmin, // Only staff can start rentals
  checkBookingOwnership,
  validateBookingStatus(['CONFIRMED']),
  logBookingOperation('START_RENTAL'),
  bookingController.startRental
);

// POST /api/bookings/:bookingId/complete - Complete rental
router.post('/:bookingId/complete', 
  verifyToken,
  requireAdmin, // Only staff can complete rentals
  checkBookingOwnership,
  validateBookingStatus(['ACTIVE']),
  logBookingOperation('COMPLETE_RENTAL'),
  bookingController.completeRental
);

// Quote pricing (public)
router.post('/quote',
  bookingController.getQuote
);

// Apply loyalty to booking
router.post('/:bookingId/apply-loyalty',
  verifyToken,
  checkBookingOwnership,
  logBookingOperation('APPLY_LOYALTY'),
  bookingController.applyLoyalty
);

// Confirm booking for agency payment (no online payment)
router.post('/:bookingId/confirm-agence',
  verifyToken,
  checkBookingOwnership,
  logBookingOperation('CONFIRM_AGENCE'),
  bookingController.confirmAgence
);

// POST /api/bookings/:bookingId/additional-driver - Add additional driver
router.post('/:bookingId/additional-driver', 
  verifyToken,
  checkBookingOwnership,
  validateBookingStatus(['PENDING']),
  validateDriverData,
  validateAdditionalDriverLicense,
  checkDriverBlacklist,
  rateLimitDriverValidation,
  logDriverValidation,
  logBookingOperation('ADD_ADDITIONAL_DRIVER'),
  bookingController.addAdditionalDriver
);

// DELETE /api/bookings/:bookingId/additional-driver/:driverId - Remove additional driver
router.delete('/:bookingId/additional-driver/:driverId', 
  verifyToken,
  checkBookingOwnership,
  validateBookingStatus(['PENDING']),
  logBookingOperation('REMOVE_ADDITIONAL_DRIVER'),
  bookingController.removeAdditionalDriver
);

// GET /api/bookings/:bookingId/contract - Get booking contract
router.get('/:bookingId/contract', 
  verifyToken,
  checkBookingOwnership,
  logBookingOperation('GET_CONTRACT'),
  bookingController.getBookingContract
);

// GET /api/bookings/:bookingId/invoice - Get booking invoice
router.get('/:bookingId/invoice', 
  verifyToken,
  checkBookingOwnership,
  logBookingOperation('GET_INVOICE'),
  bookingController.getBookingInvoice
);

/**
 * Admin routes
 */
// GET /api/bookings/admin/all - Get all bookings (admin)
router.get('/admin/all', 
  verifyToken,
  requireAdmin,
  validateDateRange,
  validatePagination,
  logBookingOperation('ADMIN_GET_ALL_BOOKINGS'),
  bookingController.getAllBookings
);

// PUT /api/bookings/:bookingId/status - Update booking status (admin)
router.put('/:bookingId/status', 
  verifyToken,
  requireAdmin,
  logBookingOperation('ADMIN_UPDATE_STATUS'),
  bookingController.updateBookingStatus
);

// GET /api/bookings/admin/statistics - Get booking statistics (admin)
router.get('/admin/statistics', 
  verifyToken,
  requireAdmin,
  logBookingOperation('ADMIN_GET_STATISTICS'),
  bookingController.getBookingStatistics
);

// Apply error handler at the end
router.use(bookingController.handleBookingErrors);

module.exports = router;
