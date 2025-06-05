'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { useAuth } from '../../../hooks/useAuth';

interface Area {
  id: string;
  name: string;
}

interface Table {
  id: string;
  name: string;
  capacity: number;
  status: string;
  area: Area;
  currentOrder?: {
    id: string;
    total: number;
    orderItems: any[];
  };
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: Table | null;
}

// Adisyon Modal Bileşeni
function ReceiptModal({ isOpen, onClose, table }: ReceiptModalProps) {
  const [printing, setPrinting] = useState(false);

  if (!isOpen || !table) return null;

  const handlePrintReceipt = async () => {
    setPrinting(true);
    try {
      const token = localStorage.getItem('token');
      
      // Adisyon yazdırma API'sini çağır
      const response = await fetch('http://localhost:5000/api/printers/test-receipt', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: table.currentOrder?.id,
          table: {
            number: table.name,
            name: table.name
          },
          total: table.currentOrder?.total || 0,
          paymentMethod: 'CASH',
          waiter: 'Garson',
          items: table.currentOrder?.orderItems || []
        })
      });

      if (response.ok) {
        alert('Adisyon başarıyla yazdırıldı!');
        onClose();
      } else {
        alert('Adisyon yazdırılırken bir hata oluştu!');
      }
    } catch (error) {
      console.error('Print error:', error);
      alert('Adisyon yazdırılırken bir hata oluştu!');
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-rose-500 to-rose-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">📄 Adisyon Özeti</h2>
            <Button
              onClick={onClose}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full w-10 h-10 p-0"
            >
              ✕
            </Button>
          </div>
          <div className="mt-2 text-rose-100">
            {table.name} - {table.area.name}
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {/* Sipariş Detayları */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Sipariş Detayları</h3>
            
            {table.currentOrder?.orderItems && table.currentOrder.orderItems.length > 0 ? (
              <div className="space-y-3">
                {table.currentOrder.orderItems.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{item.menuItem?.name || item.name}</div>
                      <div className="text-sm text-gray-600">
                        {item.quantity} adet × ₺{(item.menuItem?.price || item.price || 0).toFixed(2)}
                      </div>
                      {item.notes && (
                        <div className="text-xs text-gray-500 mt-1">Not: {item.notes}</div>
                      )}
                    </div>
                    <div className="text-lg font-bold text-rose-600">
                      ₺{((item.quantity || 1) * (item.menuItem?.price || item.price || 0)).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🍽️</div>
                <div>Henüz sipariş alınmamış</div>
              </div>
            )}

            {/* Toplam */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center bg-gradient-to-r from-rose-50 to-rose-100 p-4 rounded-lg">
                <div className="text-xl font-bold text-gray-800">TOPLAM</div>
                <div className="text-2xl font-bold text-rose-600">
                  ₺{(table.currentOrder?.total || 0).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <Button
              onClick={onClose}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-xl"
            >
              İptal
            </Button>
            <Button
              onClick={handlePrintReceipt}
              disabled={printing}
              className="flex-1 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white py-3 rounded-xl"
            >
              {printing ? '🖨️ Yazdırılıyor...' : '🖨️ Adisyon Yazdır'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ActiveTablesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTables, setActiveTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArea, setSelectedArea] = useState<string>('ALL');
  const [receiptModal, setReceiptModal] = useState<{ isOpen: boolean; table: Table | null }>({
    isOpen: false,
    table: null
  });

  const areas = [
    { id: 'ALL', name: 'Tümü' },
    { id: 'SALON', name: 'Salon' },
    { id: 'BAHÇE', name: 'Bahçe' },
    { id: 'TERAS', name: 'Teras' },
    { id: 'VIP', name: 'VIP' },
    { id: 'BAR', name: 'Bar' }
  ];

  useEffect(() => {
    if (!user || user.role !== 'WAITER') {
      router.push('/tablet/login');
      return;
    }

    fetchActiveTables();
  }, [user, router]);

  const fetchActiveTables = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Tüm aktif siparişleri getir (PAID hariç)
      const response = await fetch('http://localhost:5000/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Aktif masalar yüklenirken bir hata oluştu');
      }

      const result = await response.json();
      const orders = result.data || result; // API response format'ına göre
      
      // Masaları grupla ve sipariş bilgilerini ekle
      const tablesWithOrders: Table[] = [];
      const processedTableIds = new Set();

      orders.forEach((order: any) => {
        if (!processedTableIds.has(order.tableId) && order.status !== 'PAID') {
          tablesWithOrders.push({
            id: order.table.id,
            name: order.table.name,
            capacity: order.table.capacity || 4,
            status: order.table.status,
            area: order.table.area || { id: '1', name: 'Salon' },
            currentOrder: {
              id: order.id,
              total: order.total || 0,
              orderItems: order.items || []
            }
          });
          processedTableIds.add(order.tableId);
        }
      });

      console.log('Aktif masalar:', tablesWithOrders);
      setActiveTables(tablesWithOrders);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching active tables:', error);
      setLoading(false);
    }
  };

  const handleTableSelect = (table: Table) => {
    // Seçili masayı localStorage'a kaydet
    localStorage.setItem('selectedTable', JSON.stringify(table));
    // Sipariş al sayfasına yönlendir
    router.push('/tablet/orders');
  };

  const handleShowReceipt = (e: React.MouseEvent, table: Table) => {
    e.stopPropagation(); // Masa seçimini engelle
    setReceiptModal({ isOpen: true, table });
  };

  const filteredTables = selectedArea === 'ALL' 
    ? activeTables 
    : activeTables.filter(table => table.area.name.toUpperCase() === selectedArea);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 flex items-center justify-center">
        <div className="text-3xl text-rose-600">Aktif masalar yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={() => router.push('/tablet')}
            className="text-xl px-6 py-3 rounded-xl bg-gray-600 hover:bg-gray-700 text-white"
          >
            🔙 Ana Sayfa
          </Button>
          <h1 className="text-4xl font-bold text-rose-600 text-center">🔥 Aktif Masalar</h1>
          <div className="w-32"></div>
        </div>

        {/* Area Filter */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          {areas.map((area) => (
            <Button
              key={area.id}
              onClick={() => setSelectedArea(area.id)}
              className={`text-lg px-6 py-3 rounded-xl whitespace-nowrap ${
                selectedArea === area.id
                  ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-lg'
                  : 'bg-white text-rose-600 hover:bg-rose-50 border border-rose-200'
              }`}
            >
              {area.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Active Tables Grid */}
      {filteredTables.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🍽️</div>
          <div className="text-2xl text-gray-600 mb-2">Aktif sipariş yok</div>
          <div className="text-lg text-gray-500">
            {selectedArea === 'ALL' ? 'Henüz hiçbir masada aktif sipariş bulunmuyor' : `${areas.find(a => a.id === selectedArea)?.name} bölgesinde aktif sipariş yok`}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredTables.map((table) => (
            <div
              key={table.id}
              className="aspect-square bg-gradient-to-br from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border-4 border-white flex flex-col items-center justify-center p-4 relative"
            >
              {/* Masa Bilgileri */}
              <div 
                onClick={() => handleTableSelect(table)}
                className="text-center space-y-2 cursor-pointer flex-1 flex flex-col justify-center"
              >
                <div className="text-4xl mb-2">🔥</div>
                <div className="text-xl font-bold">{table.name}</div>
                <div className="text-sm opacity-90 bg-white bg-opacity-20 rounded-full px-3 py-1">
                  {table.area.name}
                </div>
                <div className="text-xs opacity-75">
                  {table.capacity} kişilik
                </div>
                {table.currentOrder && (
                  <div className="text-xs opacity-90 mt-1 bg-white bg-opacity-30 rounded-full px-2 py-1 font-bold">
                    ₺{table.currentOrder.total.toFixed(2)}
                  </div>
                )}
              </div>

              {/* Adisyon Çıkart Butonu */}
              <Button
                onClick={(e) => handleShowReceipt(e, table)}
                className="w-full mt-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-sm py-2 rounded-lg border border-white border-opacity-30"
              >
                📄 Adisyon Çıkart
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={receiptModal.isOpen}
        onClose={() => setReceiptModal({ isOpen: false, table: null })}
        table={receiptModal.table}
      />

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-lg text-rose-600">
          © 2025 By Code Software. Tüm hakları saklıdır.
        </p>
      </div>
    </div>
  );
} 