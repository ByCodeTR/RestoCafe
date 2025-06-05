'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { useAuth } from '../../../hooks/useAuth';

interface Table {
  id: string;
  name: string;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
  areaId: string;
  area: {
    id: string;
    name: string;
  };
}

interface TableWithArea extends Table {
  areaName?: string;
}

interface Area {
  id: string;
  name: string;
  tables: Table[];
}

interface AllTablesArea {
  name: string;
  tables: TableWithArea[];
}

export default function TabletTablesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>('Tüm Masalar');
  const [loading, setLoading] = useState(true);
  
  // Masa taşıma ve birleştirme state'leri
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [targetTable, setTargetTable] = useState<Table | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'WAITER') {
      router.push('/tablet/login');
      return;
    }
    fetchAreas();
  }, [user, router]);

  const fetchAreas = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/areas?include=tables');
      if (!response.ok) {
        throw new Error('Bölgeler yüklenirken bir hata oluştu');
      }
      const data = await response.json();
      setAreas(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching areas:', err);
      setLoading(false);
    }
  };

  const getStatusColor = (status: Table['status']) => {
    const colors = {
      AVAILABLE: 'from-emerald-400 via-emerald-500 to-emerald-600 shadow-emerald-200',
      OCCUPIED: 'from-rose-400 via-rose-500 to-rose-600 shadow-rose-200',
      RESERVED: 'from-amber-400 via-amber-500 to-amber-600 shadow-amber-200',
    };
    return colors[status];
  };

  const getStatusLabel = (status: Table['status']) => {
    const labels = {
      AVAILABLE: 'Müsait',
      OCCUPIED: 'Dolu',
      RESERVED: 'Rezerve',
    };
    return labels[status];
  };

  const getStatusEmoji = (status: Table['status']) => {
    const emojis = {
      AVAILABLE: '✨',
      OCCUPIED: '🔥',
      RESERVED: '📅',
    };
    return emojis[status];
  };

  const handleTableSelect = (table: Table) => {
    if (table.status === 'AVAILABLE') {
      // Masayı seç ve sipariş sayfasına git
      localStorage.setItem('selectedTable', JSON.stringify(table));
      router.push('/tablet/orders');
    } else if (table.status === 'OCCUPIED') {
      // Mevcut siparişleri göster
      router.push(`/tablet/table-orders/${table.id}`);
    } else if (table.status === 'RESERVED') {
      // Rezerve masa için bilgi göster
      alert('Bu masa rezerve edilmiş. Lütfen başka bir masa seçin.');
    }
  };

  // Masa taşıma fonksiyonu
  const handleMoveTable = async () => {
    if (!selectedTable || !targetTable) return;

    try {
      const response = await fetch('http://localhost:5000/api/tables/move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceTableId: selectedTable.id,
          targetTableId: targetTable.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`${selectedTable.name} masası ${targetTable.name} masasına taşındı!`);
        fetchAreas(); // Masaları yenile
        setShowMoveModal(false);
        setSelectedTable(null);
        setTargetTable(null);
      } else {
        alert(data.message || 'Masa taşıma işlemi başarısız');
      }
    } catch (error) {
      console.error('Move table error:', error);
      alert('Masa taşıma işlemi sırasında bir hata oluştu');
    }
  };

  // Masa birleştirme fonksiyonu
  const handleMergeTables = async () => {
    if (!selectedTable || !targetTable) return;

    try {
      const response = await fetch('http://localhost:5000/api/tables/merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mainTableId: selectedTable.id,
          mergeTableId: targetTable.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`${targetTable.name} masası ${selectedTable.name} masası ile birleştirildi!`);
        fetchAreas(); // Masaları yenile
        setShowMergeModal(false);
        setSelectedTable(null);
        setTargetTable(null);
      } else {
        alert(data.message || 'Masa birleştirme işlemi başarısız');
      }
    } catch (error) {
      console.error('Merge tables error:', error);
      alert('Masa birleştirme işlemi sırasında bir hata oluştu');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <div className="text-2xl text-slate-600 mt-4 font-medium">Masalar yükleniyor...</div>
        </div>
      </div>
    );
  }

  // Tüm masalar için özel data hazırlama
  const allTables: TableWithArea[] = areas.flatMap(area => area.tables.map(table => ({ ...table, areaName: area.name })));
  const selectedAreaData: Area | AllTablesArea | undefined = selectedArea === 'Tüm Masalar' 
    ? { name: 'Tüm Masalar', tables: allTables }
    : areas.find(area => area.name === selectedArea);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push('/tablet')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-all duration-200 hover:scale-105"
            >
              <span className="text-lg">←</span>
              Geri
            </button>
            
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              🏠 Masa Seçimi
            </h1>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowMoveModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-all duration-200 hover:scale-105 shadow-lg shadow-blue-200"
              >
                📦 Masa Taşı
              </button>
              <button
                onClick={() => setShowMergeModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-medium transition-all duration-200 hover:scale-105 shadow-lg shadow-purple-200"
              >
                🔗 Birleştir
              </button>
            </div>
          </div>

          {/* Area Tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setSelectedArea('Tüm Masalar')}
              className={`px-6 py-3 rounded-xl font-medium whitespace-nowrap transition-all duration-200 ${
                selectedArea === 'Tüm Masalar'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200'
                  : 'bg-white hover:bg-slate-50 text-slate-600 shadow-md hover:shadow-lg'
              }`}
            >
              🌟 Tüm Masalar
            </button>
            {areas.map((area) => (
              <button
                key={area.id}
                onClick={() => setSelectedArea(area.name)}
                className={`px-6 py-3 rounded-xl font-medium whitespace-nowrap transition-all duration-200 ${
                  selectedArea === area.name
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-200'
                    : 'bg-white hover:bg-slate-50 text-slate-600 shadow-md hover:shadow-lg'
                }`}
              >
                📍 {area.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-slate-700 flex items-center gap-2">
            {selectedArea === 'Tüm Masalar' ? '🌟' : '📍'} {selectedAreaData?.name}
            <span className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
              {selectedAreaData?.tables.length || 0} masa
            </span>
          </h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {selectedAreaData?.tables.map((table: TableWithArea) => (
            <div
              key={table.id}
              onClick={() => handleTableSelect(table)}
              className={`group cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                table.status === 'RESERVED' ? 'cursor-not-allowed opacity-50' : ''
              }`}
            >
              <div className={`
                aspect-square 
                rounded-2xl 
                bg-gradient-to-br ${getStatusColor(table.status)}
                shadow-xl hover:shadow-2xl
                border border-white/20
                backdrop-blur-sm
                transition-all duration-300 
                hover:scale-105 hover:-translate-y-1
                flex flex-col items-center justify-center
                text-white
                relative overflow-hidden
                p-4
              `}>
                {/* Decorative background pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/20"></div>
                  <div className="absolute bottom-2 left-2 w-6 h-6 rounded-full bg-white/15"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/5"></div>
                </div>
                
                {/* Content */}
                <div className="relative z-10 text-center">
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    {getStatusEmoji(table.status)}
                  </div>
                  <div className="text-xl font-bold mb-1">{table.name}</div>
                  <div className="text-sm opacity-90 mb-2">{table.capacity} Kişi</div>
                  {selectedArea === 'Tüm Masalar' && table.areaName && (
                    <div className="text-xs opacity-75 bg-white/20 px-2 py-1 rounded-full mb-2">
                      📍 {table.areaName}
                    </div>
                  )}
                  <div className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                    {getStatusLabel(table.status)}
                  </div>
                </div>

                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {(!selectedAreaData?.tables || selectedAreaData.tables.length === 0) && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🪑</div>
            <div className="text-xl text-slate-600 font-medium">Bu bölgede henüz masa bulunmuyor</div>
            <div className="text-slate-500 mt-2">Yeni masa eklemek için admin panelini kullanın</div>
          </div>
        )}
      </div>

      {/* Status Legend */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2">
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 px-6 py-4">
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-xl">✨</span>
              <span className="text-slate-600 font-medium">Müsait</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🔥</span>
              <span className="text-slate-600 font-medium">Dolu</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📅</span>
              <span className="text-slate-600 font-medium">Rezerve</span>
            </div>
          </div>
        </div>
      </div>

      {/* Masa Taşıma Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                📦 Masa Taşıma
              </h2>
              <p className="text-blue-100 mt-2">Dolu bir masayı boş bir masaya taşıyın</p>
            </div>
            
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Kaynak Masa Seçimi */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-slate-700 flex items-center gap-2">
                    🔴 Hangi masayı taşıyacaksınız?
                  </h3>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {areas.flatMap(area => area.tables)
                      .filter(table => table.status === 'OCCUPIED')
                      .map(table => (
                        <button
                          key={table.id}
                          onClick={() => setSelectedTable(table)}
                          className={`w-full p-4 text-left rounded-xl transition-all ${
                            selectedTable?.id === table.id
                              ? 'bg-rose-500 text-white shadow-lg scale-105'
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-100 hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🔥</span>
                            <div>
                              <div className="font-semibold">{table.name}</div>
                              <div className="text-sm opacity-75">📍 {table.area.name} • {table.capacity} Kişi</div>
                            </div>
                          </div>
                        </button>
                    ))}
                  </div>
                </div>

                {/* Hedef Masa Seçimi */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-slate-700 flex items-center gap-2">
                    ✨ Hangi masaya taşıyacaksınız?
                  </h3>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {areas.flatMap(area => area.tables)
                      .filter(table => table.status === 'AVAILABLE')
                      .map(table => (
                        <button
                          key={table.id}
                          onClick={() => setTargetTable(table)}
                          className={`w-full p-4 text-left rounded-xl transition-all ${
                            targetTable?.id === table.id
                              ? 'bg-emerald-500 text-white shadow-lg scale-105'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">✨</span>
                            <div>
                              <div className="font-semibold">{table.name}</div>
                              <div className="text-sm opacity-75">📍 {table.area.name} • {table.capacity} Kişi</div>
                            </div>
                          </div>
                        </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8 pt-6 border-t border-slate-200">
                <button
                  onClick={() => {
                    setShowMoveModal(false);
                    setSelectedTable(null);
                    setTargetTable(null);
                  }}
                  className="flex-1 py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-all"
                >
                  ❌ İptal
                </button>
                <button
                  onClick={handleMoveTable}
                  disabled={!selectedTable || !targetTable}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-xl font-medium transition-all disabled:cursor-not-allowed"
                >
                  📦 Masa Taşı
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Masa Birleştirme Modal */}
      {showMergeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-6">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                🔗 Masa Birleştirme
              </h2>
              <p className="text-purple-100 mt-2">İki dolu masayı birleştirin</p>
            </div>
            
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Ana Masa Seçimi */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-slate-700 flex items-center gap-2">
                    🏠 Ana masa hangisi?
                  </h3>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {areas.flatMap(area => area.tables)
                      .filter(table => table.status === 'OCCUPIED')
                      .map(table => (
                        <button
                          key={table.id}
                          onClick={() => setSelectedTable(table)}
                          className={`w-full p-4 text-left rounded-xl transition-all ${
                            selectedTable?.id === table.id
                              ? 'bg-purple-500 text-white shadow-lg scale-105'
                              : 'bg-purple-50 text-purple-700 hover:bg-purple-100 hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🔥</span>
                            <div>
                              <div className="font-semibold">{table.name}</div>
                              <div className="text-sm opacity-75">📍 {table.area.name} • {table.capacity} Kişi</div>
                            </div>
                          </div>
                        </button>
                    ))}
                  </div>
                </div>

                {/* Birleştirilecek Masa Seçimi */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-slate-700 flex items-center gap-2">
                    🔗 Hangi masayı birleştireceksiniz?
                  </h3>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {areas.flatMap(area => area.tables)
                      .filter(table => table.status === 'OCCUPIED' && table.id !== selectedTable?.id)
                      .map(table => (
                        <button
                          key={table.id}
                          onClick={() => setTargetTable(table)}
                          className={`w-full p-4 text-left rounded-xl transition-all ${
                            targetTable?.id === table.id
                              ? 'bg-pink-500 text-white shadow-lg scale-105'
                              : 'bg-pink-50 text-pink-700 hover:bg-pink-100 hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🔥</span>
                            <div>
                              <div className="font-semibold">{table.name}</div>
                              <div className="text-sm opacity-75">📍 {table.area.name} • {table.capacity} Kişi</div>
                            </div>
                          </div>
                        </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8 pt-6 border-t border-slate-200">
                <button
                  onClick={() => {
                    setShowMergeModal(false);
                    setSelectedTable(null);
                    setTargetTable(null);
                  }}
                  className="flex-1 py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-all"
                >
                  ❌ İptal
                </button>
                <button
                  onClick={handleMergeTables}
                  disabled={!selectedTable || !targetTable}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-xl font-medium transition-all disabled:cursor-not-allowed"
                >
                  🔗 Masa Birleştir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 