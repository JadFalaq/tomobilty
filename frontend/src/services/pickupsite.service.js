import apiClient, { handleApiError } from '../utils/apiClient';

export const pickupSiteService = {
  async getPickupSites() {
    try {
      const response = await apiClient.get('/pickup-sites');
      if (response.data.success) {
        return {
          success: true,
          sites: response.data.data.items,
          total: response.data.data.total,
        };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },
};
