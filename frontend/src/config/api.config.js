export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3000/api'),
  PAYMENT_RETURN_URL: import.meta.env.VITE_PAYMENT_RETURN_URL || (typeof window !== 'undefined' ? `${window.location.origin}/payment/return` : 'http://localhost:5173/payment/return'),
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
};

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'tomobila_access_token',
  REFRESH_TOKEN: 'tomobila_refresh_token',
  USER: 'tomobila_user',
};

export const ERROR_CODES = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_EXISTS: 'USER_EXISTS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_REFRESH_TOKEN: 'INVALID_REFRESH_TOKEN',
  AUTH_REFRESH_REUSED: 'AUTH_REFRESH_REUSED',
  CAR_NOT_AVAILABLE: 'CAR_NOT_AVAILABLE',
  BOOKING_NOT_FOUND: 'BOOKING_NOT_FOUND',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INSUFFICIENT_POINTS: 'INSUFFICIENT_POINTS',
};
