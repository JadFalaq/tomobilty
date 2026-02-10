import apiClient, { handleApiError } from '../utils/apiClient';

export const adminService = {
  async getDashboardStats() {
    try {
      const response = await apiClient.get('/admin/stats');
      if (response.data.success) {
        return { success: true, stats: response.data.data };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async listCars(params = {}) {
    try {
      const response = await apiClient.get('/admin/cars', { params });
      if (response.data.success) {
        return {
          success: true,
          cars: response.data.data.items,
          pagination: response.data.data.pagination,
        };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async getCarById(carId) {
    try {
      const response = await apiClient.get(`/admin/cars/${carId}`);
      if (response.data.success) {
        return { success: true, car: response.data.data };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async createCar(data) {
    try {
      const response = await apiClient.post('/admin/cars', data);
      if (response.data.success) {
        return { success: true, car: response.data.data };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async updateCar(carId, data) {
    try {
      const response = await apiClient.put(`/admin/cars/${carId}`, data);
      if (response.data.success) {
        return { success: true, car: response.data.data };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async deleteCar(carId) {
    try {
      const response = await apiClient.delete(`/admin/cars/${carId}`);
      return { success: response.data.success, message: response.data.message };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async listBookings(params = {}) {
    try {
      const response = await apiClient.get('/admin/bookings', { params });
      if (response.data.success) {
        return {
          success: true,
          bookings: response.data.data.items,
          pagination: response.data.data.pagination,
        };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async getBookingStatistics(params = {}) {
    try {
      const response = await apiClient.get('/bookings/admin/statistics', { params });
      if (response.data.success) {
        return { success: true, statistics: response.data.data };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async updateBookingStatus(bookingId, data) {
    try {
      const response = await apiClient.put(`/bookings/${bookingId}/status`, data);
      if (response.data.success) {
        return { success: true, booking: response.data.data.booking };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async updateBooking(bookingId, data) {
    try {
      const response = await apiClient.put(`/admin/bookings/${bookingId}`, data);
      if (response.data.success) {
        return { success: true, booking: response.data.data };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async listCarBrands(params = {}) {
    try {
      const response = await apiClient.get('/admin/car-brands', { params });
      if (response.data.success) {
        return {
          success: true,
          brands: response.data.data.items,
          pagination: response.data.data.pagination,
        };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async listCarCategories(params = {}) {
    try {
      const response = await apiClient.get('/admin/car-categories', { params });
      if (response.data.success) {
        return {
          success: true,
          categories: response.data.data.items,
          pagination: response.data.data.pagination,
        };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async listBookingStatuses(params = {}) {
    try {
      const response = await apiClient.get('/admin/booking-statuses', { params });
      if (response.data.success) {
        return {
          success: true,
          statuses: response.data.data.items,
          pagination: response.data.data.pagination,
        };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async listPayments(params = {}) {
    try {
      const response = await apiClient.get('/admin/payments', { params });
      if (response.data.success) {
        return {
          success: true,
          payments: response.data.data.items,
          pagination: response.data.data.pagination,
        };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async listCarImages(params = {}) {
    try {
      const response = await apiClient.get('/admin/car-images', { params });
      if (response.data.success) {
        return {
          success: true,
          images: response.data.data.items,
          pagination: response.data.data.pagination,
        };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async createCarImage(data) {
    try {
      const response = await apiClient.post('/admin/car-images', data);
      if (response.data.success) {
        return { success: true, image: response.data.data };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async deleteCarImage(imageId) {
    try {
      const response = await apiClient.delete(`/admin/car-images/${imageId}`);
      return { success: response.data.success, message: response.data.message };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },
};
