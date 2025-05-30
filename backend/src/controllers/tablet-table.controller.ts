import { Request, Response } from 'express';
import {
  getEmptyTables,
  getTablesByArea,
  updateTableStatus,
  mergeTables,
  updateTableNote,
} from '../services/tablet-table.service';
import { TableStatus } from '@prisma/client';

// Boş masaları getir
export const getEmpty = async (req: Request, res: Response) => {
  try {
    const tables = await getEmptyTables();
    res.json(tables);
  } catch (error) {
    console.error('Get empty tables error:', error);
    res.status(500).json({ message: 'Boş masalar listelenemedi' });
  }
};

// Bölgeye göre masaları getir
export const getByArea = async (req: Request, res: Response) => {
  try {
    const { areaId } = req.params;
    const tables = await getTablesByArea(areaId);
    res.json(tables);
  } catch (error) {
    console.error('Get tables by area error:', error);
    res.status(500).json({ message: 'Masalar listelenemedi' });
  }
};

// Masa durumunu güncelle
export const updateStatus = async (req: Request, res: Response) => {
  try {
    const { tableId } = req.params;
    const { status } = req.body;
    const waiterId = req.user.id; // Auth middleware'den gelen kullanıcı

    if (!status || !Object.values(TableStatus).includes(status)) {
      return res.status(400).json({
        message: 'Geçersiz masa durumu',
      });
    }

    const table = await updateTableStatus(tableId, status, waiterId);
    res.json(table);
  } catch (error) {
    console.error('Update table status error:', error);
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Masa durumu güncellenemedi' });
    }
  }
};

// Masaları birleştir
export const merge = async (req: Request, res: Response) => {
  try {
    const { sourceTableId, targetTableId } = req.body;
    const waiterId = req.user.id; // Auth middleware'den gelen kullanıcı

    if (!sourceTableId || !targetTableId) {
      return res.status(400).json({
        message: 'Kaynak ve hedef masa seçilmeli',
      });
    }

    if (sourceTableId === targetTableId) {
      return res.status(400).json({
        message: 'Aynı masa seçilemez',
      });
    }

    const result = await mergeTables(sourceTableId, targetTableId, waiterId);
    res.json(result);
  } catch (error) {
    console.error('Merge tables error:', error);
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Masalar birleştirilemedi' });
    }
  }
};

// Masa notunu güncelle
export const updateNote = async (req: Request, res: Response) => {
  try {
    const { tableId } = req.params;
    const { note } = req.body;
    const waiterId = req.user.id; // Auth middleware'den gelen kullanıcı

    if (!note) {
      return res.status(400).json({
        message: 'Not alanı boş olamaz',
      });
    }

    const table = await updateTableNote(tableId, note, waiterId);
    res.json(table);
  } catch (error) {
    console.error('Update table note error:', error);
    res.status(500).json({ message: 'Masa notu güncellenemedi' });
  }
}; 