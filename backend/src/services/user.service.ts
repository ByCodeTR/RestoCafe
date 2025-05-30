import { PrismaClient, User, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Kullanıcı oluştur
export const createUser = async (data: {
  username: string;
  password: string;
  name: string;
  role: Role;
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
    role?: Role;
    isActive?: boolean;
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

// Kullanıcı sil (soft delete)
export const deleteUser = async (id: string) => {
  return await prisma.user.update({
    where: { id },
    data: { isActive: false },
  });
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

// Tüm kullanıcıları getir
export const getAllUsers = async (includeInactive = false) => {
  const users = await prisma.user.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: { createdAt: 'desc' },
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
      isActive: true,
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

// Kullanıcı aktivitelerini getir
export const getUserActivities = async (userId: string) => {
  return await prisma.userActivity.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          role: true,
        },
      },
    },
  });
};

// Kullanıcı aktivitesi ekle
export const addUserActivity = async (data: {
  userId: string;
  action: string;
  details: string;
}) => {
  return await prisma.userActivity.create({
    data,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          role: true,
        },
      },
    },
  });
};

// Kullanıcı rolünü güncelle
export const updateUserRole = async (id: string, role: Role) => {
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