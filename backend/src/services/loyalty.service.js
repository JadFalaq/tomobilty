const prisma = require('../config/prisma');
const {
  calculateTierMultiplier,
  formatPoints,
  calculatePointsToNextTier,
  pointsToMoney,
  moneyToPoints,
  calculateBasePoints,
  isValidPointsAmount,
  calculateBonusPoints,
  determineTierByPoints,
  formatTransactionDescription,
  calculateLoyaltyDiscount,
  checkPointsExpiration,
  validateRewardRedemption
} = require('../utils/loyalty.utils');

const {
  InsufficientPointsError,
  LoyaltyAccountNotFoundError,
  InvalidRewardError,
  ExpiredPointsError,
  InvalidPointsAmountError,
  TierUpgradeError
} = require('../errors/loyalty.errors');

/**
 * Create loyalty account for new user
 * @param {number} userId - User ID
 * @returns {Object} Created loyalty account
 */
const createLoyaltyAccount = async (userId) => {
  try {
    // Check if account already exists
    const existingAccount = await prisma.loyaltyAccount.findUnique({
      where: { user_id: userId }
    });

    if (existingAccount) {
      return existingAccount;
    }

    // Create new loyalty account with Bronze tier (id: 1)
    const loyaltyAccount = await prisma.loyaltyAccount.create({
      data: {
        user_id: userId,
        tier_id: 1, // Bronze tier
        points_balance: 0,
        lifetime_points: 0,
        total_spent: 0
      },
      include: {
        tier: true,
        user: true
      }
    });

    console.log(`✅ Loyalty account created for user ${userId}`);
    return loyaltyAccount;
  } catch (error) {
    console.error('Error creating loyalty account:', error);
    throw error;
  }
};

/**
 * Calculate points earned from booking amount
 * @param {number} bookingAmount - Booking amount in MAD
 * @param {number} userId - User ID
 * @returns {Object} Points calculation details
 */
const calculatePointsEarned = async (bookingAmount, userId) => {
  try {
    // Get user's loyalty account and tier
    const loyaltyAccount = await prisma.loyaltyAccount.findUnique({
      where: { user_id: userId },
      include: { tier: true }
    });

    if (!loyaltyAccount) {
      throw new LoyaltyAccountNotFoundError(userId);
    }

    // Calculate base points (1 point per 10 MAD)
    const basePoints = moneyToPoints(bookingAmount);
    
    // Apply tier multiplier
    const tierMultiplier = calculateTierMultiplier(loyaltyAccount.tier.name);
    const pointsWithMultiplier = Math.floor(basePoints * tierMultiplier);

    return {
      basePoints,
      tierMultiplier,
      pointsWithMultiplier,
      tierName: loyaltyAccount.tier.name
    };
  } catch (error) {
    console.error('Error calculating points earned:', error);
    throw error;
  }
};

/**
 * Add points to user's loyalty account
 * @param {number} userId - User ID
 * @param {number} points - Points to add
 * @param {number} bookingId - Associated booking ID (optional)
 * @param {string} description - Transaction description
 * @returns {Object} Updated account info
 */
const addPoints = async (userId, points, bookingId = null, description = 'Points ajoutés') => {
  try {
    // Validate points amount
    if (!isValidPointsAmount(points)) {
      throw new InvalidPointsAmountError(points);
    }

    // Get or create loyalty account
    let loyaltyAccount = await prisma.loyaltyAccount.findUnique({
      where: { user_id: userId },
      include: { tier: true }
    });

    if (!loyaltyAccount) {
      loyaltyAccount = await createLoyaltyAccount(userId);
    }

    // Update loyalty account
    const updatedAccount = await prisma.loyaltyAccount.update({
      where: { user_id: userId },
      data: {
        points_balance: {
          increment: points
        },
        lifetime_points: {
          increment: points
        }
      },
      include: { tier: true }
    });

    // Create transaction record
    await prisma.loyaltyTransaction.create({
      data: {
        loyalty_account_id: loyaltyAccount.id,
        points: points,
        transaction_type: 'EARNED',
        description: formatTransactionDescription('EARNED', { source: description }),
        booking_id: bookingId
      }
    });

    // Check for tier upgrade
    const upgradeResult = await checkTierUpgrade(userId);

    console.log(`✅ Added ${points} points to user ${userId}. New balance: ${updatedAccount.points_balance}`);

    return {
      points_added: points,
      new_balance: updatedAccount.points_balance,
      tier_upgrade: upgradeResult
    };
  } catch (error) {
    console.error('Error adding points:', error);
    throw error;
  }
};

/**
 * Redeem points from user's account
 * @param {number} userId - User ID
 * @param {number} points - Points to redeem
 * @param {string} description - Transaction description
 * @returns {Object} Redemption result
 */
const redeemPoints = async (userId, points, description = 'Points échangés') => {
  try {
    // Validate minimum redemption (100 points)
    if (points < 100) {
      throw new InvalidPointsAmountError(points);
    }

    // Get loyalty account
    const loyaltyAccount = await prisma.loyaltyAccount.findUnique({
      where: { user_id: userId }
    });

    if (!loyaltyAccount) {
      throw new LoyaltyAccountNotFoundError(userId);
    }

    // Check sufficient points
    if (loyaltyAccount.points_balance < points) {
      throw new InsufficientPointsError(points, loyaltyAccount.points_balance);
    }

    // Update points balance
    const updatedAccount = await prisma.loyaltyAccount.update({
      where: { user_id: userId },
      data: {
        points_balance: {
          decrement: points
        }
      }
    });

    // Create redemption transaction
    await prisma.loyaltyTransaction.create({
      data: {
        loyalty_account_id: loyaltyAccount.id,
        points: -points,
        transaction_type: 'REDEEMED',
        description: formatTransactionDescription('REDEEMED', { reason: description })
      }
    });

    // Calculate discount amount (100 points = 10 MAD)
    const discountAmount = pointsToMoney(points);

    console.log(`✅ Redeemed ${points} points for user ${userId}. Discount: ${discountAmount} MAD`);

    return {
      points_redeemed: points,
      discount_amount: discountAmount,
      new_balance: updatedAccount.points_balance
    };
  } catch (error) {
    console.error('Error redeeming points:', error);
    throw error;
  }
};

/**
 * Check and upgrade tier if eligible
 * @param {number} userId - User ID
 * @returns {Object} Upgrade result
 */
const checkTierUpgrade = async (userId) => {
  try {
    // Get current loyalty account
    const loyaltyAccount = await prisma.loyaltyAccount.findUnique({
      where: { user_id: userId },
      include: { tier: true }
    });

    if (!loyaltyAccount) {
      throw new LoyaltyAccountNotFoundError(userId);
    }

    // Get all tiers
    const tiers = await prisma.loyaltyTier.findMany({
      orderBy: { min_points: 'asc' }
    });

    // Determine new tier based on lifetime points
    const newTier = determineTierByPoints(loyaltyAccount.lifetime_points, tiers);

    // Check if upgrade is needed
    if (newTier.id !== loyaltyAccount.tier_id && newTier.min_points > loyaltyAccount.tier.min_points) {
      // Update tier
      await prisma.loyaltyAccount.update({
        where: { user_id: userId },
        data: { tier_id: newTier.id }
      });

      // Add bonus points for tier upgrade
      const bonusPoints = 100; // Bonus for tier upgrade
      await prisma.loyaltyTransaction.create({
        data: {
          loyalty_account_id: loyaltyAccount.id,
          points: bonusPoints,
          transaction_type: 'BONUS',
          description: formatTransactionDescription('BONUS', { reason: `Upgrade vers ${newTier.name}` })
        }
      });

      // Update points balance with bonus
      await prisma.loyaltyAccount.update({
        where: { user_id: userId },
        data: {
          points_balance: { increment: bonusPoints }
        }
      });

      // Send notification
      try {
        await prisma.notification.create({
          data: {
            user_id: userId,
            title: 'Félicitations ! Nouveau niveau de fidélité',
            message: `Vous avez été promu au niveau ${newTier.name} ! Profitez de ${newTier.discount_percent}% de réduction + ${bonusPoints} points bonus.`,
            type: 'SYSTEM'
          }
        });
      } catch (notifError) {
        console.warn('Could not create notification:', notifError.message);
      }

      console.log(`🎉 User ${userId} upgraded from ${loyaltyAccount.tier.name} to ${newTier.name}`);

      return {
        upgraded: true,
        old_tier: loyaltyAccount.tier,
        new_tier: newTier,
        bonus_points: bonusPoints
      };
    }

    return { upgraded: false };
  } catch (error) {
    console.error('Error checking tier upgrade:', error);
    throw new TierUpgradeError(error.message);
  }
};

/**
 * Calculate discount amount based on user's tier
 * @param {number} userId - User ID
 * @param {number} bookingAmount - Booking amount in MAD
 * @returns {number} Discount amount
 */
const calculateDiscount = async (userId, bookingAmount) => {
  try {
    const loyaltyAccount = await prisma.loyaltyAccount.findUnique({
      where: { user_id: userId },
      include: { tier: true }
    });

    if (!loyaltyAccount) {
      return 0;
    }

    const discountPercent = calculateLoyaltyDiscount(loyaltyAccount.tier);
    return (bookingAmount * discountPercent) / 100;
  } catch (error) {
    console.error('Error calculating discount:', error);
    return 0;
  }
};

/**
 * Get complete user loyalty information
 * @param {number} userId - User ID
 * @returns {Object} Complete loyalty info
 */
const getUserLoyaltyInfo = async (userId) => {
  try {
    // Get or create loyalty account
    let loyaltyAccount = await prisma.loyaltyAccount.findUnique({
      where: { user_id: userId },
      include: {
        tier: true,
        transactions: {
          orderBy: { created_at: 'desc' },
          take: 20,
          include: {
            booking: {
              select: {
                id: true,
                car: {
                  select: {
                    modele: true,
                    brand: { select: { name: true } }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!loyaltyAccount) {
      loyaltyAccount = await createLoyaltyAccount(userId);
    }

    // Get all tiers for next tier calculation
    const tiers = await prisma.loyaltyTier.findMany({
      orderBy: { min_points: 'asc' }
    });

    // Calculate points to next tier
    const nextTier = tiers.find(tier => tier.min_points > loyaltyAccount.lifetime_points);
    const nextTierInfo = nextTier ? {
      next_tier: nextTier,
      points_needed: nextTier.min_points - loyaltyAccount.lifetime_points,
      progress_percentage: Math.min((loyaltyAccount.lifetime_points / nextTier.min_points) * 100, 100)
    } : null;

    // Get available rewards
    const availableRewards = await getAvailableRewards(userId);

    return {
      account: loyaltyAccount,
      tier: loyaltyAccount.tier,
      next_tier: nextTierInfo,
      available_rewards: availableRewards,
      transactions: loyaltyAccount.transactions,
      formatted_balance: loyaltyAccount.points_balance.toLocaleString()
    };
  } catch (error) {
    console.error('Error getting user loyalty info:', error);
    throw error;
  }
};

/**
 * Get available rewards for user
 * @param {number} userId - User ID
 * @returns {Array} Available rewards
 */
const getAvailableRewards = async (userId) => {
  try {
    const loyaltyAccount = await prisma.loyaltyAccount.findUnique({
      where: { user_id: userId }
    });

    if (!loyaltyAccount) {
      return [];
    }

    // Get all active rewards
    const allRewards = await prisma.loyaltyReward.findMany({
      where: { is_active: true },
      orderBy: { points_cost: 'asc' }
    });

    // Add affordability info to each reward
    return allRewards.map(reward => ({
      ...reward,
      can_afford: loyaltyAccount.points_balance >= reward.points_cost,
      points_needed: Math.max(0, reward.points_cost - loyaltyAccount.points_balance)
    }));
  } catch (error) {
    console.error('Error getting available rewards:', error);
    throw error;
  }
};

/**
 * Redeem a specific reward
 * @param {number} userId - User ID
 * @param {number} rewardId - Reward ID
 * @returns {Object} Redemption result
 */
const redeemReward = async (userId, rewardId) => {
  try {
    // Get reward details
    const reward = await prisma.loyaltyReward.findUnique({
      where: { id: rewardId }
    });

    if (!reward || !reward.is_active) {
      throw new InvalidRewardError(rewardId);
    }

    // Get loyalty account
    const loyaltyAccount = await prisma.loyaltyAccount.findUnique({
      where: { user_id: userId }
    });

    if (!loyaltyAccount) {
      throw new LoyaltyAccountNotFoundError(userId);
    }

    // Validate redemption
    const validation = validateRewardRedemption(reward, loyaltyAccount.points_balance);
    if (!validation.isValid) {
      if (!validation.canAfford) {
        throw new InsufficientPointsError(reward.points_cost, loyaltyAccount.points_balance);
      }
      throw new InvalidRewardError(rewardId);
    }

    // Redeem points
    const redemptionResult = await redeemPoints(
      userId,
      reward.points_cost,
      `Échange récompense: ${reward.name}`
    );

    // Send notification
    try {
      await prisma.notification.create({
        data: {
          user_id: userId,
          title: 'Récompense échangée !',
          message: `Vous avez échangé ${reward.points_cost} points contre: ${reward.name}`,
          type: 'SYSTEM'
        }
      });
    } catch (notifError) {
      console.warn('Could not create notification:', notifError.message);
    }

    console.log(`🎁 User ${userId} redeemed reward: ${reward.name}`);

    return {
      reward,
      points_used: reward.points_cost,
      new_balance: redemptionResult.new_balance
    };
  } catch (error) {
    console.error('Error redeeming reward:', error);
    throw error;
  }
};

/**
 * Expire inactive points (12+ months)
 * @param {number} userId - User ID
 * @returns {Object} Expiration result
 */
const expireInactivePoints = async (userId) => {
  try {
    const loyaltyAccount = await prisma.loyaltyAccount.findUnique({
      where: { user_id: userId },
      include: {
        transactions: {
          where: { transaction_type: 'EARNED' },
          orderBy: { created_at: 'desc' },
          take: 1
        }
      }
    });

    if (!loyaltyAccount || loyaltyAccount.transactions.length === 0) {
      return { points_expired: 0 };
    }

    const lastActivity = loyaltyAccount.transactions[0].created_at;
    const expirationInfo = checkPointsExpiration(lastActivity);

    if (expirationInfo.isExpired && loyaltyAccount.points_balance > 0) {
      const pointsToExpire = loyaltyAccount.points_balance;

      // Update account
      await prisma.loyaltyAccount.update({
        where: { user_id: userId },
        data: { points_balance: 0 }
      });

      // Create expiration transaction
      await prisma.loyaltyTransaction.create({
        data: {
          loyalty_account_id: loyaltyAccount.id,
          points: -pointsToExpire,
          transaction_type: 'EXPIRED',
          description: formatTransactionDescription('EXPIRED')
        }
      });

      // Send notification
      try {
        await prisma.notification.create({
          data: {
            user_id: userId,
            title: 'Points expirés',
            message: `${pointsToExpire} points ont expiré par inactivité de 12 mois.`,
            type: 'SYSTEM'
          }
        });
      } catch (notifError) {
        console.warn('Could not create notification:', notifError.message);
      }

      console.log(`⏰ Expired ${pointsToExpire} points for user ${userId}`);
      return { points_expired: pointsToExpire };
    }

    return { points_expired: 0 };
  } catch (error) {
    console.error('Error expiring inactive points:', error);
    throw error;
  }
};

/**
 * Refund points for cancelled booking
 * @param {number} bookingId - Booking ID
 * @returns {Object} Refund result
 */
const refundPoints = async (bookingId) => {
  try {
    // Find the original earned transaction
    const originalTransaction = await prisma.loyaltyTransaction.findFirst({
      where: {
        booking_id: bookingId,
        transaction_type: 'EARNED'
      },
      include: {
        loyaltyAccount: true
      }
    });

    if (!originalTransaction) {
      return { points_refunded: 0 };
    }

    const pointsToRefund = originalTransaction.points;
    const userId = originalTransaction.loyaltyAccount.user_id;

    // Update loyalty account (remove points)
    await prisma.loyaltyAccount.update({
      where: { user_id: userId },
      data: {
        points_balance: {
          decrement: pointsToRefund
        },
        lifetime_points: {
          decrement: pointsToRefund
        }
      }
    });

    // Create refund transaction
    await prisma.loyaltyTransaction.create({
      data: {
        loyalty_account_id: originalTransaction.loyalty_account_id,
        points: -pointsToRefund,
        transaction_type: 'REFUNDED',
        description: formatTransactionDescription('REFUNDED', { reason: `Annulation réservation #${bookingId}` }),
        booking_id: bookingId
      }
    });

    // Send notification
    try {
      await prisma.notification.create({
        data: {
          user_id: userId,
          title: 'Points remboursés',
          message: `${pointsToRefund} points ont été remboursés suite à l'annulation de votre réservation.`,
          type: 'SYSTEM'
        }
      });
    } catch (notifError) {
      console.warn('Could not create notification:', notifError.message);
    }

    console.log(`💰 Refunded ${pointsToRefund} points for booking ${bookingId}`);

    return {
      points_refunded: pointsToRefund,
      user_id: userId
    };
  } catch (error) {
    console.error('Error refunding points:', error);
    throw error;
  }
};

/**
 * Get transaction history for user
 * @param {number} userId - User ID
 * @param {number} limit - Number of transactions to return
 * @returns {Array} Transaction history
 */
const getTransactionHistory = async (userId, limit = 20) => {
  try {
    const loyaltyAccount = await prisma.loyaltyAccount.findUnique({
      where: { user_id: userId }
    });

    if (!loyaltyAccount) {
      return [];
    }

    const transactions = await prisma.loyaltyTransaction.findMany({
      where: { loyalty_account_id: loyaltyAccount.id },
      orderBy: { created_at: 'desc' },
      take: limit,
      include: {
        booking: {
          select: {
            id: true,
            car: {
              select: {
                modele: true,
                brand: { select: { name: true } }
              }
            }
          }
        }
      }
    });

    return transactions.map(transaction => ({
      ...transaction,
      formatted_points: formatPoints(Math.abs(transaction.points)),
      is_positive: transaction.points > 0
    }));
  } catch (error) {
    console.error('Error getting transaction history:', error);
    throw error;
  }
};

/**
 * Award points for completed booking with bonuses
 * @param {number} userId - User ID
 * @param {number} bookingId - Booking ID
 * @param {number} bookingAmount - Booking amount in MAD
 * @param {Object} bookingDetails - Booking details for bonus calculation
 * @returns {Object} Points awarded result
 */
const awardBookingPoints = async (userId, bookingId, bookingAmount, bookingDetails = {}) => {
  try {
    // Calculate base points with tier multiplier
    const pointsCalculation = await calculatePointsEarned(bookingAmount, userId);
    let totalPoints = pointsCalculation.pointsWithMultiplier;

    // Check if this is user's first booking
    const bookingCount = await prisma.booking.count({
      where: { user_id: userId, status: 'COMPLETED' }
    });
    const isFirstBooking = bookingCount === 0;

    // Calculate bonus points
    const bonusPoints = calculateBonusPoints({
      duration_days: bookingDetails.duration_days || 1,
      ...bookingDetails
    }, isFirstBooking);

    totalPoints += bonusPoints;

    // Add points to account
    const result = await addPoints(
      userId,
      totalPoints,
      bookingId,
      `Réservation #${bookingId} (${bookingAmount} MAD)`
    );

    // Update total spent
    await prisma.loyaltyAccount.update({
      where: { user_id: userId },
      data: {
        total_spent: { increment: bookingAmount }
      }
    });

    console.log(`🎯 Awarded ${totalPoints} points to user ${userId} for booking ${bookingId}`);

    return {
      ...result,
      base_points: pointsCalculation.pointsWithMultiplier,
      bonus_points: bonusPoints,
      total_points: totalPoints,
      is_first_booking: isFirstBooking
    };
  } catch (error) {
    console.error('Error awarding booking points:', error);
    throw error;
  }
};

/**
 * Get all loyalty tiers
 * @returns {Array} All loyalty tiers
 */
const getAllTiers = async () => {
  try {
    return await prisma.loyaltyTier.findMany({
      orderBy: { min_points: 'asc' }
    });
  } catch (error) {
    console.error('Error getting all tiers:', error);
    throw error;
  }
};


/**
 * Initialize default loyalty tiers
 * @returns {Promise<void>}
 */
const initializeDefaultTiers = async () => {
  try {
    const existingTiers = await prisma.loyaltyTier.count();
    
    if (existingTiers === 0) {
      await prisma.loyaltyTier.createMany({
        data: [
          {
            name: 'Bronze',
            min_points: 0,
            max_points: 999,
            discount_percent: 5,
            points_multiplier: 1.0,
            benefits: 'Niveau de base - 5% de réduction'
          },
          {
            name: 'Argent',
            min_points: 1000,
            max_points: 2999,
            discount_percent: 10,
            points_multiplier: 1.5,
            benefits: '10% de réduction + multiplicateur x1.5'
          },
          {
            name: 'Or',
            min_points: 3000,
            max_points: 6999,
            discount_percent: 15,
            points_multiplier: 2.0,
            benefits: '15% de réduction + multiplicateur x2 + priorité'
          },
          {
            name: 'Platine',
            min_points: 7000,
            max_points: null,
            discount_percent: 20,
            points_multiplier: 3.0,
            benefits: '20% de réduction + multiplicateur x3 + surclassements gratuits + support VIP'
          }
        ]
      });
      console.log('✅ Default loyalty tiers initialized');
    }
  } catch (error) {
    console.error('Error initializing default tiers:', error);
  }
};

/**
 * Initialize default loyalty rewards
 * @returns {Promise<void>}
 */
const initializeDefaultRewards = async () => {
  try {
    const existingRewards = await prisma.loyaltyReward.count();
    
    if (existingRewards === 0) {
      await prisma.loyaltyReward.createMany({
        data: [
          {
            name: 'Réduction 10 MAD',
            description: 'Réduction de 10 MAD sur votre prochaine réservation',
            points_cost: 100,
            reward_type: 'DISCOUNT',
            reward_value: 10
          },
          {
            name: 'Réduction 25 MAD',
            description: 'Réduction de 25 MAD sur votre prochaine réservation',
            points_cost: 250,
            reward_type: 'DISCOUNT',
            reward_value: 25
          },
          {
            name: 'Réduction 50 MAD',
            description: 'Réduction de 50 MAD sur votre prochaine réservation',
            points_cost: 500,
            reward_type: 'DISCOUNT',
            reward_value: 50
          },
          {
            name: 'Surclassement gratuit',
            description: 'Surclassement gratuit vers une catégorie supérieure',
            points_cost: 750,
            reward_type: 'UPGRADE',
            reward_value: 0
          },
          {
            name: 'Assurance gratuite',
            description: 'Assurance tous risques gratuite pour votre prochaine location',
            points_cost: 1000,
            reward_type: 'INSURANCE',
            reward_value: 0
          },
          {
            name: 'Location gratuite 1 jour',
            description: 'Une journée de location gratuite (valeur max 300 MAD)',
            points_cost: 3000,
            reward_type: 'FREE_RENTAL',
            reward_value: 300
          }
        ]
      });
      console.log('✅ Default loyalty rewards initialized');
    }
  } catch (error) {
    console.error('Error initializing default rewards:', error);
  }
};

module.exports = {
  // Core functions
  createLoyaltyAccount,
  calculatePointsEarned,
  addPoints,
  redeemPoints,
  checkTierUpgrade,
  calculateDiscount,
  getUserLoyaltyInfo,
  getAvailableRewards,
  redeemReward,
  expireInactivePoints,
  refundPoints,
  getTransactionHistory,
  awardBookingPoints,
  getAllTiers,
  
  // Initialization functions
  initializeDefaultTiers,
  initializeDefaultRewards
};
