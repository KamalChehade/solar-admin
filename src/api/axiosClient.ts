import axios, { InternalAxiosRequestConfig } from 'axios';

const API_BASE = import.meta.env.VITE_Api_URL || '';

const axiosClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token from localStorage if present
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    try {
      const token = localStorage.getItem('solar_token_v1');
      if (token) {
        config.headers = {
          ...(config.headers as Record<string, string>),
          Authorization: `Bearer ${token}`,
        } as any;
      }
    } catch (e) {
      // ignore
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosClient;
