import apiClient, { handleApiError } from '../utils/apiClient';

export const bookingService = {
  async checkAvailability(data) {
    try {
      const response = await apiClient.post('/bookings/check-availability', {
        variante_car_id: data.varianteCarId,
        date_debut: data.dateDebut,
        date_fin: data.dateFin,
      });
      if (response.data.success) {
        return {
          success: true,
          available: response.data.data.available,
        };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async calculatePrice(data) {
    try {
      const response = await apiClient.post('/bookings/calculate-price', {
        variante_car_id: data.varianteCarId,
        date_debut: data.dateDebut,
        date_fin: data.dateFin,
        insurance_id: data.insuranceId,
        additional_drivers: data.additionalDrivers,
      });
      if (response.data.success) {
        return {
          success: true,
          pricing: response.data.data,
        };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async createBooking(data) {
    try {
      const response = await apiClient.post('/bookings', {
        car_id: data.carId,
        date_debut: data.dateDebut,
        date_fin: data.dateFin,
        lieu_prise_en_charge: data.lieuPriseEnCharge,
        lieu_retour: data.lieuRetour,
        pickup_site_id: data.pickupSiteId,
        return_site_id: data.returnSiteId,
        mode_paiement: data.modePaiement,
        protection_id: data.protectionId,
        additional_drivers: data.additionalDrivers,
      });
      if (response.data.success) {
        return {
          success: true,
          booking: response.data.data,
        };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async getMyBookings(params = {}) {
    try {
      const response = await apiClient.get('/bookings/me', { params });
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

  async getBookingById(bookingId) {
    try {
      const response = await apiClient.get(`/bookings/me/${bookingId}`);
      if (response.data.success) {
        return {
          success: true,
          booking: response.data.data.booking,
        };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async cancelBooking(bookingId) {
    try {
      const response = await apiClient.delete(`/bookings/me/${bookingId}`);
      if (response.data.success) {
        return {
          success: true,
          booking: response.data.data.booking,
        };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async downloadInvoice(bookingId) {
    try {
      const response = await apiClient.get(`/bookings/me/${bookingId}/invoice`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `facture-${bookingId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return { success: true };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async applyLoyalty(bookingId, pointsToRedeem) {
    try {
      const response = await apiClient.post(`/bookings/${bookingId}/apply-loyalty`, {
        points_to_redeem: pointsToRedeem,
      });
      return { success: response.data.success };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async confirmAgencyPayment(bookingId) {
    try {
      const response = await apiClient.post(`/bookings/${bookingId}/confirm-agence`);
      return { success: response.data.success, message: response.data.message };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async getContract(bookingId) {
    try {
      const response = await apiClient.get(`/bookings/${bookingId}/contract`);
      if (response.data.success) {
        return {
          success: true,
          contract: response.data.data.contract,
        };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },
};
