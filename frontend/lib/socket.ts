"use client";

import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

const getSocket = () => {
  // Eğer window tanımlı değilse (server-side), boş dön
  if (typeof window === 'undefined') {
    return null;
  }

  // Önce localStorage'dan token'ı al
  let token = localStorage.getItem('token');

  // Eğer localStorage'da yoksa cookie'den kontrol et
  if (!token) {
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(c => c.trim().startsWith('token='));
    if (tokenCookie) {
      token = tokenCookie.split('=')[1];
    }
  }

  // Token yoksa null dön
  if (!token) {
    return null;
  }

  // Socket.IO bağlantısını oluştur
  const socket = io(SOCKET_URL, {
    auth: {
      token
    },
    transports: ['websocket'],
    autoConnect: true, // Otomatik bağlantıyı aktif et
    reconnection: true, // Yeniden bağlanmayı aktif et
    reconnectionAttempts: 5, // Maksimum 5 kez yeniden bağlanmayı dene
    reconnectionDelay: 1000, // İlk denemede 1 saniye bekle
    reconnectionDelayMax: 5000, // Maksimum 5 saniye bekleme süresi
    timeout: 10000 // 10 saniye bağlantı zaman aşımı
  });

  // Bağlantı yönetimi
  socket.on('connect', () => {
    console.log('Socket.IO bağlantısı kuruldu');
    
    // Admin room'una katıl
    socket.emit('join', 'admin');
    console.log('Admin room\'una katıldı');
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket.IO bağlantısı kesildi:', reason);
  });

  // Hata yönetimi
  socket.on('connect_error', (error) => {
    console.error('Socket bağlantı hatası:', error.message);
    
    if (error.message === 'Invalid authentication token') {
      // Token geçersiz, kullanıcıyı logout yap
      localStorage.removeItem('token');
      window.location.href = '/admin/login';
    }
  });

  return socket;
};

// Socket instance'ı oluştur
let socketInstance: ReturnType<typeof io> | null = null;

// Socket bağlantısını başlat veya var olan bağlantıyı döndür
export const initSocket = () => {
  if (!socketInstance) {
    socketInstance = getSocket();
  }
  return socketInstance;
};

// Default export olarak socket'i export et
const socket = initSocket();
export default socket;

// Named export olarak da export et (geriye uyumluluk için)
export { socket, getSocket };

// Socket event dinleyicileri
export const socketEvents = {
  onNewOrder: (callback: (order: any) => void) => {
    const socket = initSocket();
    if (socket) {
      socket.on('newOrder', callback);
    }
  },
  onOrderUpdated: (callback: (order: any) => void) => {
    const socket = initSocket();
    if (socket) {
      socket.on('orderUpdated', callback);
    }
  },
  onOrderDeleted: (callback: (orderId: string) => void) => {
    const socket = initSocket();
    if (socket) {
      socket.on('orderDeleted', callback);
    }
  },
  onTableStatusUpdated: (callback: (table: any) => void) => {
    const socket = initSocket();
    if (socket) {
      socket.on('tableStatusUpdated', callback);
      // İlk bağlantıda mevcut masa durumlarını iste
      socket.emit('requestTableStatuses');
    }
  },
  // Event dinleyicilerini temizle
  cleanup: () => {
    if (socketInstance) {
      socketInstance.off('newOrder');
      socketInstance.off('orderUpdated');
      socketInstance.off('orderDeleted');
      socketInstance.off('tableStatusUpdated');
    }
  },
  // Bağlantıyı kapat
  disconnect: () => {
    if (socketInstance) {
      socketInstance.disconnect();
      socketInstance = null;
    }
  }
}; 