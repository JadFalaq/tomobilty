/**
 * Notification service for emails and SMS
 */

const nodemailer = require('nodemailer');
const prisma = require('../config/prisma');

// Email transporter configuration
const createEmailTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

/**
 * Send booking confirmation email
 * @param {number} bookingId - Booking ID
 * @returns {Promise<boolean>} Success status
 */
const sendBookingConfirmation = async (bookingId) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        car: {
          include: {
            brand: true
          }
        },
        status: true
      }
    });

    if (!booking) {
      throw new Error('Réservation introuvable');
    }

    const emailData = {
      to: booking.user.email,
      subject: `Confirmation de réservation #${bookingId}`,
      template: 'booking-confirmation',
      data: {
        customerName: `${booking.user.prenom} ${booking.user.nom}`,
        bookingId: bookingId,
        carDetails: `${booking.car.brand.name} ${booking.car.modele}`,
        startDate: booking.date_debut.toLocaleDateString('fr-FR'),
        endDate: booking.date_fin.toLocaleDateString('fr-FR'),
        pickupLocation: booking.lieu_prise_en_charge || 'À définir',
        returnLocation: booking.lieu_retour || 'À définir',
        totalPrice: parseFloat(booking.prix_total),
        status: booking.status.name
      }
    };

    await sendEmail(emailData);
    
    // Log notification
    await logNotification(booking.user_id, 'EMAIL', 'BOOKING_CONFIRMATION', 
      `Confirmation de réservation #${bookingId}`, bookingId);

    console.log(`📧 Booking confirmation sent to ${booking.user.email}`);
    return true;

  } catch (error) {
    console.error('Error sending booking confirmation:', error);
    return false;
  }
};

/**
 * Send payment confirmation email
 * @param {number} paymentId - Payment ID
 * @returns {Promise<boolean>} Success status
 */
const sendPaymentConfirmation = async (paymentId) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
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
      throw new Error('Paiement introuvable');
    }

    const emailData = {
      to: payment.booking.user.email,
      subject: `Confirmation de paiement - Réservation #${payment.booking_id}`,
      template: 'payment-confirmation',
      data: {
        customerName: `${payment.booking.user.prenom} ${payment.booking.user.nom}`,
        bookingId: payment.booking_id,
        paymentId: paymentId,
        amount: parseFloat(payment.amount),
        currency: payment.currency,
        paymentMethod: 'Carte bancaire',
        carDetails: `${payment.booking.car.brand.name} ${payment.booking.car.modele}`,
        paymentDate: payment.updated_at.toLocaleDateString('fr-FR')
      }
    };

    await sendEmail(emailData);
    
    // Log notification
    await logNotification(payment.booking.user_id, 'EMAIL', 'PAYMENT_CONFIRMATION', 
      `Confirmation de paiement - Réservation #${payment.booking_id}`, payment.booking_id);

    console.log(`📧 Payment confirmation sent to ${payment.booking.user.email}`);
    return true;

  } catch (error) {
    console.error('Error sending payment confirmation:', error);
    return false;
  }
};

/**
 * Send contract email with PDF attachment
 * @param {number} contractId - Contract ID
 * @returns {Promise<boolean>} Success status
 */
const sendContractEmail = async (contractId) => {
  try {
    const contract = await prisma.rentalContract.findUnique({
      where: { id: contractId },
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

    if (!contract) {
      throw new Error('Contrat introuvable');
    }

    const emailData = {
      to: contract.booking.user.email,
      subject: `Contrat de location - Réservation #${contract.booking_id}`,
      template: 'contract-email',
      data: {
        customerName: `${contract.booking.user.prenom} ${contract.booking.user.nom}`,
        contractNumber: contract.contract_number,
        bookingId: contract.booking_id,
        carDetails: `${contract.booking.car.brand.name} ${contract.booking.car.modele}`
      },
      attachments: [
        {
          filename: `contrat_${contract.contract_number}.pdf`,
          path: contract.pdf_path
        }
      ]
    };

    await sendEmail(emailData);
    
    // Log notification
    await logNotification(contract.booking.user_id, 'EMAIL', 'CONTRACT_SENT', 
      `Contrat de location envoyé`, contract.booking_id);

    console.log(`📧 Contract sent to ${contract.booking.user.email}`);
    return true;

  } catch (error) {
    console.error('Error sending contract email:', error);
    return false;
  }
};

/**
 * Send invoice email with PDF attachment
 * @param {number} invoiceId - Invoice ID
 * @returns {Promise<boolean>} Success status
 */
const sendInvoiceEmail = async (invoiceId) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        user: true,
        booking: {
          include: {
            car: {
              include: {
                brand: true
              }
            }
          }
        }
      }
    });

    if (!invoice) {
      throw new Error('Facture introuvable');
    }

    const emailData = {
      to: invoice.user.email,
      subject: `Facture ${invoice.invoice_number} - Réservation #${invoice.booking_id}`,
      template: 'invoice-email',
      data: {
        customerName: `${invoice.user.prenom} ${invoice.user.nom}`,
        invoiceNumber: invoice.invoice_number,
        bookingId: invoice.booking_id,
        amount: parseFloat(invoice.amount),
        currency: invoice.currency,
        carDetails: `${invoice.booking.car.brand.name} ${invoice.booking.car.modele}`,
        status: invoice.status === 'PAID' ? 'Payée' : 'En attente'
      },
      attachments: invoice.pdf_path ? [
        {
          filename: `facture_${invoice.invoice_number}.pdf`,
          path: invoice.pdf_path
        }
      ] : []
    };

    await sendEmail(emailData);
    
    // Log notification
    await logNotification(invoice.user_id, 'EMAIL', 'INVOICE_SENT', 
      `Facture ${invoice.invoice_number} envoyée`, invoice.booking_id);

    console.log(`📧 Invoice sent to ${invoice.user.email}`);
    return true;

  } catch (error) {
    console.error('Error sending invoice email:', error);
    return false;
  }
};

/**
 * Send loyalty points notification
 * @param {number} userId - User ID
 * @param {number} points - Points earned
 * @param {string} reason - Reason for points
 * @returns {Promise<boolean>} Success status
 */
const sendLoyaltyPointsNotification = async (userId, points, reason = 'Réservation') => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('Utilisateur introuvable');
    }

    const emailData = {
      to: user.email,
      subject: `🎉 Vous avez gagné ${points} points de fidélité !`,
      template: 'loyalty-points',
      data: {
        customerName: `${user.prenom} ${user.nom}`,
        points: points,
        reason: reason,
        totalPoints: user.loyalty_points || 0
      }
    };

    await sendEmail(emailData);
    
    // Log notification
    await logNotification(userId, 'EMAIL', 'LOYALTY_POINTS', 
      `${points} points de fidélité gagnés`);

    console.log(`📧 Loyalty points notification sent to ${user.email}`);
    return true;

  } catch (error) {
    console.error('Error sending loyalty points notification:', error);
    return false;
  }
};

/**
 * Send rental start reminder (24h before)
 * @param {number} bookingId - Booking ID
 * @returns {Promise<boolean>} Success status
 */
const sendRentalStartReminder = async (bookingId) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        car: {
          include: {
            brand: true
          }
        }
      }
    });

    if (!booking) {
      throw new Error('Réservation introuvable');
    }

    const emailData = {
      to: booking.user.email,
      subject: `Rappel : Votre location commence demain - Réservation #${bookingId}`,
      template: 'rental-start-reminder',
      data: {
        customerName: `${booking.user.prenom} ${booking.user.nom}`,
        bookingId: bookingId,
        carDetails: `${booking.car.brand.name} ${booking.car.modele}`,
        startDate: booking.date_debut.toLocaleDateString('fr-FR'),
        startTime: booking.date_debut.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        pickupLocation: booking.lieu_prise_en_charge || 'À définir',
        contactPhone: process.env.COMPANY_PHONE || '+212 XXX XXX XXX'
      }
    };

    await sendEmail(emailData);
    
    // Log notification
    await logNotification(booking.user_id, 'EMAIL', 'RENTAL_START_REMINDER', 
      `Rappel début de location`, bookingId);

    console.log(`📧 Rental start reminder sent to ${booking.user.email}`);
    return true;

  } catch (error) {
    console.error('Error sending rental start reminder:', error);
    return false;
  }
};

/**
 * Send rental end reminder (24h before)
 * @param {number} bookingId - Booking ID
 * @returns {Promise<boolean>} Success status
 */
const sendRentalEndReminder = async (bookingId) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        car: {
          include: {
            brand: true
          }
        }
      }
    });

    if (!booking) {
      throw new Error('Réservation introuvable');
    }

    const emailData = {
      to: booking.user.email,
      subject: `Rappel : Retour du véhicule demain - Réservation #${bookingId}`,
      template: 'rental-end-reminder',
      data: {
        customerName: `${booking.user.prenom} ${booking.user.nom}`,
        bookingId: bookingId,
        carDetails: `${booking.car.brand.name} ${booking.car.modele}`,
        endDate: booking.date_fin.toLocaleDateString('fr-FR'),
        endTime: booking.date_fin.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        returnLocation: booking.lieu_retour || booking.lieu_prise_en_charge || 'À définir',
        contactPhone: process.env.COMPANY_PHONE || '+212 XXX XXX XXX'
      }
    };

    await sendEmail(emailData);
    
    // Log notification
    await logNotification(booking.user_id, 'EMAIL', 'RENTAL_END_REMINDER', 
      `Rappel fin de location`, bookingId);

    console.log(`📧 Rental end reminder sent to ${booking.user.email}`);
    return true;

  } catch (error) {
    console.error('Error sending rental end reminder:', error);
    return false;
  }
};

/**
 * Send review request after rental completion
 * @param {number} bookingId - Booking ID
 * @returns {Promise<boolean>} Success status
 */
const sendReviewRequest = async (bookingId) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        car: {
          include: {
            brand: true
          }
        }
      }
    });

    if (!booking) {
      throw new Error('Réservation introuvable');
    }

    const emailData = {
      to: booking.user.email,
      subject: `Votre avis nous intéresse - Réservation #${bookingId}`,
      template: 'review-request',
      data: {
        customerName: `${booking.user.prenom} ${booking.user.nom}`,
        bookingId: bookingId,
        carDetails: `${booking.car.brand.name} ${booking.car.modele}`,
        reviewUrl: `${process.env.FRONTEND_URL}/review/${bookingId}`
      }
    };

    await sendEmail(emailData);
    
    // Log notification
    await logNotification(booking.user_id, 'EMAIL', 'REVIEW_REQUEST', 
      `Demande d'avis client`, bookingId);

    console.log(`📧 Review request sent to ${booking.user.email}`);
    return true;

  } catch (error) {
    console.error('Error sending review request:', error);
    return false;
  }
};

/**
 * Send cancellation confirmation
 * @param {number} bookingId - Booking ID
 * @param {string} reason - Cancellation reason
 * @returns {Promise<boolean>} Success status
 */
const sendCancellationConfirmation = async (bookingId, reason = '') => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        car: {
          include: {
            brand: true
          }
        }
      }
    });

    if (!booking) {
      throw new Error('Réservation introuvable');
    }

    const emailData = {
      to: booking.user.email,
      subject: `Confirmation d'annulation - Réservation #${bookingId}`,
      template: 'cancellation-confirmation',
      data: {
        customerName: `${booking.user.prenom} ${booking.user.nom}`,
        bookingId: bookingId,
        carDetails: `${booking.car.brand.name} ${booking.car.modele}`,
        reason: reason,
        refundInfo: 'Le remboursement sera traité dans les 3-5 jours ouvrables.'
      }
    };

    await sendEmail(emailData);
    
    // Log notification
    await logNotification(booking.user_id, 'EMAIL', 'CANCELLATION_CONFIRMATION', 
      `Confirmation d'annulation`, bookingId);

    console.log(`📧 Cancellation confirmation sent to ${booking.user.email}`);
    return true;

  } catch (error) {
    console.error('Error sending cancellation confirmation:', error);
    return false;
  }
};

/**
 * Send email using configured transporter
 * @param {Object} emailData - Email data
 * @returns {Promise<boolean>} Success status
 */
const sendEmail = async (emailData) => {
  try {
    const transporter = createEmailTransporter();
    
    const mailOptions = {
      from: `"TOMMOBILTY" <${process.env.SMTP_USER}>`,
      to: emailData.to,
      subject: emailData.subject,
      html: generateEmailHTML(emailData.template, emailData.data),
      attachments: emailData.attachments || []
    };

    await transporter.sendMail(mailOptions);
    return true;

  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Generate HTML content for email templates
 * @param {string} template - Template name
 * @param {Object} data - Template data
 * @returns {string} HTML content
 */
const generateEmailHTML = (template, data) => {
  // Basic HTML template - in production, use a proper template engine
  const baseTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2c5aa0; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .button { display: inline-block; padding: 10px 20px; background: #2c5aa0; color: white; text-decoration: none; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>TOMMOBILTY</h1>
        </div>
        <div class="content">
          {{CONTENT}}
        </div>
        <div class="footer">
          <p>TOMMOBILTY - Location de véhicules au Maroc</p>
          <p>Email: contact@tommobilty.com | Téléphone: +212 XXX XXX XXX</p>
        </div>
      </div>
    </body>
    </html>
  `;

  let content = '';

  switch (template) {
    case 'booking-confirmation':
      content = `
        <h2>Confirmation de réservation</h2>
        <p>Bonjour ${data.customerName},</p>
        <p>Votre réservation #${data.bookingId} a été confirmée avec succès.</p>
        <h3>Détails de la réservation :</h3>
        <ul>
          <li><strong>Véhicule :</strong> ${data.carDetails}</li>
          <li><strong>Date de début :</strong> ${data.startDate}</li>
          <li><strong>Date de fin :</strong> ${data.endDate}</li>
          <li><strong>Lieu de prise en charge :</strong> ${data.pickupLocation}</li>
          <li><strong>Lieu de retour :</strong> ${data.returnLocation}</li>
          <li><strong>Prix total :</strong> ${data.totalPrice} MAD</li>
        </ul>
        <p>Merci de votre confiance !</p>
      `;
      break;

    case 'payment-confirmation':
      content = `
        <h2>Confirmation de paiement</h2>
        <p>Bonjour ${data.customerName},</p>
        <p>Votre paiement de ${data.amount} ${data.currency} pour la réservation #${data.bookingId} a été traité avec succès.</p>
        <p><strong>Véhicule :</strong> ${data.carDetails}</p>
        <p><strong>Date de paiement :</strong> ${data.paymentDate}</p>
        <p>Votre réservation est maintenant confirmée.</p>
      `;
      break;

    case 'rental-start-reminder':
      content = `
        <h2>Rappel : Votre location commence demain</h2>
        <p>Bonjour ${data.customerName},</p>
        <p>Votre location du ${data.carDetails} commence demain le ${data.startDate} à ${data.startTime}.</p>
        <p><strong>Lieu de prise en charge :</strong> ${data.pickupLocation}</p>
        <p>N'oubliez pas d'apporter votre permis de conduire et une pièce d'identité.</p>
        <p>Pour toute question : ${data.contactPhone}</p>
      `;
      break;

    default:
      content = `
        <h2>Notification TOMMOBILTY</h2>
        <p>Bonjour ${data.customerName || 'Client'},</p>
        <p>Vous avez reçu une nouvelle notification concernant votre réservation.</p>
      `;
  }

  return baseTemplate.replace('{{CONTENT}}', content);
};

/**
 * Log notification in database
 * @param {number} userId - User ID
 * @param {string} type - Notification type (EMAIL, SMS)
 * @param {string} category - Notification category
 * @param {string} message - Notification message
 * @param {number} bookingId - Related booking ID (optional)
 * @returns {Promise<Object>} Created notification
 */
const logNotification = async (userId, type, category, message, bookingId = null) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        user_id: userId,
        title: message,
        message: message,
        type: 'SYSTEM',
        booking_id: bookingId,
        metadata: JSON.stringify({
          notification_type: type,
          category: category,
          sent_at: new Date().toISOString()
        })
      }
    });

    return notification;

  } catch (error) {
    console.error('Error logging notification:', error);
    // Don't throw error to avoid breaking the main flow
    return null;
  }
};

module.exports = {
  sendBookingConfirmation,
  sendPaymentConfirmation,
  sendContractEmail,
  sendInvoiceEmail,
  sendLoyaltyPointsNotification,
  sendRentalStartReminder,
  sendRentalEndReminder,
  sendReviewRequest,
  sendCancellationConfirmation,
  sendEmail,
  logNotification
};
