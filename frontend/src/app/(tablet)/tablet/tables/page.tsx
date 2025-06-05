'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

interface Table {
  id: number;
  name: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';
  areaId: number;
  area: {
    id: number;
    name: string;
  };
}

interface Area {
  id: number;
  name: string;
}

export default function TablesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [areas, setAreas] = useState<Area[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedArea, setSelectedArea] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'WAITER') {
      router.push('/tablet/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [areasResponse, tablesResponse] = await Promise.all([
          api.get('/areas'),
          api.get('/tables')
        ]);

        setAreas(areasResponse.data);
        setTables(tablesResponse.data);
        
        // Varsayılan olarak ilk alanı seç
        if (areasResponse.data.length > 0) {
          setSelectedArea(areasResponse.data[0].id);
        }
      } catch (error) {
        console.error('Veri yüklenirken hata oluştu:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, router]);

  const getStatusColor = (status: Table['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-500';
      case 'OCCUPIED':
        return 'bg-red-500';
      case 'RESERVED':
        return 'bg-yellow-500';
      case 'MAINTENANCE':
        return 'bg-gray-500';
      default:
        return 'bg-gray-200';
    }
  };

  const getStatusText = (status: Table['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return 'Müsait';
      case 'OCCUPIED':
        return 'Dolu';
      case 'RESERVED':
        return 'Rezerve';
      case 'MAINTENANCE':
        return 'Bakımda';
      default:
        return 'Bilinmiyor';
    }
  };

  const handleTableClick = (table: Table) => {
    if (table.status === 'AVAILABLE') {
      router.push(`/tablet/orders?tableId=${table.id}`);
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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-primary mb-8">
          Masa Yönetimi
        </h1>

        {/* Bölge Seçimi */}
        <div className="flex gap-2 overflow-x-auto pb-4">
          {areas.map((area) => (
            <Button
              key={area.id}
              variant={selectedArea === area.id ? "default" : "outline"}
              onClick={() => setSelectedArea(area.id)}
              className="whitespace-nowrap"
            >
              {area.name}
            </Button>
          ))}
        </div>

        {/* Masa Gridi */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {tables
            .filter(table => !selectedArea || table.areaId === selectedArea)
            .map((table) => (
              <Button
                key={table.id}
                variant="outline"
                onClick={() => handleTableClick(table)}
                className={`h-32 relative flex flex-col items-center justify-center ${
                  table.status === 'AVAILABLE' ? 'hover:bg-primary/10' : ''
                }`}
                disabled={table.status !== 'AVAILABLE'}
              >
                <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${getStatusColor(table.status)}`} />
                <span className="text-2xl font-bold">{table.name}</span>
                <span className="text-sm text-muted-foreground mt-1">
                  {getStatusText(table.status)}
                </span>
              </Button>
            ))}
        </div>
      </div>
    </div>
  );
} 