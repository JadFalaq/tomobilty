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
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
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

export default apiClient;
