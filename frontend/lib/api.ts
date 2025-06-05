import axios from 'axios';
import { getCookie, removeCookie } from './utils';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Önce localStorage'dan kontrol et
    let token = localStorage.getItem('token');
    
    // Eğer localStorage'da yoksa cookie'den kontrol et
    if (!token) {
      token = getCookie('token');
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response) {
      // Token geçersiz veya süresi dolmuş
      if (error.response.status === 401) {
        // Token yenileme başarısız olursa çıkış yap
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        removeCookie('token');
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/admin/login';
        }
      }
      // Sunucu hatası
      else if (error.response.status === 500) {
        console.error('Sunucu hatası:', error.response.data);
      }
    }
    return Promise.reject(error);
  }
);

export default api; 