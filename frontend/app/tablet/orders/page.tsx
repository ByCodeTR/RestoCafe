'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { useAuth } from '../../../hooks/useAuth';

interface Category {
  id: string;
  name: string;
  products: Product[];
}

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  categoryId: string;
  category: {
    id: string;
    name: string;
  };
}

interface OrderItem {
  product: Product;
  quantity: number;
  notes?: string;
}

export default function TabletOrdersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showOrderSummary, setShowOrderSummary] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'WAITER') {
      router.push('/tablet/login');
      return;
    }

    // Seçili masayı al
    const tableData = localStorage.getItem('selectedTable');
    if (!tableData) {
      router.push('/tablet/tables');
      return;
    }
    
    try {
      const table = JSON.parse(tableData);
      console.log('Selected table data:', table);
      setSelectedTable(table);
    } catch (error) {
      console.error('Error parsing table data:', error);
      router.push('/tablet/tables');
      return;
    }

    fetchMenu();
  }, [user, router]);

  const fetchMenu = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/categories?include=products', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Menü yüklenirken bir hata oluştu');
      }
      const data = await response.json();
      // Hammaddeler kategorisini filtrele
      const menuCategories = data.filter((cat: Category) => cat.name !== 'Hammaddeler');
      setCategories(menuCategories);
      if (menuCategories.length > 0) {
        setSelectedCategory(menuCategories[0].name);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching menu:', err);
      setLoading(false);
    }
  };

  const addToOrder = (product: Product) => {
    setOrderItems(prev => {
      const existingItem = prev.find(item => item.product.id === product.id);
      if (existingItem) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { product, quantity: 1 }];
      }
    });
  };

  const removeFromOrder = (productId: string) => {
    setOrderItems(prev => {
      return prev.map(item =>
        item.product.id === productId
          ? { ...item, quantity: Math.max(0, item.quantity - 1) }
          : item
      ).filter(item => item.quantity > 0);
    });
  };

  const getTotalPrice = () => {
    return orderItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const getItemQuantity = (productId: string) => {
    const item = orderItems.find(item => item.product.id === productId);
    return item ? item.quantity : 0;
  };

  const handlePlaceOrder = async () => {
    if (orderItems.length === 0) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tableId: selectedTable.id,
          items: orderItems.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            notes: item.notes || '',
          })),
          waiterId: user?.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Sipariş gönderilirken bir hata oluştu');
      }

      // Sipariş başarılı
      alert('✅ Sipariş başarıyla gönderildi! Admin ve mutfağa bildirim gitti.');
      localStorage.removeItem('selectedTable');
      router.push('/tablet');
    } catch (error) {
      console.error('Error placing order:', error);
      alert('❌ Sipariş gönderilirken bir hata oluştu!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 flex items-center justify-center">
        <div className="text-3xl text-rose-600">Menü yükleniyor...</div>
      </div>
    );
  }

  const selectedCategoryData = categories.find(cat => cat.name === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 flex flex-col">
      {/* Header */}
      <div className="flex-none p-6 bg-white shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={() => router.push('/tablet/tables')}
            className="text-xl px-6 py-3 rounded-xl bg-gray-600 hover:bg-gray-700 text-white"
          >
            🔙 Masa Seç
          </Button>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-rose-600">📋 Sipariş Al</h1>
            {selectedTable && (
              <p className="text-xl text-rose-500">
                🪑 {selectedTable.name} - {selectedTable.area?.name || 'Bilinmeyen Bölge'}
              </p>
            )}
          </div>
          <div className="w-32"></div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              onClick={() => setSelectedCategory(category.name)}
              className={`text-lg px-6 py-3 rounded-xl whitespace-nowrap ${
                selectedCategory === category.name
                  ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-lg'
                  : 'bg-white text-rose-600 hover:bg-rose-50 border border-rose-200'
              }`}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {selectedCategoryData?.products.map((product) => (
            <div
              key={product.id}
              onClick={() => addToOrder(product)}
              className="bg-white rounded-2xl shadow-lg p-4 border-2 border-transparent hover:border-rose-300 transition-all cursor-pointer hover:scale-105 relative"
            >
              {/* Adet Badge */}
              {getItemQuantity(product.id) > 0 && (
                <div className="absolute -top-2 -left-2 bg-rose-600 text-white text-lg font-bold rounded-full w-8 h-8 flex items-center justify-center shadow-lg z-10">
                  x{getItemQuantity(product.id)}
                </div>
              )}
              
              <div className="text-center space-y-3">
                <h3 className="text-xl font-bold text-gray-800">{product.name}</h3>
                {product.description && (
                  <p className="text-sm text-gray-600">{product.description}</p>
                )}
                <p className="text-2xl font-bold text-rose-600">₺{product.price.toFixed(2)}</p>
                
                {/* Tıklama İpucu */}
                <div className="text-xs text-gray-500 bg-gray-50 rounded-lg py-2">
                  👆 Tıklayarak ekle
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex-none p-6 bg-white shadow-2xl border-t-4 border-rose-200">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <p className="text-lg text-gray-600">Toplam Ürün: <span className="font-bold">{orderItems.length}</span></p>
            <p className="text-2xl font-bold text-rose-600">₺{getTotalPrice().toFixed(2)}</p>
          </div>
          
          <div className="flex gap-4">
            {orderItems.length > 0 && (
              <Button
                onClick={() => setShowOrderSummary(true)}
                className="text-xl px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
              >
                📋 Sipariş Gör ({orderItems.reduce((sum, item) => sum + item.quantity, 0)})
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Order Summary Modal */}
      {showOrderSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-rose-500 to-rose-600 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">📋 Sipariş Özeti</h2>
                <Button
                  onClick={() => setShowOrderSummary(false)}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full w-10 h-10"
                >
                  ✕
                </Button>
              </div>
              <p className="text-rose-100 mt-2">
                🪑 {selectedTable?.name} - {selectedTable?.area?.name}
              </p>
            </div>

            {/* Modal Content */}
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {orderItems.map((item) => (
                  <div key={item.product.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-gray-800">{item.product.name}</h4>
                      <p className="text-gray-600">₺{item.product.price.toFixed(2)} x {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-rose-600">₺{(item.product.price * item.quantity).toFixed(2)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          onClick={() => removeFromOrder(item.product.id)}
                          className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full text-sm"
                        >
                          -
                        </Button>
                        <span className="font-bold text-lg w-8 text-center">{item.quantity}</span>
                        <Button
                          onClick={() => addToOrder(item.product)}
                          className="w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-full text-sm"
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-gray-50 border-t">
              <div className="flex justify-between items-center mb-4">
                <span className="text-2xl font-bold text-gray-800">Toplam:</span>
                <span className="text-3xl font-bold text-rose-600">₺{getTotalPrice().toFixed(2)}</span>
              </div>
              
              <Button
                onClick={handlePlaceOrder}
                disabled={orderItems.length === 0}
                className="w-full h-16 text-2xl font-bold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl disabled:opacity-50"
              >
                🚀 Siparişi Gönder
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex-none text-center py-4 bg-rose-50">
        <p className="text-rose-600">
          © 2025 By Code Software. Tüm hakları saklıdır.
        </p>
      </div>
    </div>
  );
} 