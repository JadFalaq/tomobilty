/**
 * Mock Loyalty Service for development when database is unavailable
 */

// Mock data
const mockTiers = [
  {
    id: 1,
    name: 'Bronze',
    min_points: 0,
    max_points: 999,
    discount_percent: 5,
    points_multiplier: 1.0,
    benefits: 'Niveau de base - 5% de réduction'
  },
  {
    id: 2,
    name: 'Argent',
    min_points: 1000,
    max_points: 2999,
    discount_percent: 10,
    points_multiplier: 1.5,
    benefits: '10% de réduction + multiplicateur x1.5'
  },
  {
    id: 3,
    name: 'Or',
    min_points: 3000,
    max_points: 6999,
    discount_percent: 15,
    points_multiplier: 2.0,
    benefits: '15% de réduction + multiplicateur x2 + priorité'
  },
  {
    id: 4,
    name: 'Platine',
    min_points: 7000,
    max_points: null,
    discount_percent: 20,
    points_multiplier: 3.0,
    benefits: '20% de réduction + multiplicateur x3 + surclassements gratuits + support VIP'
  }
];

const mockRewards = [
  {
    id: 1,
    name: 'Réduction 10 MAD',
    description: 'Réduction de 10 MAD sur votre prochaine réservation',
    points_cost: 100,
    reward_type: 'DISCOUNT',
    reward_value: 10,
    is_active: true
  },
  {
    id: 2,
    name: 'Réduction 25 MAD',
    description: 'Réduction de 25 MAD sur votre prochaine réservation',
    points_cost: 250,
    reward_type: 'DISCOUNT',
    reward_value: 25,
    is_active: true
  },
  {
    id: 3,
    name: 'Réduction 50 MAD',
    description: 'Réduction de 50 MAD sur votre prochaine réservation',
    points_cost: 500,
    reward_type: 'DISCOUNT',
    reward_value: 50,
    is_active: true
  },
  {
    id: 4,
    name: 'Surclassement gratuit',
    description: 'Surclassement gratuit vers une catégorie supérieure',
    points_cost: 750,
    reward_type: 'UPGRADE',
    reward_value: 0,
    is_active: true
  },
  {
    id: 5,
    name: 'Assurance gratuite',
    description: 'Assurance tous risques gratuite pour votre prochaine location',
    points_cost: 1000,
    reward_type: 'INSURANCE',
    reward_value: 0,
    is_active: true
  },
  {
    id: 6,
    name: 'Location gratuite 1 jour',
    description: 'Une journée de location gratuite (valeur max 300 MAD)',
    points_cost: 3000,
    reward_type: 'FREE_RENTAL',
    reward_value: 300,
    is_active: true
  }
];

let mockAccounts = new Map();
let mockTransactions = new Map();

// Helper functions
const getUserTier = (points) => {
  return mockTiers.find(tier => 
    points >= tier.min_points && (tier.max_points === null || points <= tier.max_points)
  ) || mockTiers[0];
};

const createMockAccount = (userId) => {
  const account = {
    id: userId,
    user_id: userId,
    points_balance: 1250, // Demo points
    lifetime_points: 1250,
    tier_id: 2,
    total_spent: 2500,
    created_at: new Date(),
    updated_at: new Date()
  };
  mockAccounts.set(userId, account);
  return account;
};

// Mock service functions
const getUserLoyaltyInfo = async (userId) => {
  let account = mockAccounts.get(userId);
  if (!account) {
    account = createMockAccount(userId);
  }

  const tier = getUserTier(account.lifetime_points);
  const nextTier = mockTiers.find(t => t.min_points > account.lifetime_points);
  
  const availableRewards = mockRewards.map(reward => ({
    ...reward,
    can_afford: account.points_balance >= reward.points_cost,
    points_needed: Math.max(0, reward.points_cost - account.points_balance)
  }));

  const transactions = mockTransactions.get(userId) || [];

  return {
    account: { ...account, tier },
    tier,
    next_tier: nextTier ? {
      next_tier: nextTier,
      points_needed: nextTier.min_points - account.lifetime_points,
      progress_percentage: (account.lifetime_points / nextTier.min_points) * 100
    } : null,
    available_rewards: availableRewards,
    transactions,
    formatted_balance: account.points_balance.toLocaleString()
  };
};

const calculatePointsEarned = async (bookingAmount, userId) => {
  let account = mockAccounts.get(userId);
  if (!account) {
    account = createMockAccount(userId);
  }

  const tier = getUserTier(account.lifetime_points);
  const basePoints = Math.floor(bookingAmount / 10);
  const pointsWithMultiplier = Math.floor(basePoints * tier.points_multiplier);

  return {
    basePoints,
    tierMultiplier: tier.points_multiplier,
    pointsWithMultiplier,
    tierName: tier.name
  };
};

const getAllTiers = async () => {
  return mockTiers;
};

const getAvailableRewards = async (userId) => {
  let account = mockAccounts.get(userId);
  if (!account) {
    account = createMockAccount(userId);
  }

  return mockRewards.map(reward => ({
    ...reward,
    can_afford: account.points_balance >= reward.points_cost,
    points_needed: Math.max(0, reward.points_cost - account.points_balance)
  }));
};

const calculateDiscount = async (userId, bookingAmount) => {
  let account = mockAccounts.get(userId);
  if (!account) {
    account = createMockAccount(userId);
  }

  const tier = getUserTier(account.lifetime_points);
  return (bookingAmount * tier.discount_percent) / 100;
};

const redeemPoints = async (userId, points, description = 'Points échangés') => {
  let account = mockAccounts.get(userId);
  if (!account) {
    account = createMockAccount(userId);
  }

  if (account.points_balance < points) {
    throw new Error('Points insuffisants');
  }

  account.points_balance -= points;
  mockAccounts.set(userId, account);

  // Add transaction
  const transactions = mockTransactions.get(userId) || [];
  transactions.unshift({
    id: Date.now(),
    points: -points,
    transaction_type: 'REDEEMED',
    description,
    created_at: new Date(),
    is_positive: false,
    formatted_points: points.toLocaleString()
  });
  mockTransactions.set(userId, transactions);

  return {
    points_redeemed: points,
    discount_amount: points / 10,
    new_balance: account.points_balance
  };
};

const redeemReward = async (userId, rewardId) => {
  const reward = mockRewards.find(r => r.id === rewardId);
  if (!reward) {
    throw new Error('Récompense introuvable');
  }

  let account = mockAccounts.get(userId);
  if (!account) {
    account = createMockAccount(userId);
  }

  if (account.points_balance < reward.points_cost) {
    throw new Error('Points insuffisants pour cette récompense');
  }

  account.points_balance -= reward.points_cost;
  mockAccounts.set(userId, account);

  // Add transaction
  const transactions = mockTransactions.get(userId) || [];
  transactions.unshift({
    id: Date.now(),
    points: -reward.points_cost,
    transaction_type: 'REDEEMED',
    description: `Échange récompense: ${reward.name}`,
    created_at: new Date(),
    is_positive: false,
    formatted_points: reward.points_cost.toLocaleString()
  });
  mockTransactions.set(userId, transactions);

  return {
    reward,
    points_used: reward.points_cost,
    new_balance: account.points_balance
  };
};

const getTransactionHistory = async (userId, limit = 20) => {
  const transactions = mockTransactions.get(userId) || [];
  return transactions.slice(0, limit);
};

const addPoints = async (userId, points, bookingId = null, description = 'Points ajoutés') => {
  let account = mockAccounts.get(userId);
  if (!account) {
    account = createMockAccount(userId);
  }

  account.points_balance += points;
  account.lifetime_points += points;
  mockAccounts.set(userId, account);

  // Add transaction
  const transactions = mockTransactions.get(userId) || [];
  transactions.unshift({
    id: Date.now(),
    points: points,
    transaction_type: 'EARNED',
    description,
    booking_id: bookingId,
    created_at: new Date(),
    is_positive: true,
    formatted_points: points.toLocaleString()
  });
  mockTransactions.set(userId, transactions);

  return {
    points_added: points,
    new_balance: account.points_balance,
    tier_upgrade: { upgraded: false }
  };
};

module.exports = {
  getUserLoyaltyInfo,
  calculatePointsEarned,
  getAllTiers,
  getAvailableRewards,
  calculateDiscount,
  redeemPoints,
  redeemReward,
  getTransactionHistory,
  addPoints
};
