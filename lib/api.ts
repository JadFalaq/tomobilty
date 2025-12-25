import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Créer une instance axios avec configuration de base
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/connexion')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/connexion';
    }
    return Promise.reject(error);
  }
);

// API Auth
export const authAPI = {
  inscription: (data: any) => api.post('/auth/inscription', data),
  connexion: (data: any) => api.post('/auth/connexion', data),
  obtenirProfil: () => api.get('/auth/me'),
  mettreAJourProfil: (data: any) => api.put('/auth/profile', data),
  oauthGoogle: (data: any) => api.post('/auth/oauth/google', data),
  startPhone: (data: any) => api.post('/auth/phone/start', data),
  verifyPhone: (data: any) => api.post('/auth/phone/verify', data),
};

// API Voitures
export const voituresAPI = {
  obtenirVoitures: (params?: any) => api.get('/cars', { params }),
  obtenirVoitureParId: (id: string) => api.get(`/cars/${id}`),
  verifierDisponibilite: (id: string, data: any) => api.get(`/cars/${id}/availability`, { params: data }),
  obtenirVoituresDisponibles: async (params?: any) => {
    const path = '/cars/available';
    const fullUrl = `${API_URL}${path}?${new URLSearchParams(params || {}).toString()}`;
    console.log('[AVAILABLE CARS] Request:', params);
    console.log('[AVAILABLE CARS] URL:', fullUrl);
    try {
      const res = await api.get(path, { params });
      return res;
    } catch (error: any) {
      console.error('[AVAILABLE CARS] Error status:', error?.response?.status);
      console.error('[AVAILABLE CARS] Error body:', error?.response?.data);
      console.error('[AVAILABLE CARS] Error details:', error?.response?.data?.errors);
      console.error('[AVAILABLE CARS] Error message:', error?.message);
      console.error('[AVAILABLE CARS] Error url:', error?.config?.url);
      throw error;
    }
  },
  creerVoiture: (data: any) => api.post('/cars', data),
  mettreAJourVoiture: (id: string, data: any) => api.put(`/cars/${id}`, data),
  supprimerVoiture: (id: string) => api.delete(`/cars/${id}`),
};

// API Réservations
export const reservationsAPI = {
  creerReservation: (data: any) => api.post('/bookings', data),
  confirmerReservation: (id: string, data: any) => api.put(`/bookings/${id}/confirm`, data),
  obtenirMesReservations: () => api.get('/bookings'),
  obtenirToutesReservations: (params?: any) => api.get('/bookings/admin', { params }),
  obtenirReservationParId: (id: string) => api.get(`/bookings/${id}`),
  annulerReservation: (id: string) => api.put(`/bookings/${id}/cancel`),
  mettreAJourStatut: (id: string, data: any) => api.put(`/bookings/${id}/status`, data),
};

// API Paiements
export const paymentsAPI = {
  // Nouvelle API multi-provider
  createPaymentSession: (data: any) => api.post('/payments/create', data),
  getPaymentById: (id: string) => api.get(`/payments/${id}`),
  getPaymentsByBooking: (bookingId: string) => api.get(`/payments/booking/${bookingId}`),
  cancelPayment: (id: string) => api.post(`/payments/${id}/cancel`),
  createRefund: (id: string, data: any) => api.post(`/payments/${id}/refund`, data),
  getProvidersInfo: () => api.get('/payments/providers/info'),
  
  // Legacy support (à supprimer plus tard)
  createCheckoutSession: (data: any) => api.post('/payments/create-session', data),
};

// API Protections
export const protectionsAPI = {
  getAll: () => api.get('/protections'),
};
export default api;
