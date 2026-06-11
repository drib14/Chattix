import axios from 'axios';

const isNetwork = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const API_URL = isNetwork ? import.meta.env.VITE_MOBILE_API_URL : import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
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

// Retry logic for 429 (Too Many Requests) with exponential backoff
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Handle 429 Too Many Requests with retry
    if (error.response?.status === 429 && (!config._retryCount || config._retryCount < MAX_RETRIES)) {
      config._retryCount = (config._retryCount || 0) + 1;

      // Use Retry-After header if present, otherwise exponential backoff
      const retryAfter = error.response.headers['retry-after'];
      const delayMs = retryAfter
        ? parseInt(retryAfter, 10) * 1000
        : BASE_DELAY_MS * Math.pow(2, config._retryCount - 1);

      console.warn(
        `[API] 429 rate-limited on ${config.method?.toUpperCase()} ${config.url} — retrying in ${delayMs}ms (attempt ${config._retryCount}/${MAX_RETRIES})`
      );

      await sleep(delayMs);
      return api(config);
    }

    // Handle 401 Unauthorized — force logout
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
