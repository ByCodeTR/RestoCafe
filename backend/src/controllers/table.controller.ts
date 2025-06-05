import { Request, Response } from 'express';
import prisma from '../lib/prisma';

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
      return res.status(404).json({ 
        success: false,
        message: 'Masa bulunamadı' 
      });
    }

    return res.json({
      success: true,
      data: table,
      message: 'Masa bilgileri başarıyla getirildi'
    });
  } catch (error) {
    console.error('Get table error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Masa alınamadı' 
    });
  }
};

export const createTable = async (req: Request, res: Response) => {
  try {
    const { name, capacity, areaId, status } = req.body;

    // Bölge kontrolü
    const area = await prisma.area.findUnique({
      where: { id: areaId },
    });

    if (!area) {
      return res.status(404).json({ message: 'Bölge bulunamadı' });
    }

    // Otomatik masa numarası oluştur
    const existingTablesCount = await prisma.table.count({
      where: { areaId },
    });
    const number = `T${existingTablesCount + 1}`;

    // Masa numarası kontrolü (eğer zaten varsa, sayıyı artır)
    let finalNumber = number;
    let counter = existingTablesCount + 1;
    while (await prisma.table.findFirst({ where: { number: finalNumber, areaId } })) {
      counter++;
      finalNumber = `T${counter}`;
    }

    const table = await prisma.table.create({
      data: {
        name: name || `Masa ${finalNumber}`,
        number: finalNumber,
        capacity: parseInt(capacity),
        areaId,
        status: status || 'AVAILABLE',
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
    const { name, number, capacity, areaId, status } = req.body;

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
        name,
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

// Masa taşıma fonksiyonu
export const moveTable = async (req: Request, res: Response) => {
  try {
    const { sourceTableId, targetTableId } = req.body;

    // Kaynak ve hedef masaları kontrol et
    const sourceTable = await prisma.table.findUnique({
      where: { id: sourceTableId },
      include: { area: true }
    });

    const targetTable = await prisma.table.findUnique({
      where: { id: targetTableId },
      include: { area: true }
    });

    if (!sourceTable || !targetTable) {
      return res.status(404).json({ 
        success: false,
        message: 'Kaynak veya hedef masa bulunamadı' 
      });
    }

    // Kaynak masa dolu olmalı, hedef masa boş olmalı
    if (sourceTable.status !== 'OCCUPIED') {
      return res.status(400).json({ 
        success: false,
        message: 'Kaynak masa dolu değil' 
      });
    }

    if (targetTable.status !== 'AVAILABLE') {
      return res.status(400).json({ 
        success: false,
        message: 'Hedef masa boş değil' 
      });
    }

    // Kaynak masanın aktif siparişlerini bul
    const activeOrders = await prisma.order.findMany({
      where: {
        tableId: sourceTableId,
        status: {
          in: ['NEW', 'PREPARING', 'READY']
        }
      }
    });

    // Transaction ile masa taşıma işlemi
    await prisma.$transaction(async (tx) => {
      // Aktif siparişleri hedef masaya taşı
      for (const order of activeOrders) {
        await tx.order.update({
          where: { id: order.id },
          data: { tableId: targetTableId }
        });
      }

      // Kaynak masayı boş yap
      await tx.table.update({
        where: { id: sourceTableId },
        data: { status: 'AVAILABLE' }
      });

      // Hedef masayı dolu yap
      await tx.table.update({
        where: { id: targetTableId },
        data: { status: 'OCCUPIED' }
      });
    });

    // Güncellenmiş masaları getir
    const updatedSourceTable = await prisma.table.findUnique({
      where: { id: sourceTableId },
      include: { area: true }
    });

    const updatedTargetTable = await prisma.table.findUnique({
      where: { id: targetTableId },
      include: { area: true }
    });

    // Socket.IO ile masa taşıma işlemini bildir
    req.app.get('io').emit('tablesMoved', {
      sourceTable: updatedSourceTable,
      targetTable: updatedTargetTable
    });

    res.json({
      success: true,
      message: `${sourceTable.name} masası ${targetTable.name} masasına taşındı`,
      data: {
        sourceTable: updatedSourceTable,
        targetTable: updatedTargetTable
      }
    });

  } catch (error) {
    console.error('Move table error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Masa taşıma işlemi başarısız' 
    });
  }
};

// Masa birleştirme fonksiyonu
export const mergeTables = async (req: Request, res: Response) => {
  try {
    const { mainTableId, mergeTableId } = req.body;

    // Ana masa ve birleştirilecek masayı kontrol et
    const mainTable = await prisma.table.findUnique({
      where: { id: mainTableId },
      include: { area: true }
    });

    const mergeTable = await prisma.table.findUnique({
      where: { id: mergeTableId },
      include: { area: true }
    });

    if (!mainTable || !mergeTable) {
      return res.status(404).json({ 
        success: false,
        message: 'Ana masa veya birleştirme masası bulunamadı' 
      });
    }

    // Her iki masa da dolu olmalı
    if (mainTable.status !== 'OCCUPIED' || mergeTable.status !== 'OCCUPIED') {
      return res.status(400).json({ 
        success: false,
        message: 'Her iki masa da dolu olmalı' 
      });
    }

    // Birleştirme masasının aktif siparişlerini bul
    const mergeOrders = await prisma.order.findMany({
      where: {
        tableId: mergeTableId,
        status: {
          in: ['NEW', 'PREPARING', 'READY']
        }
      }
    });

    // Transaction ile masa birleştirme işlemi
    await prisma.$transaction(async (tx) => {
      // Birleştirme masasının siparişlerini ana masaya taşı
      for (const order of mergeOrders) {
        await tx.order.update({
          where: { id: order.id },
          data: { tableId: mainTableId }
        });
      }

      // Birleştirme masasını boş yap
      await tx.table.update({
        where: { id: mergeTableId },
        data: { status: 'AVAILABLE' }
      });

      // Ana masanın kapasitesini güncelle (geçici olarak artır)
      await tx.table.update({
        where: { id: mainTableId },
        data: { 
          capacity: mainTable.capacity + mergeTable.capacity 
        }
      });
    });

    // Güncellenmiş masaları getir
    const updatedMainTable = await prisma.table.findUnique({
      where: { id: mainTableId },
      include: { area: true }
    });

    const updatedMergeTable = await prisma.table.findUnique({
      where: { id: mergeTableId },
      include: { area: true }
    });

    // Socket.IO ile masa birleştirme işlemini bildir
    req.app.get('io').emit('tablesMerged', {
      mainTable: updatedMainTable,
      mergeTable: updatedMergeTable
    });

    res.json({
      success: true,
      message: `${mergeTable.name} masası ${mainTable.name} masası ile birleştirildi`,
      data: {
        mainTable: updatedMainTable,
        mergeTable: updatedMergeTable
      }
    });

  } catch (error) {
    console.error('Merge tables error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Masa birleştirme işlemi başarısız' 
    });
  }
}; 