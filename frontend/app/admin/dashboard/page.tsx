"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, ShoppingBag, Users, Coffee, Plus, FileText, Settings, AlertTriangle, Package, Bell, CreditCard, Banknote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { io, Socket } from 'socket.io-client'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const recentOrders = [
  {
    id: "#1234",
    table: "Masa 5",
    amount: 245.00,
    status: "completed",
    date: "2024-03-21 14:30"
  },
  {
    id: "#1233",
    table: "Masa 3",
    amount: 180.50,
    status: "preparing",
    date: "2024-03-21 14:25"
  },
  {
    id: "#1232",
    table: "Masa 8",
    amount: 320.75,
    status: "completed",
    date: "2024-03-21 14:15"
  },
  {
    id: "#1231",
    table: "Masa 12",
    amount: 150.00,
    status: "preparing",
    date: "2024-03-21 14:10"
  },
  {
    id: "#1230",
    table: "Masa 2",
    amount: 95.50,
    status: "completed",
    date: "2024-03-21 14:00"
  }
]

interface Product {
  id: string
  name: string
  stock: number
  minStock: number
  category: {
    id: string
    name: string
  }
}

interface DashboardStats {
  dailySales: number
  dailyCreditCard: number
  dailyCash: number
  activeTableCount: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([])
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    dailySales: 0,
    dailyCreditCard: 0,
    dailyCash: 0,
    activeTableCount: 0
  })
  const [loading, setLoading] = useState(true)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [newOrdersCount, setNewOrdersCount] = useState(0)

  // Dashboard istatistiklerini getir
  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/reports/dashboard-stats')
      if (response.status === 200) {
        setDashboardStats(response.data)
      }
    } catch (error) {
      console.error('Dashboard istatistikleri yüklenirken hata:', error)
    }
  }

  // Düşük stok ürünlerini getir
  const fetchLowStockProducts = async () => {
    try {
      const response = await api.get('/products')
      if (response.status === 200) {
        const products = response.data
        const lowStock = products.filter((p: Product) => p.stock <= p.minStock)
        setLowStockProducts(lowStock.slice(0, 5)) // İlk 5 ürün
      }
    } catch (error) {
      console.error('Düşük stok ürünleri yüklenirken hata:', error)
    }
  }

  // Socket.IO bağlantısı kur
  const initializeSocket = () => {
    const token = localStorage.getItem('token')
    if (!token) return

    const newSocket = io('http://localhost:5000', {
      auth: { token }
    })

    newSocket.on('connect', () => {
      console.log('Admin Socket.IO bağlantısı kuruldu')
    })

    newSocket.on('newOrder', (orderData) => {
      console.log('Yeni sipariş bildirimi alındı:', orderData)
      
      // Toast bildirimi göster
      toast.success(`Yeni Sipariş! 🍽️`, {
        description: `${orderData.table.name || orderData.table.number} - ₺${orderData.total.toFixed(2)}`,
        action: {
          label: "Görüntüle",
          onClick: () => router.push('/admin/orders')
        }
      })

      // Bildirim sayısını artır
      setNewOrdersCount(prev => prev + 1)

      // Dashboard istatistiklerini yenile
      fetchDashboardStats()

      // Bildirim sesi çal
      playNotificationSound()
    })

    setSocket(newSocket)
  }

  const playNotificationSound = () => {
    // Basit bir beep sesi için kısa audio URL kullanıyoruz
    try {
      const audio = new Audio('/notification.mp3')
      audio.volume = 0.5
      audio.play().catch(e => console.log('Ses çalma hatası:', e))
    } catch (error) {
      console.log('Ses dosyası bulunamadı, varsayılan beep kullanılıyor')
      // Fallback olarak context audioContext ile beep sesi
    }
  }

  // Component mount ve unmount işlemleri
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([
        fetchDashboardStats(),
        fetchLowStockProducts()
      ])
      setLoading(false)
    }

    loadData()
    initializeSocket()

    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [])

  const handleNotificationClear = () => {
    setNewOrdersCount(0)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'preparing':
        return 'bg-yellow-100 text-yellow-800'
      case 'pending':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Tamamlandı'
      case 'preparing':
        return 'Hazırlanıyor'
      case 'pending':
        return 'Bekliyor'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <div className="flex items-center space-x-4">
          {newOrdersCount > 0 && (
            <div className="flex items-center space-x-2">
              <Badge variant="destructive" className="animate-pulse">
                {newOrdersCount} yeni sipariş
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleNotificationClear}
              >
                <Bell className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Günlük İstatistik Kartları */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Günlük Satış</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashboardStats.dailySales)}</div>
            <p className="text-xs text-muted-foreground">
              Bugünkü toplam satış
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Masa</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.activeTableCount}</div>
            <p className="text-xs text-muted-foreground">
              Dolu masa sayısı
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kredi Kartı</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashboardStats.dailyCreditCard)}</div>
            <p className="text-xs text-muted-foreground">
              Günlük kart ödeme
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nakit Ödeme</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashboardStats.dailyCash)}</div>
            <p className="text-xs text-muted-foreground">
              Günlük nakit ödeme
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Son Siparişler</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/orders">
                Tümünü Gör
                <FileText className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sipariş</TableHead>
                  <TableHead>Masa</TableHead>
                  <TableHead>Tutar</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.table}</TableCell>
                    <TableCell>{formatCurrency(order.amount)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusText(order.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Low Stock Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-orange-600" />
              Düşük Stok Uyarısı
            </CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/inventory">
                <Package className="mr-2 h-4 w-4" />
                Stok Yönetimi
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="mx-auto h-12 w-12 mb-4 text-gray-300" />
                <p>Düşük stoklu ürün bulunmamaktadır.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ürün</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Mevcut</TableHead>
                    <TableHead>Min.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category.name}</TableCell>
                      <TableCell>
                        <Badge variant={product.stock === 0 ? "destructive" : "secondary"}>
                          {product.stock}
                        </Badge>
                      </TableCell>
                      <TableCell>{product.minStock}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}