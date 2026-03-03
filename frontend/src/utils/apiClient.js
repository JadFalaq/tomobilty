import axios from 'axios';
import { API_CONFIG, STORAGE_KEYS } from '../config/api.config';

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};

    const isAuthRoute =
      typeof originalRequest.url === 'string' &&
      originalRequest.url.startsWith('/auth/');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

      if (!refreshToken) {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        window.location.href = '/';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const { access, refresh } = response.data.data.tokens;
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh);

        apiClient.defaults.headers.common.Authorization = `Bearer ${access}`;
        originalRequest.headers.Authorization = `Bearer ${access}`;

        processQueue(null, access);
        isRefreshing = false;

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;

        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        window.location.href = '/';

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const handleApiError = (error) => {
  if (error.response) {
    const { data } = error.response;
    
    if (data.error) {
      return {
        code: data.error.code,
        message: data.error.message,
        details: data.details,
      };
    }
    
    return {
      code: data.code || 'UNKNOWN_ERROR',
      message: data.message || 'Une erreur est survenue',
      errors: data.errors,
    };
  }
  
  if (error.request) {
    return {
      code: 'NETWORK_ERROR',
      message: 'Impossible de contacter le serveur',
    };
  }
  
  return {
    code: 'UNKNOWN_ERROR',
    message: error.message || 'Une erreur inattendue est survenue',
  };
};

export const getImageUrl = (url) => {
  if (!url) return 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=800';
  
  // 1. If it's already an absolute external URL (Supabase, Unsplash, etc.), return it
  // But we filter out our old localhost:5000 links
  if (url.startsWith('http') && !url.includes('localhost:5000') && !url.includes('127.0.0.1:5000')) {
    return url;
  }

  // 2. If it's a relative path or an old localhost link, we need to handle it
  const backendBase = API_CONFIG.BASE_URL.replace('/api', '');
  let path = url;

  if (url.includes('://')) {
    try {
      const urlObj = new URL(url);
      path = urlObj.pathname;
    } catch (e) {
      const parts = url.split(':5000');
      path = parts.length > 1 ? parts[1] : url;
    }
  }

  // Ensure path starts with /
  if (!path.startsWith('/')) path = '/' + path;
  
  // Handle /public/uploads/ vs /uploads/
  if (path.startsWith('/public/uploads/')) {
    path = path.replace('/public/uploads/', '/uploads/');
  }
  
  // If we are in production (or if it's a relative path that should be served by backend)
  const finalUrl = `${backendBase}${path}`;
  
  // Add a cache buster for admin uploads only if it's not a cloud URL
  return url.includes('supabase.co') ? url : `${finalUrl}?t=${new Date().getTime()}`;
};

export default apiClient;
