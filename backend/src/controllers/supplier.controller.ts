import { Request, Response } from 'express';
import { PrismaClient } from '../../src/generated/prisma';

const prisma = new PrismaClient();

export const getAllSuppliers = async (req: Request, res: Response) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        stockLogs: {
          take: 5,
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
    res.json(suppliers);
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({ message: 'Tedarikçiler alınamadı' });
  }
};

export const getSupplierById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        stockLogs: {
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!supplier) {
      return res.status(404).json({ message: 'Tedarikçi bulunamadı' });
    }

    res.json(supplier);
  } catch (error) {
    console.error('Get supplier error:', error);
    res.status(500).json({ message: 'Tedarikçi alınamadı' });
  }
};

export const createSupplier = async (req: Request, res: Response) => {
  try {
    const { name, contactName, phone, email, address } = req.body;

    // Telefon numarası kontrolü
    const existingSupplierByPhone = await prisma.supplier.findFirst({
      where: { phone },
    });

    if (existingSupplierByPhone) {
      return res.status(400).json({ 
        message: 'Bu telefon numarası başka bir tedarikçi tarafından kullanılıyor' 
      });
    }

    // Email kontrolü
    if (email) {
      const existingSupplierByEmail = await prisma.supplier.findFirst({
        where: { email },
      });

      if (existingSupplierByEmail) {
        return res.status(400).json({ 
          message: 'Bu email adresi başka bir tedarikçi tarafından kullanılıyor' 
        });
      }
    }

    const supplier = await prisma.supplier.create({
      data: {
        name,
        contactName,
        phone,
        email,
        address,
      },
    });

    res.status(201).json(supplier);
  } catch (error) {
    console.error('Create supplier error:', error);
    res.status(500).json({ message: 'Tedarikçi oluşturulamadı' });
  }
};

export const updateSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, contactName, phone, email, address } = req.body;

    // Telefon numarası kontrolü
    if (phone) {
      const existingSupplierByPhone = await prisma.supplier.findFirst({
        where: {
          phone,
          NOT: {
            id,
          },
        },
      });

      if (existingSupplierByPhone) {
        return res.status(400).json({ 
          message: 'Bu telefon numarası başka bir tedarikçi tarafından kullanılıyor' 
        });
      }
    }

    // Email kontrolü
    if (email) {
      const existingSupplierByEmail = await prisma.supplier.findFirst({
        where: {
          email,
          NOT: {
            id,
          },
        },
      });

      if (existingSupplierByEmail) {
        return res.status(400).json({ 
          message: 'Bu email adresi başka bir tedarikçi tarafından kullanılıyor' 
        });
      }
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name,
        contactName,
        phone,
        email,
        address,
      },
    });

    res.json(supplier);
  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(500).json({ message: 'Tedarikçi güncellenemedi' });
  }
};

export const deleteSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Tedarikçiye ait stok hareketleri kontrolü
    const stockLogs = await prisma.stockLog.findFirst({
      where: { supplierId: id },
    });

    if (stockLogs) {
      return res.status(400).json({ 
        message: 'Bu tedarikçiye ait stok hareketleri bulunmaktadır. Silinemez.' 
      });
    }

    await prisma.supplier.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete supplier error:', error);
    res.status(500).json({ message: 'Tedarikçi silinemedi' });
  }
}; 