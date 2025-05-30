import { Request, Response } from 'express';
import { PrismaClient } from '../../src/generated/prisma';

const prisma = new PrismaClient();

export const getAllTables = async (req: Request, res: Response) => {
  try {
    const tables = await prisma.table.findMany({
      include: {
        area: true,
      },
    });
    res.json(tables);
  } catch (error) {
    console.error('Get tables error:', error);
    res.status(500).json({ message: 'Masalar alınamadı' });
  }
};

export const getTableById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const table = await prisma.table.findUnique({
      where: { id },
      include: {
        area: true,
      },
    });

    if (!table) {
      return res.status(404).json({ message: 'Masa bulunamadı' });
    }

    res.json(table);
  } catch (error) {
    console.error('Get table error:', error);
    res.status(500).json({ message: 'Masa alınamadı' });
  }
};

export const createTable = async (req: Request, res: Response) => {
  try {
    const { number, capacity, areaId } = req.body;

    // Bölge kontrolü
    const area = await prisma.area.findUnique({
      where: { id: areaId },
    });

    if (!area) {
      return res.status(404).json({ message: 'Bölge bulunamadı' });
    }

    // Masa numarası kontrolü
    const existingTable = await prisma.table.findFirst({
      where: {
        number,
        areaId,
      },
    });

    if (existingTable) {
      return res.status(400).json({ 
        message: 'Bu masa numarası seçili bölgede zaten kullanılıyor' 
      });
    }

    const table = await prisma.table.create({
      data: {
        number,
        capacity,
        areaId,
        status: 'AVAILABLE',
      },
      include: {
        area: true,
      },
    });

    res.status(201).json(table);
  } catch (error) {
    console.error('Create table error:', error);
    res.status(500).json({ message: 'Masa oluşturulamadı' });
  }
};

export const updateTable = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { number, capacity, areaId, status } = req.body;

    // Bölge kontrolü
    if (areaId) {
      const area = await prisma.area.findUnique({
        where: { id: areaId },
      });

      if (!area) {
        return res.status(404).json({ message: 'Bölge bulunamadı' });
      }
    }

    // Masa numarası kontrolü
    if (number) {
      const existingTable = await prisma.table.findFirst({
        where: {
          number,
          areaId,
          NOT: {
            id,
          },
        },
      });

      if (existingTable) {
        return res.status(400).json({ 
          message: 'Bu masa numarası seçili bölgede zaten kullanılıyor' 
        });
      }
    }

    const table = await prisma.table.update({
      where: { id },
      data: {
        number,
        capacity,
        areaId,
        status,
      },
      include: {
        area: true,
      },
    });

    res.json(table);
  } catch (error) {
    console.error('Update table error:', error);
    res.status(500).json({ message: 'Masa güncellenemedi' });
  }
};

export const deleteTable = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Masaya ait aktif sipariş kontrolü
    const activeOrder = await prisma.order.findFirst({
      where: {
        tableId: id,
        status: {
          in: ['ACTIVE', 'PENDING'],
        },
      },
    });

    if (activeOrder) {
      return res.status(400).json({ 
        message: 'Bu masaya ait aktif sipariş bulunmaktadır' 
      });
    }

    await prisma.table.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete table error:', error);
    res.status(500).json({ message: 'Masa silinemedi' });
  }
};

export const updateTableStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const table = await prisma.table.update({
      where: { id },
      data: { status },
      include: {
        area: true,
      },
    });

    // Socket.IO ile masa durumu değişikliğini bildir
    req.app.get('io').emit('tableStatusUpdated', table);

    res.json(table);
  } catch (error) {
    console.error('Update table status error:', error);
    res.status(500).json({ message: 'Masa durumu güncellenemedi' });
  }
}; 