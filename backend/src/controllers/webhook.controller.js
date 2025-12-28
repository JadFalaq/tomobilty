/**
 * Webhook controller for handling Stripe payment events
 */

const paymentService = require('../services/payment.service');
const bookingService = require('../services/booking.service');
const { asyncHandler } = require('../middlewares/errorHandler.middleware');

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 */
const handleStripeWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['stripe-signature'];
  const payload = req.body;

  try {
    // Verify webhook signature
    const event = paymentService.verifyWebhookSignature(payload, signature);

    console.log(`📨 Received Stripe webhook: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;

      case 'charge.dispute.created':
        await handleChargeDisputeCreated(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      default:
        console.log(`⚠️ Unhandled Stripe event type: ${event.type}`);
    }

    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('❌ Stripe webhook error:', error);
    
    res.status(400).json({
      success: false,
      message: 'Webhook processing failed',
      error: error.message
    });
  }
});

/**
 * Handle checkout session completed event
 * @param {Object} session - Stripe checkout session object
 */
const handleCheckoutSessionCompleted = async (session) => {
  try {
    console.log(`✅ Checkout session completed: ${session.id}`);

    const bookingId = parseInt(session.metadata?.booking_id);
    const paymentId = parseInt(session.metadata?.payment_id);

    if (!bookingId || !paymentId) {
      throw new Error('Missing booking_id or payment_id in session metadata');
    }

    // Update payment status
    await paymentService.handlePaymentSuccess(session.id, {
      id: session.payment_intent,
      payment_method_types: session.payment_method_types || ['card']
    });

    // Confirm booking and execute post-payment workflow
    await bookingService.confirmBooking(bookingId, paymentId);

    console.log(`🎉 Booking ${bookingId} confirmed successfully via webhook`);

  } catch (error) {
    console.error('Error handling checkout session completed:', error);
    throw error;
  }
};

/**
 * Handle payment intent succeeded event
 * @param {Object} paymentIntent - Stripe payment intent object
 */
const handlePaymentIntentSucceeded = async (paymentIntent) => {
  try {
    console.log(`💰 Payment intent succeeded: ${paymentIntent.id}`);

    // This is usually handled by checkout.session.completed
    // But we can use this as a backup or for direct payment intents
    
    // Find payment by provider_payment_id
    const payment = await prisma.payment.findFirst({
      where: {
        provider_payment_id: paymentIntent.id
      }
    });

    if (payment && payment.status !== 'COMPLETED') {
      await paymentService.handlePaymentSuccess(null, paymentIntent);
      
      // If this payment is for a booking, confirm it
      if (payment.booking_id) {
        await bookingService.confirmBooking(payment.booking_id, payment.id);
      }
    }

  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
    // Don't throw error to avoid webhook retry loops
  }
};

/**
 * Handle payment intent failed event
 * @param {Object} paymentIntent - Stripe payment intent object
 */
const handlePaymentIntentFailed = async (paymentIntent) => {
  try {
    console.log(`❌ Payment intent failed: ${paymentIntent.id}`);

    // Find the associated session
    const sessions = await stripe.checkout.sessions.list({
      payment_intent: paymentIntent.id,
      limit: 1
    });

    if (sessions.data.length > 0) {
      const session = sessions.data[0];
      await paymentService.handlePaymentFailed(session.id, paymentIntent);
      
      console.log(`💔 Payment failed for session: ${session.id}`);
    }

  } catch (error) {
    console.error('Error handling payment intent failed:', error);
    // Don't throw error to avoid webhook retry loops
  }
};

/**
 * Handle charge dispute created event
 * @param {Object} dispute - Stripe dispute object
 */
const handleChargeDisputeCreated = async (dispute) => {
  try {
    console.log(`⚖️ Charge dispute created: ${dispute.id}`);

    // Log the dispute for manual review
    // In a real application, you might want to:
    // 1. Notify administrators
    // 2. Automatically gather evidence
    // 3. Update booking status if necessary
    
    console.log(`Dispute amount: ${dispute.amount} ${dispute.currency}`);
    console.log(`Dispute reason: ${dispute.reason}`);
    console.log(`Dispute status: ${dispute.status}`);

    // TODO: Implement dispute handling logic
    // - Send notification to admin
    // - Update payment/booking status
    // - Gather evidence automatically

  } catch (error) {
    console.error('Error handling charge dispute:', error);
  }
};

/**
 * Handle invoice payment succeeded event
 * @param {Object} invoice - Stripe invoice object
 */
const handleInvoicePaymentSucceeded = async (invoice) => {
  try {
    console.log(`📄 Invoice payment succeeded: ${invoice.id}`);

    // This might be for subscription payments or other invoice-based payments
    // Handle accordingly based on your business logic

  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error);
  }
};

/**
 * Handle subscription deleted event
 * @param {Object} subscription - Stripe subscription object
 */
const handleSubscriptionDeleted = async (subscription) => {
  try {
    console.log(`🔄 Subscription deleted: ${subscription.id}`);

    // Handle subscription cancellation if you have subscription-based features
    // This might affect user access to premium features

  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
};

/**
 * GET /api/webhooks/test
 * Test webhook endpoint (development only)
 */
const testWebhook = asyncHandler(async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({
      success: false,
      message: 'Not found'
    });
  }

  res.json({
    success: true,
    message: 'Webhook endpoint is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

/**
 * POST /api/webhooks/simulate-payment
 * Simulate payment success for testing (development only)
 */
const simulatePaymentSuccess = asyncHandler(async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({
      success: false,
      message: 'Not found'
    });
  }

  const { booking_id, payment_id } = req.body;

  if (!booking_id || !payment_id) {
    return res.status(400).json({
      success: false,
      message: 'booking_id and payment_id required'
    });
  }

  try {
    // Simulate successful payment
    await paymentService.handlePaymentSuccess(`sim_session_${Date.now()}`, {
      id: `sim_pi_${Date.now()}`,
      payment_method_types: ['card']
    });

    // Confirm booking
    await bookingService.confirmBooking(parseInt(booking_id), parseInt(payment_id));

    res.json({
      success: true,
      message: 'Payment simulation completed',
      data: {
        booking_id: parseInt(booking_id),
        payment_id: parseInt(payment_id)
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Payment simulation failed',
      error: error.message
    });
  }
});

/**
 * GET /api/webhooks/stripe/events
 * Get recent Stripe events (admin only, for debugging)
 */
const getStripeEvents = asyncHandler(async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Accès non autorisé'
    });
  }

  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    const events = await stripe.events.list({
      limit: parseInt(req.query.limit) || 20,
      type: req.query.type || undefined
    });

    res.json({
      success: true,
      data: {
        events: events.data,
        has_more: events.has_more
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des événements Stripe',
      error: error.message
    });
  }
});

/**
 * POST /api/webhooks/stripe/retry
 * Retry processing a specific Stripe event (admin only)
 */
const retryStripeEvent = asyncHandler(async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Accès non autorisé'
    });
  }

  const { event_id } = req.body;

  if (!event_id) {
    return res.status(400).json({
      success: false,
      message: 'event_id requis'
    });
  }

  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    const event = await stripe.events.retrieve(event_id);
    
    // Process the event again
    const mockReq = {
      headers: { 'stripe-signature': 'manual-retry' },
      body: JSON.stringify(event)
    };
    
    const mockRes = {
      status: (code) => ({
        json: (data) => ({ statusCode: code, data })
      })
    };

    // This is a simplified retry - in production you might want more sophisticated retry logic
    await handleStripeWebhook(mockReq, mockRes);

    res.json({
      success: true,
      message: 'Événement retraité avec succès',
      data: {
        event_id,
        event_type: event.type,
        created: new Date(event.created * 1000)
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors du retraitement de l\'événement',
      error: error.message
    });
  }
});

module.exports = {
  handleStripeWebhook,
  testWebhook,
  simulatePaymentSuccess,
  getStripeEvents,
  retryStripeEvent
};
