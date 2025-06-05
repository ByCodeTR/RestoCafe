import { PrismaClient, User, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Kullanıcı oluştur
export const createUser = async (data: {
  username: string;
  password: string;
  name: string;
  role: UserRole;
  email: string;
}) => {
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      ...data,
      password: hashedPassword,
    },
  });

  // Şifreyi gizle
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// Kullanıcı güncelle
export const updateUser = async (
  id: string,
  data: {
    username?: string;
    password?: string;
    name?: string;
    role?: UserRole;
    email?: string;
  }
) => {
  // Şifre güncellenmişse hashle
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }

  const user = await prisma.user.update({
    where: { id },
    data,
  });

  // Şifreyi gizle
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// Kullanıcı sil (soft delete - kullanıcıyı deaktif et)
export const deleteUser = async (id: string) => {
  // Önce kullanıcının siparişleri olup olmadığını kontrol et
  const orderCount = await prisma.order.count({
    where: { userId: id }
  });

  if (orderCount > 0) {
    // Siparişleri olan kullanıcıları soft delete yap
    return await prisma.user.update({
      where: { id },
      data: { 
        isActive: false,
        username: `deleted_${Date.now()}_${id.slice(0, 8)}` // Username'i unique tutmak için
      }
    });
  } else {
    // Siparişi olmayan kullanıcıları hard delete yap
    return await prisma.user.delete({
      where: { id },
    });
  }
};

// Kullanıcı getir
export const getUser = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new Error('Kullanıcı bulunamadı');
  }

  // Şifreyi gizle
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// Tüm kullanıcıları getir (sadece aktif olanlar)
export const getAllUsers = async () => {
  const users = await prisma.user.findMany({
    where: { 
      isActive: true 
    },
    orderBy: { createdAt: 'desc' }
  });

  // Şifreleri gizle
  return users.map(user => {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  });
};

// Kullanıcı ara
export const searchUsers = async (query: string) => {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { username: { contains: query, mode: 'insensitive' } },
        { name: { contains: query, mode: 'insensitive' } },
      ],
    },
    orderBy: { createdAt: 'desc' },
  });

  // Şifreleri gizle
  return users.map(user => {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  });
};

// Kullanıcı rolünü güncelle
export const updateUserRole = async (id: string, role: UserRole) => {
  const user = await prisma.user.update({
    where: { id },
    data: { role },
  });

  // Şifreyi gizle
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// Kullanıcı şifresini güncelle
export const updateUserPassword = async (
  id: string,
  currentPassword: string,
  newPassword: string
) => {
  // Mevcut kullanıcıyı bul
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new Error('Kullanıcı bulunamadı');
  }

  // Mevcut şifreyi kontrol et
  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isPasswordValid) {
    throw new Error('Mevcut şifre yanlış');
  }

  // Yeni şifreyi hashle ve güncelle
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id },
    data: { password: hashedPassword },
  });

  return true;
}; 