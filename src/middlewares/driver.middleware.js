/**
 * Middleware for driver validation and license verification
 */

const { validateDriverLicense } = require('../utils/booking.utils');

/**
 * Validate main driver (user) license
 */
const validateMainDriverLicense = (req, res, next) => {
  const user = req.user;

  if (!user.permis_conduire || !user.date_permis) {
    return res.status(400).json({
      success: false,
      message: 'Permis de conduire requis. Veuillez mettre à jour votre profil.',
      code: 'MISSING_DRIVER_LICENSE'
    });
  }

  try {
    const licenseValidation = validateDriverLicense(user.permis_conduire, user.date_permis, 2);
    
    if (!licenseValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: `Permis de conduire invalide: ${licenseValidation.reason}`,
        code: 'INVALID_MAIN_DRIVER_LICENSE'
      });
    }

    // Store validation result for later use
    req.driverValidation = {
      main: licenseValidation
    };

    next();

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Erreur lors de la validation du permis de conduire',
      code: 'DRIVER_LICENSE_VALIDATION_ERROR'
    });
  }
};

/**
 * Validate additional driver license
 */
const validateAdditionalDriverLicense = (req, res, next) => {
  const { permis_numero, permis_date } = req.body;

  if (!permis_numero || !permis_date) {
    return res.status(400).json({
      success: false,
      message: 'Numéro de permis et date requis',
      code: 'MISSING_DRIVER_LICENSE_DATA'
    });
  }

  try {
    const licenseValidation = validateDriverLicense(permis_numero, permis_date, 1);
    
    if (!licenseValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: `Permis de conduire invalide: ${licenseValidation.reason}`,
        code: 'INVALID_ADDITIONAL_DRIVER_LICENSE'
      });
    }

    // Store validation result
    req.driverValidation = {
      ...req.driverValidation,
      additional: licenseValidation
    };

    next();

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Erreur lors de la validation du permis de conduire',
      code: 'DRIVER_LICENSE_VALIDATION_ERROR'
    });
  }
};

/**
 * Check driver age requirements
 */
const checkDriverAge = (minAge = 21) => {
  return (req, res, next) => {
    const user = req.user;

    if (!user.date_naissance) {
      return res.status(400).json({
        success: false,
        message: 'Date de naissance requise. Veuillez mettre à jour votre profil.',
        code: 'MISSING_BIRTH_DATE'
      });
    }

    const birthDate = new Date(user.date_naissance);
    const now = new Date();
    const age = Math.floor((now - birthDate) / (365.25 * 24 * 60 * 60 * 1000));

    if (age < minAge) {
      return res.status(400).json({
        success: false,
        message: `Âge minimum requis: ${minAge} ans. Âge actuel: ${age} ans`,
        code: 'INSUFFICIENT_AGE'
      });
    }

    req.driverAge = age;
    next();
  };
};

/**
 * Validate driver identity documents
 */
const validateDriverDocuments = (req, res, next) => {
  const user = req.user;

  // Check required identity documents
  const requiredFields = ['nom', 'prenom', 'date_naissance'];
  const missingFields = [];

  requiredFields.forEach(field => {
    if (!user[field]) {
      missingFields.push(field);
    }
  });

  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Documents d\'identité incomplets',
      missing_fields: missingFields,
      code: 'INCOMPLETE_IDENTITY_DOCUMENTS'
    });
  }

  // Validate name format (basic validation)
  const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/;
  
  if (!nameRegex.test(user.nom)) {
    return res.status(400).json({
      success: false,
      message: 'Format du nom invalide',
      code: 'INVALID_NAME_FORMAT'
    });
  }

  if (!nameRegex.test(user.prenom)) {
    return res.status(400).json({
      success: false,
      message: 'Format du prénom invalide',
      code: 'INVALID_FIRSTNAME_FORMAT'
    });
  }

  next();
};

/**
 * Check for driver license blacklist
 */
const checkDriverBlacklist = async (req, res, next) => {
  try {
    const user = req.user;
    const { permis_numero } = req.body;

    // Check main driver
    if (user.permis_conduire) {
      const isBlacklisted = await checkLicenseBlacklist(user.permis_conduire);
      if (isBlacklisted) {
        return res.status(403).json({
          success: false,
          message: 'Permis de conduire suspendu ou révoqué',
          code: 'BLACKLISTED_LICENSE'
        });
      }
    }

    // Check additional driver if provided
    if (permis_numero) {
      const isBlacklisted = await checkLicenseBlacklist(permis_numero);
      if (isBlacklisted) {
        return res.status(403).json({
          success: false,
          message: 'Permis de conduire additionnel suspendu ou révoqué',
          code: 'BLACKLISTED_ADDITIONAL_LICENSE'
        });
      }
    }

    next();

  } catch (error) {
    console.error('Error checking driver blacklist:', error);
    // Continue without blocking if blacklist check fails
    next();
  }
};

/**
 * Check license against blacklist (mock implementation)
 * In production, this would check against official databases
 */
const checkLicenseBlacklist = async (licenseNumber) => {
  // Mock blacklist - in production, integrate with official APIs
  const blacklistedLicenses = [
    'SUSPENDED123',
    'REVOKED456',
    'INVALID789'
  ];

  return blacklistedLicenses.includes(licenseNumber.toUpperCase());
};

/**
 * Validate international driver license
 */
const validateInternationalLicense = (req, res, next) => {
  const user = req.user;
  const { permis_numero, is_international } = req.body;

  // Check if this is an international license
  const licenseToCheck = permis_numero || user.permis_conduire;
  const isInternational = is_international || isInternationalLicenseFormat(licenseToCheck);

  if (isInternational) {
    // Additional validation for international licenses
    if (!user.passport_number) {
      return res.status(400).json({
        success: false,
        message: 'Numéro de passeport requis pour les permis internationaux',
        code: 'MISSING_PASSPORT_FOR_INTERNATIONAL_LICENSE'
      });
    }

    // Check if international license is accepted
    const acceptedCountries = ['FR', 'ES', 'IT', 'DE', 'BE', 'NL', 'CH', 'AT'];
    const licenseCountry = extractCountryFromLicense(licenseToCheck);
    
    if (!acceptedCountries.includes(licenseCountry)) {
      return res.status(400).json({
        success: false,
        message: 'Permis international non accepté pour ce pays',
        code: 'INTERNATIONAL_LICENSE_NOT_ACCEPTED',
        accepted_countries: acceptedCountries
      });
    }
  }

  next();
};

/**
 * Check if license format indicates international license
 */
const isInternationalLicenseFormat = (licenseNumber) => {
  // Simple heuristic - international licenses often have country codes
  const internationalPatterns = [
    /^[A-Z]{2}\d+/,  // Country code + numbers
    /^\d+[A-Z]{2}/,  // Numbers + country code
    /^INT\d+/        // International prefix
  ];

  return internationalPatterns.some(pattern => pattern.test(licenseNumber));
};

/**
 * Extract country code from license number
 */
const extractCountryFromLicense = (licenseNumber) => {
  const countryMatch = licenseNumber.match(/^([A-Z]{2})/);
  return countryMatch ? countryMatch[1] : 'MA'; // Default to Morocco
};

/**
 * Rate limit driver validation requests
 */
const rateLimitDriverValidation = (req, res, next) => {
  const userId = req.user.id;
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minutes
  const maxAttempts = 10;

  if (!global.driverValidationAttempts) {
    global.driverValidationAttempts = new Map();
  }

  const userAttempts = global.driverValidationAttempts.get(userId) || [];
  const recentAttempts = userAttempts.filter(timestamp => now - timestamp < windowMs);

  if (recentAttempts.length >= maxAttempts) {
    return res.status(429).json({
      success: false,
      message: 'Trop de tentatives de validation. Veuillez réessayer dans 5 minutes.',
      code: 'DRIVER_VALIDATION_RATE_LIMIT'
    });
  }

  recentAttempts.push(now);
  global.driverValidationAttempts.set(userId, recentAttempts);

  next();
};

/**
 * Log driver validation attempts for security
 */
const logDriverValidation = (req, res, next) => {
  const originalSend = res.json;
  
  res.json = function(data) {
    // Log validation attempt
    console.log('🚗 Driver Validation:', {
      userId: req.user?.id,
      success: data.success,
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    originalSend.call(this, data);
  };

  next();
};

module.exports = {
  validateMainDriverLicense,
  validateAdditionalDriverLicense,
  checkDriverAge,
  validateDriverDocuments,
  checkDriverBlacklist,
  validateInternationalLicense,
  rateLimitDriverValidation,
  logDriverValidation
};
