'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { useAuth } from '../../hooks/useAuth';
import { io, Socket } from 'socket.io-client';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  notes?: string;
}

interface Order {
  id: string;
  status: 'PENDING' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';
  createdAt: string;
  table: {
    id: string;
    name: string;
    number?: string;
    area?: {
      name: string;
    };
  };
  items: OrderItem[];
  user: {
    name: string;
  };
}

export default function KitchenPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Mutfak personeli kontrolü
    if (!['ADMIN', 'CHEF', 'MANAGER'].includes(user.role)) {
      router.push('/');
      return;
    }

    fetchOrders();
    initializeSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user, router]);

  const initializeSocket = () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const newSocket = io('http://localhost:5000', {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('Mutfak Socket.IO bağlantısı kuruldu');
    });

    newSocket.on('newOrder', (orderData) => {
      console.log('Yeni sipariş alındı:', orderData);
      // Ses çal veya bildirim göster
      playNotificationSound();
      fetchOrders(); // Siparişleri yenile
    });

    newSocket.on('printKitchenOrder', (printData) => {
      console.log('Yazıcı verisi:', printData);
      // Burada gerçek yazıcı entegrasyonu olabilir
      printKitchenReceipt(printData);
    });

    setSocket(newSocket);
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/orders?status=active', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Siparişler yüklenirken bir hata oluştu');
      }

      const result = await response.json();
      setOrders(result.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Sipariş güncellenirken bir hata oluştu');
      }

      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Sipariş güncellenirken bir hata oluştu!');
    }
  };

  const playNotificationSound = () => {
    // Basit bildirim sesi
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmkaBS2Sw/LKeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmkaBS2Sw/LKeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmkaBS2Sw/LKeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmkaBS2Sw/LKeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmkaBS2Sw/LKeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmkaBS2Sw/LKeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmkaBS2Sw/LKeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmkaBS2Sw/LKeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmkaBQ==');
    audio.play().catch(e => console.log('Ses çalınamadı:', e));
  };

  const printKitchenReceipt = (printData: any) => {
    // Yazıcı simülasyonu - gerçek uygulamada termal yazıcı entegrasyonu olur
    const printContent = `
MUTFAK SİPARİŞİ
================
Sipariş No: ${printData.orderId}
Masa: ${printData.tableNumber}
Bölge: ${printData.areaName}
Garson: ${printData.waiter}
Saat: ${new Date(printData.createdAt).toLocaleTimeString('tr-TR')}

ÜRÜNLER:
${printData.items.map((item: any) => 
  `${item.quantity}x ${item.name}${item.notes ? ` (${item.notes})` : ''}`
).join('\n')}

================
    `;
    
    console.log('Mutfak Yazıcısı:', printContent);
    
    // Gerçek yazıcı kodu burada olacak
    // window.print() simülasyonu
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Mutfak Siparişi</title>
            <style>
              body { font-family: monospace; font-size: 12px; }
              pre { white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <pre>${printContent}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      PENDING: 'from-yellow-400 to-yellow-500',
      PREPARING: 'from-blue-400 to-blue-500',
      READY: 'from-green-400 to-green-500',
      SERVED: 'from-gray-400 to-gray-500',
      CANCELLED: 'from-red-400 to-red-500',
    };
    return colors[status as keyof typeof colors] || 'from-gray-400 to-gray-500';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      PENDING: 'Bekliyor',
      PREPARING: 'Hazırlanıyor',
      READY: 'Hazır',
      SERVED: 'Servis Edildi',
      CANCELLED: 'İptal',
    };
    return labels[status as keyof typeof labels] || status;
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-3xl text-gray-600">Siparişler yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-lg p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">🍳 Mutfak Paneli</h1>
          <div className="flex items-center gap-4">
            <Button
              onClick={fetchOrders}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
            >
              🔄 Yenile
            </Button>
            <Button
              onClick={() => router.push('/')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2"
            >
              🏠 Ana Sayfa
            </Button>
            <Button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('selectedTable');
                router.push('/');
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2"
            >
              🚪 Çıkış Yap
            </Button>
          </div>
        </div>
        <p className="text-gray-600 mt-2">Hoşgeldin, {user?.name}</p>
      </div>

      {/* Orders Grid */}
      <div className="p-6">
        {orders.length === 0 ? (
          <div className="text-center text-2xl text-gray-500 mt-20">
            Henüz aktif sipariş bulunmuyor
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-orange-400"
              >
                {/* Order Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      {order.table.name || order.table.number}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {order.table.area?.name || 'Bilinmeyen Bölge'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Garson: {order.user.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{formatTime(order.createdAt)}</p>
                  </div>
                </div>

                {/* Status */}
                <div
                  className={`mb-4 p-2 rounded-lg bg-gradient-to-r ${getStatusColor(order.status)} text-white text-center`}
                >
                  <span className="font-bold">{getStatusLabel(order.status)}</span>
                </div>

                {/* Order Items */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Siparişler:</h4>
                  <div className="space-y-1">
                    {order.items.map((item) => (
                      <div key={item.id} className="text-sm">
                        <span className="font-medium">{item.quantity}x {item.name}</span>
                        {item.notes && (
                          <p className="text-xs text-gray-600 ml-4">Not: {item.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  {order.status === 'PENDING' && (
                    <Button
                      onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      👨‍🍳 Hazırlamaya Başla
                    </Button>
                  )}
                  
                  {order.status === 'PREPARING' && (
                    <Button
                      onClick={() => updateOrderStatus(order.id, 'READY')}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      ✅ Hazır
                    </Button>
                  )}

                  <Button
                    onClick={() => printKitchenReceipt({
                      orderId: order.id,
                      tableNumber: order.table.name || order.table.number,
                      areaName: order.table.area?.name || 'Genel Salon',
                      items: order.items,
                      createdAt: order.createdAt,
                      waiter: order.user.name
                    })}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white"
                  >
                    🖨️ Fiş Yazdır
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-8 p-4">
        <div className="text-center">
          <p className="text-gray-600">
            © 2025 By Code Software. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </div>
  );
} 