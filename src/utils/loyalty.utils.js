/**
 * Utility functions for the loyalty system
 */

/**
 * Calculate tier multiplier based on tier name
 * @param {string} tierName - Name of the tier (Bronze, Argent, Or, Platine)
 * @returns {number} Multiplier for points calculation
 */
const calculateTierMultiplier = (tierName) => {
  const multipliers = {
    'Bronze': 1,
    'Argent': 1.5,
    'Or': 2,
    'Platine': 3
  };
  return multipliers[tierName] || 1;
};

/**
 * Format points for display
 * @param {number} points - Number of points
 * @returns {string} Formatted points string
 */
const formatPoints = (points) => {
  if (points >= 1000000) {
    return `${(points / 1000000).toFixed(1)}M pts`;
  } else if (points >= 1000) {
    return `${(points / 1000).toFixed(1)}K pts`;
  }
  return `${points} pts`;
};

/**
 * Calculate points needed to reach next tier
 * @param {number} currentPoints - Current points balance
 * @param {number} currentTierId - Current tier ID
 * @param {Array} tiers - Array of tier objects
 * @returns {Object} Next tier info and points needed
 */
const calculatePointsToNextTier = (currentPoints, currentTierId, tiers) => {
  const sortedTiers = tiers.sort((a, b) => a.min_points - b.min_points);
  const currentTierIndex = sortedTiers.findIndex(tier => tier.id === currentTierId);
  
  if (currentTierIndex === -1 || currentTierIndex === sortedTiers.length - 1) {
    return {
      nextTier: null,
      pointsNeeded: 0,
      isMaxTier: true
    };
  }
  
  const nextTier = sortedTiers[currentTierIndex + 1];
  const pointsNeeded = Math.max(0, nextTier.min_points - currentPoints);
  
  return {
    nextTier,
    pointsNeeded,
    isMaxTier: false
  };
};

/**
 * Convert points to money (MAD)
 * @param {number} points - Number of points
 * @returns {number} Money amount in MAD
 */
const pointsToMoney = (points) => {
  return points / 10; // 100 points = 10 MAD
};

/**
 * Convert money (MAD) to points
 * @param {number} amount - Money amount in MAD
 * @returns {number} Number of points
 */
const moneyToPoints = (amount) => {
  return Math.floor(amount / 10); // 10 MAD = 1 point
};

/**
 * Calculate points earned from booking amount
 * @param {number} bookingAmount - Booking amount in MAD
 * @param {number} tierMultiplier - Tier multiplier
 * @returns {number} Points earned
 */
const calculateBasePoints = (bookingAmount, tierMultiplier = 1) => {
  const basePoints = moneyToPoints(bookingAmount);
  return Math.floor(basePoints * tierMultiplier);
};

/**
 * Check if points amount is valid
 * @param {number} points - Points amount to validate
 * @returns {boolean} True if valid
 */
const isValidPointsAmount = (points) => {
  return Number.isInteger(points) && points >= 0 && points <= 10000;
};

/**
 * Calculate bonus points for special conditions
 * @param {Object} booking - Booking object
 * @param {boolean} isFirstBooking - Is this the user's first booking
 * @returns {number} Bonus points
 */
const calculateBonusPoints = (booking, isFirstBooking = false) => {
  let bonusPoints = 0;
  
  // First booking bonus
  if (isFirstBooking) {
    bonusPoints += 500;
  }
  
  // Long booking bonuses
  if (booking.duration_days >= 30) {
    bonusPoints += 500; // 30+ days bonus
  } else if (booking.duration_days >= 7) {
    bonusPoints += 100; // 7+ days bonus
  }
  
  return bonusPoints;
};

/**
 * Determine tier based on points
 * @param {number} points - Current points
 * @param {Array} tiers - Array of tier objects
 * @returns {Object} Tier object
 */
const determineTierByPoints = (points, tiers) => {
  const sortedTiers = tiers.sort((a, b) => b.min_points - a.min_points);
  
  for (const tier of sortedTiers) {
    if (points >= tier.min_points) {
      return tier;
    }
  }
  
  // Return lowest tier if no match
  return tiers.find(tier => tier.min_points === 0) || tiers[0];
};

/**
 * Format transaction description
 * @param {string} type - Transaction type
 * @param {Object} details - Additional details
 * @returns {string} Formatted description
 */
const formatTransactionDescription = (type, details = {}) => {
  const descriptions = {
    'EARNED': `Points gagnés - ${details.source || 'Réservation'}`,
    'REDEEMED': `Points échangés - ${details.reason || 'Réduction'}`,
    'EXPIRED': `Points expirés - Inactivité de 12 mois`,
    'BONUS': `Bonus - ${details.reason || 'Upgrade de tier'}`,
    'REFUNDED': `Points remboursés - ${details.reason || 'Annulation réservation'}`
  };
  
  return descriptions[type] || `Transaction - ${type}`;
};

/**
 * Calculate loyalty discount percentage
 * @param {Object} tier - Tier object
 * @returns {number} Discount percentage (0-100)
 */
const calculateLoyaltyDiscount = (tier) => {
  return parseFloat(tier.discount_percent) || 0;
};

/**
 * Check if points are about to expire
 * @param {Date} lastActivity - Last activity date
 * @param {number} warningDays - Days before expiration to warn (default: 7)
 * @returns {Object} Expiration info
 */
const checkPointsExpiration = (lastActivity, warningDays = 7) => {
  const now = new Date();
  const expirationDate = new Date(lastActivity);
  expirationDate.setFullYear(expirationDate.getFullYear() + 1); // 12 months
  
  const daysUntilExpiration = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24));
  
  return {
    isExpired: daysUntilExpiration <= 0,
    isExpiringSoon: daysUntilExpiration <= warningDays && daysUntilExpiration > 0,
    daysUntilExpiration: Math.max(0, daysUntilExpiration),
    expirationDate
  };
};

/**
 * Validate reward redemption
 * @param {Object} reward - Reward object
 * @param {number} userPoints - User's current points
 * @returns {Object} Validation result
 */
const validateRewardRedemption = (reward, userPoints) => {
  return {
    isValid: reward.is_active && userPoints >= reward.points_cost,
    canAfford: userPoints >= reward.points_cost,
    isActive: reward.is_active,
    pointsNeeded: Math.max(0, reward.points_cost - userPoints)
  };
};

module.exports = {
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
};
