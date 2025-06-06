'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function WaiterLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', {
        username: formData.username,
        password: formData.password,
      });

      const data = response.data;

      // Kullanıcı rolünü kontrol et
      if (data.user.role === 'WAITER') {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        toast.success('Giriş başarılı! Garson paneline yönlendiriliyorsunuz...');
        router.push('/waiter/dashboard');
      } else {
        setError('Bu panele erişim yetkiniz bulunmuyor');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Giriş yapılırken bir hata oluştu');
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex flex-col justify-center items-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Garson Girişi</h1>
          <p className="text-gray-500 mt-2">RestoCafe garson paneline hoş geldiniz</p>
        </div>

        {error && (
          <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Kullanıcı Adı
            </Label>
            <Input
              id="username"
              name="username"
              type="text"
              required
              value={formData.username}
              onChange={handleChange}
              className="w-full"
              placeholder="Kullanıcı adınızı girin"
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Şifre
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full"
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center">
            <input
              id="rememberMe"
              name="rememberMe"
              type="checkbox"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              disabled={isLoading}
            />
            <Label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
              Beni hatırla
            </Label>
          </div>

          <div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Giriş yapılıyor...</span>
                </div>
              ) : (
                'Giriş Yap'
              )}
            </Button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <Button
            onClick={() => router.push('/')}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg"
          >
            🏠 Ana Sayfaya Dön
          </Button>
        </div>
      </div>
    </div>
  );
} 