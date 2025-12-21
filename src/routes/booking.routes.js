const express = require('express');
const bookingController = require('../controllers/booking.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth.middleware');
const { 
  validateBookingCreation, 
  validateId, 
  validatePagination 
} = require('../middlewares/validation.middleware');

const router = express.Router();

// Protected routes (User must be authenticated)
router.get('/', verifyToken, validatePagination, bookingController.getUserBookings);
router.post('/', verifyToken, validateBookingCreation, bookingController.createBooking);
router.get('/:id', verifyToken, validateId, bookingController.getBookingById);
router.put('/:id/cancel', verifyToken, validateId, bookingController.cancelBooking);
router.post('/:id/additional-drivers', verifyToken, validateId, bookingController.addAdditionalDriver);
router.delete('/:id/additional-drivers/:driverId', verifyToken, validateId, bookingController.removeAdditionalDriver);

// Admin routes
router.get('/admin/all', verifyToken, requireAdmin, validatePagination, bookingController.getAllBookings);
router.put('/:id/status', verifyToken, requireAdmin, validateId, bookingController.updateBookingStatus);
router.get('/admin/statistics', verifyToken, requireAdmin, bookingController.getBookingStatistics);

module.exports = router;
