/**
 * Payment controller refactorisé pour supporter multiple providers (Stripe, CMI, etc.)
 */

const paymentService = require('../services/payment.service');
const bookingService = require('../services/booking.service');
const { asyncHandler } = require('../middlewares/errorHandler.middleware');
const prisma = require('../config/prisma');

/**
 * POST /api/payments/create
 * Create payment session (supports multiple providers)
 */
const createPaymentSession = asyncHandler(async (req, res) => {
  const { booking_id, amount, currency = 'MAD', provider } = req.body;

  // Verify booking belongs to user
  const booking = await prisma.booking.findFirst({
    where: {
      id: parseInt(booking_id),
      user_id: req.user.id
    },
    include: {
      varianteCar: {
        include: {
          car: { include: { brand: true } }
        }
      },
      user: {
        select: {
          id: true,
          email: true,
          nom: true,
          prenom: true
        }
      }
    }
  });

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Réservation non trouvée',
      code: 'BOOKING_NOT_FOUND'
    });
  }

  // Check if payment already exists
  const existingPayment = await prisma.payment.findFirst({
    where: {
      booking_id: parseInt(booking_id),
      status: {
        in: ['CREATED', 'PENDING', 'COMPLETED']
      }
    }
  });

  if (existingPayment && existingPayment.status === 'COMPLETED') {
    return res.status(400).json({
      success: false,
      message: 'Cette réservation est déjà payée',
      code: 'ALREADY_PAID'
    });
  }

  try {
    // Prepare booking data for payment service
    const bookingData = {
      pricing: { totalPrice: parseFloat(amount) },
      car: booking.varianteCar.car,
      user: booking.user,
      metadata: {
        booking_reference: `BK-${booking.id}`,
        date_debut: booking.date_debut.toISOString().split('T')[0],
        date_fin: booking.date_fin.toISOString().split('T')[0]
      }
    };

    const paymentSession = await paymentService.createPaymentSession(
      parseInt(booking_id),
      bookingData,
      provider
    );

    res.json({
      success: true,
      data: paymentSession
    });

  } catch (error) {
    console.error('Payment session creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la session de paiement',
      error: error.message
    });
  }
});

/**
 * GET /api/payments/return
 * Handle payment return from provider (browser redirect)
 */
const handlePaymentReturn = asyncHandler(async (req, res) => {
  const provider = req.query.provider || req.body.provider || process.env.PAYMENT_PROVIDER || 'cmi';

  try {
    const returnResult = await paymentService.handlePaymentReturn(req, provider);

    // Redirect to appropriate page based on status
    const redirectUrl = returnResult.redirect_url;
    
    if (returnResult.status === 'COMPLETED' && returnResult.payment?.id && returnResult.booking?.id) {
      try {
        await bookingService.confirmBooking(returnResult.booking.id, returnResult.payment.id);
      } catch (confirmError) {
        console.error('Booking confirmation error:', confirmError);
      }
    }
    
    if (req.query.format === 'json') {
      // For AJAX requests
      res.json({
        success: returnResult.status === 'COMPLETED',
        data: {
          status: returnResult.status,
          message: returnResult.message,
          booking_id: returnResult.booking?.id,
          payment_id: returnResult.payment?.id,
          redirect_url: redirectUrl
        }
      });
    } else {
      // For browser redirects
      res.redirect(redirectUrl);
    }

  } catch (error) {
    console.error('Payment return handling error:', error);
    
    const errorUrl = `${process.env.FRONTEND_URL}/payment-error?message=${encodeURIComponent(error.message)}`;
    
    if (req.query.format === 'json') {
      res.status(500).json({
        success: false,
        message: 'Erreur lors du traitement du retour de paiement',
        error: error.message
      });
    } else {
      res.redirect(errorUrl);
    }
  }
});

/**
 * POST /api/payments/cmi/ipn
 * Handle CMI IPN (Instant Payment Notification)
 */
const handleCmiIpn = asyncHandler(async (req, res) => {
  try {
    let requestObj = req;
    if (Buffer.isBuffer(req.body)) {
      const raw = req.body.toString('utf8');
      const params = Object.fromEntries(new URLSearchParams(raw));
      requestObj = { ...req, body: params };
    }
    const notificationResult = await paymentService.handlePaymentNotification(requestObj, 'cmi');

    console.log('📨 CMI IPN processed:', {
      booking_id: notificationResult.booking?.id,
      payment_id: notificationResult.payment?.id,
      status: notificationResult.payment?.status,
      already_processed: notificationResult.already_processed
    });
    
    if (notificationResult.payment?.status === 'COMPLETED' && notificationResult.payment?.id && notificationResult.booking?.id) {
      try {
        await bookingService.confirmBooking(notificationResult.booking.id, notificationResult.payment.id);
      } catch (confirmError) {
        console.error('Booking confirmation error:', confirmError);
      }
    }

    // Send appropriate response to CMI
    if (notificationResult.should_ack && notificationResult.ack_response) {
      res.status(200).send(notificationResult.ack_response);
    } else {
      res.status(200).send('OK');
    }

  } catch (error) {
    console.error('❌ CMI IPN error:', error);
    res.status(400).send('ERROR');
  }
});

/**
 * POST /api/payments/stripe/webhook
 * Handle Stripe webhooks (legacy support)
 */
const handleStripeWebhook = asyncHandler(async (req, res) => {
  try {
    const notificationResult = await paymentService.handlePaymentNotification(req, 'stripe');

    console.log('📨 Stripe webhook processed:', {
      booking_id: notificationResult.booking?.id,
      payment_id: notificationResult.payment?.id,
      status: notificationResult.payment?.status
    });

    res.json({ received: true });

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
 * GET /api/payments/:id
 * Get payment details
 */
const getPaymentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const paymentDetails = await paymentService.getPaymentStatus(parseInt(id));

  // Verify user has access to this payment
  if (req.user.role !== 'ADMIN' && paymentDetails.payment.user_id !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Accès non autorisé à ce paiement'
    });
  }

  res.json({
    success: true,
    data: paymentDetails
  });
});

/**
 * GET /api/payments/booking/:bookingId
 * Get payments for a booking
 */
const getPaymentsByBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  // Verify booking belongs to user (unless admin)
  if (req.user.role !== 'ADMIN') {
    const booking = await prisma.booking.findFirst({
      where: {
        id: parseInt(bookingId),
        user_id: req.user.id
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }
  }

  const payments = await paymentService.getBookingPayments(parseInt(bookingId));

  res.json({
    success: true,
    data: { payments }
  });
});

/**
 * POST /api/payments/:id/refund
 * Create refund (Admin only)
 */
const createRefund = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount, reason = 'Remboursement administratif' } = req.body;

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Accès non autorisé'
    });
  }

  const refundResult = await paymentService.createRefund(
    parseInt(id),
    amount ? parseFloat(amount) : null,
    reason
  );

  res.json({
    success: true,
    message: 'Remboursement créé avec succès',
    data: refundResult
  });
});

/**
 * POST /api/payments/:id/cancel
 * Cancel payment session
 */
const cancelPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const payment = await prisma.payment.findUnique({
    where: { id: parseInt(id) }
  });

  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'Paiement non trouvé'
    });
  }

  // Verify user has access to this payment
  if (req.user.role !== 'ADMIN' && payment.user_id !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Accès non autorisé à ce paiement'
    });
  }

  const cancelResult = await paymentService.cancelPayment(parseInt(id));

  res.json({
    success: true,
    message: 'Paiement annulé avec succès',
    data: cancelResult
  });
});

/**
 * GET /api/payments/admin/statistics
 * Get payment statistics (Admin only)
 */
const getPaymentStatistics = asyncHandler(async (req, res) => {
  const { period = '30d', provider } = req.query;

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Accès non autorisé'
    });
  }

  let dateFilter = {};
  const now = new Date();

  switch (period) {
    case '7d':
      dateFilter = {
        created_at: {
          gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        }
      };
      break;
    case '30d':
      dateFilter = {
        created_at: {
          gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        }
      };
      break;
    case '90d':
      dateFilter = {
        created_at: {
          gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        }
      };
      break;
  }

  if (provider) {
    dateFilter.provider = provider;
  }

  const [
    totalPayments,
    completedPayments,
    failedPayments,
    totalRevenue,
    averagePayment,
    paymentsByStatus,
    paymentsByProvider
  ] = await Promise.all([
    prisma.payment.count({ where: dateFilter }),
    prisma.payment.count({
      where: { ...dateFilter, status: 'COMPLETED' }
    }),
    prisma.payment.count({
      where: { ...dateFilter, status: 'FAILED' }
    }),
    prisma.payment.aggregate({
      where: { ...dateFilter, status: 'COMPLETED' },
      _sum: { amount: true }
    }),
    prisma.payment.aggregate({
      where: { ...dateFilter, status: 'COMPLETED' },
      _avg: { amount: true }
    }),
    prisma.payment.groupBy({
      by: ['status'],
      where: dateFilter,
      _count: true,
      orderBy: { _count: { status: 'desc' } }
    }),
    prisma.payment.groupBy({
      by: ['provider'],
      where: dateFilter,
      _count: true,
      _sum: { amount: true },
      orderBy: { _count: { provider: 'desc' } }
    })
  ]);

  res.json({
    success: true,
    data: {
      period,
      provider_filter: provider,
      statistics: {
        total_payments: totalPayments,
        completed_payments: completedPayments,
        failed_payments: failedPayments,
        success_rate: totalPayments > 0 ? (completedPayments / totalPayments * 100).toFixed(2) : 0,
        total_revenue: totalRevenue._sum.amount || 0,
        average_payment: averagePayment._avg.amount || 0,
        payments_by_status: paymentsByStatus.map(item => ({
          status: item.status,
          count: item._count
        })),
        payments_by_provider: paymentsByProvider.map(item => ({
          provider: item.provider,
          count: item._count,
          revenue: item._sum.amount || 0
        }))
      }
    }
  });
});

/**
 * GET /api/payments/providers/info
 * Get available payment providers info
 */
const getProvidersInfo = asyncHandler(async (req, res) => {
  const PaymentProviderFactory = require('../services/providers/PaymentProviderFactory');
  
  const providersInfo = PaymentProviderFactory.getAllProvidersInfo();
  
  res.json({
    success: true,
    data: {
      current_provider: process.env.PAYMENT_PROVIDER || 'cmi',
      available_providers: providersInfo
    }
  });
});

module.exports = {
  createPaymentSession,
  handlePaymentReturn,
  handleCmiIpn,
  handleStripeWebhook,
  getPaymentById,
  getPaymentsByBooking,
  createRefund,
  cancelPayment,
  getPaymentStatistics,
  getProvidersInfo
};
