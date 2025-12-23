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
  createCheckoutSession: (data: any) => api.post('/payments/create-session', data),
};

export default api;
