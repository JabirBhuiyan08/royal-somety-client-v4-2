// client/src/utils/api.js
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

let isRedirecting = false;
let suppressRedirect = false;

export const suppressAuthRedirect = (fn) => {
  suppressRedirect = true;
  return fn().finally(() => { suppressRedirect = false; });
};

// Attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 - don't hard redirect to prevent login loop
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !isRedirecting && !suppressRedirect) {
      isRedirecting = true;
      localStorage.removeItem('token');
      setTimeout(() => {
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        isRedirecting = false;
      }, 100);
    }
    return Promise.reject(err);
  }
);

export default api;
