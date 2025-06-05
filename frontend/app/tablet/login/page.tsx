'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { useToast } from "../../../components/ui/use-toast";
import { useAuth } from '../../../hooks/useAuth';
import api from '../../../lib/api';

export default function TabletLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        username,
        password,
      });

      if (response.data.user.role !== 'WAITER') {
        toast({
          title: "Hata",
          description: "Bu giriş sadece garsonlar içindir.",
          variant: "destructive",
        });
        return;
      }

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      login(response.data.token, response.data.user);
      
      router.push('/tablet');
    } catch (error: any) {
      toast({
        title: "Giriş Başarısız",
        description: error.response?.data?.message || "Kullanıcı adı veya şifre hatalı",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary">RestoCafe</h1>
          <p className="mt-2 text-xl">Garson Girişi</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Kullanıcı Adı"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-14 text-lg"
              required
            />
          </div>

          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Şifre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 text-lg"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full h-14 text-lg"
            disabled={loading}
          >
            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
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
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-gray-600">
          © 2025 By Code Software. Tüm hakları saklıdır.
        </p>
      </div>
    </div>
  );
} 