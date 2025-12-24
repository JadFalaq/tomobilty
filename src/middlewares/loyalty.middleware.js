/**
 * Loyalty system middleware functions
 */

const loyaltyService = require('../services/loyalty.service');
const { isValidPointsAmount } = require('../utils/loyalty.utils');
const {
  InsufficientPointsError,
  LoyaltyAccountNotFoundError,
  InvalidPointsAmountError
} = require('../errors/loyalty.errors');

/**
 * Validate points amount middleware
 * @param {number} minPoints - Minimum points required
 * @returns {Function} Middleware function
 */
const validatePoints = (minPoints = 0) => {
  return (req, res, next) => {
    const { points } = req.body;
    
    if (!points) {
      return res.status(400).json({
        success: false,
        message: 'Points requis',
        code: 'MISSING_POINTS'
      });
    }

    const pointsNumber = parseInt(points);
    
    if (!isValidPointsAmount(pointsNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Montant de points invalide. Doit être entre 1 et 10000',
        code: 'INVALID_POINTS_AMOUNT'
      });
    }

    if (pointsNumber < minPoints) {
      return res.status(400).json({
        success: false,
        message: `Minimum ${minPoints} points requis`,
        code: 'INSUFFICIENT_POINTS_AMOUNT'
      });
    }

    req.validatedPoints = pointsNumber;
    next();
  };
};

/**
 * Check if loyalty account exists, create if not
 * @returns {Function} Middleware function
 */
const checkLoyaltyAccount = () => {
  return async (req, res, next) => {
    try {
      const userId = req.params.userId ? parseInt(req.params.userId) : req.user.id;
      
      // Try to get loyalty account, create if doesn't exist
      let loyaltyAccount = await loyaltyService.getUserLoyaltyInfo(userId);
      
      if (!loyaltyAccount.account) {
        // Create new loyalty account
        loyaltyAccount = await loyaltyService.createLoyaltyAccount(userId);
      }

      req.loyaltyAccount = loyaltyAccount;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Validate user has sufficient points
 * @param {number} requiredPoints - Points required for the operation
 * @returns {Function} Middleware function
 */
const requireSufficientPoints = (requiredPoints) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const loyaltyInfo = await loyaltyService.getUserLoyaltyInfo(userId);
      
      if (loyaltyInfo.account.points_balance < requiredPoints) {
        throw new InsufficientPointsError(requiredPoints, loyaltyInfo.account.points_balance);
      }

      req.userPoints = loyaltyInfo.account.points_balance;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Validate booking amount
 * @returns {Function} Middleware function
 */
const validateBookingAmount = () => {
  return (req, res, next) => {
    const { bookingAmount } = req.body;
    
    if (!bookingAmount || bookingAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Montant de réservation requis et doit être positif',
        code: 'INVALID_BOOKING_AMOUNT'
      });
    }

    const amount = parseFloat(bookingAmount);
    
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Montant de réservation invalide',
        code: 'INVALID_BOOKING_AMOUNT'
      });
    }

    req.validatedBookingAmount = amount;
    next();
  };
};

/**
 * Validate reward ID and check if it exists
 * @returns {Function} Middleware function
 */
const validateReward = () => {
  return async (req, res, next) => {
    try {
      const { rewardId } = req.body;
      
      if (!rewardId) {
        return res.status(400).json({
          success: false,
          message: 'ID de récompense requis',
          code: 'MISSING_REWARD_ID'
        });
      }

      const rewardIdNumber = parseInt(rewardId);
      
      if (isNaN(rewardIdNumber) || rewardIdNumber <= 0) {
        return res.status(400).json({
          success: false,
          message: 'ID de récompense invalide',
          code: 'INVALID_REWARD_ID'
        });
      }

      // Check if reward exists and is active
      const rewards = await loyaltyService.getAvailableRewards(req.user.id);
      const reward = rewards.find(r => r.id === rewardIdNumber);
      
      if (!reward) {
        return res.status(404).json({
          success: false,
          message: 'Récompense introuvable ou inactive',
          code: 'REWARD_NOT_FOUND'
        });
      }

      req.validatedReward = reward;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Rate limiting for points operations
 * @param {number} maxOperations - Max operations per time window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Function} Middleware function
 */
const rateLimitPoints = (maxOperations = 10, windowMs = 60000) => {
  const userOperations = new Map();
  
  return (req, res, next) => {
    const userId = req.user.id;
    const now = Date.now();
    
    // Clean up old entries
    for (const [key, data] of userOperations.entries()) {
      if (now - data.firstOperation > windowMs) {
        userOperations.delete(key);
      }
    }
    
    // Check current user operations
    const userOps = userOperations.get(userId);
    
    if (!userOps) {
      userOperations.set(userId, {
        count: 1,
        firstOperation: now
      });
      return next();
    }
    
    if (userOps.count >= maxOperations) {
      return res.status(429).json({
        success: false,
        message: 'Trop de tentatives. Veuillez réessayer plus tard.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((userOps.firstOperation + windowMs - now) / 1000)
      });
    }
    
    userOps.count++;
    next();
  };
};

/**
 * Validate user ownership or admin access
 * @returns {Function} Middleware function
 */
const validateUserAccess = () => {
  return (req, res, next) => {
    const targetUserId = req.params.userId ? parseInt(req.params.userId) : req.body.userId;
    const currentUserId = req.user.id;
    const isAdmin = req.user.role === 'ADMIN';
    
    // Allow access if user is accessing their own data or is admin
    if (targetUserId === currentUserId || isAdmin) {
      return next();
    }
    
    return res.status(403).json({
      success: false,
      message: 'Accès non autorisé',
      code: 'ACCESS_DENIED'
    });
  };
};

/**
 * Log loyalty operations for audit
 * @returns {Function} Middleware function
 */
const auditLoyaltyOperation = () => {
  return (req, res, next) => {
    const originalSend = res.json;
    
    res.json = function(data) {
      // Log the operation
      console.log(`🔍 Loyalty Operation: ${req.method} ${req.path}`, {
        user: req.user.id,
        body: req.body,
        params: req.params,
        query: req.query,
        success: data.success,
        timestamp: new Date().toISOString()
      });
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

/**
 * Validate transaction description
 * @returns {Function} Middleware function
 */
const validateDescription = () => {
  return (req, res, next) => {
    const { description } = req.body;
    
    if (description && typeof description !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Description doit être une chaîne de caractères',
        code: 'INVALID_DESCRIPTION'
      });
    }
    
    if (description && description.length > 255) {
      return res.status(400).json({
        success: false,
        message: 'Description trop longue (max 255 caractères)',
        code: 'DESCRIPTION_TOO_LONG'
      });
    }
    
    next();
  };
};

module.exports = {
  validatePoints,
  checkLoyaltyAccount,
  requireSufficientPoints,
  validateBookingAmount,
  validateReward,
  rateLimitPoints,
  validateUserAccess,
  auditLoyaltyOperation,
  validateDescription
};
