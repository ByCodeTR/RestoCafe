import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from '@/components/ui/use-toast';

let socket: Socket | null = null;

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Token bulunamadı. Socket bağlantısı yapılamayacak.');
      return;
    }

    if (!socket) {
      socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
        auth: {
          token
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
        transports: ['websocket']
      });
    }

    return socket;
  }, []);

  useEffect(() => {
    const currentSocket = connect();
    if (!currentSocket) return;

    function onConnect() {
      setIsConnected(true);
      console.log('Socket bağlantısı başarılı');
    }

    function onDisconnect(reason: string) {
      setIsConnected(false);
      console.log('Socket bağlantısı kesildi:', reason);
      
      // Eğer client tarafından kapatılmadıysa yeniden bağlanmayı dene
      if (reason !== 'io client disconnect') {
        currentSocket.connect();
      }
    }

    function onConnectError(error: Error) {
      console.error('Socket bağlantı hatası:', error.message);
      if (error.message.includes('Authentication')) {
        // Token hatası durumunda localStorage'ı temizle
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Kullanıcıyı bilgilendir
        toast({
          title: "Oturum Hatası",
          description: "Oturumunuz sonlandırıldı. Lütfen tekrar giriş yapın.",
          variant: "destructive"
        });
        // Login sayfasına yönlendir
        window.location.href = '/login';
      }
    }

    currentSocket.on('connect', onConnect);
    currentSocket.on('disconnect', onDisconnect);
    currentSocket.on('connect_error', onConnectError);

    // Component unmount olduğunda
    return () => {
      if (currentSocket) {
        currentSocket.off('connect', onConnect);
        currentSocket.off('disconnect', onDisconnect);
        currentSocket.off('connect_error', onConnectError);
      }
    };
  }, [connect]);

  // Socket instance'ını ve bağlantı durumunu döndür
  return { socket, isConnected };
} 