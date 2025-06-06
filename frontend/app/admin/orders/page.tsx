"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Plus, Minus, X, RefreshCw, ShoppingCart, CreditCard, Split, ArrowRightLeft, ArrowLeftRight } from 'lucide-react'
import api from '@/lib/api'
import { socket, socketEvents } from '@/lib/socket'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
  note?: string
}

interface Order {
  id: string
  table: {
    id: string
    name: string
    number: string
  }
  status: string
  total: number
  createdAt: string
  items: OrderItem[]
}

interface Product {
  id: string
  name: string
  price: number
  categoryId: string
}

interface Category {
  id: string
  name: string
  products: Product[]
}

interface Table {
  id: string
  name: string
  number: string
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED'
  orders?: Order[]
}

interface Area {
  id: string
  name: string
  tables: Table[]
}

export default function OrdersPage() {
  const router = useRouter()
  const [areas, setAreas] = useState<Area[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedArea, setSelectedArea] = useState<string>('all')
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [note, setNote] = useState('')
  const [selectedTableOrders, setSelectedTableOrders] = useState<Order[]>([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit' | 'split'>('cash')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [remainingAmount, setRemainingAmount] = useState(0)
  const [splitAmounts, setSplitAmounts] = useState({
    cash: '',
    credit: ''
  })
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false)
  const [sourceTable, setSourceTable] = useState<Table | null>(null)
  const [targetTable, setTargetTable] = useState<Table | null>(null)
  const [mergeMode, setMergeMode] = useState<'merge' | 'move'>('merge')

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Token kontrolü
      const token = localStorage.getItem('token')
      if (!token) {
        router.replace('/admin/login')
        return
      }

      // Tüm verileri paralel olarak çek
      const [areasResponse, ordersResponse, categoriesResponse] = await Promise.all([
        api.get('/areas').catch(err => {
          console.error('Bölgeler yüklenirken hata:', err)
          throw new Error('Bölgeler yüklenemedi')
        }),
        api.get('/orders').catch(err => {
          console.error('Siparişler yüklenirken hata:', err)
          throw new Error('Siparişler yüklenemedi')
        }),
        api.get('/categories').catch(err => {
          console.error('Kategoriler yüklenirken hata:', err)
          throw new Error('Kategoriler yüklenemedi')
        })
      ])

      console.log('Orders Response:', ordersResponse.data);

      setAreas(areasResponse.data)
      setOrders(ordersResponse.data.data || []) // Eğer data undefined ise boş array kullan
      setCategories(categoriesResponse.data)

      // Varsayılan kategori seçimi
      if (categoriesResponse.data.length > 0) {
        setSelectedCategory(categoriesResponse.data[0].id)
      }

    } catch (err: any) {
      console.error('Veri yüklenirken hata:', err)
      const errorMessage = err.response?.data?.message || err.message || 'Veriler yüklenirken bir hata oluştu.'
      setError(errorMessage)
      
      if (err.response?.status === 401) {
        router.replace('/admin/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchTableOrders = async (tableNumber: string) => {
    try {
      setIsLoadingOrders(true)
      const response = await api.get(`/orders?table.number=${tableNumber}`)
      setSelectedTableOrders(response.data.data)
    } catch (err: any) {
      console.error('Masa siparişleri yüklenirken hata:', err)
      toast.error('Masa siparişleri yüklenemedi')
    } finally {
      setIsLoadingOrders(false)
    }
  }

  const handleTableSelect = (table: Table) => {
    setSelectedTable(table)
    if (table.number) {
      fetchTableOrders(table.number)
    }
  }

  const calculateExistingTotal = () => {
    return selectedTableOrders.reduce((sum, order) => sum + order.total, 0)
  }

  useEffect(() => {
    // Socket bağlantısını başlat
    socket?.connect();

    // Socket event dinleyicilerini ekle
    socketEvents.onNewOrder((order) => {
      console.log('Yeni sipariş alındı:', order);
      if (!order) return;
      
      // Siparişler listesini güncelle
      setOrders(prev => [order, ...(prev || [])]);
      
      // Eğer seçili masa varsa ve bu sipariş o masaya aitse, masa siparişlerini yenile
      if (selectedTable && order.table?.id === selectedTable.id) {
        fetchTableOrders(selectedTable.number);
      }
      
      // Masa durumlarını güncelle
      fetchInitialData();
      
      toast.info('Yeni sipariş alındı!');
    });

    socketEvents.onOrderUpdated((updatedOrder) => {
      console.log('Sipariş güncellendi:', updatedOrder);
      if (!updatedOrder) return;
      
      // Siparişler listesini güncelle
      setOrders(prev => (prev || []).map(order => 
        order?.id === updatedOrder.id ? updatedOrder : order
      ));
      
      // Eğer seçili masa varsa ve bu sipariş o masaya aitse, masa siparişlerini yenile
      if (selectedTable && updatedOrder.table?.id === selectedTable.id) {
        fetchTableOrders(selectedTable.number);
      }
      
      // Masa durumlarını güncelle
      fetchInitialData();
      
      toast.success('Sipariş güncellendi!');
    });

    socketEvents.onOrderDeleted((orderId) => {
      console.log('Sipariş silindi:', orderId);
      if (!orderId) return;
      
      // Siparişler listesini güncelle
      setOrders(prev => (prev || []).filter(order => order?.id !== orderId));
      
      // Seçili masa varsa masa siparişlerini yenile
      if (selectedTable) {
        fetchTableOrders(selectedTable.number);
      }
      
      // Masa durumlarını güncelle
      fetchInitialData();
      
      toast.warning('Sipariş silindi!');
    });

    socketEvents.onTableStatusUpdated((updatedTable) => {
      console.log('Masa durumu güncellendi:', updatedTable);
      if (!updatedTable?.id) return;
      
      // Masa durumlarını güncelle
      setAreas(prev => prev.map(area => ({
        ...area,
        tables: area.tables.map(table => 
          table?.id === updatedTable.id ? { ...table, ...updatedTable } : table
        )
      })));
      
      // Eğer güncellenen masa seçili masaysa, sipariş detaylarını da yenile
      if (selectedTable && selectedTable.id === updatedTable.id) {
        fetchTableOrders(selectedTable.number);
      }
    });

    // İlk verileri yükle
    fetchInitialData()

    return () => {
      // Socket event dinleyicilerini temizle
      socketEvents.cleanup();
      socket?.disconnect();
    }
  }, [router, selectedTable])

  const handleAddToOrder = (product: Product) => {
    setOrderItems(prev => {
      const existingItem = prev.find(item => item.id === product.id)
      if (existingItem) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setOrderItems(prev => prev.filter(item => item.id !== productId))
    } else {
      setOrderItems(prev =>
        prev.map(item =>
          item.id === productId
            ? { ...item, quantity: newQuantity }
            : item
        )
      )
    }
  }

  const handleSaveOrder = async () => {
    if (!selectedTable || orderItems.length === 0) {
      console.log('Sipariş verisi eksik:', { selectedTable, orderItems });
      return;
    }

    try {
      // 1. Siparişi kaydet
      const orderData = {
        tableId: selectedTable.id,
        total: calculateTotal(),
        items: orderItems.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
          note: note || undefined
        }))
      }

      console.log('Sipariş gönderiliyor:', orderData);
      const response = await api.post('/orders', orderData)
      console.log('Sipariş yanıtı:', response.data);
      
      if (response.data.success) {
        // 2. Mutfağa bildirim göndermeyi dene
        try {
          console.log('Mutfak bildirimi gönderiliyor...');
          await api.post('/kitchen/notify', {
            orderId: response.data.order.id,
            tableNumber: selectedTable.number,
            items: orderItems.map(item => ({
              name: item.name,
              quantity: item.quantity,
              note: note || undefined
            }))
          });
          console.log('Mutfak bildirimi gönderildi');

          // 3. Adisyon yazdırmayı dene - Mutfak bildirimi başarılı olduktan sonra
          try {
            console.log('Adisyon yazdırılıyor...');
            await api.post('/kitchen/print', {
              orderId: response.data.order.id,
              tableNumber: selectedTable.number,
              items: orderItems.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                total: item.price * item.quantity
              })),
              totalAmount: calculateTotal(),
              orderTime: new Date().toLocaleTimeString('tr-TR'),
              note: note || undefined
            });
            console.log('Adisyon yazdırıldı');
            toast.success('Sipariş kaydedildi ve adisyon yazdırıldı')
          } catch (err) {
            console.warn('Adisyon yazdırılamadı:', err);
            toast.warning('Sipariş kaydedildi fakat adisyon yazdırılamadı')
          }
        } catch (err) {
          console.warn('Mutfak bildirimi gönderilemedi:', err);
          toast.warning('Sipariş kaydedildi fakat mutfak bildirimi gönderilemedi')
        }

        // Socket üzerinden mutfağa bildirim göndermeyi dene
        try {
          console.log('Socket bildirimi gönderiliyor...');
          socket?.emit('newKitchenOrder', {
            tableNumber: selectedTable.number,
            items: orderItems,
            note: note
          });
          console.log('Socket bildirimi gönderildi');
        } catch (err) {
          console.warn('Socket bildirimi gönderilemedi:', err);
        }

        setOrderItems([])
        setNote('')
        setIsOrderModalOpen(false)
        fetchInitialData()
      } else {
        throw new Error(response.data.message || 'Sipariş kaydedilemedi')
      }
    } catch (err: any) {
      console.error('Sipariş işlenirken hata:', err)
      console.error('Hata detayı:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      });
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Sipariş kaydedilemedi'
      toast.error(errorMessage)
    }
  }

  const handlePrintReceipt = async () => {
    if (!selectedTable) return;

    try {
      const paymentData = {
        paymentMethod,
        cashAmount: paymentMethod === 'cash' ? calculateExistingTotal() :
                   paymentMethod === 'split' ? parseFloat(splitAmounts.cash || '0') : 0,
        creditAmount: paymentMethod === 'credit' ? calculateExistingTotal() :
                     paymentMethod === 'split' ? parseFloat(splitAmounts.credit || '0') : 0
      };

      await api.post('/printer/receipt', {
        tableNumber: selectedTable.number,
        orders: selectedTableOrders,
        payment: paymentData,
        timestamp: new Date().toLocaleString('tr-TR')
      });

      toast.success('Fiş yazdırıldı');
    } catch (err: any) {
      console.error('Fiş yazdırma hatası:', err);
      toast.error('Fiş yazdırılamadı');
    }
  };

  const handlePaymentMethodChange = (method: 'cash' | 'credit' | 'split') => {
    setPaymentMethod(method)
    if (method === 'split') {
      setSplitAmounts({ cash: '', credit: '' })
      setRemainingAmount(calculateExistingTotal())
    }
  }

  const handlePaymentAmountChange = (value: string) => {
    const numValue = value ? parseFloat(value) : 0
    const total = calculateExistingTotal()

    if (paymentMethod === 'split') {
      // Parçalı ödemede nakit miktarını güncelle
      const creditAmount = total - numValue
      setSplitAmounts({
        cash: value,
        credit: creditAmount > 0 ? creditAmount.toFixed(2) : '0'
      })
    } else if (paymentMethod === 'cash') {
      // Nakit ödemede direkt tutarı kaydet
      setPaymentAmount(value)
    }
  }

  const handleSplitCreditChange = (value: string) => {
    const numValue = value ? parseFloat(value) : 0
    const total = calculateExistingTotal()
    
    // Kredi kartı miktarını güncelle, kalanı nakit olarak hesapla
    const cashAmount = total - numValue
    setSplitAmounts({
      cash: cashAmount > 0 ? cashAmount.toFixed(2) : '0',
      credit: value
    })
  }

  const calculateChange = () => {
    if (paymentMethod === 'cash' && paymentAmount) {
      const change = parseFloat(paymentAmount) - calculateExistingTotal();
      return change >= 0 ? change : 0;
    }
    return 0;
  };

  const validatePayment = () => {
    const total = calculateExistingTotal()
    
    if (paymentMethod === 'split') {
      const cashAmount = parseFloat(splitAmounts.cash || '0')
      const creditAmount = parseFloat(splitAmounts.credit || '0')
      const totalPaid = cashAmount + creditAmount
      
      // Toplam tutar ile ödenen tutar eşleşmeli
      return Math.abs(totalPaid - total) < 0.01 && totalPaid > 0
    } else if (paymentMethod === 'cash') {
      // Nakit ödeme için alınan tutar en az toplam tutar kadar olmalı (veya boşsa tam tutar kabul edilir)
      if (!paymentAmount) return true // Boşsa tam tutar kabul et
      return parseFloat(paymentAmount) >= total
    } else if (paymentMethod === 'credit') {
      // Kredi kartı ödemesi için her zaman geçerli
      return true
    }
    
    return false
  }

  const handlePayment = async () => {
    try {
      // Ödeme işlemi için gerekli verileri hazırla
      let paymentData;
      
      if (paymentMethod === 'split') {
        paymentData = {
          paymentMethod: 'SPLIT',
          cashAmount: parseFloat(splitAmounts.cash || '0'),
          creditAmount: parseFloat(splitAmounts.credit || '0')
        }
      } else if (paymentMethod === 'cash') {
        paymentData = {
          paymentMethod: 'CASH',
          cashAmount: calculateExistingTotal(),
          creditAmount: 0
        }
      } else {
        paymentData = {
          paymentMethod: 'CREDIT',
          cashAmount: 0,
          creditAmount: calculateExistingTotal()
        }
      }

      console.log('Ödeme verisi gönderiliyor:', paymentData)

      // Her bir sipariş için ödeme işlemini gerçekleştir
      for (const order of selectedTableOrders) {
        await api.post(`/orders/${order.id}/payment`, paymentData)
      }

      // Başarılı ödeme modalını göster
      setIsPaymentModalOpen(false)
      setIsSuccessModalOpen(true)

      // Seçili masayı ve siparişleri temizle
      setSelectedTable(null)
      setSelectedTableOrders([])
      
      // Tüm siparişleri yeniden yükle
      fetchInitialData()

      toast.success('Ödeme başarıyla tamamlandı!')

    } catch (error: any) {
      console.error('Ödeme işlemi sırasında hata:', error)
      toast.error(error.response?.data?.message || 'Ödeme işlemi başarısız oldu')
    }
  }

  // Adisyon yazdırma fonksiyonu
  const handlePrintBill = async (orderId: string) => {
    try {
      console.log('Adisyon yazdırılıyor:', orderId);
      
      const response = await api.post(`/orders/${orderId}/print-bill`);
      
      if (response.data.success) {
        toast.success('Adisyon başarıyla yazdırıldı!');
      } else {
        toast.error('Adisyon yazdırılamadı: ' + response.data.message);
      }
    } catch (error: any) {
      console.error('Adisyon yazdırma hatası:', error);
      toast.error(error.response?.data?.message || 'Adisyon yazdırılamadı');
    }
  };

  // Tüm masa siparişleri için adisyon yazdırma
  const handlePrintTableBill = async () => {
    try {
      if (selectedTableOrders.length === 0) {
        toast.error('Bu masada yazdırılacak sipariş bulunmuyor');
        return;
      }

      // Her sipariş için adisyon yazdır
      for (const order of selectedTableOrders) {
        await handlePrintBill(order.id);
      }
      
      toast.success(`${selectedTableOrders.length} sipariş için adisyon yazdırıldı`);
    } catch (error: any) {
      console.error('Masa adisyonu yazdırma hatası:', error);
      toast.error('Adisyon yazdırılamadı');
    }
  };

  const handleClose = () => {
    setIsSuccessModalOpen(false);
    setSelectedTable(null);
    fetchInitialData();
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const getTableStatusColor = (status: string) => {
    switch (status) {
      case 'OCCUPIED':
        return 'border-red-500 border-2'
      case 'RESERVED':
        return 'border-yellow-500 border-2'
      default:
        return 'border-emerald-500 border-2'
    }
  }

  const getTableHeaderColor = (status: string) => {
    switch (status) {
      case 'OCCUPIED':
        return 'bg-red-100'
      case 'RESERVED':
        return 'bg-yellow-100'
      default:
        return 'bg-emerald-100'
    }
  }

  const getTableStatusText = (status: string) => {
    switch (status) {
      case 'OCCUPIED':
        return 'Dolu'
      case 'RESERVED':
        return 'Rezerve'
      default:
        return 'Müsait'
    }
  }

  const getTableStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'OCCUPIED':
        return 'destructive'
      case 'RESERVED':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  // Masanın toplam tutarını hesapla
  const calculateTableTotal = (tableNumber: string) => {
    if (!orders) return 0;
    
    const tableOrders = orders.filter(order => 
      order?.table?.number === tableNumber && 
      !['DELIVERED', 'CANCELLED'].includes(order?.status || '')
    );
    return tableOrders.reduce((sum, order) => sum + (order?.total || 0), 0);
  }

  // Masanın sipariş sayısını hesapla
  const getTableOrderCount = (tableNumber: string) => {
    if (!orders) return 0;
    
    return orders.filter(order => 
      order?.table?.number === tableNumber && 
      !['DELIVERED', 'CANCELLED'].includes(order?.status || '')
    ).length;
  }

  // Masa birleştirme/taşıma işlemi
  const handleTableOperation = async () => {
    if (!sourceTable || !targetTable) {
      toast.error('Lütfen kaynak ve hedef masaları seçin')
      return
    }

    try {
      const response = await api.post('/tablet/tables/merge', {
        sourceTableId: sourceTable.id,
        targetTableId: targetTable.id,
        operationType: mergeMode // 'merge' veya 'move'
      })

      if (response.data) {
        toast.success(mergeMode === 'merge' ? 'Masalar başarıyla birleştirildi' : 'Masa başarıyla taşındı')
        setIsMergeModalOpen(false)
        setSourceTable(null)
        setTargetTable(null)
        fetchInitialData()
      }
    } catch (error: any) {
      console.error('Masa işlemi hatası:', error)
      toast.error(error.response?.data?.message || 'İşlem başarısız oldu')
    }
  }

  // Yükleme durumu
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  // Hata durumu
  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="text-destructive mb-4">
            <X className="w-12 h-12 mx-auto" />
          </div>
          <p className="font-medium mb-2">Hata Oluştu</p>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchInitialData} variant="outline">
            Tekrar Dene
          </Button>
        </div>
      </div>
    )
  }

  // Veri yok durumu
  if (!areas.length || !categories.length) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Henüz veri bulunmuyor</p>
          <Button onClick={fetchInitialData} variant="outline">
            Tekrar Dene
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen">
      {/* Ana Masalar Ekranı */}
      <div className={`p-6 bg-gray-50/50 transition-all duration-300 ${selectedTable ? 'hidden' : 'block'}`}>
        <div className="mb-4 flex justify-between items-center">
          <p className="text-sm text-gray-500">Sipariş almak için masa seçin</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setMergeMode('move')
                setIsMergeModalOpen(true)
              }}
              className="flex items-center gap-2"
            >
              <ArrowRightLeft className="h-4 w-4" />
              Masa Taşı
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setMergeMode('merge')
                setIsMergeModalOpen(true)
              }}
              className="flex items-center gap-2"
            >
              <ArrowLeftRight className="h-4 w-4" />
              Masa Birleştir
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full justify-start mb-6 bg-white border rounded-lg p-1">
            <TabsTrigger 
              value="all" 
              className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded"
            >
              Tüm Masalar
            </TabsTrigger>
            {areas.map((area) => (
              <TabsTrigger 
                key={area.id} 
                value={area.id} 
                className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded"
              >
                {area.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Tüm Masalar Tab İçeriği */}
          <TabsContent value="all" className="mt-0">
            <div className="grid grid-cols-4 gap-4">
              {areas.flatMap(area => area.tables)
                .sort((a, b) => parseInt(a.number.slice(1)) - parseInt(b.number.slice(1)))
                .map((table) => {
                const orderCount = getTableOrderCount(table.number);
                const tableTotal = calculateTableTotal(table.number);
                
                return (
                  <Card
                    key={table.id}
                    className={`cursor-pointer border bg-white transition-all hover:scale-[1.02] ${
                      getTableStatusColor(table.status)
                    } ${
                      selectedTable?.id === table.id ? 'ring-2 ring-primary ring-offset-2' : ''
                    }`}
                    onClick={() => handleTableSelect(table)}
                  >
                    <CardHeader className={`p-3 ${getTableHeaderColor(table.status)}`}>
                      <CardTitle className="text-base flex items-center justify-between">
                        <span>{table.name}</span>
                        <Badge variant={getTableStatusBadgeVariant(table.status)}>
                          {getTableStatusText(table.status)}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3">
                      {orderCount > 0 ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Aktif Sipariş:</span>
                            <span className="font-medium">{orderCount}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Toplam Tutar:</span>
                            <span className="font-medium text-green-600">₺{tableTotal.toFixed(2)}</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTableSelect(table);
                            }}
                          >
                            Siparişleri Görüntüle
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="link"
                          size="sm"
                          className="w-full text-blue-600 hover:text-blue-700 p-0 h-auto font-normal"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTableSelect(table);
                          }}
                        >
                          + Sipariş Ekle
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Bölgelere Göre Masalar */}
          {areas.map((area) => (
            <TabsContent key={area.id} value={area.id} className="mt-0">
              <div className="grid grid-cols-4 gap-4">
                {area.tables
                  .sort((a, b) => parseInt(a.number.slice(1)) - parseInt(b.number.slice(1)))
                  .map((table) => {
                  const orderCount = getTableOrderCount(table.number);
                  const tableTotal = calculateTableTotal(table.number);
                  
                  return (
                    <Card
                      key={table.id}
                      className={`cursor-pointer border bg-white transition-all hover:scale-[1.02] ${
                        getTableStatusColor(table.status)
                      } ${
                        selectedTable?.id === table.id ? 'ring-2 ring-primary ring-offset-2' : ''
                      }`}
                      onClick={() => handleTableSelect(table)}
                    >
                      <CardHeader className={`p-3 ${getTableHeaderColor(table.status)}`}>
                        <CardTitle className="text-base flex items-center justify-between">
                          <span>{table.name}</span>
                          <Badge variant={getTableStatusBadgeVariant(table.status)}>
                            {getTableStatusText(table.status)}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3">
                        {orderCount > 0 ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Aktif Sipariş:</span>
                              <span className="font-medium">{orderCount}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Toplam Tutar:</span>
                              <span className="font-medium text-green-600">₺{tableTotal.toFixed(2)}</span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full mt-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTableSelect(table);
                              }}
                            >
                              Siparişleri Görüntüle
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="link"
                            size="sm"
                            className="w-full text-blue-600 hover:text-blue-700 p-0 h-auto font-normal"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTableSelect(table);
                            }}
                          >
                            + Sipariş Ekle
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Tam Ekran Sipariş Detayı */}
      {selectedTable && (
        <div className="fixed inset-0 bg-white animate-in slide-in-from-right duration-300 z-50">
          <div className="h-full flex flex-col">
            {/* Üst Bar */}
            <div className="p-4 border-b flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => {
                    setSelectedTable(null)
                    setOrderItems([])
                    setNote('')
                    setSelectedTableOrders([])
                  }}
                >
                  <X className="h-5 w-5" />
                </Button>
                <div>
                  <h2 className="text-lg font-medium">
                    {selectedTable.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedTableOrders.length > 0 
                      ? `${selectedTableOrders.length} Aktif Sipariş` 
                      : 'Yeni Sipariş'}
                  </p>
                </div>
              </div>
            </div>

            {/* Ana İçerik */}
            <div className="flex-1 flex flex-col min-h-0">
              {/* Üst kısım - Ürün arama */}
              <div className="p-4 border-b bg-white sticky top-[73px] z-10">
                <div className="relative max-w-md mx-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input className="pl-9" placeholder="Ürün ara..." />
                </div>
              </div>

              {/* Orta Kısım */}
              <div className="flex-1 flex min-h-0">
                {/* Sol kısım - Kategoriler */}
                <div className="w-1/4 border-r">
                  <ScrollArea className="h-full">
                    <div className="p-4">
                      {categories.map((category) => (
                        <Button
                          key={category.id}
                          variant="ghost"
                          className={`w-full justify-start font-normal h-auto py-2 px-3 ${
                            selectedCategory === category.id ? 'bg-blue-50 text-blue-600' : ''
                          }`}
                          onClick={() => setSelectedCategory(category.id)}
                        >
                          {category.name}
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Sağ kısım - Siparişler ve Ürünler */}
                <div className="w-3/4 flex">
                  {/* Yeni Sipariş */}
                  <div className="w-1/2 border-r">
                    <ScrollArea className="h-full">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium text-gray-800">Yeni Sipariş</h3>
                          {orderItems.length > 0 && (
                            <Badge variant="outline" className="font-normal text-base">
                              Toplam: ₺{calculateTotal().toFixed(2)}
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {categories
                            .find(c => c.id === selectedCategory)
                            ?.products.map((product) => (
                              <Button
                                key={product.id}
                                variant="outline"
                                className="h-auto py-3 px-4 flex flex-col items-start gap-1 hover:bg-gray-50"
                                onClick={() => handleAddToOrder(product)}
                              >
                                <span className="font-medium">{product.name}</span>
                                <span className="text-green-600">₺{product.price.toFixed(2)}</span>
                              </Button>
                            ))}
                        </div>
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Mevcut Siparişler */}
                  <div className="w-1/2">
                    <ScrollArea className="h-full">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium text-gray-800">Mevcut Siparişler</h3>
                          <div className="flex gap-2 items-center">
                            <Badge variant="outline" className="font-normal text-base">
                              Toplam: ₺{calculateExistingTotal().toFixed(2)}
                            </Badge>
                            <Button
                              size="default"
                              variant="outline"
                              onClick={handlePrintTableBill}
                              className="border-blue-500 text-blue-600 hover:bg-blue-50"
                              disabled={selectedTableOrders.length === 0}
                            >
                              📄 Adisyon Çıkar
                            </Button>
                            <Button
                              size="lg"
                              onClick={() => setIsPaymentModalOpen(true)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Ödeme Al
                            </Button>
                          </div>
                        </div>
                        {selectedTableOrders.length > 0 ? (
                          <div className="space-y-4">
                            {selectedTableOrders.map((order) => (
                              <div 
                                key={order.id} 
                                className="bg-gray-50 rounded-lg p-4"
                              >
                                <div className="flex justify-between items-center mb-3">
                                  <span className="text-sm text-gray-500">
                                    {new Date(order.createdAt).toLocaleTimeString('tr-TR')}
                                  </span>
                                  <Badge variant={order.status === 'NEW' ? 'default' : 'secondary'}>
                                    {order.status === 'NEW' ? 'Yeni' : 'Hazırlanıyor'}
                                  </Badge>
                                </div>
                                {order.items.map((item) => (
                                  <div key={item.id} className="flex justify-between items-center py-1 text-sm">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{item.quantity}x</span>
                                      <span>{item.name}</span>
                                    </div>
                                    <span>₺{(item.price * item.quantity).toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 py-8">
                            <p>Henüz sipariş yok</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </div>
            </div>

            {/* Alt kısım - Sepet */}
            {orderItems.length > 0 ? (
              <div className="border-t p-4 bg-white">
                <div className="max-w-3xl mx-auto">
                  <ScrollArea className="h-[180px]">
                    <div className="space-y-2 pr-4">
                      {orderItems.map((item) => (
                        <div 
                          key={item.id} 
                          className="flex items-center justify-between gap-2"
                        >
                          <div className="flex flex-col flex-1">
                            <span className="font-medium">{item.name}</span>
                            <span className="text-sm text-gray-500">₺{item.price.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <span className="w-20 text-right font-medium">₺{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <Input
                    placeholder="Not ekleyin..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="mt-4"
                  />

                  <div className="flex flex-col gap-2 mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Sipariş Toplamı</span>
                      <span className="text-lg font-semibold text-green-600">₺{calculateTotal().toFixed(2)}</span>
                    </div>

                    {selectedTableOrders.length > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Masa Toplamı</span>
                        <span className="text-lg font-semibold text-blue-600">
                          ₺{(calculateTotal() + calculateExistingTotal()).toFixed(2)}
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setOrderItems([])
                          setNote('')
                        }}
                      >
                        Temizle
                      </Button>
                      <Button
                        className="w-full"
                        onClick={async () => {
                          await handleSaveOrder();
                          // Sipariş kaydedildikten sonra ekranı kapat
                          setSelectedTable(null);
                          setOrderItems([]);
                          setNote('');
                          setSelectedTableOrders([]);
                        }}
                        disabled={orderItems.length === 0}
                      >
                        Kaydet
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center border-t">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <ShoppingCart className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-lg font-medium text-gray-900 mb-1">Henüz ürün eklenmedi</p>
                <p className="text-sm text-gray-500">
                  Soldaki menüden ürün seçerek başlayın
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ödeme Modalı */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              💳 Ödeme İşlemi
            </DialogTitle>
            <p className="text-gray-500">Masa {selectedTable?.name} • {selectedTableOrders.length} Sipariş</p>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Toplam Tutar Gösterimi */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-400 via-green-500 to-green-600 shadow-xl mb-4">
                <div className="text-center text-white">
                  <div className="text-xs font-medium opacity-90">TOPLAM</div>
                  <div className="text-xl font-bold">₺{calculateExistingTotal().toFixed(2)}</div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Ödeme Tutarı</h3>
              <p className="text-sm text-gray-500">Ödenecek toplam tutar</p>
            </div>

            {/* Ödeme Yöntemi Seçimi - Kompakt Kartlar */}
            <div>
              <h4 className="text-base font-semibold text-gray-800 mb-4 text-center">Ödeme Yöntemini Seçin</h4>
              <div className="grid grid-cols-3 gap-4">
                {/* Nakit Ödeme */}
                <div 
                  className={`group cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                    paymentMethod === 'cash' ? 'scale-105' : ''
                  }`}
                  onClick={() => handlePaymentMethodChange('cash')}
                >
                  <div className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                    paymentMethod === 'cash' 
                      ? 'border-green-400 bg-gradient-to-br from-green-50 to-green-100 shadow-lg shadow-green-200/50' 
                      : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-md'
                  }`}>
                    <div className="p-4 text-center">
                      <div className="text-3xl mb-2">💵</div>
                      <h5 className={`text-sm font-bold mb-1 ${
                        paymentMethod === 'cash' ? 'text-green-700' : 'text-gray-700'
                      }`}>
                        Nakit
                      </h5>
                      <p className={`text-xs ${
                        paymentMethod === 'cash' ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        Peşin ödeme
                      </p>
                    </div>
                    {paymentMethod === 'cash' && (
                      <div className="absolute top-2 right-2">
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Kredi Kartı */}
                <div 
                  className={`group cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                    paymentMethod === 'credit' ? 'scale-105' : ''
                  }`}
                  onClick={() => handlePaymentMethodChange('credit')}
                >
                  <div className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                    paymentMethod === 'credit' 
                      ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg shadow-blue-200/50' 
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                  }`}>
                    <div className="p-4 text-center">
                      <div className="text-3xl mb-2">💳</div>
                      <h5 className={`text-sm font-bold mb-1 ${
                        paymentMethod === 'credit' ? 'text-blue-700' : 'text-gray-700'
                      }`}>
                        Kredi Kartı
                      </h5>
                      <p className={`text-xs ${
                        paymentMethod === 'credit' ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        Manual ödeme
                      </p>
                    </div>
                    {paymentMethod === 'credit' && (
                      <div className="absolute top-2 right-2">
                        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Karma Ödeme */}
                <div 
                  className={`group cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                    paymentMethod === 'split' ? 'scale-105' : ''
                  }`}
                  onClick={() => handlePaymentMethodChange('split')}
                >
                  <div className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                    paymentMethod === 'split' 
                      ? 'border-purple-400 bg-gradient-to-br from-purple-50 to-purple-100 shadow-lg shadow-purple-200/50' 
                      : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md'
                  }`}>
                    <div className="p-4 text-center">
                      <div className="text-3xl mb-2">💸</div>
                      <h5 className={`text-sm font-bold mb-1 ${
                        paymentMethod === 'split' ? 'text-purple-700' : 'text-gray-700'
                      }`}>
                        Karma Ödeme
                      </h5>
                      <p className={`text-xs ${
                        paymentMethod === 'split' ? 'text-purple-600' : 'text-gray-500'
                      }`}>
                        Nakit + Kart
                      </p>
                    </div>
                    {paymentMethod === 'split' && (
                      <div className="absolute top-2 right-2">
                        <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Ödeme Detayları */}
            <div className="space-y-4">
              {/* Nakit Ödeme Detayları */}
              {paymentMethod === 'cash' && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 shadow-md">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center mr-3">
                      <span className="text-xl">💵</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-green-800">Nakit Ödeme</h4>
                      <p className="text-sm text-green-600">Müşteriden alınan tutarı girin</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-2">
                        Müşteriden Alınan Tutar
                      </label>
                      <Input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => handlePaymentAmountChange(e.target.value)}
                        placeholder={calculateExistingTotal().toFixed(2)}
                        className="text-2xl h-12 font-bold text-center border-2 border-green-300 focus:border-green-500 bg-white"
                      />
                    </div>
                    
                    {paymentAmount && parseFloat(paymentAmount) > calculateExistingTotal() && (
                      <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-green-300">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center mr-2">
                              <span className="text-sm">💰</span>
                            </div>
                            <div>
                              <span className="text-sm font-semibold text-blue-700">Para Üstü</span>
                              <p className="text-xs text-blue-600">Müşteriye verilecek</p>
                            </div>
                          </div>
                          <span className="text-xl font-bold text-blue-700">
                            ₺{calculateChange().toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Kredi Kartı Ödeme Detayları - Basit Onay */}
              {paymentMethod === 'credit' && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 shadow-md">
                  <div className="text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center">
                        <CreditCard className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-blue-800 mb-2">Kredi Kartı Ödemesi</h4>
                      <p className="text-sm text-blue-600 mb-3">Manual ödeme alımı</p>
                      <div className="text-2xl font-bold text-blue-700">₺{calculateExistingTotal().toFixed(2)}</div>
                    </div>
                    <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-blue-300">
                      <p className="text-xs text-blue-600">
                        💳 Müşteriden kredi kartıyla ödeme alındığını onaylayın
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Karma Ödeme Detayları */}
              {paymentMethod === 'split' && (
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200 shadow-md">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center mr-3">
                      <span className="text-xl">💸</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-purple-800">Karma Ödeme</h4>
                      <p className="text-sm text-purple-600">Nakit ve kart ödemesini ayarlayın</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-purple-700 mb-2">
                        💵 Nakit Miktar
                      </label>
                      <Input
                        type="number"
                        value={splitAmounts.cash}
                        onChange={(e) => handlePaymentAmountChange(e.target.value)}
                        placeholder="0.00"
                        className="text-lg h-10 font-bold text-center border-2 border-purple-300 focus:border-purple-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-purple-700 mb-2">
                        💳 Kredi Kartı
                      </label>
                      <Input
                        type="number"
                        value={splitAmounts.credit}
                        onChange={(e) => handleSplitCreditChange(e.target.value)}
                        placeholder="0.00"
                        className="text-lg h-10 font-bold text-center border-2 border-purple-300 focus:border-purple-500 bg-white"
                      />
                    </div>
                  </div>

                  {/* Kalan Tutar Göstergesi */}
                  <div className="mt-4 bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-purple-300">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-purple-700 font-medium">Kalan Tutar:</span>
                      <span className="text-lg font-bold text-purple-700">
                        ₺{Math.max(0, calculateExistingTotal() - parseFloat(splitAmounts.cash || '0') - parseFloat(splitAmounts.credit || '0')).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Alt Butonlar - Kompakt */}
            <div className="flex gap-4 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                size="lg"
                className="flex-1 h-12 text-base border-2 border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 transition-all duration-300 rounded-lg"
                onClick={() => setIsPaymentModalOpen(false)}
              >
                ❌ İptal Et
              </Button>
              <Button
                size="lg"
                className={`flex-1 h-12 text-base font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md rounded-lg ${
                  paymentMethod === 'cash' 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' 
                    : paymentMethod === 'credit'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                    : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
                }`}
                onClick={handlePayment}
                disabled={!validatePayment()}
              >
                {paymentMethod === 'cash' ? '💵 Nakit Ödeme Al' : 
                 paymentMethod === 'credit' ? '💳 Kart Ödeme Al' : 
                 '💸 Karma Ödeme Al'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Başarılı Ödeme Modalı */}
      <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <DialogContent className="max-w-md">
          <div className="flex flex-col items-center justify-center py-6">
            {/* Başarılı İkonu */}
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            {/* Başarılı Mesajı */}
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Ödeme Başarılı
            </h2>
            <p className="text-gray-500 text-center mb-6">
              {paymentMethod === 'split' 
                ? `Nakit: ₺${splitAmounts.cash} - K.Kartı: ₺${splitAmounts.credit}`
                : paymentMethod === 'cash' 
                  ? `Nakit: ₺${paymentAmount || calculateExistingTotal().toFixed(2)}${paymentAmount && parseFloat(paymentAmount) > calculateExistingTotal() ? ` (Para Üstü: ₺${calculateChange().toFixed(2)})` : ''}`
                  : `Kredi Kartı: ₺${calculateExistingTotal().toFixed(2)}`
              }
            </p>

            {/* Butonlar */}
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                className="flex-1 h-12 transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-md border-2 hover:border-green-400"
                onClick={handlePrintTableBill}
              >
                🖨️ Fiş Bas
              </Button>
              <Button
                className="flex-1 h-12 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                onClick={handleClose}
              >
                ✅ Kapat
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Masa Birleştirme/Taşıma Modalı */}
      <Dialog open={isMergeModalOpen} onOpenChange={setIsMergeModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {mergeMode === 'merge' ? 'Masa Birleştir' : 'Masa Taşı'}
            </DialogTitle>
            <p className="text-sm text-gray-500 mt-2">
              {mergeMode === 'merge' 
                ? 'Birleştirilecek iki dolu masayı seçin' 
                : 'Taşınacak dolu masayı ve hedef masayı seçin'}
            </p>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-8">
            {/* Kaynak Masa Seçimi */}
            <div>
              <h3 className="text-sm font-medium mb-3">
                Kaynak Masa {mergeMode === 'merge' ? '(Dolu)' : '(Siparişli)'}
              </h3>
              <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
                {areas.flatMap(area => area.tables)
                  .filter(table => {
                    // Her iki modda da kaynak masada sipariş olmalı
                    const hasOrders = getTableOrderCount(table.number) > 0;
                    const notSelected = table.id !== targetTable?.id;
                    return hasOrders && notSelected;
                  })
                  .map(table => (
                    <Button
                      key={table.id}
                      variant={sourceTable?.id === table.id ? "default" : "outline"}
                      className="h-auto py-3 px-4"
                      onClick={() => setSourceTable(table)}
                    >
                      <div className="text-left">
                        <div className="font-medium">{table.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {getTableOrderCount(table.number)} Sipariş
                        </div>
                        <div className="text-sm text-green-600">
                          ₺{calculateTableTotal(table.number).toFixed(2)}
                        </div>
                      </div>
                    </Button>
                  ))}
              </div>
            </div>

            {/* Hedef Masa Seçimi */}
            <div>
              <h3 className="text-sm font-medium mb-3">
                Hedef Masa {mergeMode === 'merge' ? '(Dolu)' : '(Tümü)'}
              </h3>
              <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
                {areas.flatMap(area => area.tables)
                  .filter(table => {
                    const notSelected = table.id !== sourceTable?.id;
                    if (mergeMode === 'merge') {
                      // Birleştirme modunda hedef masa da dolu olmalı
                      return getTableOrderCount(table.number) > 0 && notSelected;
                    } else {
                      // Taşıma modunda tüm masalar (kaynak masa hariç) gösterilir
                      return notSelected;
                    }
                  })
                  .map(table => (
                    <Button
                      key={table.id}
                      variant={targetTable?.id === table.id ? "default" : "outline"}
                      className="h-auto py-3 px-4"
                      onClick={() => setTargetTable(table)}
                    >
                      <div className="text-left">
                        <div className="font-medium">{table.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {getTableOrderCount(table.number) > 0 ? (
                            <span>{getTableOrderCount(table.number)} Sipariş</span>
                          ) : (
                            <span className="text-blue-600">Boş Masa</span>
                          )}
                        </div>
                        {getTableOrderCount(table.number) > 0 && (
                          <div className="text-sm text-green-600">
                            ₺{calculateTableTotal(table.number).toFixed(2)}
                          </div>
                        )}
                      </div>
                    </Button>
                  ))}
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setIsMergeModalOpen(false)
                setSourceTable(null)
                setTargetTable(null)
              }}
            >
              İptal
            </Button>
            <Button
              className="flex-1"
              onClick={handleTableOperation}
              disabled={!sourceTable || !targetTable}
            >
              {mergeMode === 'merge' ? 'Birleştir' : 'Taşı'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mevcut Siparişler Başlığı ve Ödeme Butonu */}
      {selectedTableOrders.length > 0 && (
        <div className="sticky top-[73px] z-20 bg-white border-b">
          <div className="max-w-3xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-800">Mevcut Siparişler</h3>
                <p className="text-sm text-gray-500">Masa {selectedTable?.name}</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-sm text-gray-500">Toplam Tutar</div>
                  <div className="text-2xl font-bold text-green-600">₺{calculateExistingTotal().toFixed(2)}</div>
                </div>
                <Button
                  size="lg"
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="h-14 px-6 bg-green-600 hover:bg-green-700 text-lg gap-2"
                >
                  <CreditCard className="h-5 w-5" />
                  Ödeme Al
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 