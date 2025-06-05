'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { useAuth } from '../../../../hooks/useAuth';
import { toast } from 'sonner';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  note?: string;
  product: {
    id: string;
    name: string;
    price: number;
  };
}

interface Order {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
  user: {
    id: string;
    name: string;
  };
}

interface Table {
  id: string;
  name: string;
  number: string;
  capacity: number;
  status: string;
  totalAmount: number;
  area: {
    id: string;
    name: string;
  };
}

export default function TableOrdersPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [table, setTable] = useState<Table | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const tableId = params?.tableId as string;

  useEffect(() => {
    if (!user || user.role !== 'WAITER') {
      router.push('/tablet/login');
      return;
    }
    if (tableId) {
      fetchTableOrders();
    }
  }, [user, router, tableId]);

  const fetchTableOrders = async () => {
    try {
      setLoading(true);

      // Masa bilgilerini al
      const tableResponse = await fetch(`http://localhost:5000/api/tables/${tableId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!tableResponse.ok) {
        throw new Error('Masa bilgileri alınamadı');
      }

      const tableData = await tableResponse.json();
      setTable(tableData.data);

      // Masanın siparişlerini al
      const ordersResponse = await fetch(`http://localhost:5000/api/orders?table.id=${tableId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!ordersResponse.ok) {
        throw new Error('Siparişler alınamadı');
      }

      const ordersData = await ordersResponse.json();
      
      // Sadece aktif siparişleri filtrele
      const activeOrders = ordersData.data.filter((order: Order) => 
        order.status !== 'PAID' && order.status !== 'CANCELLED'
      );
      
      setOrders(activeOrders);

    } catch (error) {
      console.error('Veri alınırken hata:', error);
      toast.error('Sipariş bilgileri alınamadı');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    });
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'PENDING': 'Bekliyor',
      'PREPARING': 'Hazırlanıyor',
      'READY': 'Hazır',
      'COMPLETED': 'Tamamlandı',
      'PAID': 'Ödendi',
      'CANCELLED': 'İptal'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'PENDING': 'bg-yellow-500',
      'PREPARING': 'bg-blue-500',
      'READY': 'bg-green-500',
      'COMPLETED': 'bg-purple-500',
      'PAID': 'bg-emerald-500',
      'CANCELLED': 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const handleAddOrder = () => {
    if (table) {
      // Masayı seç ve sipariş sayfasına git
      localStorage.setItem('selectedTable', JSON.stringify(table));
      router.push('/tablet/orders');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 flex items-center justify-center">
        <div className="text-3xl text-rose-600">Siparişler yükleniyor...</div>
      </div>
    );
  }

  if (!table) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl text-rose-600 mb-4">Masa bulunamadı</div>
          <Button
            onClick={() => router.push('/tablet/tables')}
            className="bg-rose-500 hover:bg-rose-600 text-white"
          >
            Masalara Dön
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={() => router.push('/tablet/tables')}
            className="text-xl px-6 py-3 rounded-xl bg-white text-rose-600 hover:bg-rose-50"
          >
            ← Masalara Dön
          </Button>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-rose-600">
              {table.area.name} - {table.name}
            </h1>
            <p className="text-lg text-rose-500">
              {table.capacity} Kişilik • Toplam: {formatPrice(table.totalAmount)}
            </p>
          </div>
          <Button
            onClick={handleAddOrder}
            className="text-xl px-6 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white"
          >
            + Sipariş Ekle
          </Button>
        </div>
      </div>

      {/* Orders List */}
      <div className="px-6">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-3xl text-rose-400 mb-4">📋</div>
            <div className="text-xl text-rose-600 mb-4">Bu masada aktif sipariş bulunmuyor</div>
            <Button
              onClick={handleAddOrder}
              className="bg-rose-500 hover:bg-rose-600 text-white text-lg px-8 py-3"
            >
              İlk Siparişi Ver
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl shadow-lg p-6">
                {/* Order Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`${getStatusColor(order.status)} text-white px-4 py-2 rounded-full text-sm font-medium`}>
                      {getStatusLabel(order.status)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-rose-600">
                      {formatPrice(order.total)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Garson: {order.user.name}
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="bg-rose-100 text-rose-600 font-bold rounded-full w-8 h-8 flex items-center justify-center text-sm">
                            {item.quantity}
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">{item.name}</div>
                            {item.note && (
                              <div className="text-sm text-gray-500 italic">Not: {item.note}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-800">
                          {formatPrice(item.price)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatPrice(item.price * item.quantity)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Toplam {order.items.reduce((sum, item) => sum + item.quantity, 0)} ürün
                    </div>
                    <div className="text-lg font-bold text-rose-600">
                      {formatPrice(order.total)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Footer */}
      {orders.length > 0 && (
        <div className="mt-8 mb-6 px-6">
          <div className="bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-2xl p-6">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-lg font-medium">Masa Toplamı</div>
                <div className="text-sm opacity-90">
                  {orders.length} sipariş • {orders.reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)} ürün
                </div>
              </div>
              <div className="text-3xl font-bold">
                {formatPrice(table.totalAmount)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 