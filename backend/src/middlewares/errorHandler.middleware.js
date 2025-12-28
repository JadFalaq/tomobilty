const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'Une entrée avec ces données existe déjà',
      error: 'DUPLICATE_ENTRY'
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Ressource non trouvée',
      error: 'NOT_FOUND'
    });
  }

  if (err.code && err.code.startsWith('P')) {
    return res.status(400).json({
      success: false,
      message: 'Erreur de base de données',
      error: 'DATABASE_ERROR'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token invalide',
      error: 'INVALID_TOKEN'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expiré',
      error: 'EXPIRED_TOKEN'
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      error: 'VALIDATION_ERROR',
      details: err.details
    });
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'Fichier trop volumineux',
      error: 'FILE_TOO_LARGE'
    });
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      success: false,
      message: 'Trop de fichiers',
      error: 'TOO_MANY_FILES'
    });
  }

  // Stripe errors
  if (err.type === 'StripeCardError') {
    return res.status(400).json({
      success: false,
      message: 'Erreur de carte bancaire',
      error: 'CARD_ERROR',
      details: err.message
    });
  }

  if (err.type === 'StripeInvalidRequestError') {
    return res.status(400).json({
      success: false,
      message: 'Requête de paiement invalide',
      error: 'PAYMENT_ERROR'
    });
  }

  // Custom application errors
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message || 'Erreur de l\'application',
      error: err.code || 'APPLICATION_ERROR'
    });
  }

  // Default server error
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Erreur interne du serveur' 
      : err.message,
    error: 'INTERNAL_SERVER_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Custom error class
class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  AppError,
  asyncHandler
};
