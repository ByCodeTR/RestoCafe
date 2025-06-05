import { Request, Response } from 'express';
import {
  waiterLogin,
  waiterLogout,
  checkActiveSession,
  getWaiterTables,
  getWaiterStats,
  getWaiterSessionHistory,
} from '../services/waiter.service';

// Garson girişi
export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: 'Kullanıcı adı ve şifre zorunludur',
      });
    }

    const result = await waiterLogin(username, password);
    res.json(result);
  } catch (error) {
    console.error('Waiter login error:', error);
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Giriş yapılamadı' });
    }
  }
};

// Garson çıkışı
export const logout = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        message: 'Oturum ID gerekli',
      });
    }

    await waiterLogout(sessionId);
    res.json({ message: 'Çıkış başarılı' });
  } catch (error) {
    console.error('Waiter logout error:', error);
    res.status(500).json({ message: 'Çıkış yapılamadı' });
  }
};

// Oturum kontrolü
export const checkSession = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        message: 'Token gerekli',
      });
    }

    const session = await checkActiveSession(token);
    res.json(session);
  } catch (error) {
    console.error('Check session error:', error);
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Oturum kontrol edilemedi' });
    }
  }
};

// Garsonun aktif masalarını getir
export const getTables = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const tables = await getWaiterTables(userId);
    res.json(tables);
  } catch (error) {
    console.error('Get waiter tables error:', error);
    res.status(500).json({ message: 'Masalar listelenemedi' });
  }
};

// Garsonun günlük istatistiklerini getir
export const getStats = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const stats = await getWaiterStats(userId);
    res.json(stats);
  } catch (error) {
    console.error('Get waiter stats error:', error);
    res.status(500).json({ message: 'İstatistikler alınamadı' });
  }
};

// Garsonun oturum geçmişini getir
export const getSessionHistory = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const sessions = await getWaiterSessionHistory(userId);
    res.json(sessions);
  } catch (error) {
    console.error('Get session history error:', error);
    res.status(500).json({ message: 'Oturum geçmişi alınamadı' });
  }
}; 