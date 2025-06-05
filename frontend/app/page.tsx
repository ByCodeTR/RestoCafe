'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Shield, Users } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Kullanıcı kontrolü - sadece client-side'da
    try {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      if (token && user) {
        const userData = JSON.parse(user);
        if (userData.role === 'ADMIN') {
          router.push('/admin');
        } else if (userData.role === 'WAITER') {
          router.push('/tablet');
        } else if (userData.role === 'KITCHEN') {
          router.push('/kitchen');
        }
      }
    } catch (error) {
      console.error('User data parse error:', error);
    }
  }, [mounted, router]);

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  // İlk render'da basit yükleme göster
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl text-white">🍽️</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            RestoCafe
          </h1>
          <p className="text-lg text-slate-600">
            Yükleniyor...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-xl text-white">🍽️</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">RestoCafe</h1>
                <p className="text-sm text-slate-600">Restoran Yönetim Sistemi</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Ana İçerik */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-slate-800 mb-8">
            Giriş Yapın
          </h2>
          
          {/* Giriş Kartları */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            
            {/* Yönetici Paneli */}
            <button
              onClick={() => handleNavigation('/admin/login')}
              className="group bg-white hover:bg-slate-50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200 hover:border-blue-300 p-8 text-center"
            >
              <div className="w-20 h-20 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                <Shield className="w-10 h-10 text-blue-600" />
              </div>
              
              <h3 className="text-2xl font-bold text-slate-800 mb-2">
                Yönetici Paneli
              </h3>
              <p className="text-slate-600 mb-4">
                Restoran yönetimi ve raporlar
              </p>
              
              <div className="text-blue-600 group-hover:translate-y-1 transition-transform">
                <span className="font-medium">Giriş Yap →</span>
              </div>
            </button>

            {/* Garson Paneli */}
            <button
              onClick={() => handleNavigation('/tablet/login')}
              className="group bg-white hover:bg-slate-50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200 hover:border-emerald-300 p-8 text-center"
            >
              <div className="w-20 h-20 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-200 transition-colors">
                <Users className="w-10 h-10 text-emerald-600" />
              </div>
              
              <h3 className="text-2xl font-bold text-slate-800 mb-2">
                Garson Paneli
              </h3>
              <p className="text-slate-600 mb-4">
                Sipariş alma ve masa yönetimi
              </p>
              
              <div className="text-emerald-600 group-hover:translate-y-1 transition-transform">
                <span className="font-medium">Giriş Yap →</span>
              </div>
            </button>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6">
        <div className="max-w-4xl mx-auto text-center px-6">
          <p className="text-slate-800">
            © 2025 By Code Software. Tüm hakları saklıdır.
          </p>
        </div>
      </footer>
    </div>
  );
}
