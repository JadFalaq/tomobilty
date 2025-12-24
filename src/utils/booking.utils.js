/**
 * Utility functions for the booking system
 */

const { InvalidBookingDatesError } = require('../errors/booking.errors');

/**
 * Calculate number of days between two dates
 * @param {Date|string} dateDebut - Start date
 * @param {Date|string} dateFin - End date
 * @returns {number} Number of days
 */
const calculateDaysBetween = (dateDebut, dateFin) => {
  const start = new Date(dateDebut);
  const end = new Date(dateFin);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Validate booking dates
 * @param {Date|string} dateDebut - Start date
 * @param {Date|string} dateFin - End date
 * @returns {boolean} True if valid
 */
const validateBookingDates = (dateDebut, dateFin) => {
  const start = new Date(dateDebut);
  const end = new Date(dateFin);
  const now = new Date();
  
  // Remove time component for date comparison
  now.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  if (start >= end) {
    throw new InvalidBookingDatesError(dateDebut, dateFin);
  }
  
  if (start < now) {
    throw new InvalidBookingDatesError(dateDebut, dateFin);
  }
  
  return true;
};

/**
 * Check if driver license is valid
 * @param {string} permisNumero - License number
 * @param {Date|string} permisDate - License issue date
 * @param {number} minYears - Minimum years required (default: 2)
 * @returns {Object} Validation result
 */
const validateDriverLicense = (permisNumero, permisDate, minYears = 2) => {
  if (!permisNumero || !permisDate) {
    return {
      isValid: false,
      reason: 'Numéro de permis et date requis'
    };
  }
  
  const licenseDate = new Date(permisDate);
  const now = new Date();
  const yearsWithLicense = (now - licenseDate) / (1000 * 60 * 60 * 24 * 365.25);
  
  if (yearsWithLicense < minYears) {
    return {
      isValid: false,
      reason: `Permis requis depuis au moins ${minYears} ans. Actuel: ${yearsWithLicense.toFixed(1)} ans`
    };
  }
  
  // Check if license is not expired (assuming 10 years validity)
  const expirationDate = new Date(licenseDate);
  expirationDate.setFullYear(expirationDate.getFullYear() + 10);
  
  if (now > expirationDate) {
    return {
      isValid: false,
      reason: 'Permis expiré'
    };
  }
  
  return {
    isValid: true,
    yearsWithLicense: yearsWithLicense.toFixed(1)
  };
};

/**
 * Calculate deposit amount (20% of total price)
 * @param {number} totalPrice - Total booking price
 * @returns {number} Deposit amount
 */
const calculateDeposit = (totalPrice) => {
  return Math.round(totalPrice * 0.20 * 100) / 100; // Round to 2 decimal places
};

/**
 * Generate booking reference number
 * @param {number} bookingId - Booking ID
 * @returns {string} Formatted booking reference
 */
const generateBookingReference = (bookingId) => {
  const year = new Date().getFullYear();
  const paddedId = bookingId.toString().padStart(6, '0');
  return `BK-${year}-${paddedId}`;
};

/**
 * Check if dates overlap
 * @param {Date} start1 - First period start
 * @param {Date} end1 - First period end
 * @param {Date} start2 - Second period start
 * @param {Date} end2 - Second period end
 * @returns {boolean} True if dates overlap
 */
const datesOverlap = (start1, end1, start2, end2) => {
  return start1 <= end2 && start2 <= end1;
};

/**
 * Format date for display
 * @param {Date|string} date - Date to format
 * @param {string} locale - Locale (default: 'fr-FR')
 * @returns {string} Formatted date
 */
const formatDate = (date, locale = 'fr-FR') => {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Calculate cancellation penalty based on time until start date
 * @param {Date|string} dateDebut - Booking start date
 * @param {Date} cancellationDate - Cancellation date (default: now)
 * @returns {Object} Penalty information
 */
const calculateCancellationPenalty = (dateDebut, cancellationDate = new Date()) => {
  const startDate = new Date(dateDebut);
  const cancelDate = new Date(cancellationDate);
  
  const hoursUntilStart = (startDate - cancelDate) / (1000 * 60 * 60);
  
  let penaltyPercent = 0;
  let refundPercent = 100;
  
  if (hoursUntilStart < 24) {
    // Less than 24 hours: no refund
    penaltyPercent = 100;
    refundPercent = 0;
  } else if (hoursUntilStart < 48) {
    // 24-48 hours: 50% penalty
    penaltyPercent = 50;
    refundPercent = 50;
  } else {
    // More than 48 hours: full refund
    penaltyPercent = 0;
    refundPercent = 100;
  }
  
  return {
    hoursUntilStart: Math.round(hoursUntilStart),
    penaltyPercent,
    refundPercent,
    canCancel: true
  };
};

/**
 * Validate additional driver data
 * @param {Object} driverData - Driver information
 * @returns {Object} Validation result
 */
const validateAdditionalDriver = (driverData) => {
  const { nom, prenom, permis_numero, permis_date } = driverData;
  
  if (!nom || !prenom || !permis_numero || !permis_date) {
    return {
      isValid: false,
      reason: 'Nom, prénom, numéro de permis et date requis'
    };
  }
  
  // Validate license (minimum 1 year for additional drivers)
  const licenseValidation = validateDriverLicense(permis_numero, permis_date, 1);
  
  return licenseValidation;
};

/**
 * Calculate business days between two dates (excluding weekends)
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {number} Number of business days
 */
const calculateBusinessDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let businessDays = 0;
  
  const currentDate = new Date(start);
  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
      businessDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return businessDays;
};

/**
 * Check if booking is modifiable
 * @param {Object} booking - Booking object
 * @returns {Object} Modification status
 */
const canModifyBooking = (booking) => {
  const now = new Date();
  const startDate = new Date(booking.date_debut);
  const hoursUntilStart = (startDate - now) / (1000 * 60 * 60);
  
  // Can modify if booking is PENDING and more than 24 hours before start
  const canModify = booking.status.name === 'PENDING' && hoursUntilStart > 24;
  
  return {
    canModify,
    reason: !canModify ? 
      (booking.status.name !== 'PENDING' ? 'Réservation déjà confirmée' : 'Moins de 24h avant le début') : 
      null,
    hoursUntilStart: Math.round(hoursUntilStart)
  };
};

/**
 * Generate contract number
 * @param {number} bookingId - Booking ID
 * @returns {string} Contract number
 */
const generateContractNumber = (bookingId) => {
  const year = new Date().getFullYear();
  const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const paddedId = bookingId.toString().padStart(4, '0');
  return `CT-${year}${month}-${paddedId}`;
};

/**
 * Generate invoice number
 * @param {number} invoiceId - Invoice ID
 * @returns {string} Invoice number
 */
const generateInvoiceNumber = (invoiceId) => {
  const year = new Date().getFullYear();
  const paddedId = invoiceId.toString().padStart(5, '0');
  return `INV-${year}-${paddedId}`;
};

module.exports = {
  calculateDaysBetween,
  validateBookingDates,
  validateDriverLicense,
  calculateDeposit,
  generateBookingReference,
  datesOverlap,
  formatDate,
  calculateCancellationPenalty,
  validateAdditionalDriver,
  calculateBusinessDays,
  canModifyBooking,
  generateContractNumber,
  generateInvoiceNumber
};
