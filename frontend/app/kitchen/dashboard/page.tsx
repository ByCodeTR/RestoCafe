'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/lib/api';

interface User {
  id: string;
  name: string;
  role: string;
}

interface Order {
  id: string;
  tableId: string;
  table: {
    name: string;
  };
  status: string;
  items: OrderItem[];
  createdAt: string;
}

interface OrderItem {
  id: string;
  productId: string;
  product: {
    name: string;
    description: string | null;
  };
  quantity: number;
  note: string | null;
}

export default function KitchenDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userStr || !token) {
      router.push('/kitchen/login');
      return;
    }

    const userData = JSON.parse(userStr);
    if (userData.role !== 'KITCHEN') {
      router.push('/kitchen/login');
      return;
    }

    setUser(userData);
    fetchOrders();
  }, [router]);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders/active');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Siparişler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/kitchen/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg mr-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Mutfak Paneli</h1>
                <p className="text-sm text-gray-500">Hoş geldiniz, {user?.name}</p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Çıkış Yap
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-200"
            >
              <div className="bg-gradient-to-r from-orange-500 to-red-600 px-4 py-3">
                <div className="flex justify-between items-center text-white">
                  <h3 className="text-lg font-semibold">{order.table.name}</h3>
                  <span className="text-sm opacity-90">
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
              
              <div className="p-4">
                <ul className="space-y-3">
                  {order.items.map((item) => (
                    <li key={item.id} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium text-gray-900">
                            {item.quantity}x {item.product.name}
                          </span>
                          {item.product.description && (
                            <p className="text-sm text-gray-500 mt-1">{item.product.description}</p>
                          )}
                          {item.note && (
                            <p className="text-sm text-orange-600 mt-1">Not: {item.note}</p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-orange-500 text-orange-600 hover:bg-orange-50"
                        >
                          Hazır
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {orders.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">Bekleyen Sipariş Yok</h3>
            <p className="text-gray-500 mt-2">Yeni siparişler geldiğinde burada görünecek</p>
          </div>
        )}
      </main>
    </div>
  );
} 