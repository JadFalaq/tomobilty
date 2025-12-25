const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const prisma = require('../config/prisma');
const { AppError, asyncHandler } = require('../middlewares/errorHandler.middleware');

// Create Stripe payment session
const createPaymentSession = asyncHandler(async (req, res) => {
  const { booking_id, amount, currency = 'mad' } = req.body;

  // Verify booking belongs to user
  const booking = await prisma.booking.findFirst({
    where: {
      id: parseInt(booking_id),
      user_id: req.user.id
    },
    include: {
      car: {
        include: {
          brand: true
        }
      },
      user: {
        select: {
          email: true,
          nom: true,
          prenom: true
        }
      }
    }
  });

  if (!booking) {
    throw new AppError('Réservation non trouvée', 404, 'BOOKING_NOT_FOUND');
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
    throw new AppError('Cette réservation est déjà payée', 400, 'ALREADY_PAID');
  }

  try {
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: `Location ${booking.car.brand.name} ${booking.car.modele}`,
              description: `Réservation #${booking.id} - Du ${new Date(booking.date_debut).toLocaleDateString('fr-FR')} au ${new Date(booking.date_fin).toLocaleDateString('fr-FR')}`,
            },
            unit_amount: Math.round(parseFloat(amount) * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/booking/${booking.id}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/booking/${booking.id}/payment-cancel`,
      customer_email: booking.user.email,
      metadata: {
        booking_id: booking.id.toString(),
        user_id: req.user.id.toString()
      }
    });

    // Create or update payment record
    const payment = await prisma.payment.upsert({
      where: {
        booking_id_user_id: {
          booking_id: parseInt(booking_id),
          user_id: req.user.id
        }
      },
      update: {
        amount: parseFloat(amount),
        currency: currency.toUpperCase(),
        status: 'CREATED',
        provider_session_id: session.id,
        metadata: JSON.stringify({
          stripe_session_id: session.id,
          customer_email: booking.user.email
        })
      },
      create: {
        booking_id: parseInt(booking_id),
        user_id: req.user.id,
        amount: parseFloat(amount),
        currency: currency.toUpperCase(),
        status: 'CREATED',
        provider_session_id: session.id,
        metadata: JSON.stringify({
          stripe_session_id: session.id,
          customer_email: booking.user.email
        })
      }
    });

    res.json({
      success: true,
      data: {
        session_id: session.id,
        session_url: session.url,
        payment_id: payment.id
      }
    });
  } catch (error) {
    console.error('Stripe error:', error);
    throw new AppError('Erreur lors de la création de la session de paiement', 500, 'STRIPE_ERROR');
  }
});

// Handle Stripe webhook
const handleWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      await handlePaymentSuccess(event.data.object);
      break;
    case 'checkout.session.expired':
      await handlePaymentExpired(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Handle successful payment
const handlePaymentSuccess = async (session) => {
  try {
    const bookingId = parseInt(session.metadata.booking_id);
    const userId = parseInt(session.metadata.user_id);

    // Update payment status
    await prisma.payment.updateMany({
      where: {
        booking_id: bookingId,
        user_id: userId,
        provider_session_id: session.id
      },
      data: {
        status: 'COMPLETED',
        provider_payment_id: session.payment_intent,
        metadata: JSON.stringify({
          ...JSON.parse(session.metadata || '{}'),
          payment_intent: session.payment_intent,
          amount_total: session.amount_total,
          currency: session.currency
        })
      }
    });

    // Update booking payment status
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        paiement_effectue: true,
        montant_paye: session.amount_total / 100 // Convert from cents
      }
    });

    // Create invoice
    const invoiceNumber = `INV-${Date.now()}-${bookingId}`;
    await prisma.invoice.create({
      data: {
        user_id: userId,
        booking_id: bookingId,
        payment_id: (await prisma.payment.findFirst({
          where: {
            booking_id: bookingId,
            provider_session_id: session.id
          }
        }))?.id,
        invoice_number: invoiceNumber,
        amount: session.amount_total / 100,
        currency: session.currency.toUpperCase(),
        status: 'PAID'
      }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        user_id: userId,
        title: 'Paiement confirmé',
        message: `Votre paiement pour la réservation #${bookingId} a été confirmé avec succès.`,
        type: 'PAYMENT'
      }
    });

    console.log(`Payment successful for booking ${bookingId}`);
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
};

// Handle expired payment
const handlePaymentExpired = async (session) => {
  try {
    const bookingId = parseInt(session.metadata.booking_id);
    const userId = parseInt(session.metadata.user_id);

    // Update payment status
    await prisma.payment.updateMany({
      where: {
        booking_id: bookingId,
        user_id: userId,
        provider_session_id: session.id
      },
      data: {
        status: 'CANCELLED'
      }
    });

    console.log(`Payment expired for booking ${bookingId}`);
  } catch (error) {
    console.error('Error handling payment expiry:', error);
  }
};

// Handle failed payment
const handlePaymentFailed = async (paymentIntent) => {
  try {
    // Update payment status based on payment intent
    await prisma.payment.updateMany({
      where: {
        provider_payment_id: paymentIntent.id
      },
      data: {
        status: 'FAILED'
      }
    });

    console.log(`Payment failed for payment intent ${paymentIntent.id}`);
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
};

// Get payments by booking
const getPaymentsByBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  // Verify booking belongs to user
  const booking = await prisma.booking.findFirst({
    where: {
      id: parseInt(bookingId),
      user_id: req.user.id
    }
  });

  if (!booking) {
    throw new AppError('Réservation non trouvée', 404, 'BOOKING_NOT_FOUND');
  }

  const payments = await prisma.payment.findMany({
    where: {
      booking_id: parseInt(bookingId)
    },
    orderBy: {
      created_at: 'desc'
    }
  });

  res.json({
    success: true,
    data: { payments }
  });
});

// Get payment by ID
const getPaymentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const payment = await prisma.payment.findFirst({
    where: {
      id: parseInt(id),
      user_id: req.user.id
    },
    include: {
      booking: {
        include: {
          car: {
            include: {
              brand: true
            }
          }
        }
      },
      invoices: true
    }
  });

  if (!payment) {
    throw new AppError('Paiement non trouvé', 404, 'PAYMENT_NOT_FOUND');
  }

  res.json({
    success: true,
    data: { payment }
  });
});

// Get all payments (Admin only)
const getAllPayments = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    status, 
    user_id, 
    booking_id,
    date_from,
    date_to
  } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};

  if (status) {
    where.status = status;
  }

  if (user_id) {
    where.user_id = parseInt(user_id);
  }

  if (booking_id) {
    where.booking_id = parseInt(booking_id);
  }

  if (date_from || date_to) {
    where.created_at = {};
    if (date_from) where.created_at.gte = new Date(date_from);
    if (date_to) where.created_at.lte = new Date(date_to);
  }

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nom: true,
            prenom: true
          }
        },
        booking: {
          include: {
            car: {
              include: {
                brand: true
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      skip,
      take: parseInt(limit)
    }),
    prisma.payment.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
});

// Refund payment (Admin only)
const refundPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const payment = await prisma.payment.findUnique({
    where: { id: parseInt(id) },
    include: {
      booking: true,
      user: {
        select: {
          id: true,
          email: true
        }
      }
    }
  });

  if (!payment) {
    throw new AppError('Paiement non trouvé', 404, 'PAYMENT_NOT_FOUND');
  }

  if (payment.status !== 'COMPLETED') {
    throw new AppError('Seuls les paiements complétés peuvent être remboursés', 400, 'PAYMENT_NOT_COMPLETED');
  }

  try {
    // Create Stripe refund
    const refund = await stripe.refunds.create({
      payment_intent: payment.provider_payment_id,
      reason: 'requested_by_customer'
    });

    // Update payment status
    await prisma.payment.update({
      where: { id: parseInt(id) },
      data: {
        status: 'REFUNDED',
        metadata: JSON.stringify({
          ...JSON.parse(payment.metadata || '{}'),
          refund_id: refund.id,
          refund_reason: reason,
          refunded_at: new Date().toISOString()
        })
      }
    });

    // Update booking
    await prisma.booking.update({
      where: { id: payment.booking_id },
      data: {
        paiement_effectue: false,
        montant_paye: 0
      }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        user_id: payment.user_id,
        title: 'Remboursement effectué',
        message: `Votre paiement pour la réservation #${payment.booking_id} a été remboursé.`,
        type: 'PAYMENT'
      }
    });

    res.json({
      success: true,
      message: 'Remboursement effectué avec succès',
      data: {
        refund_id: refund.id,
        amount: refund.amount / 100
      }
    });
  } catch (error) {
    console.error('Stripe refund error:', error);
    throw new AppError('Erreur lors du remboursement', 500, 'REFUND_ERROR');
  }
});

// Get payment statistics (Admin only)
const getPaymentStatistics = asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query;

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

  const [
    totalPayments,
    completedPayments,
    failedPayments,
    totalRevenue,
    averagePayment,
    paymentsByStatus
  ] = await Promise.all([
    prisma.payment.count({ where: dateFilter }),
    prisma.payment.count({
      where: {
        ...dateFilter,
        status: 'COMPLETED'
      }
    }),
    prisma.payment.count({
      where: {
        ...dateFilter,
        status: 'FAILED'
      }
    }),
    prisma.payment.aggregate({
      where: {
        ...dateFilter,
        status: 'COMPLETED'
      },
      _sum: { amount: true }
    }),
    prisma.payment.aggregate({
      where: {
        ...dateFilter,
        status: 'COMPLETED'
      },
      _avg: { amount: true }
    }),
    prisma.payment.groupBy({
      by: ['status'],
      where: dateFilter,
      _count: true,
      orderBy: {
        _count: {
          status: 'desc'
        }
      }
    })
  ]);

  res.json({
    success: true,
    data: {
      period,
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
        }))
      }
    }
  });
});

module.exports = {
  createPaymentSession,
  handleWebhook,
  getPaymentsByBooking,
  getPaymentById,
  getAllPayments,
  refundPayment,
  getPaymentStatistics
};
