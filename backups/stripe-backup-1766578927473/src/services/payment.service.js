/**
 * Payment service for handling payments via multiple providers (Stripe, CMI, etc.)
 */

const prisma = require('../config/prisma');
const PaymentProviderFactory = require('./providers/PaymentProviderFactory');
const { PaymentFailedError } = require('../errors/booking.errors');

/**
 * Create payment session for booking payment (supports multiple providers)
 * @param {number} bookingId - Booking ID
 * @param {Object} bookingData - Booking details
 * @param {string} providerName - Payment provider (optional, uses default from env)
 * @returns {Promise<Object>} Payment session details
 */
const createPaymentSession = async (bookingId, bookingData, providerName = null) => {
  try {
    const { pricing, car, user, metadata } = bookingData;
    const provider = PaymentProviderFactory.createProvider(providerName);
    const currentProvider = providerName || process.env.PAYMENT_PROVIDER || 'cmi';

    // Create payment record first
    const payment = await prisma.payment.create({
      data: {
        booking_id: bookingId,
        user_id: user.id,
        amount: pricing.totalPrice,
        currency: 'MAD',
        status: 'CREATED',
        provider: currentProvider,
        metadata: JSON.stringify({
          booking_reference: metadata.booking_reference,
          car_model: `${car.brand.name} ${car.modele}`,
          date_debut: metadata.date_debut,
          date_fin: metadata.date_fin
        })
      }
    });

    // Prepare order data for provider
    const orderData = {
      orderId: bookingId,
      amount: pricing.totalPrice,
      currency: 'MAD',
      customerEmail: user.email,
      customerName: `${user.prenom} ${user.nom}`,
      description: `Location ${car.brand.name} ${car.modele}`,
      returnUrl: `${process.env.FRONTEND_URL}/payments/return`,
      cancelUrl: `${process.env.FRONTEND_URL}/booking/cancel?booking_id=${bookingId}`,
      ipnUrl: `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/payments/${currentProvider}/ipn`
    };

    // Create payment session via provider
    const sessionResult = await provider.createPaymentSession(orderData);

    // Update payment with session details
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        provider_session_id: sessionResult.sessionId,
        provider_payment_id: sessionResult.providerRef,
        status: 'PENDING'
      }
    });

    return {
      payment_id: payment.id,
      session_id: sessionResult.sessionId,
      session_url: sessionResult.redirectUrl,
      provider_ref: sessionResult.providerRef,
      amount: pricing.totalPrice,
      currency: 'MAD',
      provider: currentProvider
    };

  } catch (error) {
    console.error('Payment session creation error:', error);
    throw new PaymentFailedError(`Erreur lors de la création de la session de paiement: ${error.message}`);
  }
};

/**
 * Handle successful payment webhook from Stripe
 * @param {string} sessionId - Stripe session ID
 * @param {Object} paymentIntent - Stripe payment intent object
 * @returns {Promise<Object>} Payment update result
 */
const handlePaymentSuccess = async (sessionId, paymentIntent) => {
  try {
    // Find payment by session ID
    const payment = await prisma.payment.findFirst({
      where: {
        provider_session_id: sessionId
      },
      include: {
        booking: {
          include: {
            user: true,
            car: {
              include: {
                brand: true
              }
            }
          }
        }
      }
    });

    if (!payment) {
      throw new Error(`Payment not found for session ${sessionId}`);
    }

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        provider_payment_id: paymentIntent.id,
        metadata: JSON.stringify({
          ...JSON.parse(payment.metadata || '{}'),
          payment_method: paymentIntent.payment_method_types?.[0],
          completed_at: new Date().toISOString()
        })
      }
    });

    // Update booking payment status
    await prisma.booking.update({
      where: { id: payment.booking_id },
      data: {
        paiement_effectue: true,
        montant_paye: payment.amount,
        mode_paiement: paymentIntent.payment_method_types?.[0] || 'card'
      }
    });

    console.log(`✅ Payment ${payment.id} completed for booking ${payment.booking_id}`);

    return {
      payment: updatedPayment,
      booking: payment.booking
    };

  } catch (error) {
    console.error('Error handling payment success:', error);
    throw error;
  }
};

/**
 * Handle failed payment webhook from Stripe
 * @param {string} sessionId - Stripe session ID
 * @param {Object} paymentIntent - Stripe payment intent object
 * @returns {Promise<Object>} Payment update result
 */
const handlePaymentFailed = async (sessionId, paymentIntent) => {
  try {
    // Find payment by session ID
    const payment = await prisma.payment.findFirst({
      where: {
        provider_session_id: sessionId
      }
    });

    if (!payment) {
      throw new Error(`Payment not found for session ${sessionId}`);
    }

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED',
        metadata: JSON.stringify({
          ...JSON.parse(payment.metadata || '{}'),
          failure_reason: paymentIntent.last_payment_error?.message || 'Payment failed',
          failed_at: new Date().toISOString()
        })
      }
    });

    console.log(`❌ Payment ${payment.id} failed for booking ${payment.booking_id}`);

    return {
      payment: updatedPayment
    };

  } catch (error) {
    console.error('Error handling payment failure:', error);
    throw error;
  }
};

/**
 * Create refund for a payment
 * @param {number} paymentId - Payment ID
 * @param {number} amount - Refund amount (optional, defaults to full amount)
 * @param {string} reason - Refund reason
 * @returns {Promise<Object>} Refund result
 */
const createRefund = async (paymentId, amount = null, reason = 'Annulation de réservation') => {
  try {
    // Get original payment
    const originalPayment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
            user: true
          }
        }
      }
    });

    if (!originalPayment) {
      throw new Error(`Payment ${paymentId} not found`);
    }

    if (originalPayment.status !== 'COMPLETED') {
      throw new Error(`Cannot refund payment with status ${originalPayment.status}`);
    }

    const refundAmount = amount || originalPayment.amount;

    // Create Stripe refund
    const stripeRefund = await stripe.refunds.create({
      payment_intent: originalPayment.provider_payment_id,
      amount: Math.round(refundAmount * 100), // Convert to cents
      reason: 'requested_by_customer',
      metadata: {
        booking_id: originalPayment.booking_id.toString(),
        original_payment_id: paymentId.toString(),
        refund_reason: reason
      }
    });

    // Create refund payment record
    const refundPayment = await prisma.payment.create({
      data: {
        booking_id: originalPayment.booking_id,
        user_id: originalPayment.user_id,
        amount: -refundAmount, // Negative amount for refund
        currency: originalPayment.currency,
        status: 'COMPLETED',
        provider: 'stripe',
        provider_payment_id: stripeRefund.id,
        metadata: JSON.stringify({
          refund_reason: reason,
          original_payment_id: paymentId,
          stripe_refund_id: stripeRefund.id,
          refunded_at: new Date().toISOString()
        })
      }
    });

    console.log(`✅ Refund ${refundPayment.id} created for payment ${paymentId}, amount: ${refundAmount} MAD`);

    return {
      refund: refundPayment,
      stripe_refund: stripeRefund,
      original_payment: originalPayment
    };

  } catch (error) {
    console.error('Error creating refund:', error);
    throw new PaymentFailedError(paymentId, error.message);
  }
};

/**
 * Get payment status and details
 * @param {number} paymentId - Payment ID
 * @returns {Promise<Object>} Payment details
 */
const getPaymentStatus = async (paymentId) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
            user: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                email: true
              }
            },
            car: {
              include: {
                brand: true
              }
            }
          }
        }
      }
    });

    if (!payment) {
      throw new Error(`Payment ${paymentId} not found`);
    }

    // If payment has Stripe session/payment ID, get additional details from Stripe
    let stripeDetails = null;
    if (payment.provider_session_id && payment.status === 'PENDING') {
      try {
        stripeDetails = await stripe.checkout.sessions.retrieve(payment.provider_session_id);
      } catch (stripeError) {
        console.warn('Could not retrieve Stripe session details:', stripeError.message);
      }
    } else if (payment.provider_payment_id && payment.status === 'COMPLETED') {
      try {
        stripeDetails = await stripe.paymentIntents.retrieve(payment.provider_payment_id);
      } catch (stripeError) {
        console.warn('Could not retrieve Stripe payment details:', stripeError.message);
      }
    }

    return {
      payment,
      stripe_details: stripeDetails,
      metadata: payment.metadata ? JSON.parse(payment.metadata) : {}
    };

  } catch (error) {
    console.error('Error getting payment status:', error);
    throw error;
  }
};

/**
 * Get all payments for a booking
 * @param {number} bookingId - Booking ID
 * @returns {Promise<Array>} List of payments
 */
const getBookingPayments = async (bookingId) => {
  try {
    const payments = await prisma.payment.findMany({
      where: {
        booking_id: bookingId
      },
      orderBy: {
        created_at: 'asc'
      }
    });

    return payments.map(payment => ({
      ...payment,
      metadata: payment.metadata ? JSON.parse(payment.metadata) : {}
    }));

  } catch (error) {
    console.error('Error getting booking payments:', error);
    throw error;
  }
};

/**
 * Cancel pending payment
 * @param {number} paymentId - Payment ID
 * @returns {Promise<Object>} Cancellation result
 */
const cancelPayment = async (paymentId) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId }
    });

    if (!payment) {
      throw new Error(`Payment ${paymentId} not found`);
    }

    if (payment.status !== 'PENDING') {
      throw new Error(`Cannot cancel payment with status ${payment.status}`);
    }

    // Cancel Stripe session if exists
    if (payment.provider_session_id) {
      try {
        await stripe.checkout.sessions.expire(payment.provider_session_id);
      } catch (stripeError) {
        console.warn('Could not cancel Stripe session:', stripeError.message);
      }
    }

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'CANCELLED',
        metadata: JSON.stringify({
          ...JSON.parse(payment.metadata || '{}'),
          cancelled_at: new Date().toISOString()
        })
      }
    });

    console.log(`✅ Payment ${paymentId} cancelled`);

    return {
      payment: updatedPayment
    };

  } catch (error) {
    console.error('Error cancelling payment:', error);
    throw error;
  }
};

/**
 * Verify Stripe webhook signature
 * @param {string} payload - Webhook payload
 * @param {string} signature - Stripe signature header
 * @returns {Object} Verified event object
 */
const verifyWebhookSignature = (payload, signature) => {
  try {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    return stripe.webhooks.constructEvent(payload, signature, endpointSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    throw new Error('Invalid webhook signature');
  }
};

module.exports = {
  createPaymentSession,
  handlePaymentSuccess,
  handlePaymentFailed,
  createRefund,
  getPaymentStatus,
  getBookingPayments,
  cancelPayment,
  verifyWebhookSignature
};
