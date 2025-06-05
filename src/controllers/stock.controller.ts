import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class StockController {
  async getAllStock(req: Request, res: Response) {
    try {
      const stockLogs = await prisma.stockLog.findMany({
        include: {
          product: true,
          supplier: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      res.json(stockLogs);
    } catch (error) {
      console.error('Get stock logs error:', error);
      res.status(500).json({ message: 'Stok hareketleri alınamadı' });
    }
  }

  async getStockById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const stockLog = await prisma.stockLog.findUnique({
        where: { id },
        include: {
          product: true,
          supplier: true,
        },
      });

      if (!stockLog) {
        return res.status(404).json({ message: 'Stok hareketi bulunamadı' });
      }

      res.json(stockLog);
    } catch (error) {
      console.error('Get stock log error:', error);
      res.status(500).json({ message: 'Stok hareketi alınamadı' });
    }
  }

  async createStock(req: Request, res: Response) {
    try {
      const { productId, supplierId, quantity, type, notes } = req.body;

      // Ürün kontrolü
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        return res.status(404).json({ message: 'Ürün bulunamadı' });
      }

      // Tedarikçi kontrolü (giriş işlemi ise zorunlu)
      if (type === 'IN' && !supplierId) {
        return res.status(400).json({ 
          message: 'Stok girişi için tedarikçi seçimi zorunludur' 
        });
      }

      if (supplierId) {
        const supplier = await prisma.supplier.findUnique({
          where: { id: supplierId },
        });

        if (!supplier) {
          return res.status(404).json({ message: 'Tedarikçi bulunamadı' });
        }
      }

      // Stok çıkışı için miktar kontrolü
      if (type === 'OUT' && product.stock < quantity) {
        return res.status(400).json({ 
          message: 'Yetersiz stok miktarı' 
        });
      }

      // Stok hareketi oluştur
      const stockLog = await prisma.stockLog.create({
        data: {
          productId,
          supplierId,
          quantity,
          type,
          notes,
        },
        include: {
          product: true,
          supplier: true,
        },
      });

      // Ürün stok miktarını güncelle
      const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: {
          stock: {
            [type === 'IN' ? 'increment' : 'decrement']: quantity,
          },
        },
      });

      // Stok minimum seviyenin altına düştüyse bildirim gönder
      if (updatedProduct.stock <= updatedProduct.minStock) {
        req.app.get('io').emit('lowStock', {
          productId: updatedProduct.id,
          productName: updatedProduct.name,
          currentStock: updatedProduct.stock,
          minStock: updatedProduct.minStock,
        });
      }

      res.status(201).json(stockLog);
    } catch (error) {
      console.error('Create stock log error:', error);
      res.status(500).json({ message: 'Stok hareketi oluşturulamadı' });
    }
  }

  async updateStock(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      // Sadece notlar güncellenebilir
      const stockLog = await prisma.stockLog.update({
        where: { id },
        data: { notes },
        include: {
          product: true,
          supplier: true,
        },
      });

      res.json(stockLog);
    } catch (error) {
      console.error('Update stock log error:', error);
      res.status(500).json({ message: 'Stok hareketi güncellenemedi' });
    }
  }

  async deleteStock(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Stok hareketini bul
      const stockLog = await prisma.stockLog.findUnique({
        where: { id },
      });

      if (!stockLog) {
        return res.status(404).json({ message: 'Stok hareketi bulunamadı' });
      }

      // Stok hareketini sil
      await prisma.stockLog.delete({
        where: { id },
      });

      // Ürün stok miktarını geri al
      await prisma.product.update({
        where: { id: stockLog.productId },
        data: {
          stock: {
            [stockLog.type === 'IN' ? 'decrement' : 'increment']: stockLog.quantity,
          },
        },
      });

      res.json({ message: 'Stok hareketi silindi' });
    } catch (error) {
      console.error('Delete stock log error:', error);
      res.status(500).json({ message: 'Stok hareketi silinemedi' });
    }
  }

  async getLowStockAlerts(req: Request, res: Response) {
    try {
      const lowStockProducts = await prisma.product.findMany({
        where: {
          stock: {
            lte: prisma.product.fields.minStock,
          },
        },
      });

      res.json(lowStockProducts);
    } catch (error) {
      console.error('Get low stock alerts error:', error);
      res.status(500).json({ message: 'Düşük stok uyarıları alınamadı' });
    }
  }
} 