'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { useAuth } from '../../../hooks/useAuth';

interface OrderItem {
  id: string;
  quantity: number;
  notes?: string;
  product: {
    id: string;
    name: string;
    price: number;
  };
}

interface Order {
  id: string;
  status: 'PENDING' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';
  total: number;
  createdAt: string;
  table: {
    id: string;
    name: string;
    area: {
      id: string;
      name: string;
    };
  };
  items: OrderItem[];
}

export default function TabletActiveOrdersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'WAITER') {
      router.push('/tablet/login');
      return;
    }
    fetchActiveOrders();
    
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchActiveOrders, 30000);
    return () => clearInterval(interval);
  }, [user, router]);

  const fetchActiveOrders = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/orders?status=active&include=table,items');
      if (!response.ok) {
        throw new Error('Siparişler yüklenirken bir hata oluştu');
      }
      const data = await response.json();
      setOrders(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setLoading(false);
    }
  };

  const getStatusColor = (status: Order['status']) => {
    const colors = {
      PENDING: 'from-yellow-400 to-yellow-500',
      PREPARING: 'from-blue-400 to-blue-500',
      READY: 'from-green-400 to-green-500',
      SERVED: 'from-gray-400 to-gray-500',
      CANCELLED: 'from-red-400 to-red-500',
    };
    return colors[status];
  };

  const getStatusLabel = (status: Order['status']) => {
    const labels = {
      PENDING: 'Bekliyor',
      PREPARING: 'Hazırlanıyor',
      READY: 'Hazır',
      SERVED: 'Servis Edildi',
      CANCELLED: 'İptal',
    };
    return labels[status];
  };

  const getStatusEmoji = (status: Order['status']) => {
    const emojis = {
      PENDING: '⏳',
      PREPARING: '👨‍🍳',
      READY: '🔔',
      SERVED: '✅',
      CANCELLED: '❌',
    };
    return emojis[status];
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Sipariş güncellenirken bir hata oluştu');
      }

      fetchActiveOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Sipariş güncellenirken bir hata oluştu!');
    }
  };

  const printBill = async (orderId: string, tableName: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/print-bill`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Adisyon yazdırılırken bir hata oluştu');
      }

      const result = await response.json();
      alert(`✅ ${tableName} için adisyon başarıyla yazdırıldı!`);
    } catch (error) {
      console.error('Error printing bill:', error);
      alert('❌ Adisyon yazdırılırken bir hata oluştu!');
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 flex items-center justify-center">
        <div className="text-3xl text-rose-600">Siparişler yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 flex flex-col">
      {/* Header */}
      <div className="flex-none p-6">
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={() => router.push('/tablet')}
            className="text-xl px-6 py-3 rounded-xl bg-white text-rose-600 hover:bg-rose-50"
          >
            ← Ana Sayfa
          </Button>
          <h1 className="text-4xl font-bold text-rose-600">
            Açık Masalar
          </h1>
          <Button
            onClick={fetchActiveOrders}
            className="text-xl px-6 py-3 rounded-xl bg-rose-500 text-white hover:bg-rose-600"
          >
            🔄 Yenile
          </Button>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="flex-1 p-6">
        {orders.length === 0 ? (
          <div className="text-center text-2xl text-rose-500 mt-20">
            Henüz aktif sipariş bulunmuyor
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl shadow-2xl p-6 border-2 border-rose-200"
              >
                {/* Order Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">
                      {order.table.name}
                    </h3>
                    <p className="text-lg text-gray-600">{order.table.area.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{formatTime(order.createdAt)}</p>
                    <p className="text-xl font-bold text-rose-600">₺{order.total.toFixed(2)}</p>
                  </div>
                </div>

                {/* Status */}
                <div
                  className={`mb-4 p-3 rounded-xl bg-gradient-to-r ${getStatusColor(order.status)} text-white text-center`}
                >
                  <span className="text-2xl mr-2">{getStatusEmoji(order.status)}</span>
                  <span className="text-lg font-bold">{getStatusLabel(order.status)}</span>
                </div>

                {/* Order Items */}
                <div className="mb-4 max-h-40 overflow-y-auto">
                  <h4 className="font-medium text-gray-700 mb-2">Siparişler:</h4>
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>{item.quantity}x {item.product.name}</span>
                      <span>₺{(item.product.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  {order.status === 'READY' && (
                    <Button
                      onClick={() => updateOrderStatus(order.id, 'SERVED')}
                      className="w-full h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl text-lg font-bold"
                    >
                      ✅ Servis Edildi
                    </Button>
                  )}
                  
                  {order.status === 'PENDING' && (
                    <Button
                      onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
                      className="w-full h-12 bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white rounded-xl text-lg font-bold"
                    >
                      ❌ İptal Et
                    </Button>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => printBill(order.id, order.table.name)}
                      className="h-12 bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl text-lg font-bold"
                    >
                      📄 Adisyon
                    </Button>
                    <Button
                      onClick={() => router.push(`/tablet/table-orders/${order.table.id}`)}
                      className="h-12 bg-gradient-to-r from-purple-400 to-purple-500 hover:from-purple-500 hover:to-purple-600 text-white rounded-xl text-lg font-bold"
                    >
                      📋 Detay
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Legend */}
      <div className="flex-none p-6">
        <div className="bg-white rounded-2xl p-4 shadow-lg">
          <h3 className="text-lg font-bold text-gray-800 mb-3 text-center">Sipariş Durumları</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl">⏳</span>
              <span className="text-sm text-gray-600">Bekliyor</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl">👨‍🍳</span>
              <span className="text-sm text-gray-600">Hazırlanıyor</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl">🔔</span>
              <span className="text-sm text-gray-600">Hazır</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl">✅</span>
              <span className="text-sm text-gray-600">Servis Edildi</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl">❌</span>
              <span className="text-sm text-gray-600">İptal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 