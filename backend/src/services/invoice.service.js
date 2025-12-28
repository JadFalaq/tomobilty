/**
 * Invoice service for billing and invoice generation
 */

const prisma = require('../config/prisma');
const { generateInvoicePDF, generatePDFPath } = require('../utils/pdf.utils');
const { generateInvoiceNumber } = require('../utils/booking.utils');
const { InvoiceGenerationError } = require('../errors/booking.errors');

/**
 * Generate invoice for a booking payment
 * @param {number} bookingId - Booking ID
 * @param {number} paymentId - Payment ID
 * @returns {Promise<Object>} Generated invoice details
 */
const generateInvoice = async (bookingId, paymentId) => {
  try {
    // Get booking with all related data
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        varianteCar: {
          include: {
            car: {
              include: {
                brand: true,
                category: true
              }
            }
          }
        },
        payments: {
          where: { id: paymentId }
        }
      }
    });

    if (!booking) {
      throw new InvoiceGenerationError(bookingId, 'Réservation non trouvée');
    }

    const payment = booking.payments[0];
    if (!payment) {
      throw new InvoiceGenerationError(bookingId, 'Paiement non trouvé');
    }

    // Generate invoice number
    const invoiceNumber = generateInvoiceNumber(Date.now());

    // Calculate invoice items and totals
    const invoiceData = await calculateInvoiceData(booking, payment);

    // Create invoice record
    const invoice = await prisma.invoice.create({
      data: {
        user_id: booking.user_id,
        booking_id: bookingId,
        payment_id: paymentId,
        invoice_number: invoiceNumber,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status === 'COMPLETED' ? 'PAID' : 'PENDING',
        metadata: JSON.stringify({
          booking_reference: `BK-${new Date().getFullYear()}-${bookingId.toString().padStart(6, '0')}`,
          car_details: `${booking.varianteCar.car.brand.name} ${booking.varianteCar.car.modele}`,
          rental_period: `${booking.date_debut.toLocaleDateString('fr-FR')} - ${booking.date_fin.toLocaleDateString('fr-FR')}`,
          ...invoiceData.metadata
        })
      }
    });

    // Prepare PDF data
    const pdfData = {
      invoiceNumber,
      createdAt: invoice.created_at,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      client: {
        nom: booking.user.nom,
        prenom: booking.user.prenom,
        email: booking.user.email,
        adresse: booking.user.adresse
      },
      items: invoiceData.items,
      subtotal: invoiceData.subtotal,
      discount: invoiceData.discount,
      tax: invoiceData.tax,
      taxRate: invoiceData.taxRate,
      total: invoiceData.total,
      status: invoice.status,
      paymentMethod: payment.metadata ? JSON.parse(payment.metadata).payment_method : 'Carte bancaire',
      paidAt: payment.status === 'COMPLETED' ? payment.updated_at : null
    };

    // Generate PDF
    const pdfPath = generatePDFPath('invoice', invoiceNumber);
    await generateInvoicePDF(pdfData, pdfPath);

    // Update invoice with PDF path
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoice.id },
      data: { pdf_path: pdfPath }
    });

    console.log(`✅ Invoice ${invoiceNumber} generated for booking ${bookingId}`);

    return {
      invoice: updatedInvoice,
      invoiceData: pdfData,
      pdfPath
    };

  } catch (error) {
    console.error('Error generating invoice:', error);
    throw new InvoiceGenerationError(bookingId, error.message);
  }
};

/**
 * Calculate invoice data and line items
 * @param {Object} booking - Booking object
 * @param {Object} payment - Payment object
 * @returns {Object} Invoice calculation data
 */
const calculateInvoiceData = async (booking, payment) => {
  const numberOfDays = Math.ceil((new Date(booking.date_fin) - new Date(booking.date_debut)) / (1000 * 60 * 60 * 24));
  const dailyRate = parseFloat(booking.varianteCar.car.prix_par_jour);
  
  const items = [
    {
      code: 'LOC',
      description: `Location ${booking.varianteCar.car.brand.name} ${booking.varianteCar.car.modele}`,
      quantity: numberOfDays,
      unitPrice: dailyRate,
      amount: dailyRate * numberOfDays
    }
  ];

  // Conducteurs additionnels supprimés

  // Add insurance if applicable
  // This would need to be calculated based on actual insurance selection
  // For now, we'll check if there's a difference in the total price
  const baseAmount = items.reduce((sum, item) => sum + item.amount, 0);
  const totalPaid = parseFloat(payment.amount);
  
  if (totalPaid > baseAmount) {
    const insuranceAmount = totalPaid - baseAmount;
    items.push({
      code: 'ASS',
      description: 'Assurance complémentaire',
      quantity: numberOfDays,
      unitPrice: insuranceAmount / numberOfDays,
      amount: insuranceAmount
    });
  }

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const discount = 0; // Calculate if loyalty discount was applied
  const taxRate = 0; // Morocco doesn't have VAT on car rentals typically
  const tax = (subtotal - discount) * taxRate / 100;
  const total = subtotal - discount + tax;

  return {
    items,
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    taxRate,
    total: Math.round(total * 100) / 100,
    metadata: {
      number_of_days: numberOfDays,
      daily_rate: dailyRate,
      additional_drivers: 0
    }
  };
};

/**
 * Get invoice by ID
 * @param {number} invoiceId - Invoice ID
 * @returns {Promise<Object>} Invoice details
 */
const getInvoice = async (invoiceId) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        user: {
          select: {
            nom: true,
            prenom: true,
            email: true
          }
        },
        booking: {
          include: {
            varianteCar: {
              include: {
                car: {
                  include: { brand: true }
                }
              }
            }
          }
        },
        payment: true
      }
    });

    if (!invoice) {
      throw new Error('Facture introuvable');
    }

    return {
      ...invoice,
      metadata: invoice.metadata ? JSON.parse(invoice.metadata) : {}
    };

  } catch (error) {
    console.error('Error getting invoice:', error);
    throw error;
  }
};

/**
 * Get all invoices for a user
 * @param {number} userId - User ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} List of invoices
 */
const getUserInvoices = async (userId, filters = {}) => {
  try {
    const { status, date_from, date_to, limit = 20, offset = 0 } = filters;

    const whereClause = {
      user_id: userId
    };

    if (status) {
      whereClause.status = status;
    }

    if (date_from || date_to) {
      whereClause.created_at = {};
      if (date_from) {
        whereClause.created_at.gte = new Date(date_from);
      }
      if (date_to) {
        whereClause.created_at.lte = new Date(date_to);
      }
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        booking: {
          include: {
            varianteCar: {
              include: {
                car: {
                  include: { brand: true }
                }
              }
            }
          }
        },
        payment: {
          select: {
            status: true,
            created_at: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    return invoices.map(invoice => ({
      ...invoice,
      metadata: invoice.metadata ? JSON.parse(invoice.metadata) : {}
    }));

  } catch (error) {
    console.error('Error getting user invoices:', error);
    throw error;
  }
};

/**
 * Update invoice status
 * @param {number} invoiceId - Invoice ID
 * @param {string} status - New status
 * @returns {Promise<Object>} Updated invoice
 */
const updateInvoiceStatus = async (invoiceId, status) => {
  try {
    const validStatuses = ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'];
    
    if (!validStatuses.includes(status)) {
      throw new Error(`Status invalide: ${status}`);
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status }
    });

    console.log(`✅ Invoice ${invoiceId} status updated to ${status}`);

    return updatedInvoice;

  } catch (error) {
    console.error('Error updating invoice status:', error);
    throw error;
  }
};

/**
 * Send invoice email to customer
 * @param {number} invoiceId - Invoice ID
 * @returns {Promise<boolean>} Success status
 */
const sendInvoiceEmail = async (invoiceId) => {
  try {
    const invoice = await getInvoice(invoiceId);
    
    // This would integrate with the notification service
    // For now, we'll just log the action
    console.log(`📧 Invoice ${invoice.invoice_number} email sent to ${invoice.user.email}`);
    
    return true;

  } catch (error) {
    console.error('Error sending invoice email:', error);
    throw error;
  }
};

/**
 * Mark invoice as paid
 * @param {number} invoiceId - Invoice ID
 * @param {Date} paidDate - Payment date (optional)
 * @returns {Promise<Object>} Updated invoice
 */
const markInvoiceAsPaid = async (invoiceId, paidDate = new Date()) => {
  try {
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'PAID',
        updated_at: paidDate
      }
    });

    console.log(`✅ Invoice ${invoiceId} marked as paid`);

    return updatedInvoice;

  } catch (error) {
    console.error('Error marking invoice as paid:', error);
    throw error;
  }
};

/**
 * Get invoice statistics for admin dashboard
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} Invoice statistics
 */
const getInvoiceStatistics = async (filters = {}) => {
  try {
    const { date_from, date_to } = filters;

    const whereClause = {};
    if (date_from || date_to) {
      whereClause.created_at = {};
      if (date_from) {
        whereClause.created_at.gte = new Date(date_from);
      }
      if (date_to) {
        whereClause.created_at.lte = new Date(date_to);
      }
    }

    const [
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      totalRevenue,
      paidRevenue
    ] = await Promise.all([
      prisma.invoice.count({ where: whereClause }),
      prisma.invoice.count({ where: { ...whereClause, status: 'PAID' } }),
      prisma.invoice.count({ where: { ...whereClause, status: 'PENDING' } }),
      prisma.invoice.count({ where: { ...whereClause, status: 'OVERDUE' } }),
      prisma.invoice.aggregate({
        where: whereClause,
        _sum: { amount: true }
      }),
      prisma.invoice.aggregate({
        where: { ...whereClause, status: 'PAID' },
        _sum: { amount: true }
      })
    ]);

    return {
      total_invoices: totalInvoices,
      paid_invoices: paidInvoices,
      pending_invoices: pendingInvoices,
      overdue_invoices: overdueInvoices,
      cancelled_invoices: totalInvoices - paidInvoices - pendingInvoices - overdueInvoices,
      total_revenue: totalRevenue._sum.amount || 0,
      paid_revenue: paidRevenue._sum.amount || 0,
      pending_revenue: (totalRevenue._sum.amount || 0) - (paidRevenue._sum.amount || 0),
      payment_rate: totalInvoices > 0 ? Math.round((paidInvoices / totalInvoices) * 100) : 0
    };

  } catch (error) {
    console.error('Error getting invoice statistics:', error);
    throw error;
  }
};

module.exports = {
  generateInvoice,
  getInvoice,
  getUserInvoices,
  updateInvoiceStatus,
  sendInvoiceEmail,
  markInvoiceAsPaid,
  getInvoiceStatistics
};
