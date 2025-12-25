const express = require('express');
const paymentController = require('../controllers/payment.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth.middleware');
const { validatePaymentCreation, validateId, validatePagination } = require('../middlewares/validation.middleware');

const router = express.Router();

// Protected routes (User must be authenticated)
router.post('/create-session', verifyToken, validatePaymentCreation, paymentController.createPaymentSession);
router.post('/webhook', paymentController.handleWebhook); // Stripe webhook (no auth)
router.get('/booking/:bookingId', verifyToken, validateId, paymentController.getPaymentsByBooking);
router.get('/:id', verifyToken, validateId, paymentController.getPaymentById);

// Admin routes
router.get('/', verifyToken, requireAdmin, validatePagination, paymentController.getAllPayments);
router.put('/:id/refund', verifyToken, requireAdmin, validateId, paymentController.refundPayment);
router.get('/admin/statistics', verifyToken, requireAdmin, paymentController.getPaymentStatistics);

module.exports = router;
