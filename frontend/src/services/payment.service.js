import apiClient, { handleApiError } from '../utils/apiClient';

export const paymentService = {
  async createPayment(data) {
    try {
      const response = await apiClient.post('/payments/create', {
        booking_id: data.bookingId,
        amount: data.amount,
        currency: data.currency || 'MAD',
        provider: data.provider,
      });
      if (response.data.success) {
        return {
          success: true,
          payment: response.data.data,
        };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async getPaymentById(paymentId) {
    try {
      const response = await apiClient.get(`/payments/${paymentId}`);
      if (response.data.success) {
        return {
          success: true,
          payment: response.data.data.payment,
          providerDetails: response.data.data.provider_details,
          metadata: response.data.data.metadata,
        };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async getBookingPayments(bookingId) {
    try {
      const response = await apiClient.get(`/payments/booking/${bookingId}`);
      if (response.data.success) {
        return {
          success: true,
          payments: response.data.data.payments,
        };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async cancelPayment(paymentId) {
    try {
      const response = await apiClient.post(`/payments/${paymentId}/cancel`);
      return {
        success: response.data.success,
        message: response.data.message,
        payment: response.data.data?.payment,
      };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async getProviderInfo() {
    try {
      const response = await apiClient.get('/payments/providers/info');
      if (response.data.success) {
        return {
          success: true,
          currentProvider: response.data.data.current_provider,
          availableProviders: response.data.data.available_providers,
        };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },
};
