import { Request, Response } from 'express';
import { io } from '../index';

// Mutfağa yeni sipariş bildirimi gönder
export const notifyKitchen = async (req: Request, res: Response) => {
  try {
    const { orderId, tableNumber, items } = req.body;

    // Socket.IO ile mutfağa bildirim gönder
    if (io) {
      io.to('kitchen').emit('newOrder', {
        orderId,
        tableNumber,
        items,
        timestamp: new Date()
      });
    }

    res.json({ 
      success: true, 
      message: 'Mutfak bildirimi gönderildi' 
    });
  } catch (error) {
    console.error('Mutfak bildirimi gönderilirken hata:', error);
    res.status(500).json({ 
      success: false,
      message: 'Mutfak bildirimi gönderilemedi' 
    });
  }
};

// Adisyon yazdır
export const printReceipt = async (req: Request, res: Response) => {
  try {
    const { orderId, tableNumber, items, totalAmount, orderTime } = req.body;

    // Burada yazıcı entegrasyonu yapılabilir
    // Şimdilik sadece başarılı yanıt dönüyoruz
    res.json({ 
      success: true, 
      message: 'Adisyon yazdırma talebi alındı' 
    });
  } catch (error) {
    console.error('Adisyon yazdırılırken hata:', error);
    res.status(500).json({ 
      success: false,
      message: 'Adisyon yazdırılamadı' 
    });
  }
}; 