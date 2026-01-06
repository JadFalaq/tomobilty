import apiClient, { handleApiError } from '../utils/apiClient';

export const carService = {
  async getCars(params = {}) {
    try {
      const response = await apiClient.get('/cars', { params });
      if (response.data.success) {
        return {
          success: true,
          cars: response.data.data.cars,
          pagination: response.data.data.pagination,
        };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async searchCars(params = {}) {
    try {
      const response = await apiClient.get('/cars/search', { params });
      if (response.data.success) {
        return {
          success: true,
          cars: response.data.data.cars,
          count: response.data.data.count,
        };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async getAvailableCars(params) {
    try {
      const response = await apiClient.get('/cars/available', { params });
      if (response.data.success) {
        return {
          success: true,
          cars: response.data.data.cars,
          total: response.data.data.total,
        };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async getCarById(id, params = {}) {
    try {
      const response = await apiClient.get(`/cars/${id}`, { params });
      if (response.data.success) {
        return {
          success: true,
          car: response.data.data.car,
        };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async checkAvailability(carId, dateDebut, dateFin) {
    try {
      const response = await apiClient.get(`/cars/${carId}/availability`, {
        params: {
          date_debut: dateDebut,
          date_fin: dateFin,
        },
      });
      if (response.data.success) {
        return {
          success: true,
          available: response.data.data.available,
          reason: response.data.data.reason,
        };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async getBrands() {
    try {
      const response = await apiClient.get('/cars/brands');
      if (response.data.success) {
        return {
          success: true,
          brands: response.data.data.brands,
        };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async getCategories() {
    try {
      const response = await apiClient.get('/cars/categories');
      if (response.data.success) {
        return {
          success: true,
          categories: response.data.data.categories,
        };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async getLeastDemanded(params = {}) {
    try {
      const response = await apiClient.get('/cars/least-demanded', { params });
      if (response.data.success) {
        return {
          success: true,
          cars: response.data.data.cars,
          pagination: response.data.data.pagination,
        };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },
};
