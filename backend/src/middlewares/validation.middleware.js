const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Données invalides'
      },
      details: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

// User validation rules
const validateUserRegistration = [
  body('email')
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  body('mot_de_passe')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'),
  body('nom')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  body('prenom')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le prénom doit contenir entre 2 et 100 caractères'),
  body('telephone')
    .optional()
    .matches(/^(\+212|0)[5-7][0-9]{8}$/)
    .withMessage('Numéro de téléphone marocain invalide'),
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  body('mot_de_passe')
    .notEmpty()
    .withMessage('Mot de passe requis'),
  handleValidationErrors
];

// Car validation rules
const validateCarCreation = [
  body('brand_id')
    .isInt({ min: 1 })
    .withMessage('ID de marque invalide'),
  body('category_id')
    .isInt({ min: 1 })
    .withMessage('ID de catégorie invalide'),
  body('modele')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le modèle doit contenir entre 2 et 50 caractères'),
  body('annee')
    .isInt({ min: 2000, max: new Date().getFullYear() + 1 })
    .withMessage('Année invalide'),
  body('immatriculation')
    .matches(/^[0-9]{1,6}-[A-Z]{1,3}-[0-9]{2}$/)
    .withMessage('Format d\'immatriculation invalide (ex: 123456-A-01)'),
  body('prix_par_jour')
    .isFloat({ min: 0 })
    .withMessage('Prix par jour invalide'),
  body('ville')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Ville requise'),
  handleValidationErrors
];

// Booking validation rules
const validateBookingCreation = [
  body('car_id')
    .isInt({ min: 1 })
    .withMessage('ID de voiture invalide'),
  body('date_debut')
    .isISO8601()
    .withMessage('Date de début invalide')
    .custom((value) => {
      const startDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (startDate < today) {
        throw new Error('La date de début ne peut pas être dans le passé');
      }
      return true;
    }),
  body('date_fin')
    .isISO8601()
    .withMessage('Date de fin invalide')
    .custom((value, { req }) => {
      const endDate = new Date(value);
      const startDate = new Date(req.body.date_debut);
      
      if (endDate <= startDate) {
        throw new Error('La date de fin doit être après la date de début');
      }
      
      const diffTime = Math.abs(endDate - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 30) {
        throw new Error('La durée de location ne peut pas dépasser 30 jours');
      }
      
      return true;
    }),
  body('lieu_prise_en_charge')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Lieu de prise en charge trop long'),
  body('lieu_retour')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Lieu de retour trop long'),
  handleValidationErrors
];

// Payment validation rules
const validatePaymentCreation = [
  body('booking_id')
    .isInt({ min: 1 })
    .withMessage('ID de réservation invalide'),
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Montant invalide'),
  body('currency')
    .optional()
    .isIn(['MAD', 'EUR', 'USD'])
    .withMessage('Devise non supportée'),
  handleValidationErrors
];

// Review validation rules
const validateReviewCreation = [
  body('car_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID de voiture invalide'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Note invalide (1-5)'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Commentaire trop long (max 1000 caractères)'),
  handleValidationErrors
];

// Parameter validation
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID invalide'),
  handleValidationErrors
];

// Query validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Numéro de page invalide'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite invalide (1-100)'),
  handleValidationErrors
];

const validateCarFilters = [
  query('ville')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Ville invalide'),
  query('marque')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Marque invalide'),
  query('prix_min')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Prix minimum invalide'),
  query('prix_max')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Prix maximum invalide'),
  query('date_debut')
    .optional()
    .isISO8601()
    .withMessage('Date de début invalide'),
  query('date_fin')
    .optional()
    .isISO8601()
    .withMessage('Date de fin invalide'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateCarCreation,
  validateBookingCreation,
  validatePaymentCreation,
  validateReviewCreation,
  validateId,
  validatePagination,
  validateCarFilters
};
