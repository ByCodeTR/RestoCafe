'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { useAuth } from '../../hooks/useAuth';

export default function TabletHomePage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user || user.role !== 'WAITER') {
      router.push('/tablet/login');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 flex flex-col">
      {/* Header */}
      <div className="flex-none p-6 text-center">
        <h1 className="text-5xl font-bold text-rose-600 mb-4">
          RestoCafe Garson Paneli
        </h1>
        {user && (
          <div className="text-2xl text-rose-500">
            Hoş geldin, <span className="font-bold text-rose-700">{user.name}</span>
          </div>
        )}
      </div>

      {/* Buttons Container - Tam ekranı kaplayan */}
      <div className="flex-1 p-8 flex flex-col gap-8">
        <Button
          className="flex-1 text-5xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 bg-gradient-to-r from-rose-400 to-rose-500 hover:from-rose-500 hover:to-rose-600 border-4 border-white min-h-[180px] text-white"
          onClick={() => router.push('/tablet/tables')}
        >
          <div className="flex flex-col items-center gap-4">
            <span className="text-8xl">🪑</span>
            <span>Masa Aç</span>
          </div>
        </Button>

        <Button
          className="flex-1 text-5xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 border-4 border-white min-h-[180px] text-white"
          onClick={() => router.push('/tablet/orders')}
        >
          <div className="flex flex-col items-center gap-4">
            <span className="text-8xl">📝</span>
            <span>Sipariş Al</span>
          </div>
        </Button>

        <Button
          className="flex-1 text-5xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 border-4 border-white min-h-[180px] text-white"
          variant="secondary"
          onClick={() => router.push('/tablet/active-tables')}
        >
          <div className="flex flex-col items-center gap-4">
            <span className="text-8xl">🔥</span>
            <span>Aktif Masalar</span>
          </div>
        </Button>
      </div>

      {/* Footer - Logout butonu */}
      <div className="flex-none p-6 text-center">
        <Button
          variant="outline"
          className="text-xl px-8 py-4 rounded-xl border-rose-300 text-rose-600 hover:bg-rose-50 mb-4"
          onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('selectedTable');
            router.push('/');
          }}
        >
          🚪 Çıkış Yap
        </Button>
        <div className="text-center">
          <p className="text-lg text-gray-600">
            © 2025 By Code Software. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </div>
  );
} 