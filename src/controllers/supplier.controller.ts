import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Input validasyonu
const validateSupplierInput = (data: any) => {
  const errors = [];

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Firma adı zorunludur');
  }

  if (data.phone) {
    const phoneRegex = /^5[0-9]{2}[0-9]{3}[0-9]{2}[0-9]{2}$/;
    if (!phoneRegex.test(data.phone.replace(/\D/g, ''))) {
      errors.push('Geçerli bir telefon numarası girin (5XX XXX XX XX)');
    }
  }

  if (data.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push('Geçerli bir e-posta adresi girin');
    }
  }

  return errors;
};

export const getAllSuppliers = async (req: Request, res: Response) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: {
        createdAt: 'desc'
      }
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
      where: { id }
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

    // Debug için request body'i logla
    console.log('Create supplier request body:', req.body);

    // Input validasyonu
    const validationErrors = validateSupplierInput(req.body);
    if (validationErrors.length > 0) {
      console.log('Validation errors:', validationErrors);
      return res.status(400).json({ message: validationErrors[0] });
    }

    // Telefon numarası kontrolü
    if (phone) {
      const existingSupplierByPhone = await prisma.supplier.findFirst({
        where: { phone: phone.replace(/\D/g, '') }
      });

      if (existingSupplierByPhone) {
        console.log('Phone number already exists:', phone);
        return res.status(400).json({ 
          message: 'Bu telefon numarası başka bir tedarikçi tarafından kullanılıyor' 
        });
      }
    }

    // Email kontrolü
    if (email) {
      const existingSupplierByEmail = await prisma.supplier.findFirst({
        where: { email }
      });

      if (existingSupplierByEmail) {
        console.log('Email already exists:', email);
        return res.status(400).json({ 
          message: 'Bu email adresi başka bir tedarikçi tarafından kullanılıyor' 
        });
      }
    }

    const supplier = await prisma.supplier.create({
      data: {
        name: name.trim(),
        contactName: contactName?.trim() || null,
        phone: phone ? phone.replace(/\D/g, '') : null,
        email: email?.trim() || null,
        address: address?.trim() || null
      }
    });

    console.log('Created supplier:', supplier);
    res.status(201).json(supplier);
  } catch (error) {
    console.error('Create supplier error:', error);
    // Detaylı hata mesajı
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    res.status(500).json({ message: 'Tedarikçi oluşturulamadı' });
  }
};

export const updateSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, contactName, phone, email, address } = req.body;

    // Debug için request body'i logla
    console.log('Update supplier request:', { id, body: req.body });

    // Input validasyonu
    const validationErrors = validateSupplierInput(req.body);
    if (validationErrors.length > 0) {
      console.log('Validation errors:', validationErrors);
      return res.status(400).json({ message: validationErrors[0] });
    }

    // Tedarikçinin varlığını kontrol et
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id }
    });

    if (!existingSupplier) {
      console.log('Supplier not found:', id);
      return res.status(404).json({ message: 'Tedarikçi bulunamadı' });
    }

    // Telefon numarası kontrolü
    if (phone) {
      const existingSupplierByPhone = await prisma.supplier.findFirst({
        where: {
          phone: phone.replace(/\D/g, ''),
          NOT: { id }
        }
      });

      if (existingSupplierByPhone) {
        console.log('Phone number already exists:', phone);
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
          NOT: { id }
        }
      });

      if (existingSupplierByEmail) {
        console.log('Email already exists:', email);
        return res.status(400).json({ 
          message: 'Bu email adresi başka bir tedarikçi tarafından kullanılıyor' 
        });
      }
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name: name.trim(),
        contactName: contactName?.trim() || null,
        phone: phone ? phone.replace(/\D/g, '') : null,
        email: email?.trim() || null,
        address: address?.trim() || null
      }
    });

    console.log('Updated supplier:', supplier);
    res.json(supplier);
  } catch (error) {
    console.error('Update supplier error:', error);
    // Detaylı hata mesajı
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    res.status(500).json({ message: 'Tedarikçi güncellenemedi' });
  }
};

export const deleteSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Tedarikçinin varlığını kontrol et
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id }
    });

    if (!existingSupplier) {
      return res.status(404).json({ message: 'Tedarikçi bulunamadı' });
    }

    // Tedarikçiye ait stok hareketleri kontrolü
    const stockLogs = await prisma.stockLog.findFirst({
      where: { supplierId: id }
    });

    if (stockLogs) {
      return res.status(400).json({ 
        message: 'Bu tedarikçiye ait stok hareketleri bulunmaktadır. Silinemez.' 
      });
    }

    await prisma.supplier.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete supplier error:', error);
    res.status(500).json({ message: 'Tedarikçi silinemedi' });
  }
}; 