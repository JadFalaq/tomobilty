const express = require('express');
const adminController = require('../controllers/admin.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth.middleware');
const { validatePagination } = require('../middlewares/validation.middleware');

const router = express.Router();

// All routes require admin authentication
router.use(verifyToken);
router.use(requireAdmin);

// Dashboard and statistics
router.get('/dashboard', adminController.getDashboardStats);
router.get('/analytics', adminController.getAnalytics);

// User management
router.get('/users', validatePagination, adminController.getUsers);
router.get('/users/statistics', adminController.getUserStatistics);

// Car management
router.get('/cars', validatePagination, adminController.getCars);
router.get('/cars/statistics', adminController.getCarStatistics);

// Booking management
router.get('/bookings', validatePagination, adminController.getBookings);
router.get('/bookings/statistics', adminController.getBookingStatistics);

// Payment management
router.get('/payments', validatePagination, adminController.getPayments);
router.get('/payments/statistics', adminController.getPaymentStatistics);

// System management
router.get('/system/health', adminController.getSystemHealth);
router.post('/system/initialize', adminController.initializeSystem);
router.get('/system/logs', adminController.getSystemLogs);

// Notifications
router.post('/notifications/broadcast', adminController.broadcastNotification);

module.exports = router;
