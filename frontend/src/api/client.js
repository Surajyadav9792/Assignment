import axios from 'axios';

let baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
if (baseURL.startsWith('http') && !baseURL.includes('/api/v1')) {
  baseURL = baseURL.replace(/\/+$/, '') + '/api/v1';
}

export const apiClient = axios.create({
  baseURL,
  timeout: 30000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('ff_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ff_token');
      localStorage.removeItem('ff_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?expired=1';
      }
    }
    return Promise.reject(err);
  }
);
