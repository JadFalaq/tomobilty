/**
 * Webhook routes for handling external service callbacks
 */

const express = require('express');
const webhookController = require('../controllers/webhook.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * Stripe webhook endpoint
 * Note: This endpoint should NOT use JSON parsing middleware
 * Stripe requires raw body for signature verification
 */
router.post('/stripe', 
  express.raw({ type: 'application/json' }),
  webhookController.handleStripeWebhook
);

/**
 * Development/Testing routes
 */
// GET /api/webhooks/test - Test webhook endpoint
router.get('/test', 
  webhookController.testWebhook
);

// POST /api/webhooks/simulate-payment - Simulate payment for testing
router.post('/simulate-payment', 
  webhookController.simulatePaymentSuccess
);

/**
 * Admin routes for webhook management
 */
// GET /api/webhooks/stripe/events - Get recent Stripe events
router.get('/stripe/events', 
  verifyToken,
  requireAdmin,
  webhookController.getStripeEvents
);

// POST /api/webhooks/stripe/retry - Retry Stripe event processing
router.post('/stripe/retry', 
  verifyToken,
  requireAdmin,
  webhookController.retryStripeEvent
);

module.exports = router;
