/**
 * Loyalty System API Service
 * Handles all loyalty-related API calls
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class LoyaltyAPI {
  constructor() {
    this.baseURL = `${API_BASE_URL}/loyalty`;
  }

  // Helper method to get auth headers
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Helper method for API calls
  async apiCall(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: this.getAuthHeaders(),
        ...options
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Get user's complete loyalty information
   * @param {number} userId - Optional user ID (defaults to current user)
   */
  async getUserLoyaltyInfo(userId = null) {
    const endpoint = userId ? `/account/${userId}` : '/account';
    return this.apiCall(endpoint);
  }

  /**
   * Calculate points for a booking amount
   * @param {number} bookingAmount - Booking amount in MAD
   * @param {number} userId - Optional user ID
   */
  async calculatePoints(bookingAmount, userId = null) {
    return this.apiCall('/calculate-points', {
      method: 'POST',
      body: JSON.stringify({ bookingAmount, userId })
    });
  }

  /**
   * Redeem points for discount
   * @param {number} points - Points to redeem
   * @param {string} description - Optional description
   */
  async redeemPoints(points, description = 'Points échangés contre réduction') {
    return this.apiCall('/redeem-points', {
      method: 'POST',
      body: JSON.stringify({ points, description })
    });
  }

  /**
   * Get available rewards for user
   */
  async getAvailableRewards() {
    return this.apiCall('/rewards');
  }

  /**
   * Redeem a specific reward
   * @param {number} rewardId - Reward ID to redeem
   */
  async redeemReward(rewardId) {
    return this.apiCall('/redeem-reward', {
      method: 'POST',
      body: JSON.stringify({ rewardId })
    });
  }

  /**
   * Get transaction history
   * @param {number} limit - Number of transactions to fetch
   */
  async getTransactionHistory(limit = 20) {
    return this.apiCall(`/transactions?limit=${limit}`);
  }

  /**
   * Get all loyalty tiers
   */
  async getAllTiers() {
    return this.apiCall('/tiers');
  }

  /**
   * Calculate discount for booking amount
   * @param {number} bookingAmount - Booking amount in MAD
   */
  async calculateDiscount(bookingAmount) {
    return this.apiCall('/calculate-discount', {
      method: 'POST',
      body: JSON.stringify({ bookingAmount })
    });
  }
}

export const loyaltyAPI = new LoyaltyAPI();
