const loyaltyService = require('../services/loyalty.service');
const { asyncHandler } = require('../middlewares/errorHandler.middleware');
const {
  InsufficientPointsError,
  LoyaltyAccountNotFoundError,
  InvalidRewardError,
  InvalidPointsAmountError
} = require('../errors/loyalty.errors');

/**
 * GET /api/loyalty/account/:userId?
 * Get complete user loyalty information
 */
const getUserLoyaltyInfo = asyncHandler(async (req, res) => {
  // Check if user is authenticated
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise'
    });
  }

  const userId = req.params.userId ? parseInt(req.params.userId) : req.user.id;
  
  // Ensure user can only access their own data (unless admin)
  if (userId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Accès non autorisé'
    });
  }

  try {
    const loyaltyInfo = await loyaltyService.getUserLoyaltyInfo(userId);

    res.json({
      success: true,
      data: loyaltyInfo
    });
  } catch (error) {
    console.error('Error getting loyalty info:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des informations de fidélité'
    });
  }
});

/**
 * POST /api/loyalty/calculate-points
 * Calculate points for a booking amount
 */
const calculatePoints = asyncHandler(async (req, res) => {
  const { bookingAmount, userId } = req.body;
  
  if (!bookingAmount || bookingAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Montant de réservation requis et doit être positif'
    });
  }

  const targetUserId = userId || req.user.id;
  const pointsCalculation = await loyaltyService.calculatePointsEarned(bookingAmount, targetUserId);

  res.json({
    success: true,
    data: pointsCalculation
  });
});

/**
 * POST /api/loyalty/add-points
 * Add points to user account
 */
const addPoints = asyncHandler(async (req, res) => {
  const { userId, points, bookingId, description } = req.body;
  
  if (!userId || !points) {
    return res.status(400).json({
      success: false,
      message: 'ID utilisateur et points requis'
    });
  }

  const result = await loyaltyService.addPoints(
    parseInt(userId),
    parseInt(points),
    bookingId ? parseInt(bookingId) : null,
    description
  );

  res.json({
    success: true,
    message: 'Points ajoutés avec succès',
    data: result
  });
});

/**
 * POST /api/loyalty/redeem-points
 * Redeem points for discount
 */
const redeemPoints = asyncHandler(async (req, res) => {
  const { userId, points, description } = req.body;
  
  if (!userId || !points) {
    return res.status(400).json({
      success: false,
      message: 'ID utilisateur et points requis'
    });
  }

  const targetUserId = userId || req.user.id;
  
  // Ensure user can only redeem their own points (unless admin)
  if (targetUserId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Accès non autorisé'
    });
  }

  const result = await loyaltyService.redeemPoints(
    targetUserId,
    parseInt(points),
    description
  );

  res.json({
    success: true,
    message: 'Points échangés avec succès',
    data: result
  });
});

/**
 * GET /api/loyalty/rewards
 * Get available rewards for user
 */
const getAvailableRewards = asyncHandler(async (req, res) => {
  const userId = req.query.userId ? parseInt(req.query.userId) : req.user.id;
  
  // Ensure user can only access their own data (unless admin)
  if (userId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Accès non autorisé'
    });
  }

  try {
    const rewards = await loyaltyService.getAvailableRewards(userId);

    res.json({
      success: true,
      data: { rewards }
    });
  } catch (error) {
    console.error('Error getting rewards:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des récompenses'
    });
  }
});

/**
 * POST /api/loyalty/redeem-reward
 * Redeem a specific reward
 */
const redeemReward = asyncHandler(async (req, res) => {
  const { userId, rewardId } = req.body;
  
  if (!rewardId) {
    return res.status(400).json({
      success: false,
      message: 'ID de récompense requis'
    });
  }

  const targetUserId = userId || req.user.id;
  
  // Ensure user can only redeem for themselves (unless admin)
  if (targetUserId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Accès non autorisé'
    });
  }

  try {
    const result = await loyaltyService.redeemReward(targetUserId, parseInt(rewardId));

    res.json({
      success: true,
      message: 'Récompense échangée avec succès',
      data: result
    });
  } catch (error) {
    console.error('Error redeeming reward:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de l\'échange de la récompense'
    });
  }
});

/**
 * GET /api/loyalty/transactions/:userId
 * Get transaction history for user
 */
const getTransactionHistory = asyncHandler(async (req, res) => {
  const userId = req.params.userId ? parseInt(req.params.userId) : req.user.id;
  const { limit = 20, page = 1 } = req.query;
  
  // Ensure user can only access their own data (unless admin)
  if (userId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Accès non autorisé'
    });
  }

  try {
    const transactions = await loyaltyService.getTransactionHistory(userId, parseInt(limit));

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: transactions.length
        }
      }
    });
  } catch (error) {
    console.error('Error getting transaction history:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'historique'
    });
  }
});

/**
 * GET /api/loyalty/tiers
 * Get all loyalty tiers
 */
const getAllTiers = asyncHandler(async (req, res) => {
  try {
    const tiers = await loyaltyService.getAllTiers();

    res.json({
      success: true,
      data: { tiers }
    });
  } catch (error) {
    console.error('Error getting tiers:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des niveaux de fidélité'
    });
  }
});

/**
 * POST /api/loyalty/calculate-discount
 * Calculate discount based on user tier
 */
const calculateDiscount = asyncHandler(async (req, res) => {
  const { userId, bookingAmount } = req.body;
  
  if (!bookingAmount || bookingAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Montant de réservation requis et doit être positif'
    });
  }

  const targetUserId = userId || req.user.id;
  const discount = await loyaltyService.calculateDiscount(targetUserId, bookingAmount);

  res.json({
    success: true,
    data: {
      discount_amount: discount,
      booking_amount: bookingAmount,
      final_amount: bookingAmount - discount
    }
  });
});

// Get all loyalty accounts (Admin only)
const getAllLoyaltyAccounts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, tier_id } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (tier_id) {
    where.tier_id = parseInt(tier_id);
  }

  const [accounts, total] = await Promise.all([
    prisma.loyaltyAccount.findMany({
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
        tier: true
      },
      orderBy: {
        points_balance: 'desc'
      },
      skip,
      take: parseInt(limit)
    }),
    prisma.loyaltyAccount.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      accounts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
});

// Award points manually (Admin only)
const awardPointsManually = asyncHandler(async (req, res) => {
  const { user_id, points, description } = req.body;

  if (!user_id || !points || points <= 0) {
    throw new AppError('ID utilisateur et points positifs requis', 400, 'INVALID_DATA');
  }

  // Get or create loyalty account
  let loyaltyAccount = await prisma.loyaltyAccount.findUnique({
    where: { user_id: parseInt(user_id) }
  });

  if (!loyaltyAccount) {
    loyaltyAccount = await prisma.loyaltyAccount.create({
      data: {
        user_id: parseInt(user_id),
        tier_id: 1,
        points_balance: 0,
        total_spent: 0
      }
    });
  }

  // Update points balance
  const updatedAccount = await prisma.loyaltyAccount.update({
    where: { user_id: parseInt(user_id) },
    data: {
      points_balance: {
        increment: parseInt(points)
      }
    }
  });

  // Create transaction
  await prisma.loyaltyTransaction.create({
    data: {
      loyalty_account_id: loyaltyAccount.id,
      points: parseInt(points),
      transaction_type: 'EARNED',
      description: description || `Points attribués manuellement par l'admin`
    }
  });

  // Check for tier upgrade
  await loyaltyService.checkAndUpgradeTier(parseInt(user_id), updatedAccount.points_balance, updatedAccount.total_spent);

  res.json({
    success: true,
    message: 'Points attribués avec succès',
    data: {
      points_awarded: parseInt(points),
      new_balance: updatedAccount.points_balance
    }
  });
});

// Create new tier (Admin only)
const createTier = asyncHandler(async (req, res) => {
  const { name, min_points, discount_percent, benefits } = req.body;

  if (!name || min_points === undefined || discount_percent === undefined) {
    throw new AppError('Nom, points minimum et pourcentage de réduction requis', 400, 'MISSING_DATA');
  }

  const tier = await prisma.loyaltyTier.create({
    data: {
      name,
      min_points: parseInt(min_points),
      discount_percent: parseFloat(discount_percent),
      benefits
    }
  });

  res.status(201).json({
    success: true,
    message: 'Niveau de fidélité créé avec succès',
    data: { tier }
  });
});

// Update tier (Admin only)
const updateTier = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, min_points, discount_percent, benefits } = req.body;

  const updateData = {};
  if (name) updateData.name = name;
  if (min_points !== undefined) updateData.min_points = parseInt(min_points);
  if (discount_percent !== undefined) updateData.discount_percent = parseFloat(discount_percent);
  if (benefits) updateData.benefits = benefits;

  const tier = await prisma.loyaltyTier.update({
    where: { id: parseInt(id) },
    data: updateData
  });

  res.json({
    success: true,
    message: 'Niveau de fidélité mis à jour avec succès',
    data: { tier }
  });
});

// Create new reward (Admin only)
const createReward = asyncHandler(async (req, res) => {
  const { name, description, points_cost, reward_type, reward_value } = req.body;

  if (!name || !points_cost || !reward_type) {
    throw new AppError('Nom, coût en points et type de récompense requis', 400, 'MISSING_DATA');
  }

  const reward = await prisma.loyaltyReward.create({
    data: {
      name,
      description,
      points_cost: parseInt(points_cost),
      reward_type,
      reward_value: reward_value ? parseFloat(reward_value) : null
    }
  });

  res.status(201).json({
    success: true,
    message: 'Récompense créée avec succès',
    data: { reward }
  });
});

// Update reward (Admin only)
const updateReward = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, points_cost, reward_type, reward_value, is_active } = req.body;

  const updateData = {};
  if (name) updateData.name = name;
  if (description) updateData.description = description;
  if (points_cost !== undefined) updateData.points_cost = parseInt(points_cost);
  if (reward_type) updateData.reward_type = reward_type;
  if (reward_value !== undefined) updateData.reward_value = parseFloat(reward_value);
  if (is_active !== undefined) updateData.is_active = is_active === true || is_active === 'true';

  const reward = await prisma.loyaltyReward.update({
    where: { id: parseInt(id) },
    data: updateData
  });

  res.json({
    success: true,
    message: 'Récompense mise à jour avec succès',
    data: { reward }
  });
});

// Delete reward (Admin only)
const deleteReward = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await prisma.loyaltyReward.delete({
    where: { id: parseInt(id) }
  });

  res.json({
    success: true,
    message: 'Récompense supprimée avec succès'
  });
});

// Error handling middleware for loyalty-specific errors
const handleLoyaltyErrors = (error, req, res, next) => {
  if (error instanceof InsufficientPointsError) {
    return res.status(400).json({
      success: false,
      message: error.message,
      code: error.code,
      data: {
        required: error.required,
        available: error.available
      }
    });
  }
  
  if (error instanceof LoyaltyAccountNotFoundError) {
    return res.status(404).json({
      success: false,
      message: error.message,
      code: error.code
    });
  }
  
  if (error instanceof InvalidRewardError) {
    return res.status(400).json({
      success: false,
      message: error.message,
      code: error.code
    });
  }
  
  if (error instanceof InvalidPointsAmountError) {
    return res.status(400).json({
      success: false,
      message: error.message,
      code: error.code
    });
  }
  
  // Pass other errors to the default error handler
  next(error);
};

module.exports = {
  // Main API endpoints
  getUserLoyaltyInfo,
  calculatePoints,
  addPoints,
  redeemPoints,
  getAvailableRewards,
  redeemReward,
  getTransactionHistory,
  getAllTiers,
  calculateDiscount,
  
  // Admin endpoints (keeping existing ones)
  getAllLoyaltyAccounts,
  awardPointsManually,
  createTier,
  updateTier,
  createReward,
  updateReward,
  deleteReward,
  
  // Error handler
  handleLoyaltyErrors
};
