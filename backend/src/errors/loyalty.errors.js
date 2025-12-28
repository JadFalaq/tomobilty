/**
 * Custom error classes for the loyalty system
 */

class LoyaltyError extends Error {
  constructor(message, code = 'LOYALTY_ERROR') {
    super(message);
    this.name = 'LoyaltyError';
    this.code = code;
  }
}

class InsufficientPointsError extends LoyaltyError {
  constructor(required, available) {
    super(`Points insuffisants. Requis: ${required}, Disponible: ${available}`);
    this.name = 'InsufficientPointsError';
    this.code = 'INSUFFICIENT_POINTS';
    this.required = required;
    this.available = available;
  }
}

class LoyaltyAccountNotFoundError extends LoyaltyError {
  constructor(userId) {
    super(`Compte fidélité introuvable pour l'utilisateur ${userId}`);
    this.name = 'LoyaltyAccountNotFoundError';
    this.code = 'LOYALTY_ACCOUNT_NOT_FOUND';
    this.userId = userId;
  }
}

class InvalidRewardError extends LoyaltyError {
  constructor(rewardId) {
    super(`Récompense invalide ou inactive: ${rewardId}`);
    this.name = 'InvalidRewardError';
    this.code = 'INVALID_REWARD';
    this.rewardId = rewardId;
  }
}

class ExpiredPointsError extends LoyaltyError {
  constructor(points) {
    super(`${points} points ont expiré par inactivité`);
    this.name = 'ExpiredPointsError';
    this.code = 'EXPIRED_POINTS';
    this.expiredPoints = points;
  }
}

class InvalidPointsAmountError extends LoyaltyError {
  constructor(amount) {
    super(`Montant de points invalide: ${amount}. Doit être entre 1 et 10000`);
    this.name = 'InvalidPointsAmountError';
    this.code = 'INVALID_POINTS_AMOUNT';
    this.amount = amount;
  }
}

class TierUpgradeError extends LoyaltyError {
  constructor(message) {
    super(`Erreur lors de l'upgrade de tier: ${message}`);
    this.name = 'TierUpgradeError';
    this.code = 'TIER_UPGRADE_ERROR';
  }
}

module.exports = {
  LoyaltyError,
  InsufficientPointsError,
  LoyaltyAccountNotFoundError,
  InvalidRewardError,
  ExpiredPointsError,
  InvalidPointsAmountError,
  TierUpgradeError
};
