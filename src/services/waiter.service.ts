import { PrismaClient, User, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Garson girişi
export const waiterLogin = async (username: string, password: string) => {
  // Kullanıcıyı bul
  const user = await prisma.user.findFirst({
    where: {
      username,
      role: UserRole.WAITER,
      isActive: true,
    },
  });

  if (!user) {
    throw new Error('Kullanıcı bulunamadı');
  }

  // Şifreyi kontrol et
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Geçersiz şifre');
  }

  // JWT token oluştur
  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
    },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '12h' }
  );

  // Oturum kaydı oluştur
  const session = await prisma.waiterSession.create({
    data: {
      userId: user.id,
      token,
      deviceInfo: 'Tablet',
      isActive: true,
    },
  });

  // Kullanıcı aktivitesi ekle
  await prisma.userActivity.create({
    data: {
      userId: user.id,
      action: 'LOGIN',
      details: 'Tablet uygulamasına giriş yapıldı',
    },
  });

  // Şifreyi gizle
  const { password: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    token,
    sessionId: session.id,
  };
};

// Garson çıkışı
export const waiterLogout = async (sessionId: string) => {
  // Oturumu bul ve kapat
  const session = await prisma.waiterSession.update({
    where: { id: sessionId },
    data: { isActive: false },
    include: { user: true },
  });

  // Kullanıcı aktivitesi ekle
  await prisma.userActivity.create({
    data: {
      userId: session.userId,
      action: 'LOGOUT',
      details: 'Tablet uygulamasından çıkış yapıldı',
    },
  });

  return true;
};

// Aktif oturumu kontrol et
export const checkActiveSession = async (token: string) => {
  // Oturumu bul
  const session = await prisma.waiterSession.findFirst({
    where: {
      token,
      isActive: true,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          role: true,
          isActive: true,
        },
      },
    },
  });

  if (!session || !session.user.isActive) {
    throw new Error('Geçersiz oturum');
  }

  return session;
};

// Garsonun aktif masalarını getir
export const getWaiterTables = async (userId: string) => {
  return await prisma.table.findMany({
    where: {
      orders: {
        some: {
          status: { in: ['ACTIVE', 'IN_PROGRESS'] },
          waiterId: userId,
        },
      },
    },
    include: {
      area: true,
      orders: {
        where: {
          status: { in: ['ACTIVE', 'IN_PROGRESS'] },
          waiterId: userId,
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      },
    },
  });
};

// Garsonun günlük istatistiklerini getir
export const getWaiterStats = async (userId: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const orders = await prisma.order.findMany({
    where: {
      waiterId: userId,
      createdAt: {
        gte: today,
      },
    },
    include: {
      items: true,
    },
  });

  return {
    totalOrders: orders.length,
    totalAmount: orders.reduce((sum, order) => sum + order.totalAmount, 0),
    activeOrders: orders.filter(order => 
      order.status === 'ACTIVE' || order.status === 'IN_PROGRESS'
    ).length,
    completedOrders: orders.filter(order => order.status === 'COMPLETED').length,
  };
};

// Garsonun oturum geçmişini getir
export const getWaiterSessionHistory = async (userId: string) => {
  return await prisma.waiterSession.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
}; 