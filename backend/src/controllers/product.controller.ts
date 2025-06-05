import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const getAllProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
      },
    });
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Ürünler alınamadı' });
  }
};

const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }

    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Ürün alınamadı' });
  }
};

const getProductsByCategory = async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;
    const products = await prisma.product.findMany({
      where: { categoryId },
      include: {
        category: true,
      },
    });
    res.json(products);
  } catch (error) {
    console.error('Get products by category error:', error);
    res.status(500).json({ message: 'Kategoriye ait ürünler alınamadı' });
  }
};

const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, price, stock, minStock, categoryId } = req.body;

    // Kategori kontrolü
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return res.status(404).json({ message: 'Kategori bulunamadı' });
    }

    // Ürün adı kontrolü
    const existingProduct = await prisma.product.findFirst({
      where: { 
        name,
        categoryId,
      },
    });

    if (existingProduct) {
      return res.status(400).json({ 
        message: 'Bu ürün adı seçili kategoride zaten kullanılıyor' 
      });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        stock,
        minStock,
        categoryId,
      },
      include: {
        category: true,
      },
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Ürün oluşturulamadı' });
  }
};

const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, minStock, categoryId } = req.body;

    // Kategori kontrolü
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        return res.status(404).json({ message: 'Kategori bulunamadı' });
      }
    }

    // Ürün adı kontrolü
    if (name) {
      const existingProduct = await prisma.product.findFirst({
        where: {
          name,
          categoryId,
          NOT: {
            id,
          },
        },
      });

      if (existingProduct) {
        return res.status(400).json({ 
          message: 'Bu ürün adı seçili kategoride zaten kullanılıyor' 
        });
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        price,
        stock,
        minStock,
        categoryId,
      },
      include: {
        category: true,
      },
    });

    // Stok minimum seviyenin altına düştüyse bildirim gönder
    if (product.stock <= product.minStock) {
      req.app.get('io').emit('lowStock', {
        productId: product.id,
        productName: product.name,
        currentStock: product.stock,
        minStock: product.minStock,
      });
    }

    res.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Ürün güncellenemedi' });
  }
};

const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Ürüne ait sipariş kontrolü
    const orderItems = await prisma.orderItem.findFirst({
      where: { productId: id },
    });

    if (orderItems) {
      return res.status(400).json({ 
        message: 'Bu ürün siparişlerde kullanılmıştır. Silinemez.' 
      });
    }

    await prisma.product.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Ürün silinemedi' });
  }
};

const productController = {
  getAllProducts,
  getProductById,
  getProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct
};

export default productController; 