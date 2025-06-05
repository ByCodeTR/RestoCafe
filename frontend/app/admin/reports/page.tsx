'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Clock, Eye } from 'lucide-react';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    name: string;
  };
}

interface Order {
  id: string;
  total: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  paidAt: string | null;
  table: {
    name: string;
    area: {
      name: string;
    };
  };
  user?: {
    name: string;
    username: string;
  };
  items: OrderItem[];
}

interface ReportData {
  date?: Date;
  startDate?: Date;
  endDate?: Date;
  totalOrders: number;
  totalAmount: number;
  paymentMethodTotals: Record<string, number>;
  topSellingProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    totalAmount: number;
  }>;
  dailyDistribution?: Record<string, { totalOrders: number; totalAmount: number }>;
  orders: Order[];
}

type ReportType = 'daily' | 'weekly' | 'monthly';

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('daily');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Rapor verilerini getir
  const fetchReport = async (type: ReportType, date: Date) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const dateParam = format(date, 'yyyy-MM-dd');
      
      const response = await fetch(`http://localhost:5000/api/reports/${type}?date=${dateParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Rapor alınamadı');
      }

      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error('Report fetch error:', error);
      toast.error('Rapor yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Sayfa yüklendiğinde günlük raporu getir
  useEffect(() => {
    fetchReport(reportType, selectedDate);
  }, [reportType, selectedDate]);

  // Rapor türü değiştiğinde
  const handleReportTypeChange = (type: ReportType) => {
    setReportType(type);
    fetchReport(type, selectedDate);
  };

  // Tarih değiştiğinde
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setDatePickerOpen(false);
      fetchReport(reportType, date);
    }
  };

  // Rapor başlığını getir
  const getReportTitle = () => {
    switch (reportType) {
      case 'daily':
        return `Günlük Rapor - ${format(selectedDate, 'dd MMMM yyyy', { locale: tr })}`;
      case 'weekly':
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
        return `Haftalık Rapor - ${format(weekStart, 'dd MMM', { locale: tr })} - ${format(weekEnd, 'dd MMM yyyy', { locale: tr })}`;
      case 'monthly':
        return `Aylık Rapor - ${format(selectedDate, 'MMMM yyyy', { locale: tr })}`;
      default:
        return 'Rapor';
    }
  };

  // Ödeme yöntemi isimlerini Türkçeleştir
  const getPaymentMethodName = (method: string) => {
    const methods: Record<string, string> = {
      'CASH': 'Nakit',
      'CREDIT': 'Kredi Kartı',
      'DEBIT': 'Banka Kartı',
      'SPLIT': 'Karma Ödeme'
    };
    return methods[method] || method;
  };

  // Para formatı
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  // Sipariş özetini oluştur
  const getOrderSummary = (items: OrderItem[]) => {
    return items.map(item => `${item.quantity}x ${item.product.name}`).join(', ');
  };

  // Excel export
  const exportToExcel = () => {
    if (!reportData) return;
    
    // Detaylı CSV export
    const csvData = [
      ['Rapor Türü', reportType],
      ['Tarih', format(selectedDate, 'dd/MM/yyyy')],
      ['Toplam Sipariş', reportData.totalOrders.toString()],
      ['Toplam Tutar', reportData.totalAmount.toString()],
      [''],
      ['Ödemesi Alınan Sipariş Detayları'],
      ['Sipariş Tarihi', 'Sipariş Saati', 'Ödeme Tarihi', 'Ödeme Saati', 'Sipariş No', 'Masa', 'Tutar', 'Ödeme Şekli', 'Sipariş Özeti'],
      ...reportData.orders.map(order => [
        format(new Date(order.createdAt), 'dd/MM/yyyy'),
        format(new Date(order.createdAt), 'HH:mm'),
        order.paidAt ? format(new Date(order.paidAt), 'dd/MM/yyyy') : 'Ödenmedi',
        order.paidAt ? format(new Date(order.paidAt), 'HH:mm') : '',
        order.id,
        `${order.table.area.name} - ${order.table.name}`,
        order.total.toString(),
        getPaymentMethodName(order.paymentMethod),
        getOrderSummary(order.items)
      ]),
      [''],
      ['En Çok Satan Ürünler'],
      ['Ürün Adı', 'Adet', 'Tutar'],
      ...reportData.topSellingProducts.map(product => [
        product.productName,
        product.quantity.toString(),
        product.totalAmount.toString()
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `odemeli_siparisler_${reportType}_${format(selectedDate, 'yyyy-MM-dd')}.csv`;
    link.click();
    
    toast.success('Rapor indirildi');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Rapor yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Başlık ve Kontroller */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📊 Raporlar</h1>
          <p className="text-gray-600 mt-1">Satış ve performans raporlarınızı görüntüleyin</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Tarih Seçici */}
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, 'dd MMMM yyyy', { locale: tr }) : "Tarih seçin"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateChange}
                initialFocus
                locale={tr}
              />
            </PopoverContent>
          </Popover>

          {/* Excel Export */}
          <Button onClick={exportToExcel} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Excel İndir
          </Button>
        </div>
      </div>

      {/* Rapor Türü Seçimi */}
      <div className="flex gap-2">
        <Button
          variant={reportType === 'daily' ? 'default' : 'outline'}
          onClick={() => handleReportTypeChange('daily')}
          className="gap-2"
        >
          <Clock className="h-4 w-4" />
          Günlük
        </Button>
        <Button
          variant={reportType === 'weekly' ? 'default' : 'outline'}
          onClick={() => handleReportTypeChange('weekly')}
          className="gap-2"
        >
          <TrendingUp className="h-4 w-4" />
          Haftalık
        </Button>
        <Button
          variant={reportType === 'monthly' ? 'default' : 'outline'}
          onClick={() => handleReportTypeChange('monthly')}
          className="gap-2"
        >
          <TrendingDown className="h-4 w-4" />
          Aylık
        </Button>
      </div>

      {/* Rapor Başlığı */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{getReportTitle()}</CardTitle>
          <CardDescription>
            {reportData && `${reportData.totalOrders} sipariş • ${formatCurrency(reportData.totalAmount)} toplam satış`}
          </CardDescription>
        </CardHeader>
      </Card>

      {reportData && (
        <>
          {/* Özet Kartları */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Sipariş</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  {reportType === 'daily' ? 'bugün' : reportType === 'weekly' ? 'bu hafta' : 'bu ay'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Satış</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(reportData.totalAmount)}</div>
                <p className="text-xs text-muted-foreground">
                  Ortalama: {formatCurrency(reportData.totalOrders > 0 ? reportData.totalAmount / reportData.totalOrders : 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En Popüler Ürün</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">
                  {reportData.topSellingProducts[0]?.productName || 'Veri yok'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {reportData.topSellingProducts[0]?.quantity || 0} adet satıldı
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Nakit Ödeme</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(reportData.paymentMethodTotals['CASH'] || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  %{reportData.totalAmount > 0 ? Math.round((reportData.paymentMethodTotals['CASH'] || 0) / reportData.totalAmount * 100) : 0} oranında
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sipariş Detayları Tablosu */}
          <Card>
            <CardHeader>
              <CardTitle>📋 Sipariş Detayları</CardTitle>
              <CardDescription>Tüm siparişlerin detaylı listesi</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Sipariş Tarihi</th>
                      <th className="text-left p-3 font-medium">Ödeme Tarihi</th>
                      <th className="text-left p-3 font-medium">Sipariş No</th>
                      <th className="text-left p-3 font-medium">Masa</th>
                      <th className="text-right p-3 font-medium">Tutar</th>
                      <th className="text-left p-3 font-medium">Ödeme Şekli</th>
                      <th className="text-left p-3 font-medium">Sipariş Özeti</th>
                      <th className="text-center p-3 font-medium">Detay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.orders.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center p-8 text-gray-500">
                          Bu tarih aralığında ödemesi alınan sipariş bulunamadı
                        </td>
                      </tr>
                    ) : (
                      reportData.orders.map((order) => (
                        <React.Fragment key={order.id}>
                          <tr className="border-b hover:bg-gray-50">
                            <td className="p-3">
                              <div className="text-sm">
                                <div className="font-medium">
                                  {format(new Date(order.createdAt), 'dd MMM yyyy', { locale: tr })}
                                </div>
                                <div className="text-gray-500">
                                  {format(new Date(order.createdAt), 'HH:mm')}
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="text-sm">
                                <div className="font-medium">
                                  {order.paidAt ? format(new Date(order.paidAt), 'dd MMM yyyy', { locale: tr }) : 'Ödenmedi'}
                                </div>
                                <div className="text-gray-500">
                                  {order.paidAt ? format(new Date(order.paidAt), 'HH:mm') : ''}
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                {order.id}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="text-sm">
                                <div className="font-medium">{order.table.name}</div>
                                <div className="text-gray-500">{order.table.area.name}</div>
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              <span className="font-bold text-green-600">
                                {formatCurrency(order.total)}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {getPaymentMethodName(order.paymentMethod)}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="text-sm text-gray-600 max-w-xs truncate">
                                {getOrderSummary(order.items)}
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                          {expandedOrder === order.id && (
                            <tr>
                              <td colSpan={8} className="p-0">
                                <div className="bg-gray-50 p-4 border-l-4 border-blue-500">
                                  <h4 className="font-medium mb-3">Sipariş İçeriği:</h4>
                                  <div className="space-y-2">
                                    {order.items.map((item) => (
                                      <div key={item.id} className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-2">
                                          <span className="bg-white px-2 py-1 rounded font-medium">
                                            {item.quantity}x
                                          </span>
                                          <span>{item.product.name}</span>
                                        </div>
                                        <div className="text-right">
                                          <div className="font-medium">
                                            {formatCurrency(item.price * item.quantity)}
                                          </div>
                                          <div className="text-gray-500 text-xs">
                                            {formatCurrency(item.price)} / adet
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Ödeme Yöntemleri */}
          <Card>
            <CardHeader>
              <CardTitle>💳 Ödeme Yöntemleri</CardTitle>
              <CardDescription>Ödeme türlerine göre dağılım</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(reportData.paymentMethodTotals).map(([method, amount]) => (
                  <div key={method} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      <span className="font-medium">{getPaymentMethodName(method)}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(amount)}</div>
                      <div className="text-sm text-muted-foreground">
                        %{reportData.totalAmount > 0 ? Math.round(amount / reportData.totalAmount * 100) : 0}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* En Çok Satan Ürünler */}
          <Card>
            <CardHeader>
              <CardTitle>🏆 En Çok Satan Ürünler</CardTitle>
              <CardDescription>Satış miktarına göre sıralı</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.topSellingProducts.slice(0, 10).map((product, index) => (
                  <div key={product.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{product.productName}</div>
                        <div className="text-sm text-muted-foreground">{product.quantity} adet</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(product.totalAmount)}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(product.totalAmount / product.quantity)} / adet
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Günlük Dağılım (Haftalık ve Aylık için) */}
          {reportData.dailyDistribution && (
            <Card>
              <CardHeader>
                <CardTitle>📈 Günlük Dağılım</CardTitle>
                <CardDescription>Günlere göre satış performansı</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(reportData.dailyDistribution).map(([date, data]) => (
                    <div key={date} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">
                          {format(new Date(date), 'dd MMMM yyyy', { locale: tr })}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {data.totalOrders} sipariş
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(data.totalAmount)}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(data.totalOrders > 0 ? data.totalAmount / data.totalOrders : 0)} ort.
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
} 