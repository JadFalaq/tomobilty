import axios from 'axios';

let HAS_WARNED_BASE_URL = false;
function computeBaseURL() {
  const raw = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_API_URL : undefined;
  let url = (raw && raw.trim().length ? raw.trim() : 'http://localhost:5000/api');
  if (!raw && process.env.NODE_ENV === 'development' && !HAS_WARNED_BASE_URL) {
    console.warn('NEXT_PUBLIC_API_URL missing. Using default http://localhost:5000/api');
    HAS_WARNED_BASE_URL = true;
  }
  url = url.replace(/\/+$/, '');
  url = url.endsWith('/api') ? url : (url.endsWith('/') ? `${url}api` : `${url}/api`);
  return url;
}

const api = axios.create({
  baseURL: computeBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dev-only baseURL visibility
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line no-console
  console.log('[API BASE URL]', (api as any).defaults?.baseURL);
}

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
    if (process.env.NODE_ENV === 'development') {
      const status = error?.response?.status;
      const url = error?.config?.url;
      // Log URL and status to help debug fetch failures
      console.error(`[API ERROR] ${status} on ${url}`);
    }
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

// API Loyalty
export const fideliteAPI = {
  obtenirMonCompte: () => api.get('/loyalty/me'),
};

// API Voitures
export const voituresAPI = {
  obtenirVoitures: (params?: any) => api.get('/cars', { params }),
  obtenirVoitureParId: (id: string) => api.get(`/cars/${id}`),
  verifierDisponibilite: (id: string, data: any) => api.get(`/cars/${id}/availability`, { params: data }),
  obtenirVoituresDisponibles: async (params?: any) => {
    const path = '/cars/available';
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('[AVAILABLE CARS] URL:', `${(api as any).defaults?.baseURL}${path}`, 'params:', params);
    }
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
  obtenirSitesRetrait: async () => {
    const path = '/pickup-sites';
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('[PICKUP SITES] URL:', `${(api as any).defaults?.baseURL}${path}`);
    }
    return api.get(path);
  },
};

// API Réservations
export const reservationsAPI = {
  creerReservation: (data: any) => api.post('/bookings', data),
  confirmerReservation: (id: string, data: any) => api.put(`/bookings/${id}/confirm`, data),
  confirmerAgence: (id: string, data: any) => api.post(`/bookings/${id}/confirm-agence`, data),
  obtenirDevis: (data: any) => api.post('/bookings/quote', data),
  obtenirMesReservations: (params?: any) => api.get('/bookings/me', { params }),
  obtenirToutesReservations: (params?: any) => api.get('/bookings/admin/all', { params }),
  obtenirReservationParId: (id: string) => api.get(`/bookings/me/${id}`),
  annulerReservation: (id: string) => api.delete(`/bookings/me/${id}`),
  telechargerFacture: (id: string) => api.get(`/bookings/me/${id}/invoice`, { responseType: 'blob' }),
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

// API Admin (limité aux usages actuels du frontend)
export const adminAPI = {
  obtenirVoitures: (params?: any) => api.get('/admin/cars', { params }),
  obtenirMarques: (params?: any) => api.get('/admin/car-brands', { params }),
  obtenirReservations: (params?: any) => api.get('/admin/bookings', { params }),
  obtenirComptesFidelite: (params?: any) => api.get('/admin/loyalty/accounts', { params }),
};

// API Protections
export const protectionsAPI = {
  getAll: () => api.get('/protections'),
};
export default api;
