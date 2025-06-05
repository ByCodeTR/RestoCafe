"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    // Cookie'lerden de kontrol et
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as { [key: string]: string });
    
    const cookieToken = cookies['token'];
    const cookieUser = cookies['user'];
    
    if ((token && user) || (cookieToken && cookieUser)) {
      try {
        const userData = user ? JSON.parse(user) : JSON.parse(cookieUser);
        if (userData.role === 'ADMIN' || userData.role === 'MANAGER') {
          // Eğer sadece cookie'lerde varsa localStorage'a da kaydet
          if (!token && cookieToken) {
            localStorage.setItem('token', cookieToken);
            localStorage.setItem('user', cookieUser);
          }
          // Eğer sadece localStorage'da varsa cookie'lere de kaydet
          if (!cookieToken && token) {
            document.cookie = `token=${token}; path=/`;
            document.cookie = `user=${user}; path=/`;
          }
          router.replace('/admin/dashboard');
        }
      } catch (err) {
        // Invalid user data, clear everything
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        document.cookie = 'user=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    console.log('Sending login request with data:', {
      username: formData.username,
      // password is omitted for security
    });

    try {
      console.log('Making API request to:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api');
      
      const response = await api.post('/auth/login', {
        username: formData.username,
        password: formData.password,
      });

      console.log('Login response received:', {
        status: response.status,
        headers: response.headers,
        data: { ...response.data, token: '[HIDDEN]' }
      });

      const data = response.data;

      // Kullanıcı rolünü kontrol et
      if (data.user.role === 'ADMIN' || data.user.role === 'MANAGER') {
        // Token ve user bilgisini localStorage'a ve cookie'ye kaydet
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Cookie'leri ayarla
        document.cookie = `token=${data.token}; path=/`;
        document.cookie = `user=${JSON.stringify(data.user)}; path=/`;

        console.log('User authenticated successfully, redirecting to dashboard...');
        toast.success('Giriş başarılı! Yönetici paneline yönlendiriliyorsunuz...');
        
        // Use router.replace instead of push to prevent back navigation
        router.replace('/admin/dashboard');
      } else {
        console.log('User role not authorized:', data.user.role);
        setError('Bu panele erişim yetkiniz bulunmuyor');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } catch (err: any) {
      console.error('Login error details:', {
        error: err,
        response: err.response ? {
          status: err.response.status,
          data: err.response.data,
          headers: err.response.headers
        } : 'No response',
        request: err.config ? {
          url: err.config.url,
          method: err.config.method,
          headers: err.config.headers
        } : 'No config'
      });
      
      setError(err.response?.data?.message || 'Giriş yapılırken bir hata oluştu');
      // Clear any existing auth data on error
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Cookie'leri temizle
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      document.cookie = 'user=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center items-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Yönetici Girişi</h1>
          <p className="text-gray-500 mt-2">RestoCafe yönetici paneline hoş geldiniz</p>
        </div>

        {error && (
          <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">Kullanıcı Adı</Label>
            <Input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full"
              placeholder="Kullanıcı adınızı girin"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Şifre</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full"
              placeholder="Şifrenizi girin"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="rememberMe"
                name="rememberMe"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                Beni Hatırla
              </label>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 rounded-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-150"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Giriş Yapılıyor...
              </div>
            ) : (
              'Giriş Yap'
            )}
          </Button>
        </form>

        {/* Ana Sayfaya Dön Butonu - Alt kısımda ortalanmış */}
        <div className="mt-8 text-center">
          <Button
            onClick={() => router.push('/')}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg"
          >
            🏠 Ana Sayfaya Dön
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-gray-600">
          © 2025 By Code Software. Tüm hakları saklıdır.
        </p>
      </div>
    </div>
  );
} 