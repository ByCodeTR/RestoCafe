import { Request, Response } from 'express';
import { PrismaClient } from '../../src/generated/prisma';

const prisma = new PrismaClient();

export const getAllStockLogs = async (req: Request, res: Response) => {
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
};

export const getStockLogById = async (req: Request, res: Response) => {
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
};

export const getStockLogsByProduct = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const stockLogs = await prisma.stockLog.findMany({
      where: { productId },
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
    console.error('Get stock logs by product error:', error);
    res.status(500).json({ message: 'Ürüne ait stok hareketleri alınamadı' });
  }
};

export const getStockLogsBySupplier = async (req: Request, res: Response) => {
  try {
    const { supplierId } = req.params;
    const stockLogs = await prisma.stockLog.findMany({
      where: { supplierId },
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
    console.error('Get stock logs by supplier error:', error);
    res.status(500).json({ message: 'Tedarikçiye ait stok hareketleri alınamadı' });
  }
};

export const createStockLog = async (req: Request, res: Response) => {
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
};

export const updateStockLog = async (req: Request, res: Response) => {
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
};

export const deleteStockLog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Stok hareketini bul
    const stockLog = await prisma.stockLog.findUnique({
      where: { id },
    });

    if (!stockLog) {
      return res.status(404).json({ message: 'Stok hareketi bulunamadı' });
    }

    // Ürünü bul
    const product = await prisma.product.findUnique({
      where: { id: stockLog.productId },
    });

    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }

    // Stok çıkışı iptal ediliyorsa yeterli stok kontrolü
    if (stockLog.type === 'IN' && product.stock < stockLog.quantity) {
      return res.status(400).json({ 
        message: 'Bu stok girişi iptal edilemez. Mevcut stok yetersiz.' 
      });
    }

    // Stok hareketini sil
    await prisma.stockLog.delete({
      where: { id },
    });

    // Ürün stok miktarını güncelle
    const updatedProduct = await prisma.product.update({
      where: { id: stockLog.productId },
      data: {
        stock: {
          [stockLog.type === 'IN' ? 'decrement' : 'increment']: stockLog.quantity,
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

    res.status(204).send();
  } catch (error) {
    console.error('Delete stock log error:', error);
    res.status(500).json({ message: 'Stok hareketi silinemedi' });
  }
}; 