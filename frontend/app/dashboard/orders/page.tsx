'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

// Tip tanımlamaları
interface OrderItem {
  id: string;
  product: {
    id: string;
    name: string;
  };
  quantity: number;
  price: number;
  note?: string;
}

interface Order {
  id: string;
  table: {
    id: string;
    name: string;
  };
  items: OrderItem[];
  status: 'NEW' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';
  total: number;
  note?: string;
  createdAt: string;
}

// Sipariş durumu renkleri
const statusColors = {
  NEW: 'bg-blue-500',
  PREPARING: 'bg-yellow-500',
  READY: 'bg-green-500',
  DELIVERED: 'bg-purple-500',
  CANCELLED: 'bg-red-500'
};

// Sipariş durumu Türkçe karşılıkları
const statusLabels = {
  NEW: 'Yeni',
  PREPARING: 'Hazırlanıyor',
  READY: 'Hazır',
  DELIVERED: 'Teslim Edildi',
  CANCELLED: 'İptal'
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();
  const { toast } = useToast();
  const router = useRouter();

  // Siparişleri getir
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.replace('/admin/login');
        return;
      }
      
      const response = await api.get('/orders', {
        params: selectedStatus ? { status: selectedStatus } : undefined
      });
      
      setOrders(response.data);
    } catch (error: any) {
      console.error('Siparişler alınamadı:', error);
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: error.response?.data?.message || 'Siparişler alınamadı'
      });
    } finally {
      setLoading(false);
    }
  };

  // Sipariş durumunu güncelle
  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      await fetchOrders();
      
      toast({
        title: 'Başarılı',
        description: 'Sipariş durumu güncellendi'
      });
    } catch (error: any) {
      console.error('Sipariş durumu güncelleme hatası:', error);
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: error.response?.data?.message || 'Sipariş durumu güncellenemedi'
      });
    }
  };

  // Siparişi iptal et
  const cancelOrder = async (orderId: string) => {
    try {
      await api.patch(`/orders/${orderId}/cancel`);
      await fetchOrders();
      
      toast({
        title: 'Başarılı',
        description: 'Sipariş iptal edildi'
      });
    } catch (error: any) {
      console.error('Sipariş iptal hatası:', error);
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: error.response?.data?.message || 'Sipariş iptal edilemedi'
      });
    }
  };

  // Socket.IO event listener'ları
  useEffect(() => {
    if (!socket) return;

    // Admin odasına katıl
    socket.emit('join-admin');

    // Yeni sipariş geldiğinde
    socket.on('newOrder', (data) => {
      toast({
        title: 'Yeni Sipariş!',
        description: `Masa ${data.order.table.name}'dan yeni sipariş geldi`,
        duration: 5000
      });
      // Ses çal
      new Audio('/sounds/notification.mp3').play().catch(console.error);
      fetchOrders();
    });

    // Sipariş durumu güncellendiğinde
    socket.on('orderStatusUpdated', () => {
      fetchOrders();
    });

    // Sipariş iptal edildiğinde
    socket.on('orderCancelled', () => {
      fetchOrders();
    });

    return () => {
      socket.off('newOrder');
      socket.off('orderStatusUpdated');
      socket.off('orderCancelled');
    };
  }, [socket]);

  // İlk yükleme ve durum değişikliklerinde siparişleri getir
  useEffect(() => {
    fetchOrders();
  }, [selectedStatus]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Siparişler</h1>
        
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tüm Durumlar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tüm Durumlar</SelectItem>
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Henüz sipariş bulunmuyor.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Masa {order.table.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {format(new Date(order.createdAt), 'dd MMMM yyyy HH:mm', { locale: tr })}
                    </p>
                  </div>
                  <Badge className={statusColors[order.status]}>
                    {statusLabels[order.status]}
                  </Badge>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ürün</TableHead>
                      <TableHead className="text-right">Miktar</TableHead>
                      <TableHead className="text-right">Fiyat</TableHead>
                      <TableHead>Not</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.product.name}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          ₺{(item.price * item.quantity).toFixed(2)}
                        </TableCell>
                        <TableCell>{item.note || '-'}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={2} className="text-right font-bold">
                        Toplam:
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        ₺{order.total.toFixed(2)}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>

                {order.note && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold">Sipariş Notu:</p>
                    <p className="text-sm text-gray-600">{order.note}</p>
                  </div>
                )}

                <div className="flex justify-end gap-2 mt-4">
                  {order.status === 'NEW' && (
                    <Button
                      onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                      className="bg-yellow-500 hover:bg-yellow-600"
                    >
                      Hazırlanıyor
                    </Button>
                  )}
                  
                  {order.status === 'PREPARING' && (
                    <Button
                      onClick={() => updateOrderStatus(order.id, 'READY')}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      Hazır
                    </Button>
                  )}
                  
                  {order.status === 'READY' && (
                    <Button
                      onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
                      className="bg-purple-500 hover:bg-purple-600"
                    >
                      Teslim Edildi
                    </Button>
                  )}

                  {['NEW', 'PREPARING'].includes(order.status) && (
                    <Button
                      onClick={() => cancelOrder(order.id)}
                      variant="destructive"
                    >
                      İptal Et
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 