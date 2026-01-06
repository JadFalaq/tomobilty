import apiClient, { handleApiError } from '../utils/apiClient';

export const protectionService = {
  async getProtections() {
    try {
      const response = await apiClient.get('/protections');
      if (response.data.success) {
        return {
          success: true,
          protections: response.data.data.protections,
        };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },
};
