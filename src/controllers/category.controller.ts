import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        products: true,
      },
    });
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Kategoriler alınamadı' });
  }
};

export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        products: true,
      },
    });

    if (!category) {
      return res.status(404).json({ message: 'Kategori bulunamadı' });
    }

    res.json(category);
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ message: 'Kategori alınamadı' });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    // Kategori adı kontrolü
    const existingCategory = await prisma.category.findFirst({
      where: { name },
    });

    if (existingCategory) {
      return res.status(400).json({ message: 'Bu kategori adı zaten kullanılıyor' });
    }

    const category = await prisma.category.create({
      data: {
        name,
      },
      include: {
        products: true,
      },
    });

    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Kategori oluşturulamadı' });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Kategori adı kontrolü
    const existingCategory = await prisma.category.findFirst({
      where: {
        name,
        NOT: {
          id,
        },
      },
    });

    if (existingCategory) {
      return res.status(400).json({ message: 'Bu kategori adı zaten kullanılıyor' });
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
      },
      include: {
        products: true,
      },
    });

    res.json(category);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Kategori güncellenemedi' });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Kategoriye ait ürünleri kontrol et
    const products = await prisma.product.findMany({
      where: { categoryId: id },
    });

    if (products.length > 0) {
      return res.status(400).json({ 
        message: 'Bu kategoriye ait ürünler bulunmaktadır. Önce ürünleri silmelisiniz.' 
      });
    }

    await prisma.category.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Kategori silinemedi' });
  }
}; 