const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || 500;
  try {
    req.log?.error({ err, requestId: req.id });
  } catch (_) {}

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: { code: 'DUPLICATE_ENTRY', message: 'Une entrée avec ces données existe déjà' }
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Ressource non trouvée' }
    });
  }

  if (err.code && err.code.startsWith('P')) {
    return res.status(400).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: 'Erreur de base de données' }
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Token invalide' }
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: { code: 'EXPIRED_TOKEN', message: 'Token expiré' }
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Données invalides' },
      details: err.details
    });
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: { code: 'FILE_TOO_LARGE', message: 'Fichier trop volumineux' }
    });
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      success: false,
      error: { code: 'TOO_MANY_FILES', message: 'Trop de fichiers' }
    });
  }

  // Stripe errors
  if (err.type === 'StripeCardError') {
    return res.status(400).json({
      success: false,
      error: { code: 'CARD_ERROR', message: 'Erreur de carte bancaire' },
      details: err.message
    });
  }

  if (err.type === 'StripeInvalidRequestError') {
    return res.status(400).json({
      success: false,
      error: { code: 'PAYMENT_ERROR', message: 'Requête de paiement invalide' }
    });
  }

  // Custom application errors
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code || 'APPLICATION_ERROR',
        message: err.message || 'Erreur de l\'application'
      }
    });
  }

  // Default server error
  res.status(status).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'Erreur interne du serveur' : (err.message || 'Unexpected error')
    },
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
