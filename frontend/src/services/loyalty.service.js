import apiClient, { handleApiError } from '../utils/apiClient';

export const loyaltyService = {
  async getTiers() {
    try {
      const response = await apiClient.get('/loyalty/tiers');
      if (response.data.success) {
        return {
          success: true,
          tiers: response.data.data.tiers,
        };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async getMyAccount() {
    try {
      const response = await apiClient.get('/loyalty/me');
      if (response.data.success) {
        return {
          success: true,
          account: response.data.data,
        };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async calculatePoints(bookingAmount, userId = null) {
    try {
      const response = await apiClient.post('/loyalty/calculate-points', {
        bookingAmount,
        userId,
      });
      if (response.data.success) {
        return {
          success: true,
          calculation: response.data.data,
        };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async redeemPoints(points, description = null) {
    try {
      const response = await apiClient.post('/loyalty/redeem-points', {
        points,
        description,
      });
      return {
        success: response.data.success,
        message: response.data.message,
        result: response.data.data,
      };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async getRewards(userId = null) {
    try {
      const params = userId ? { userId } : {};
      const response = await apiClient.get('/loyalty/rewards', { params });
      if (response.data.success) {
        return {
          success: true,
          rewards: response.data.data.rewards,
        };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async redeemReward(rewardId) {
    try {
      const response = await apiClient.post('/loyalty/redeem-reward', {
        rewardId,
      });
      return {
        success: response.data.success,
        message: response.data.message,
        result: response.data.data,
      };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async getTransactions(params = {}) {
    try {
      const response = await apiClient.get('/loyalty/transactions', { params });
      if (response.data.success) {
        return {
          success: true,
          transactions: response.data.data.transactions,
          pagination: response.data.data.pagination,
        };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async calculateDiscount(bookingAmount) {
    try {
      const response = await apiClient.post('/loyalty/calculate-discount', {
        bookingAmount,
      });
      if (response.data.success) {
        return {
          success: true,
          discount: response.data.data,
        };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },
};
