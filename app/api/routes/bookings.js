const express = require('express');
const router = express.Router();
const bookingsController = require('../controllers/bookingsController');
const authMiddleware = require('../middleware/auth');

// Routes utilisateur authentifié
router.post('/', authMiddleware.protect, bookingsController.createBooking);
router.get('/my-bookings', authMiddleware.protect, bookingsController.getMyBookings);
router.get('/:id', authMiddleware.protect, bookingsController.getBooking);
router.put('/:id/confirm', authMiddleware.protect, bookingsController.confirmBooking);
router.put('/:id/cancel', authMiddleware.protect, bookingsController.cancelBooking);

// Routes admin
router.get('/', authMiddleware.protect, authMiddleware.requireAdmin, bookingsController.getAllBookings);
router.put('/:id/status', authMiddleware.protect, authMiddleware.requireAdmin, bookingsController.updateBookingStatus);

module.exports = router;
