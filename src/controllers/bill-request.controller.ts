import { Request, Response } from 'express';
import {
  createBillRequest,
  updateBillRequest,
  getActiveBillRequest,
  getWaiterActiveBillRequests,
  getAllActiveBillRequests,
} from '../services/bill-request.service';
import { BillRequestStatus } from '@prisma/client';

// Adisyon talebi oluştur
export const create = async (req: Request, res: Response) => {
  try {
    const { tableId, note } = req.body;
    const waiterId = req.user.id; // Auth middleware'den gelen kullanıcı

    if (!tableId) {
      return res.status(400).json({
        message: 'Masa seçilmeli',
      });
    }

    const billRequest = await createBillRequest(tableId, waiterId, note);
    
    // Socket.IO ile bildirim gönder
    const io = req.app.get('io');
    io.emit('billRequest:created', billRequest);

    res.json(billRequest);
  } catch (error) {
    console.error('Create bill request error:', error);
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Adisyon talebi oluşturulamadı' });
    }
  }
};

// Adisyon talebini güncelle
export const update = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const { status, note } = req.body;
    const userId = req.user.id; // Auth middleware'den gelen kullanıcı

    if (!status || !Object.values(BillRequestStatus).includes(status)) {
      return res.status(400).json({
        message: 'Geçersiz durum',
      });
    }

    const billRequest = await updateBillRequest(requestId, status, userId, note);

    // Socket.IO ile bildirim gönder
    const io = req.app.get('io');
    io.emit('billRequest:updated', billRequest);

    res.json(billRequest);
  } catch (error) {
    console.error('Update bill request error:', error);
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Adisyon talebi güncellenemedi' });
    }
  }
};

// Masa için aktif adisyon talebini getir
export const getActiveForTable = async (req: Request, res: Response) => {
  try {
    const { tableId } = req.params;
    const billRequest = await getActiveBillRequest(tableId);
    res.json(billRequest);
  } catch (error) {
    console.error('Get active bill request error:', error);
    res.status(500).json({ message: 'Adisyon talebi alınamadı' });
  }
};

// Garsonun aktif adisyon taleplerini getir
export const getWaiterActive = async (req: Request, res: Response) => {
  try {
    const waiterId = req.user.id; // Auth middleware'den gelen kullanıcı
    const billRequests = await getWaiterActiveBillRequests(waiterId);
    res.json(billRequests);
  } catch (error) {
    console.error('Get waiter active bill requests error:', error);
    res.status(500).json({ message: 'Adisyon talepleri listelenemedi' });
  }
};

// Tüm aktif adisyon taleplerini getir
export const getAllActive = async (req: Request, res: Response) => {
  try {
    const billRequests = await getAllActiveBillRequests();
    res.json(billRequests);
  } catch (error) {
    console.error('Get all active bill requests error:', error);
    res.status(500).json({ message: 'Adisyon talepleri listelenemedi' });
  }
}; 