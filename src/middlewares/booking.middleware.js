/**
 * Middleware for booking validation and security
 */

const { validateBookingDates, validateDriverLicense } = require('../utils/booking.utils');
const bookingService = require('../services/booking.service');

/**
 * Validate booking creation data
 */
const validateBookingData = (req, res, next) => {
  const {
    car_id,
    date_debut,
    date_fin,
    lieu_prise_en_charge,
    lieu_retour,
    additional_drivers = []
  } = req.body;

  const errors = [];

  // Required fields validation
  if (!car_id) {
    errors.push('ID de voiture requis');
  }

  if (!date_debut) {
    errors.push('Date de début requise');
  }

  if (!date_fin) {
    errors.push('Date de fin requise');
  }

  // Date validation
  if (date_debut && date_fin) {
    try {
      validateBookingDates(date_debut, date_fin);
    } catch (error) {
      errors.push(error.message);
    }
  }

  // Additional drivers validation
  if (additional_drivers.length > 3) {
    errors.push('Maximum 3 conducteurs additionnels autorisés');
  }

  additional_drivers.forEach((driver, index) => {
    if (!driver.nom) {
      errors.push(`Nom requis pour le conducteur ${index + 1}`);
    }
    if (!driver.prenom) {
      errors.push(`Prénom requis pour le conducteur ${index + 1}`);
    }
    if (!driver.permis_numero) {
      errors.push(`Numéro de permis requis pour le conducteur ${index + 1}`);
    }
    if (!driver.permis_date) {
      errors.push(`Date de permis requise pour le conducteur ${index + 1}`);
    }
  });

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Données de réservation invalides',
      errors
    });
  }

  next();
};

/**
 * Validate driver license data
 */
const validateDriverData = (req, res, next) => {
  const { nom, prenom, permis_numero, permis_date } = req.body;

  const errors = [];

  if (!nom || nom.trim().length < 2) {
    errors.push('Nom requis (minimum 2 caractères)');
  }

  if (!prenom || prenom.trim().length < 2) {
    errors.push('Prénom requis (minimum 2 caractères)');
  }

  if (!permis_numero || permis_numero.trim().length < 5) {
    errors.push('Numéro de permis requis (minimum 5 caractères)');
  }

  if (!permis_date) {
    errors.push('Date de permis requise');
  } else {
    try {
      const licenseValidation = validateDriverLicense(permis_numero, permis_date, 1);
      if (!licenseValidation.isValid) {
        errors.push(licenseValidation.reason);
      }
    } catch (error) {
      errors.push('Date de permis invalide');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Données de conducteur invalides',
      errors
    });
  }

  next();
};

/**
 * Check if user owns the booking
 */
const checkBookingOwnership = async (req, res, next) => {
  try {
    const bookingId = parseInt(req.params.bookingId || req.params.id);
    const userId = req.user.id;

    // Admin can access any booking
    if (req.user.role === 'ADMIN') {
      return next();
    }

    const booking = await bookingService.getBookingDetails(bookingId, userId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Réservation introuvable'
      });
    }

    // Store booking in request for later use
    req.booking = booking;
    next();

  } catch (error) {
    if (error.message.includes('Accès non autorisé')) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à cette réservation'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification de la réservation'
    });
  }
};

/**
 * Rate limiting for booking creation
 */
const rateLimitBookingCreation = (req, res, next) => {
  // Simple in-memory rate limiting
  // In production, use Redis or similar
  const userId = req.user.id;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  if (!global.bookingAttempts) {
    global.bookingAttempts = new Map();
  }

  const userAttempts = global.bookingAttempts.get(userId) || [];
  
  // Remove old attempts outside the window
  const recentAttempts = userAttempts.filter(timestamp => now - timestamp < windowMs);
  
  if (recentAttempts.length >= maxAttempts) {
    return res.status(429).json({
      success: false,
      message: 'Trop de tentatives de réservation. Veuillez réessayer dans 15 minutes.',
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }

  // Add current attempt
  recentAttempts.push(now);
  global.bookingAttempts.set(userId, recentAttempts);

  next();
};

/**
 * Validate booking status for operations
 */
const validateBookingStatus = (allowedStatuses) => {
  return (req, res, next) => {
    const booking = req.booking;

    if (!booking) {
      return res.status(400).json({
        success: false,
        message: 'Réservation non trouvée dans la requête'
      });
    }

    if (!allowedStatuses.includes(booking.status.name)) {
      return res.status(400).json({
        success: false,
        message: `Opération non autorisée pour le status ${booking.status.name}`,
        code: 'INVALID_BOOKING_STATUS'
      });
    }

    next();
  };
};

/**
 * Validate date range for queries
 */
const validateDateRange = (req, res, next) => {
  const { date_from, date_to } = req.query;

  if (date_from && date_to) {
    const startDate = new Date(date_from);
    const endDate = new Date(date_to);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Format de date invalide'
      });
    }

    if (startDate > endDate) {
      return res.status(400).json({
        success: false,
        message: 'La date de début doit être antérieure à la date de fin'
      });
    }

    // Limit date range to prevent performance issues
    const maxRangeMs = 365 * 24 * 60 * 60 * 1000; // 1 year
    if (endDate - startDate > maxRangeMs) {
      return res.status(400).json({
        success: false,
        message: 'Plage de dates trop large (maximum 1 an)'
      });
    }
  }

  next();
};

/**
 * Validate pagination parameters
 */
const validatePagination = (req, res, next) => {
  const { limit, offset, page } = req.query;

  if (limit) {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message: 'Limite doit être entre 1 et 100'
      });
    }
    req.query.limit = limitNum;
  }

  if (offset) {
    const offsetNum = parseInt(offset);
    if (isNaN(offsetNum) || offsetNum < 0) {
      return res.status(400).json({
        success: false,
        message: 'Offset doit être >= 0'
      });
    }
    req.query.offset = offsetNum;
  }

  if (page) {
    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        message: 'Page doit être >= 1'
      });
    }
    req.query.page = pageNum;
  }

  next();
};

/**
 * Sanitize booking input data
 */
const sanitizeBookingInput = (req, res, next) => {
  const {
    lieu_prise_en_charge,
    lieu_retour,
    additional_drivers = []
  } = req.body;

  // Sanitize location strings
  if (lieu_prise_en_charge) {
    req.body.lieu_prise_en_charge = lieu_prise_en_charge.trim().substring(0, 255);
  }

  if (lieu_retour) {
    req.body.lieu_retour = lieu_retour.trim().substring(0, 255);
  }

  // Sanitize additional drivers data
  req.body.additional_drivers = additional_drivers.map(driver => ({
    nom: driver.nom ? driver.nom.trim().substring(0, 100) : '',
    prenom: driver.prenom ? driver.prenom.trim().substring(0, 100) : '',
    permis_numero: driver.permis_numero ? driver.permis_numero.trim().substring(0, 50) : '',
    permis_date: driver.permis_date
  }));

  next();
};

/**
 * Log booking operations for audit
 */
const logBookingOperation = (operation) => {
  return (req, res, next) => {
    const originalSend = res.json;
    
    res.json = function(data) {
      // Log the operation
      console.log(`📋 Booking Operation: ${operation}`, {
        userId: req.user?.id,
        bookingId: req.params?.bookingId || req.params?.id,
        timestamp: new Date().toISOString(),
        success: data.success,
        userAgent: req.headers['user-agent'],
        ip: req.ip
      });

      // Call original send
      originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Check business hours for booking operations
 */
const checkBusinessHours = (req, res, next) => {
  // Skip check for admins
  if (req.user.role === 'ADMIN') {
    return next();
  }

  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0 = Sunday, 6 = Saturday

  // Business hours: Monday-Friday 8AM-8PM, Saturday 9AM-6PM, Sunday closed
  const isBusinessHours = 
    (day >= 1 && day <= 5 && hour >= 8 && hour < 20) || // Mon-Fri 8AM-8PM
    (day === 6 && hour >= 9 && hour < 18); // Saturday 9AM-6PM

  if (!isBusinessHours) {
    return res.status(400).json({
      success: false,
      message: 'Les réservations ne peuvent être effectuées que pendant les heures d\'ouverture',
      business_hours: {
        'Lundi-Vendredi': '8h00 - 20h00',
        'Samedi': '9h00 - 18h00',
        'Dimanche': 'Fermé'
      }
    });
  }

  next();
};

module.exports = {
  validateBookingData,
  validateDriverData,
  checkBookingOwnership,
  rateLimitBookingCreation,
  validateBookingStatus,
  validateDateRange,
  validatePagination,
  sanitizeBookingInput,
  logBookingOperation,
  checkBusinessHours
};
