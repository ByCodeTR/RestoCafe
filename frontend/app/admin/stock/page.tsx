"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Package, 
  AlertTriangle, 
  Plus, 
  Minus, 
  TrendingUp, 
  TrendingDown,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { toast } from "sonner"
import io from 'socket.io-client'

interface Product {
  id: string
  name: string
  stock: number
  minStock: number
  price: number
  category: {
    id: string
    name: string
  }
}

interface StockLog {
  id: string
  quantity: number
  type: 'IN' | 'OUT' | 'ADJUSTMENT'
  createdAt: string
  product: {
    id: string
    name: string
  }
  supplier?: {
    id: string
    name: string
  }
  notes?: string
}

interface Supplier {
  id: string
  name: string
}

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [stockLogs, setStockLogs] = useState<StockLog[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStockStatus, setFilterStockStatus] = useState('all')
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 20
  const [stockForm, setStockForm] = useState({
    type: 'IN' as 'IN' | 'OUT' | 'ADJUSTMENT',
    quantity: '',
    supplierId: '',
    notes: ''
  })

  // Ürünleri getir
  const fetchProducts = async () => {
    try {
      console.log('Ürünler yükleniyor...');
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Oturum süresi dolmuş, lütfen tekrar giriş yapın');
        return;
      }

      const response = await fetch('/api/products', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Gelen ürünler:', data);
        
        // Stok kontrolü ve uyarılar
        data.forEach((product: Product) => {
          if (product.stock <= product.minStock) {
            toast.warning(`Uyarı: ${product.name} ürününün stok miktarı ${product.stock} adet kaldı! (Min: ${product.minStock})`, {
              duration: 5000,
              position: 'top-right',
              icon: <AlertTriangle className="h-5 w-5 text-orange-500" />,
              id: `stock-warning-${product.id}` // Aynı ürün için tekrar tekrar uyarı vermemek için
            });
          }
        });

        setProducts(data);
      } else {
        console.error('API yanıt kodu:', response.status);
        const errorData = await response.text();
        console.error('API hata detayı:', errorData);
        
        if (response.status === 401) {
          toast.error('Oturum süresi dolmuş, lütfen tekrar giriş yapın');
          localStorage.removeItem('token');
          window.location.href = '/admin/login';
        } else {
          toast.error('Ürünler yüklenirken hata oluştu');
        }
      }
    } catch (error) {
      console.error('Ürünler yüklenirken hata:', error);
      toast.error('Ürünler yüklenirken hata oluştu');
    }
  }

  // Stok hareketlerini getir
  const fetchStockLogs = async (page = 1) => {
    try {
      setError(null)
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Oturum süresi dolmuş, lütfen tekrar giriş yapın')
        return
      }

      const response = await fetch(`/api/stock?page=${page}&limit=${itemsPerPage}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Oturum süresi dolmuş, lütfen tekrar giriş yapın')
          localStorage.removeItem('token')
          window.location.href = '/login'
          return
        }
        throw new Error('Stok hareketleri getirilemedi')
      }

      const data = await response.json()
      setStockLogs(data.stockLogs || [])
      setTotalPages(Math.ceil(data.total / itemsPerPage))
      setCurrentPage(page)
    } catch (error) {
      console.error('Stok hareketleri yüklenirken hata:', error)
      setError('Stok hareketleri yüklenirken hata oluştu')
      toast.error('Stok hareketleri yüklenirken hata oluştu')
    }
  }

  // Tedarikçileri getir
  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/suppliers', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setSuppliers(data)
      } else if (response.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
    } catch (error) {
      console.error('Tedarikçiler yüklenirken hata:', error)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchProducts(),
          fetchStockLogs(),
          fetchSuppliers()
        ]);
      } catch (error) {
        console.error('Veri yükleme hatası:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Stok hareketi oluştur
  const handleStockMovement = async () => {
    if (!selectedProduct || !stockForm.quantity) {
      toast.error('Lütfen tüm gerekli alanları doldurun');
      return;
    }

    if (stockForm.type === 'IN' && !stockForm.supplierId) {
      toast.error('Stok girişi için tedarikçi seçimi zorunludur');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Oturum süresi dolmuş, lütfen tekrar giriş yapın');
        return;
      }

      const response = await fetch('/api/stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: selectedProduct.id,
          type: stockForm.type,
          quantity: parseInt(stockForm.quantity),
          supplierId: stockForm.supplierId || null,
          notes: stockForm.notes
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Stok hareketi oluşturulamadı');
      }

      const data = await response.json();

      // Stok hareketi sonrası stok kontrolü
      if (data.product.stock <= 10) {
        toast.warning(`Uyarı: ${data.product.name} ürününün stok miktarı ${data.product.stock} adet kaldı!`, {
          duration: 5000,
          position: 'top-right',
          icon: <AlertTriangle className="h-5 w-5 text-orange-500" />,
          id: `stock-warning-${data.product.id}`
        });
      }
      
      toast.success('Stok hareketi başarıyla oluşturuldu');
      setIsStockDialogOpen(false);
      setStockForm({
        type: 'IN',
        quantity: '',
        supplierId: '',
        notes: ''
      });
      setSelectedProduct(null);
      
      // Verileri yenile
      await Promise.all([
        fetchProducts(),
        fetchStockLogs(currentPage)
      ]);
    } catch (error) {
      console.error('Stok hareketi oluşturma hatası:', error);
      toast.error(error instanceof Error ? error.message : 'Stok hareketi oluşturulamadı');
    }
  };

  // Filtrelenmiş ürünler
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || product.category.name === filterCategory
    const matchesStockStatus = 
      filterStockStatus === 'all' ||
      (filterStockStatus === 'low' && product.stock <= product.minStock && product.stock > 0) ||
      (filterStockStatus === 'out' && product.stock === 0) ||
      (filterStockStatus === 'normal' && product.stock > product.minStock)
    
    return matchesSearch && matchesCategory && matchesStockStatus
  })

  // Düşük stok ürünleri (10 ve altı)
  const lowStockProducts = products.filter(p => p.stock <= 10 && p.stock > 0)
  
  // Biten ürünler
  const outOfStockProducts = products.filter(p => p.stock === 0)

  // Kategoriler
  const categories = [...new Set(products.map(p => p.category.name))]

  // Toplam stok değeri
  const totalStockValue = products.reduce((sum, p) => sum + (p.stock * (p.price || 0)), 0);

  // Stok durumu badge'i
  const getStockStatusBadge = (product: Product) => {
    if (product.stock === 0) {
      return <Badge variant="destructive">Tükendi</Badge>
    } else if (product.stock <= 10) {
      return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Düşük Stok</Badge>
    } else {
      return <Badge variant="default" className="bg-green-100 text-green-800">Normal</Badge>
    }
  }

  // Stok hareket tipi badge'i
  const getStockLogTypeBadge = (type: string) => {
    switch (type) {
      case 'IN':
        return <Badge variant="default" className="bg-green-100 text-green-800">Giriş</Badge>
      case 'OUT':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Çıkış</Badge>
      case 'ADJUSTMENT':
        return <Badge variant="outline">Düzeltme</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  // Stok raporu indir
  const downloadStockReport = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Oturum süresi dolmuş, lütfen tekrar giriş yapın')
        return
      }

      const response = await fetch('/api/stock/report?format=csv', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `stok-raporu-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Stok raporu başarıyla indirildi')
      } else if (response.status === 401) {
        toast.error('Oturum süresi dolmuş, lütfen tekrar giriş yapın')
        localStorage.removeItem('token')
        window.location.href = '/login'
      } else {
        toast.error('Rapor indirilemedi')
      }
    } catch (error) {
      console.error('Rapor indirme hatası:', error)
      toast.error('Rapor indirilemedi')
    }
  }

  // Stok bildirimleri için socket.io dinleyicisi
  useEffect(() => {
    const socket = io('http://localhost:5000')

    socket.on('lowStock', (data) => {
      toast.warning(data.message, {
        duration: 5000,
        position: 'top-right',
        icon: <AlertTriangle className="h-5 w-5 text-orange-500" />,
        id: `stock-warning-${data.productId}`
      })
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-800 font-medium mb-2">Hata Oluştu</p>
          <p className="text-gray-600">{error}</p>
          <Button onClick={() => fetchStockLogs(currentPage)} variant="outline" className="mt-4">
            Tekrar Dene
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stok Yönetimi</h1>
          <p className="text-muted-foreground">Ürün stoklarını takip edin ve yönetin</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadStockReport}>
            <Download className="h-4 w-4 mr-2" />
            Rapor Al
          </Button>
        </div>
      </div>

      {/* Özet Kartları */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Ürün</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">Aktif ürün sayısı</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Düşük Stok</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{lowStockProducts.length}</div>
            <p className="text-xs text-muted-foreground">10 ve altında kalan ürünler</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tükenen Ürünler</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfStockProducts.length}</div>
            <p className="text-xs text-muted-foreground">Stokta kalmayan ürünler</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Stok Değeri</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₺{totalStockValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Toplam değer</p>
          </CardContent>
        </Card>
      </div>

      {/* Biten Ürün Uyarıları */}
      {outOfStockProducts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <TrendingDown className="h-5 w-5" />
              Biten Ürünler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {outOfStockProducts.slice(0, 5).map(product => (
                <div key={product.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div>
                    <span className="font-medium">{product.name}</span>
                    <span className="text-sm text-muted-foreground ml-2">({product.category.name})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">Tükendi</Badge>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        setSelectedProduct(product)
                        setStockForm(prev => ({ ...prev, type: 'IN' }))
                        setIsStockDialogOpen(true)
                      }}
                    >
                      Stok Ekle
                    </Button>
                  </div>
                </div>
              ))}
              {outOfStockProducts.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  +{outOfStockProducts.length - 5} ürün daha tükendi
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Düşük Stok Uyarıları */}
      {lowStockProducts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Düşük Stok Uyarıları
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {lowStockProducts.slice(0, 5).map(product => (
                <div key={product.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div>
                    <span className="font-medium">{product.name}</span>
                    <span className="text-sm text-muted-foreground ml-2">({product.category.name})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      Kalan: <span className="font-bold text-orange-600">{product.stock}</span> / 
                      Min: <span className="text-muted-foreground">{product.minStock}</span>
                    </span>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        setSelectedProduct(product)
                        setStockForm(prev => ({ ...prev, type: 'IN' }))
                        setIsStockDialogOpen(true)
                      }}
                    >
                      Stok Ekle
                    </Button>
                  </div>
                </div>
              ))}
              {lowStockProducts.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  +{lowStockProducts.length - 5} ürün daha düşük stokta
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtreler */}
      <Card>
        <CardHeader>
          <CardTitle>Ürün Stokları</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Ürün ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Kategori seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Kategoriler</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStockStatus} onValueChange={setFilterStockStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Stok durumu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="normal">Normal Stok</SelectItem>
                <SelectItem value="low">Düşük Stok</SelectItem>
                <SelectItem value="out">Tükenen Ürünler</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ürün Adı</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Mevcut Stok</TableHead>
                  <TableHead>Minimum Stok</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category.name}</TableCell>
                    <TableCell>
                      <span className={`font-bold ${product.stock <= product.minStock ? 'text-orange-600' : 'text-green-600'}`}>
                        {product.stock}
                      </span>
                    </TableCell>
                    <TableCell>{product.minStock}</TableCell>
                    <TableCell>{getStockStatusBadge(product)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedProduct(product)
                            setStockForm(prev => ({ ...prev, type: 'IN' }))
                            setIsStockDialogOpen(true)
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedProduct(product)
                            setStockForm(prev => ({ ...prev, type: 'OUT' }))
                            setIsStockDialogOpen(true)
                          }}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Son Stok Hareketleri */}
      <Card>
        <CardHeader>
          <CardTitle>Son Stok Hareketleri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Ürün</TableHead>
                  <TableHead>İşlem</TableHead>
                  <TableHead>Miktar</TableHead>
                  <TableHead>Tedarikçi</TableHead>
                  <TableHead>Not</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockLogs && stockLogs.length > 0 ? (
                  stockLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {new Date(log.createdAt).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell>{log.product.name}</TableCell>
                      <TableCell>{getStockLogTypeBadge(log.type)}</TableCell>
                      <TableCell>{log.quantity}</TableCell>
                      <TableCell>{log.supplier?.name || '-'}</TableCell>
                      <TableCell>{log.notes || '-'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <Package className="w-12 h-12 mb-2 opacity-50" />
                        <p>Henüz stok hareketi bulunmuyor</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchStockLogs(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Önceki
              </Button>
              <div className="text-sm text-muted-foreground">
                Sayfa {currentPage} / {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchStockLogs(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Sonraki
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stok Hareketi Dialog */}
      <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Stok Hareketi</DialogTitle>
            <DialogDescription>
              {selectedProduct?.name} için stok hareketi oluşturun
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">Tip</Label>
              <Select value={stockForm.type} onValueChange={(value: 'IN' | 'OUT' | 'ADJUSTMENT') => 
                setStockForm(prev => ({ ...prev, type: value }))
              }>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN">Stok Girişi</SelectItem>
                  <SelectItem value="OUT">Stok Çıkışı</SelectItem>
                  <SelectItem value="ADJUSTMENT">Stok Düzeltme</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">Miktar</Label>
              <Input
                id="quantity"
                type="number"
                value={stockForm.quantity}
                onChange={(e) => setStockForm(prev => ({ ...prev, quantity: e.target.value }))}
                className="col-span-3"
                placeholder="Miktar girin"
              />
            </div>
            {stockForm.type === 'IN' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="supplier" className="text-right">Tedarikçi</Label>
                <Select value={stockForm.supplierId} onValueChange={(value) => 
                  setStockForm(prev => ({ ...prev, supplierId: value }))
                }>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Tedarikçi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">Not</Label>
              <Input
                id="notes"
                value={stockForm.notes}
                onChange={(e) => setStockForm(prev => ({ ...prev, notes: e.target.value }))}
                className="col-span-3"
                placeholder="Açıklama (opsiyonel)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStockDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleStockMovement}>
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 