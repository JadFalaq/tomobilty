/**
 * Payment service refactorisé pour supporter multiple providers (Stripe, CMI, etc.)
 */

const prisma = require('../config/prisma');
const PaymentProviderFactory = require('./providers/PaymentProviderFactory');
const { PaymentFailedError } = require('../errors/booking.errors');

const normalizePaymentStatus = (status) => {
  const s = (status || '').toUpperCase();
  if (s === 'PAID') return 'COMPLETED';
  if (s === 'FAILED') return 'FAILED';
  if (s === 'CANCELED' || s === 'CANCELLED') return 'CANCELED';
  if (s === 'PENDING') return 'PENDING';
  return 'UNKNOWN';
};

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

    // Idempotency: reuse existing CREATED/PENDING payment for same booking+provider
    let payment = await prisma.payment.findFirst({
      where: {
        booking_id: bookingId,
        provider: currentProvider,
        status: { in: ['CREATED', 'PENDING'] }
      }
    });

    if (!payment) {
      // Create payment record
      payment = await prisma.payment.create({
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
    }

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

    // If existing payment already has a session, reuse it
    if (payment.provider_session_id && payment.provider_payment_id) {
      return {
        payment_id: payment.id,
        session_id: payment.provider_session_id,
        session_url: (await (async () => {
          // We don't persist redirectUrl; providers should be able to reconstruct or client can already have it
          // Fallback: return a generic URL if provider supports retrieval
          try {
            const details = await provider.getSessionRedirectUrl?.(payment.provider_session_id);
            return details || null;
          } catch (_) {
            return null;
          }
        })()) || null,
        provider_ref: payment.provider_payment_id,
        amount: Number(payment.amount),
        currency: payment.currency,
        provider: currentProvider
      };
    }

    // Otherwise create payment session via provider and update existing row
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
 * Handle payment return from provider (browser redirect)
 * @param {Object} request - Request object with query/body params
 * @param {string} providerName - Payment provider name
 * @returns {Promise<Object>} Payment processing result
 */
const handlePaymentReturn = async (request, providerName) => {
  try {
    const provider = PaymentProviderFactory.createProvider(providerName);
    const returnResult = await provider.handleReturn(request);

    if (!returnResult.orderId) {
      throw new Error('Order ID not found in return data');
    }

    // Find payment by booking ID
    const payment = await prisma.payment.findFirst({
      where: {
        booking_id: returnResult.orderId,
        provider: providerName
      },
      include: {
        booking: {
          include: {
            user: true,
            varianteCar: { include: { car: { include: { brand: true } } } }
          }
        }
      }
    });

    if (!payment) {
      throw new Error(`Payment not found for booking ${returnResult.orderId}`);
    }

    // Update payment status based on return result
    const normalizedStatus = normalizePaymentStatus(returnResult.status);
    const updatedPayment = await updatePaymentStatus(
      payment.id, 
      normalizedStatus, 
      returnResult.transactionId,
      returnResult.message
    );

    return {
      payment: updatedPayment,
      booking: payment.booking,
      status: normalizedStatus,
      message: returnResult.message,
      redirect_url: getRedirectUrl(normalizedStatus, returnResult.orderId)
    };

  } catch (error) {
    console.error('Error handling payment return:', error);
    throw error;
  }
};

/**
 * Handle payment notification from provider (IPN/webhook)
 * @param {Object} request - Request object with notification data
 * @param {string} providerName - Payment provider name
 * @returns {Promise<Object>} Notification processing result
 */
const handlePaymentNotification = async (request, providerName) => {
  try {
    const provider = PaymentProviderFactory.createProvider(providerName);
    const notificationResult = await provider.handleNotification(request);

    if (!notificationResult.orderId) {
      throw new Error('Order ID not found in notification data');
    }

    // Find payment by booking ID
    const payment = await prisma.payment.findFirst({
      where: {
        booking_id: notificationResult.orderId,
        provider: providerName
      },
      include: {
        booking: {
          include: {
            user: true,
            varianteCar: { include: { car: { include: { brand: true } } } }
          }
        }
      }
    });

    if (!payment) {
      throw new Error(`Payment not found for booking ${notificationResult.orderId}`);
    }

    // Vérifier l'idempotence - éviter le double traitement
    const incomingNormalized = normalizePaymentStatus(notificationResult.status);
    if (payment.status === 'COMPLETED' && incomingNormalized === 'COMPLETED') {
      console.log(`Payment ${payment.id} already processed, skipping duplicate notification`);
      return {
        payment: payment,
        already_processed: true,
        should_ack: notificationResult.shouldAck,
        ack_response: notificationResult.ackResponse
      };
    }

    // Update payment status
    const updatedPayment = await updatePaymentStatus(
      payment.id,
      incomingNormalized,
      notificationResult.transactionId,
      'Payment processed via IPN'
    );

    return {
      payment: updatedPayment,
      booking: payment.booking,
      should_ack: notificationResult.shouldAck,
      ack_response: notificationResult.ackResponse
    };

  } catch (error) {
    console.error('Error handling payment notification:', error);
    throw error;
  }
};

/**
 * Update payment status in database
 * @param {number} paymentId - Payment ID
 * @param {string} status - New status
 * @param {string} transactionId - Provider transaction ID
 * @param {string} message - Status message
 * @returns {Promise<Object>} Updated payment
 */
const updatePaymentStatus = async (paymentId, status, transactionId = null, message = null) => {
  const s = (status || '').toUpperCase();
  const dbStatuses = ['COMPLETED', 'FAILED', 'CANCELED', 'PENDING', 'REFUNDED'];
  const normalized = dbStatuses.includes(s) ? s : normalizePaymentStatus(status);
  const safeStatus = dbStatuses.includes(normalized) ? normalized : 'PENDING';
  const updateData = {
    status: safeStatus,
    metadata: null
  };

  if (transactionId) {
    updateData.provider_payment_id = transactionId;
  }

  // Get current payment to merge metadata
  const currentPayment = await prisma.payment.findUnique({
    where: { id: paymentId }
  });

  const currentMetadata = currentPayment?.metadata ? JSON.parse(currentPayment.metadata) : {};
  updateData.metadata = JSON.stringify({
    ...currentMetadata,
    status_updated_at: new Date().toISOString(),
    status_message: message
  });

  return await prisma.payment.update({
    where: { id: paymentId },
    data: updateData,
    include: {
      booking: {
        include: {
          user: true,
          varianteCar: { include: { car: { include: { brand: true } } } }
        }
      }
    }
  });
};

/**
 * Execute post-payment workflow (contract, invoice, loyalty, notifications)
 * @param {number} bookingId - Booking ID
 * @param {number} paymentId - Payment ID
 * @returns {Promise<Object>} Workflow results
 */
const executePostPaymentWorkflow = async (bookingId, paymentId) => {
  try {
    // Import services (avoid circular dependencies)
    const bookingService = require('./booking.service');
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });
    if (!booking) {
      return { error: `Booking ${bookingId} not found`, workflow_completed: false };
    }
    return await bookingService.executePostPaymentWorkflow(booking, paymentId);
    
  } catch (error) {
    console.error('Error in post-payment workflow:', error);
    // Don't throw error to avoid breaking payment confirmation
    return {
      error: error.message,
      workflow_completed: false
    };
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
    const provider = PaymentProviderFactory.createProvider(originalPayment.provider);

    // Attempt refund via provider
    const refundResult = await provider.refund(
      originalPayment.provider_payment_id,
      refundAmount,
      reason
    );

    // Create refund payment record
    const refundPayment = await prisma.payment.create({
      data: {
        booking_id: originalPayment.booking_id,
        user_id: originalPayment.user_id,
        amount: -refundAmount, // Negative amount for refund
        currency: originalPayment.currency,
        status: refundResult.status === 'REFUNDED' ? 'COMPLETED' : 'PENDING',
        provider: originalPayment.provider,
        provider_payment_id: refundResult.refundId,
        metadata: JSON.stringify({
          refund_reason: reason,
          original_payment_id: paymentId,
          provider_refund_id: refundResult.refundId,
          refunded_at: new Date().toISOString(),
          requires_manual_processing: refundResult.requiresManualProcessing || false
        })
      }
    });

    console.log(`✅ Refund ${refundPayment.id} created for payment ${paymentId}, amount: ${refundAmount} MAD`);

    return {
      refund: refundPayment,
      provider_refund: refundResult,
      original_payment: originalPayment
    };

  } catch (error) {
    console.error('Error creating refund:', error);
    throw new PaymentFailedError(`Erreur lors du remboursement: ${error.message}`);
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
            varianteCar: {
              include: {
                car: {
                  include: {
                    brand: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!payment) {
      throw new Error(`Payment ${paymentId} not found`);
    }

    // Try to get additional details from provider if available
    let providerDetails = null;
    if (payment.provider_payment_id) {
      try {
        const provider = PaymentProviderFactory.createProvider(payment.provider);
        providerDetails = await provider.getPaymentStatus(payment.provider_payment_id);
      } catch (providerError) {
        console.warn('Could not retrieve provider payment details:', providerError.message);
      }
    }

    return {
      payment,
      provider_details: providerDetails,
      metadata: payment.metadata ? JSON.parse(payment.metadata) : {}
    };

  } catch (error) {
    console.error('Error getting payment status:', error);
    throw error;
  }
};

/**
 * Get redirect URL based on payment status
 * @param {string} status - Payment status
 * @param {number} bookingId - Booking ID
 * @returns {string} Redirect URL
 */
const getRedirectUrl = (status, bookingId) => {
  const baseUrl = process.env.FRONTEND_URL;
  
  switch (status) {
    case 'COMPLETED':
      return `${baseUrl}/booking/${bookingId}/payment-success`;
    case 'FAILED':
      return `${baseUrl}/booking/${bookingId}/payment-failed`;
    case 'CANCELED':
      return `${baseUrl}/booking/${bookingId}/payment-canceled`;
    default:
      return `${baseUrl}/booking/${bookingId}`;
  }
};

/**
 * Get booking payments
 * @param {number} bookingId - Booking ID
 * @returns {Promise<Array>} List of payments
 */
const getBookingPayments = async (bookingId) => {
  return await prisma.payment.findMany({
    where: {
      booking_id: bookingId
    },
    orderBy: {
      created_at: 'desc'
    }
  });
};

/**
 * Cancel payment session
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

    if (!['CREATED', 'PENDING'].includes(payment.status)) {
      throw new Error(`Cannot cancel payment with status ${payment.status}`);
    }

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'CANCELED',
        metadata: JSON.stringify({
          ...JSON.parse(payment.metadata || '{}'),
          cancelled_at: new Date().toISOString(),
          cancellation_reason: 'User cancelled'
        })
      }
    });

    console.log(`❌ Payment ${paymentId} cancelled`);

    return {
      payment: updatedPayment
    };

  } catch (error) {
    console.error('Error cancelling payment:', error);
    throw error;
  }
};

/**
 * Verify webhook signature (legacy support)
 * @param {string} payload - Webhook payload
 * @param {string} signature - Webhook signature
 * @param {string} providerName - Provider name
 * @returns {Object} Verified event object
 */
const verifyWebhookSignature = (payload, signature, providerName = 'stripe') => {
  try {
    const provider = PaymentProviderFactory.createProvider(providerName);
    
    if (providerName === 'stripe') {
      // For Stripe, we need to construct the event
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      return stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
    }
    
    // For other providers, just verify signature
    const isValid = provider.verifySignature(payload, signature);
    if (!isValid) {
      throw new Error('Invalid signature');
    }
    
    return JSON.parse(payload);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    throw new Error('Invalid webhook signature');
  }
};

module.exports = {
  createPaymentSession,
  handlePaymentReturn,
  handlePaymentNotification,
  updatePaymentStatus,
  executePostPaymentWorkflow,
  createRefund,
  getPaymentStatus,
  getBookingPayments,
  cancelPayment,
  verifyWebhookSignature,
  
  // Legacy support - these will be deprecated
  handlePaymentSuccess: handlePaymentNotification,
  handlePaymentFailed: handlePaymentNotification
};
