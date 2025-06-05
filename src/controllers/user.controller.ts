import { Request, Response } from 'express';
import {
  createUser,
  updateUser,
  deleteUser,
  getUser,
  getAllUsers,
  searchUsers,
  updateUserRole,
  updateUserPassword,
} from '../services/user.service';
import { UserRole } from '@prisma/client';

// Kullanıcı oluştur
export const create = async (req: Request, res: Response) => {
  try {
    const { username, password, name, role, email } = req.body;

    if (!username || !password || !name || !role || !email) {
      return res.status(400).json({
        message: 'Tüm alanlar zorunludur',
      });
    }

    const user = await createUser({
      username,
      password,
      name,
      role: role as UserRole,
      email,
    });

    res.status(201).json(user);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Kullanıcı oluşturulamadı' });
  }
};

// Kullanıcı güncelle
export const update = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { username, password, name, role, email } = req.body;

    const user = await updateUser(id, {
      username,
      password,
      name,
      role: role as UserRole,
      email,
    });

    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Kullanıcı güncellenemedi' });
  }
};

// Kullanıcı sil
export const remove = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deleteUser(id);
    res.json({ message: 'Kullanıcı silindi' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Kullanıcı silinemedi' });
  }
};

// Kullanıcı getir
export const get = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await getUser(id);
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Kullanıcı bulunamadı' });
  }
};

// Tüm kullanıcıları getir
export const getAll = async (req: Request, res: Response) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Kullanıcılar listelenemedi' });
  }
};

// Kullanıcı ara
export const search = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        message: 'Arama terimi gerekli',
      });
    }

    const users = await searchUsers(query as string);
    res.json(users);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Kullanıcılar aranamadı' });
  }
};

// Kullanıcı aktivitelerini getir
export const getActivities = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Bu özellik henüz implement edilmemiş
    res.status(501).json({ message: 'Bu özellik henüz kullanılabilir değil' });
  } catch (error) {
    console.error('Get user activities error:', error);
    res.status(500).json({ message: 'Kullanıcı aktiviteleri alınamadı' });
  }
};

// Kullanıcı rolünü güncelle
export const updateRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        message: 'Rol seçilmedi',
      });
    }

    const user = await updateUserRole(id, role as UserRole);
    res.json(user);
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Kullanıcı rolü güncellenemedi' });
  }
};

// Kullanıcı şifresini güncelle
export const updatePassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: 'Mevcut şifre ve yeni şifre zorunludur',
      });
    }

    await updateUserPassword(id, currentPassword, newPassword);
    res.json({ message: 'Şifre başarıyla güncellendi' });
  } catch (error) {
    console.error('Update user password error:', error);
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Şifre güncellenemedi' });
    }
  }
}; 