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
  number: string;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';
  totalAmount: number;
  area: Area;
}

export default function OpenTablePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');

  useEffect(() => {
    if (!user || user.role !== 'WAITER') {
      router.push('/tablet/login');
      return;
    }
    fetchTables();
  }, [user, router]);

  const fetchTables = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/tables', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Masalar yüklenirken bir hata oluştu');
      }

      const data = await response.json();
      setTables(data || []);
      
      // Alanları çıkar
      const uniqueAreas = Array.from(new Set(data.map((table: Table) => table.area.id)))
        .map(id => data.find((table: Table) => table.area.id === id)?.area)
        .filter(Boolean);
      setAreas(uniqueAreas);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching tables:', err);
      setLoading(false);
    }
  };

  const handleTableSelect = (table: Table) => {
    // Masa bilgisini localStorage'a kaydet
    localStorage.setItem('selectedTable', JSON.stringify(table));
    // Sipariş sayfasına yönlendir
    router.push('/tablet/orders');
  };

  // Sadece müsait masaları filtrele
  const availableTables = tables.filter(table => table.status === 'AVAILABLE');
  
  // Seçili alana göre filtrele
  const filteredTables = selectedAreaId 
    ? availableTables.filter(table => table.area.id === selectedAreaId)
    : availableTables;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 flex items-center justify-center">
        <div className="text-4xl text-rose-600 font-bold">Masalar yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100">
      {/* Header */}
      <div className="p-6 bg-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-rose-600">🪑 Masa Aç</h1>
            <p className="text-xl text-rose-500 mt-2">Müsait masaları seçin</p>
          </div>
          <Button
            onClick={() => router.push('/tablet')}
            className="bg-gray-600 hover:bg-gray-700 text-white text-xl px-8 py-4"
          >
            🔙 Geri
          </Button>
        </div>

        {/* Alan Filtreleri */}
        <div className="mt-6 flex flex-wrap gap-4">
          <Button
            onClick={() => setSelectedAreaId('')}
            className={`text-xl px-6 py-3 ${
              selectedAreaId === '' 
                ? 'bg-rose-600 text-white' 
                : 'bg-white text-rose-600 border-rose-300 hover:bg-rose-50'
            }`}
            variant={selectedAreaId === '' ? 'default' : 'outline'}
          >
            Tüm Alanlar ({availableTables.length})
          </Button>
          {areas.map(area => {
            const areaTableCount = availableTables.filter(table => table.area.id === area.id).length;
            return (
              <Button
                key={area.id}
                onClick={() => setSelectedAreaId(area.id)}
                className={`text-xl px-6 py-3 ${
                  selectedAreaId === area.id 
                    ? 'bg-rose-600 text-white' 
                    : 'bg-white text-rose-600 border-rose-300 hover:bg-rose-50'
                }`}
                variant={selectedAreaId === area.id ? 'default' : 'outline'}
              >
                {area.name} ({areaTableCount})
              </Button>
            );
          })}
        </div>
      </div>

      {/* Masa Listesi */}
      <div className="p-8">
        {filteredTables.length === 0 ? (
          <div className="text-center text-3xl text-gray-600 mt-20">
            {selectedAreaId ? 'Bu alanda müsait masa bulunmuyor' : 'Müsait masa bulunmuyor'}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredTables.map((table) => (
              <div
                key={table.id}
                onClick={() => handleTableSelect(table)}
                className="aspect-square bg-gradient-to-br from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer border-4 border-white flex flex-col items-center justify-center p-4"
              >
                <div className="text-center space-y-2">
                  <div className="text-4xl mb-2">🪑</div>
                  <div className="text-xl font-bold">{table.name}</div>
                  <div className="text-sm opacity-90 bg-white bg-opacity-20 rounded-full px-3 py-1">
                    {table.area.name}
                  </div>
                  <div className="text-xs opacity-75">
                    {table.capacity} kişilik
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alt Bilgi */}
      <div className="p-6 text-center">
        <div className="bg-white rounded-lg shadow-lg p-4 inline-block">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-green-500 rounded"></span>
              <span className="text-lg">Müsait ({filteredTables.length})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-6">
        <p className="text-lg text-rose-600">
          © 2025 By Code Software. Tüm hakları saklıdır.
        </p>
      </div>
    </div>
  );
} 