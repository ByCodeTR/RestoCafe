'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/hooks/useAuth';

export default function TabletHomePage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user || user.role !== 'WAITER') {
      router.push('/tablet/login');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-center text-primary mb-8">
          RestoCafe Garson Paneli
        </h1>

        <Button
          className="w-full h-24 text-xl"
          onClick={() => router.push('/tablet/tables')}
        >
          🪑 Masa Aç
        </Button>

        <Button
          className="w-full h-24 text-xl"
          onClick={() => router.push('/tablet/orders')}
        >
          📝 Sipariş Al
        </Button>

        <Button
          className="w-full h-24 text-xl"
          variant="secondary"
          onClick={() => router.push('/tablet/active-orders')}
        >
          🔔 Açık Masalar
        </Button>
      </div>
    </div>
  );
} 