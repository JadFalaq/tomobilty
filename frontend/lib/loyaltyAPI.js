import api from './api';

export const loyaltyAPI = {
  getUserLoyaltyInfo: (userId = null) =>
    userId ? api.get(`/loyalty/account/${userId}`) : api.get('/loyalty/account'),
  calculatePoints: (bookingAmount, userId = null) =>
    api.post('/loyalty/calculate-points', { bookingAmount, userId }),
  redeemPoints: (points, description = 'Points échangés contre réduction') =>
    api.post('/loyalty/redeem-points', { points, description }),
  getAvailableRewards: () => api.get('/loyalty/rewards'),
  redeemReward: (rewardId) => api.post('/loyalty/redeem-reward', { rewardId }),
  getTransactionHistory: (limit = 20) => api.get('/loyalty/transactions', { params: { limit } }),
  getAllTiers: () => api.get('/loyalty/tiers'),
  calculateDiscount: (bookingAmount) => api.post('/loyalty/calculate-discount', { bookingAmount }),
};
