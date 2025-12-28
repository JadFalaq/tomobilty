/**
 * Routes de paiement refactorisées pour supporter multiple providers (Stripe, CMI, etc.)
 */

const express = require('express');
const paymentController = require('../controllers/payment.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * Public routes
 */
// GET /api/payments/providers/info - Get available payment providers
router.get('/providers/info', paymentController.getProvidersInfo);

// GET /api/payments/return - Handle payment return (browser redirect)
router.get('/return', paymentController.handlePaymentReturn);
router.post('/return', paymentController.handlePaymentReturn);

/**
 * Provider-specific IPN/webhook routes
 */
// POST /api/payments/cmi/ipn - CMI Instant Payment Notification
router.post('/cmi/ipn', 
  express.raw({ type: 'application/x-www-form-urlencoded' }),
  paymentController.handleCmiIpn
);

// POST /api/payments/stripe/webhook - Stripe webhooks (legacy support)
router.post('/stripe/webhook', 
  express.raw({ type: 'application/json' }),
  paymentController.handleStripeWebhook
);

/**
 * Protected routes (User must be authenticated)
 */
// POST /api/payments/create - Create payment session
router.post('/create', 
  verifyToken,
  paymentController.createPaymentSession
);

// GET /api/payments/:id - Get payment details
router.get('/:id', 
  verifyToken,
  paymentController.getPaymentById
);

// GET /api/payments/booking/:bookingId - Get payments for booking
router.get('/booking/:bookingId', 
  verifyToken,
  paymentController.getPaymentsByBooking
);

// POST /api/payments/:id/cancel - Cancel payment
router.post('/:id/cancel', 
  verifyToken,
  paymentController.cancelPayment
);

/**
 * Admin routes
 */
// POST /api/payments/:id/refund - Create refund
router.post('/:id/refund', 
  verifyToken,
  requireAdmin,
  paymentController.createRefund
);

// GET /api/payments/admin/statistics - Get payment statistics
router.get('/admin/statistics', 
  verifyToken,
  requireAdmin,
  paymentController.getPaymentStatistics
);

module.exports = router;
