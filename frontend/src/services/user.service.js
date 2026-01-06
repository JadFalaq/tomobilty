import apiClient, { handleApiError } from '../utils/apiClient';

export const userService = {
  async getProfile() {
    try {
      const response = await apiClient.get('/users/profile');
      if (response.data.success) {
        return {
          success: true,
          user: response.data.data.user,
        };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async updateProfile(data = {}) {
    try {
      const response = await apiClient.put('/users/profile', data);
      return {
        success: response.data.success,
        message: response.data.message,
        user: response.data.data?.user,
      };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },
};
