"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { toast } from 'sonner'

interface StockAlert {
  productId: string
  productName: string
  currentStock: number
  minStock: number
}

interface NotificationContextType {
  socket: Socket | null
  stockAlerts: StockAlert[]
  clearStockAlert: (productId: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return;

    // Token kontrolü
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Token bulunamadı. Socket bağlantısı yapılamayacak.');
      return;
    }

    // Socket.IO bağlantısı oluştur
    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    setSocket(newSocket);

    // Admin odasına katıl
    newSocket.emit('join-admin');

    // Düşük stok uyarısı dinle
    newSocket.on('lowStock', (data: StockAlert) => {
      console.log('Düşük stok uyarısı alındı:', data)
      
      // Toast bildirimi göster
      toast.error(`Düşük Stok Uyarısı: ${data.productName}`, {
        description: `Kalan stok: ${data.currentStock} (Min: ${data.minStock})`,
        duration: 10000,
        action: {
          label: 'Stok Sayfasına Git',
          onClick: () => window.location.href = '/admin/stock'
        }
      })

      // Stok uyarıları listesine ekle
      setStockAlerts(prev => {
        const exists = prev.find(alert => alert.productId === data.productId)
        if (exists) {
          return prev.map(alert => 
            alert.productId === data.productId ? data : alert
          )
        }
        return [...prev, data]
      })
    });

    // Bağlantı hatası
    newSocket.on('connect_error', (error) => {
      console.error('Socket bağlantı hatası:', error);
      if (error.message.includes('Authentication')) {
        // Token hatası durumunda localStorage'ı temizle
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Sayfayı yenile (bu kullanıcıyı login sayfasına yönlendirecek)
        window.location.reload();
      }
    });

    // Bağlantı başarılı
    newSocket.on('connect', () => {
      console.log('Socket.IO bağlantısı kuruldu');
    });

    // Cleanup
    return () => {
      newSocket.close()
    }
  }, [isClient])

  const clearStockAlert = (productId: string) => {
    setStockAlerts(prev => prev.filter(alert => alert.productId !== productId))
  }

  return (
    <NotificationContext.Provider value={{ socket, stockAlerts, clearStockAlert }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
} 