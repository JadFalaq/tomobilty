const prisma = require('../config/prisma');

// Award points for booking
const awardBookingPoints = async (userId, bookingId, bookingAmount) => {
  try {
    // Calculate points (1 point per 10 MAD spent)
    const pointsToAward = Math.floor(bookingAmount / 10);
    
    if (pointsToAward <= 0) return;

    // Get or create loyalty account
    let loyaltyAccount = await prisma.loyaltyAccount.findUnique({
      where: { user_id: userId },
      include: { tier: true }
    });

    if (!loyaltyAccount) {
      // Create loyalty account with default tier (Bronze)
      loyaltyAccount = await prisma.loyaltyAccount.create({
        data: {
          user_id: userId,
          tier_id: 1, // Bronze tier
          points_balance: 0,
          total_spent: 0
        },
        include: { tier: true }
      });
    }

    // Update loyalty account
    const updatedAccount = await prisma.loyaltyAccount.update({
      where: { user_id: userId },
      data: {
        points_balance: {
          increment: pointsToAward
        },
        total_spent: {
          increment: bookingAmount
        }
      }
    });

    // Create loyalty transaction
    await prisma.loyaltyTransaction.create({
      data: {
        loyalty_account_id: loyaltyAccount.id,
        points: pointsToAward,
        transaction_type: 'EARNED',
        description: `Points gagnés pour la réservation #${bookingId}`,
        booking_id: bookingId
      }
    });

    // Check for tier upgrade
    await checkAndUpgradeTier(userId, updatedAccount.points_balance, updatedAccount.total_spent);

    return {
      points_awarded: pointsToAward,
      new_balance: updatedAccount.points_balance + pointsToAward
    };
  } catch (error) {
    console.error('Error awarding booking points:', error);
    throw error;
  }
};

// Check and upgrade tier if eligible
const checkAndUpgradeTier = async (userId, currentPoints, totalSpent) => {
  try {
    // Get all tiers ordered by min_points
    const tiers = await prisma.loyaltyTier.findMany({
      orderBy: { min_points: 'desc' }
    });

    // Find the highest tier the user qualifies for
    const eligibleTier = tiers.find(tier => currentPoints >= tier.min_points);
    
    if (!eligibleTier) return;

    // Get current loyalty account
    const loyaltyAccount = await prisma.loyaltyAccount.findUnique({
      where: { user_id: userId },
      include: { tier: true }
    });

    // Check if upgrade is needed
    if (loyaltyAccount.tier_id !== eligibleTier.id && eligibleTier.min_points > loyaltyAccount.tier.min_points) {
      // Upgrade tier
      await prisma.loyaltyAccount.update({
        where: { user_id: userId },
        data: { tier_id: eligibleTier.id }
      });

      // Create notification for tier upgrade
      await prisma.notification.create({
        data: {
          user_id: userId,
          title: 'Félicitations ! Nouveau niveau de fidélité',
          message: `Vous avez été promu au niveau ${eligibleTier.name} ! Profitez de ${eligibleTier.discount_percent}% de réduction sur vos prochaines réservations.`,
          type: 'SYSTEM'
        }
      });

      return {
        upgraded: true,
        new_tier: eligibleTier,
        old_tier: loyaltyAccount.tier
      };
    }

    return { upgraded: false };
  } catch (error) {
    console.error('Error checking tier upgrade:', error);
    throw error;
  }
};

// Redeem points for discount
const redeemPoints = async (userId, pointsToRedeem, description = 'Points utilisés') => {
  try {
    const loyaltyAccount = await prisma.loyaltyAccount.findUnique({
      where: { user_id: userId }
    });

    if (!loyaltyAccount) {
      throw new Error('Compte de fidélité non trouvé');
    }

    if (loyaltyAccount.points_balance < pointsToRedeem) {
      throw new Error('Solde de points insuffisant');
    }

    // Update points balance
    const updatedAccount = await prisma.loyaltyAccount.update({
      where: { user_id: userId },
      data: {
        points_balance: {
          decrement: pointsToRedeem
        }
      }
    });

    // Create redemption transaction
    await prisma.loyaltyTransaction.create({
      data: {
        loyalty_account_id: loyaltyAccount.id,
        points: -pointsToRedeem,
        transaction_type: 'REDEEMED',
        description
      }
    });

    return {
      points_redeemed: pointsToRedeem,
      new_balance: updatedAccount.points_balance
    };
  } catch (error) {
    console.error('Error redeeming points:', error);
    throw error;
  }
};

// Refund points for cancelled booking
const refundBookingPoints = async (userId, bookingId) => {
  try {
    // Find the original transaction
    const originalTransaction = await prisma.loyaltyTransaction.findFirst({
      where: {
        booking_id: bookingId,
        transaction_type: 'EARNED'
      },
      include: {
        loyaltyAccount: true
      }
    });

    if (!originalTransaction || originalTransaction.loyaltyAccount.user_id !== userId) {
      return; // No points to refund or wrong user
    }

    const pointsToRefund = originalTransaction.points;

    // Update loyalty account
    await prisma.loyaltyAccount.update({
      where: { user_id: userId },
      data: {
        points_balance: {
          decrement: pointsToRefund
        }
      }
    });

    // Create refund transaction
    await prisma.loyaltyTransaction.create({
      data: {
        loyalty_account_id: originalTransaction.loyalty_account_id,
        points: -pointsToRefund,
        transaction_type: 'REDEEMED',
        description: `Remboursement pour annulation de réservation #${bookingId}`,
        booking_id: bookingId
      }
    });

    return {
      points_refunded: pointsToRefund
    };
  } catch (error) {
    console.error('Error refunding booking points:', error);
    throw error;
  }
};

// Calculate discount amount based on tier
const calculateTierDiscount = async (userId, bookingAmount) => {
  try {
    const loyaltyAccount = await prisma.loyaltyAccount.findUnique({
      where: { user_id: userId },
      include: { tier: true }
    });

    if (!loyaltyAccount || !loyaltyAccount.tier.discount_percent) {
      return 0;
    }

    return (bookingAmount * loyaltyAccount.tier.discount_percent) / 100;
  } catch (error) {
    console.error('Error calculating tier discount:', error);
    return 0;
  }
};

// Get loyalty account with full details
const getLoyaltyAccount = async (userId) => {
  try {
    const loyaltyAccount = await prisma.loyaltyAccount.findUnique({
      where: { user_id: userId },
      include: {
        tier: true,
        transactions: {
          orderBy: { created_at: 'desc' },
          take: 10,
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
          }
        }
      }
    });

    if (!loyaltyAccount) {
      // Create default loyalty account
      return await prisma.loyaltyAccount.create({
        data: {
          user_id: userId,
          tier_id: 1, // Bronze tier
          points_balance: 0,
          total_spent: 0
        },
        include: {
          tier: true,
          transactions: true
        }
      });
    }

    return loyaltyAccount;
  } catch (error) {
    console.error('Error getting loyalty account:', error);
    throw error;
  }
};

// Get available rewards
const getAvailableRewards = async (userId) => {
  try {
    const loyaltyAccount = await prisma.loyaltyAccount.findUnique({
      where: { user_id: userId }
    });

    if (!loyaltyAccount) {
      return [];
    }

    // Get rewards user can afford
    const rewards = await prisma.loyaltyReward.findMany({
      where: {
        is_active: true,
        points_cost: {
          lte: loyaltyAccount.points_balance
        }
      },
      orderBy: {
        points_cost: 'asc'
      }
    });

    return rewards;
  } catch (error) {
    console.error('Error getting available rewards:', error);
    throw error;
  }
};

// Redeem a specific reward
const redeemReward = async (userId, rewardId) => {
  try {
    const reward = await prisma.loyaltyReward.findUnique({
      where: { id: rewardId }
    });

    if (!reward || !reward.is_active) {
      throw new Error('Récompense non disponible');
    }

    const loyaltyAccount = await prisma.loyaltyAccount.findUnique({
      where: { user_id: userId }
    });

    if (!loyaltyAccount || loyaltyAccount.points_balance < reward.points_cost) {
      throw new Error('Points insuffisants pour cette récompense');
    }

    // Redeem points
    await redeemPoints(userId, reward.points_cost, `Échange contre: ${reward.name}`);

    // Create notification
    await prisma.notification.create({
      data: {
        user_id: userId,
        title: 'Récompense échangée !',
        message: `Vous avez échangé ${reward.points_cost} points contre: ${reward.name}`,
        type: 'SYSTEM'
      }
    });

    return {
      reward,
      points_used: reward.points_cost
    };
  } catch (error) {
    console.error('Error redeeming reward:', error);
    throw error;
  }
};

// Initialize default tiers if they don't exist
const initializeDefaultTiers = async () => {
  try {
    const existingTiers = await prisma.loyaltyTier.count();
    
    if (existingTiers === 0) {
      await prisma.loyaltyTier.createMany({
        data: [
          {
            name: 'Bronze',
            min_points: 0,
            discount_percent: 0,
            benefits: 'Accès aux offres de base'
          },
          {
            name: 'Argent',
            min_points: 500,
            discount_percent: 5,
            benefits: '5% de réduction sur toutes les réservations'
          },
          {
            name: 'Or',
            min_points: 1500,
            discount_percent: 10,
            benefits: '10% de réduction + priorité sur les réservations'
          },
          {
            name: 'Platine',
            min_points: 3000,
            discount_percent: 15,
            benefits: '15% de réduction + surclassements gratuits + support prioritaire'
          }
        ]
      });
    }
  } catch (error) {
    console.error('Error initializing default tiers:', error);
  }
};

// Initialize default rewards
const initializeDefaultRewards = async () => {
  try {
    const existingRewards = await prisma.loyaltyReward.count();
    
    if (existingRewards === 0) {
      await prisma.loyaltyReward.createMany({
        data: [
          {
            name: 'Réduction 50 MAD',
            description: 'Réduction de 50 MAD sur votre prochaine réservation',
            points_cost: 100,
            reward_type: 'DISCOUNT',
            reward_value: 50
          },
          {
            name: 'Réduction 100 MAD',
            description: 'Réduction de 100 MAD sur votre prochaine réservation',
            points_cost: 200,
            reward_type: 'DISCOUNT',
            reward_value: 100
          },
          {
            name: 'Surclassement gratuit',
            description: 'Surclassement gratuit vers une catégorie supérieure',
            points_cost: 300,
            reward_type: 'UPGRADE',
            reward_value: 0
          },
          {
            name: 'Location gratuite 1 jour',
            description: 'Une journée de location gratuite (valeur max 300 MAD)',
            points_cost: 500,
            reward_type: 'FREE_RENTAL',
            reward_value: 300
          }
        ]
      });
    }
  } catch (error) {
    console.error('Error initializing default rewards:', error);
  }
};

// Initialize default booking statuses
const initializeDefaultBookingStatuses = async () => {
  try {
    const existingStatuses = await prisma.bookingStatus.count();
    
    if (existingStatuses === 0) {
      await prisma.bookingStatus.createMany({
        data: [
          {
            name: 'PENDING',
            description: 'En attente de confirmation'
          },
          {
            name: 'CONFIRMED',
            description: 'Réservation confirmée'
          },
          {
            name: 'IN_PROGRESS',
            description: 'Location en cours'
          },
          {
            name: 'COMPLETED',
            description: 'Location terminée'
          },
          {
            name: 'CANCELLED',
            description: 'Réservation annulée'
          },
          {
            name: 'REJECTED',
            description: 'Réservation rejetée'
          }
        ]
      });
    }
  } catch (error) {
    console.error('Error initializing default booking statuses:', error);
  }
};

module.exports = {
  awardBookingPoints,
  checkAndUpgradeTier,
  redeemPoints,
  refundBookingPoints,
  calculateTierDiscount,
  getLoyaltyAccount,
  getAvailableRewards,
  redeemReward,
  initializeDefaultTiers,
  initializeDefaultRewards,
  initializeDefaultBookingStatuses
};
