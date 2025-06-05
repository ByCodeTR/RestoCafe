import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getAllAreas = async (req: Request, res: Response) => {
  try {
    const areas = await prisma.area.findMany({
      include: {
        tables: true,
      },
    });
    res.json(areas);
  } catch (error) {
    console.error('Get areas error:', error);
    res.status(500).json({ message: 'Bölgeler alınamadı' });
  }
};

export const getAreaById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const area = await prisma.area.findUnique({
      where: { id },
      include: {
        tables: true,
      },
    });

    if (!area) {
      return res.status(404).json({ message: 'Bölge bulunamadı' });
    }

    res.json(area);
  } catch (error) {
    console.error('Get area error:', error);
    res.status(500).json({ message: 'Bölge alınamadı' });
  }
};

export const createArea = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    const area = await prisma.area.create({
      data: {
        name,
      },
    });

    res.status(201).json(area);
  } catch (error) {
    console.error('Create area error:', error);
    res.status(500).json({ message: 'Bölge oluşturulamadı' });
  }
};

export const updateArea = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const area = await prisma.area.update({
      where: { id },
      data: {
        name,
      },
    });

    res.json(area);
  } catch (error) {
    console.error('Update area error:', error);
    res.status(500).json({ message: 'Bölge güncellenemedi' });
  }
};

export const deleteArea = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Bölgeye ait masaları kontrol et
    const tables = await prisma.table.findMany({
      where: { areaId: id },
    });

    if (tables.length > 0) {
      return res.status(400).json({ 
        message: 'Bu bölgeye ait masalar bulunmaktadır. Önce masaları silmelisiniz.' 
      });
    }

    await prisma.area.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete area error:', error);
    res.status(500).json({ message: 'Bölge silinemedi' });
  }
}; 