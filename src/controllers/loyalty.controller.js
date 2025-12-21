const prisma = require('../config/prisma');
const { AppError, asyncHandler } = require('../middlewares/errorHandler.middleware');
const loyaltyService = require('../services/loyalty.service');

// Get user's loyalty account
const getLoyaltyAccount = asyncHandler(async (req, res) => {
  const loyaltyAccount = await loyaltyService.getLoyaltyAccount(req.user.id);

  // Calculate points until next tier
  const nextTier = await prisma.loyaltyTier.findFirst({
    where: {
      min_points: {
        gt: loyaltyAccount.points_balance
      }
    },
    orderBy: {
      min_points: 'asc'
    }
  });

  const pointsUntilNextTier = nextTier ? nextTier.min_points - loyaltyAccount.points_balance : 0;

  res.json({
    success: true,
    data: {
      loyaltyAccount,
      next_tier: nextTier,
      points_until_next_tier: pointsUntilNextTier
    }
  });
});

// Get available rewards for user
const getAvailableRewards = asyncHandler(async (req, res) => {
  const rewards = await loyaltyService.getAvailableRewards(req.user.id);

  res.json({
    success: true,
    data: { rewards }
  });
});

// Redeem a reward
const redeemReward = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await loyaltyService.redeemReward(req.user.id, parseInt(id));

  res.json({
    success: true,
    message: 'Récompense échangée avec succès',
    data: result
  });
});

// Get loyalty transactions history
const getLoyaltyTransactions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const loyaltyAccount = await prisma.loyaltyAccount.findUnique({
    where: { user_id: req.user.id }
  });

  if (!loyaltyAccount) {
    throw new AppError('Compte de fidélité non trouvé', 404, 'LOYALTY_ACCOUNT_NOT_FOUND');
  }

  const [transactions, total] = await Promise.all([
    prisma.loyaltyTransaction.findMany({
      where: {
        loyalty_account_id: loyaltyAccount.id
      },
      include: {
        booking: {
          include: {
            car: {
              include: {
                brand: true
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      skip,
      take: parseInt(limit)
    }),
    prisma.loyaltyTransaction.count({
      where: {
        loyalty_account_id: loyaltyAccount.id
      }
    })
  ]);

  res.json({
    success: true,
    data: {
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
});

// Get all loyalty tiers
const getLoyaltyTiers = asyncHandler(async (req, res) => {
  const tiers = await prisma.loyaltyTier.findMany({
    orderBy: {
      min_points: 'asc'
    }
  });

  res.json({
    success: true,
    data: { tiers }
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

module.exports = {
  getLoyaltyAccount,
  getAvailableRewards,
  redeemReward,
  getLoyaltyTransactions,
  getLoyaltyTiers,
  getAllLoyaltyAccounts,
  awardPointsManually,
  createTier,
  updateTier,
  createReward,
  updateReward,
  deleteReward
};
