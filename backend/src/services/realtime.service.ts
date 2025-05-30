import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Bağlı kullanıcıları takip etmek için
interface ConnectedUser {
  socketId: string;
  userId: string;
  role: string;
}

let connectedUsers: ConnectedUser[] = [];

// Socket.IO olaylarını yönet
export const handleSocketEvents = (io: Server, socket: Socket) => {
  // Kullanıcı bağlandığında
  socket.on('user:connect', async (data: { userId: string; role: string }) => {
    const { userId, role } = data;

    // Kullanıcıyı bağlı kullanıcılar listesine ekle
    connectedUsers.push({
      socketId: socket.id,
      userId,
      role,
    });

    // Kullanıcıya özel oda oluştur
    socket.join(`user:${userId}`);

    // Role özel odalara katıl
    socket.join(`role:${role}`);

    // Aktivite logu oluştur
    await prisma.userActivity.create({
      data: {
        userId,
        action: 'SOCKET_CONNECT',
        details: `Gerçek zamanlı bağlantı kuruldu: ${socket.id}`,
      },
    });

    // Bağlantı durumunu yayınla
    io.emit('users:status', getOnlineUsers());
  });

  // Kullanıcı ayrıldığında
  socket.on('disconnect', async () => {
    const user = connectedUsers.find(u => u.socketId === socket.id);
    if (user) {
      // Aktivite logu oluştur
      await prisma.userActivity.create({
        data: {
          userId: user.userId,
          action: 'SOCKET_DISCONNECT',
          details: `Gerçek zamanlı bağlantı kesildi: ${socket.id}`,
        },
      });

      // Kullanıcıyı listeden çıkar
      connectedUsers = connectedUsers.filter(u => u.socketId !== socket.id);

      // Bağlantı durumunu yayınla
      io.emit('users:status', getOnlineUsers());
    }
  });

  // Masa durumu değiştiğinde
  socket.on('table:statusChanged', (data) => {
    // Tüm garson ve kasiyer rolündeki kullanıcılara bildir
    io.to('role:WAITER').to('role:CASHIER').emit('table:statusUpdated', data);
  });

  // Yeni sipariş oluşturulduğunda
  socket.on('order:created', (data) => {
    // Mutfak ve kasa rolündeki kullanıcılara bildir
    io.to('role:KITCHEN').to('role:CASHIER').emit('order:new', data);
  });

  // Sipariş durumu güncellendiğinde
  socket.on('order:statusChanged', (data) => {
    // İlgili garsona ve mutfağa bildir
    io.to(`user:${data.waiterId}`).to('role:KITCHEN').emit('order:statusUpdated', data);
  });

  // Adisyon talebi oluşturulduğunda
  socket.on('billRequest:created', (data) => {
    // Kasiyerlere bildir
    io.to('role:CASHIER').emit('billRequest:new', data);
  });

  // Adisyon talebi güncellendiğinde
  socket.on('billRequest:statusChanged', (data) => {
    // İlgili garsona ve kasiyerlere bildir
    io.to(`user:${data.waiterId}`).to('role:CASHIER').emit('billRequest:statusUpdated', data);
  });

  // Stok durumu güncellendiğinde
  socket.on('stock:updated', (data) => {
    // Tüm kullanıcılara bildir
    io.emit('stock:statusUpdated', data);
  });
};

// Çevrimiçi kullanıcıları getir
export const getOnlineUsers = () => {
  return connectedUsers.map(user => ({
    userId: user.userId,
    role: user.role,
  }));
};

// Kullanıcının bağlı olup olmadığını kontrol et
export const isUserOnline = (userId: string) => {
  return connectedUsers.some(user => user.userId === userId);
};

// Role göre bağlı kullanıcıları getir
export const getOnlineUsersByRole = (role: string) => {
  return connectedUsers
    .filter(user => user.role === role)
    .map(user => ({
      userId: user.userId,
      socketId: user.socketId,
    }));
}; 