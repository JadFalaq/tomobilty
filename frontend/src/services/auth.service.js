import apiClient, { handleApiError } from '../utils/apiClient';
import { STORAGE_KEYS } from '../config/api.config';

export const authService = {
  async register(data) {
    try {
      const response = await apiClient.post('/auth/register', {
        email: data.email,
        mot_de_passe: data.password,
        nom: data.nom,
        prenom: data.prenom,
        telephone: data.telephone,
        adresse: data.adresse,
      });
      
      if (response.data.success) {
        const { user, tokens } = response.data.data;
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.access);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        return { success: true, user, tokens };
      }
      
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async login(email, password) {
    try {
      const response = await apiClient.post('/auth/login', {
        email,
        mot_de_passe: password,
      });
      
      if (response.data.success) {
        const { user, tokens } = response.data.data;
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.access);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        return { success: true, user, tokens };
      }
      
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  },

  async getProfile() {
    try {
      const response = await apiClient.get('/auth/me');
      if (response.data.success) {
        const user = response.data.data.user;
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        return { success: true, user };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async updateProfile(data) {
    try {
      const response = await apiClient.put('/users/profile', data);
      if (response.data.success) {
        const user = response.data.data.user;
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        return { success: true, user };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async changePassword(currentPassword, newPassword) {
    try {
      const response = await apiClient.put('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      return { success: response.data.success, message: response.data.message };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async verifyEmail(token) {
    try {
      const response = await apiClient.post('/auth/verify-email', { token });
      return { success: response.data.success, message: response.data.message };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async resendVerification(email) {
    try {
      const response = await apiClient.post('/auth/resend-verification', { email });
      return { success: response.data.success, message: response.data.message };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async googleAuth(token) {
    try {
      const response = await apiClient.post('/auth/google', { token });
      if (response.data.success) {
        const { user, tokens } = response.data.data;
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.access);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        return { success: true, user, tokens };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  getCurrentUser() {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },
};
