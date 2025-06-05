'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

interface Category {
  id: number;
  name: string;
}

interface MenuItem {
  id: number;
  name: string;
  price: number;
  categoryId: number;
}

interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  notes: string;
}

interface Table {
  id: number;
  name: string;
  area: {
    name: string;
  };
}

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const tableId = searchParams.get('tableId');

  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [table, setTable] = useState<Table | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Ses efekti için
  const playNotificationSound = () => {
    const audio = new Audio('/notification.mp3');
    audio.play().catch(console.error);
  };

  useEffect(() => {
    if (!user || user.role !== 'WAITER') {
      router.push('/tablet/login');
      return;
    }

    if (!tableId) {
      router.push('/tablet/tables');
      return;
    }

    const fetchData = async () => {
      try {
        const [categoriesRes, menuItemsRes, tableRes] = await Promise.all([
          api.get('/categories'),
          api.get('/menu-items'),
          api.get(\`/tables/\${tableId}\`)
        ]);

        setCategories(categoriesRes.data);
        setMenuItems(menuItemsRes.data);
        setTable(tableRes.data);

        if (categoriesRes.data.length > 0) {
          setSelectedCategory(categoriesRes.data[0].id);
        }
      } catch (error) {
        console.error('Veri yüklenirken hata oluştu:', error);
        toast({
          title: "Hata",
          description: "Veriler yüklenirken bir hata oluştu",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, router, tableId, toast]);

  const addToOrder = (menuItem: MenuItem) => {
    setOrderItems(prev => {
      const existingItem = prev.find(item => item.menuItem.id === menuItem.id);
      if (existingItem) {
        return prev.map(item =>
          item.menuItem.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { menuItem, quantity: 1, notes: '' }];
    });
  };

  const removeFromOrder = (menuItem: MenuItem) => {
    setOrderItems(prev => {
      const existingItem = prev.find(item => item.menuItem.id === menuItem.id);
      if (existingItem && existingItem.quantity > 1) {
        return prev.map(item =>
          item.menuItem.id === menuItem.id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prev.filter(item => item.menuItem.id !== menuItem.id);
    });
  };

  const updateNotes = (menuItem: MenuItem, notes: string) => {
    setOrderItems(prev =>
      prev.map(item =>
        item.menuItem.id === menuItem.id
          ? { ...item, notes }
          : item
      )
    );
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => 
      total + (item.menuItem.price * item.quantity), 0
    );
  };

  const handleSubmitOrder = async () => {
    if (orderItems.length === 0) {
      toast({
        title: "Hata",
        description: "Lütfen en az bir ürün ekleyin",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Siparişi oluştur
      const response = await api.post('/orders', {
        tableId,
        items: orderItems.map(item => ({
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
          notes: item.notes
        }))
      });

      // Mutfak yazıcısına gönder
      await api.post('/print/kitchen', {
        orderId: response.data.id
      });

      // Bildirim gönder
      await api.post('/notifications', {
        title: 'Yeni Sipariş',
        message: \`Masa \${table?.name}: Yeni sipariş alındı\`,
        type: 'NEW_ORDER',
        roles: ['KITCHEN', 'CASHIER'],
        data: {
          orderId: response.data.id,
          tableId,
          tableName: table?.name
        }
      });

      // Ses efektini çal
      playNotificationSound();

      // Masayı meşgul olarak işaretle
      await api.patch(\`/tables/\${tableId}/status\`, {
        status: 'OCCUPIED'
      });

      toast({
        title: "Başarılı",
        description: "Sipariş başarıyla oluşturuldu",
      });

      router.push('/tablet/tables');
    } catch (error) {
      console.error('Sipariş oluşturulurken hata:', error);
      toast({
        title: "Hata",
        description: "Sipariş oluşturulurken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-2xl text-primary">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Sol Panel - Kategoriler ve Menü */}
        <div className="flex-1 flex flex-col h-full border-r">
          {/* Masa Bilgisi */}
          <div className="p-4 border-b bg-muted/50">
            <h2 className="text-2xl font-bold text-primary">
              {table?.name} - {table?.area.name}
            </h2>
          </div>

          {/* Kategori Seçimi */}
          <ScrollArea className="flex-none p-4 border-b">
            <div className="flex gap-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className="whitespace-nowrap"
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </ScrollArea>

          {/* Menü Öğeleri */}
          <ScrollArea className="flex-1 p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {menuItems
                .filter(item => !selectedCategory || item.categoryId === selectedCategory)
                .map((item) => (
                  <Card
                    key={item.id}
                    className="p-4 cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => addToOrder(item)}
                  >
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                    </p>
                  </Card>
                ))}
            </div>
          </ScrollArea>
        </div>

        {/* Sağ Panel - Sipariş Özeti */}
        <div className="w-96 flex flex-col h-full bg-muted/30">
          <div className="p-4 border-b bg-muted/50">
            <h2 className="text-xl font-semibold">Sipariş Özeti</h2>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {orderItems.map((item) => (
                <Card key={item.menuItem.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{item.menuItem.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {(item.menuItem.price * item.quantity).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeFromOrder(item.menuItem)}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => addToOrder(item.menuItem)}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Not ekle..."
                    className="mt-2 w-full p-2 bg-background rounded-md text-sm"
                    value={item.notes}
                    onChange={(e) => updateNotes(item.menuItem, e.target.value)}
                  />
                </Card>
              ))}
            </div>
          </ScrollArea>

          <div className="p-4 border-t bg-muted/50">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold">Toplam</span>
              <Badge variant="secondary" className="text-lg">
                {calculateTotal().toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
              </Badge>
            </div>
            <Button
              className="w-full h-16 text-lg"
              onClick={handleSubmitOrder}
              disabled={orderItems.length === 0 || submitting}
            >
              {submitting ? 'Sipariş Oluşturuluyor...' : 'Siparişi Oluştur'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 