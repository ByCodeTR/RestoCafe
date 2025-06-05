import { PrismaClient } from '@prisma/client';
import prisma from '../lib/prisma';

// Boş masaları getir
export const getEmptyTables = async () => {
  return await prisma.table.findMany({
    where: {
      status: 'AVAILABLE',
    },
    include: {
      area: true,
    },
    orderBy: [
      {
        area: {
          name: 'asc',
        },
      },
      {
        name: 'asc',
      },
    ],
  });
};

// Bölgeye göre masaları getir
export const getTablesByArea = async (areaId: string) => {
  return await prisma.table.findMany({
    where: {
      areaId,
    },
    include: {
      area: true,
      orders: {
        where: {
          status: { in: ['ACTIVE', 'IN_PROGRESS'] },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });
};

// Masa durumunu güncelle
export const updateTableStatus = async (
  tableId: string,
  status: string,
  waiterId: string
) => {
  // Önce masayı kontrol et
  const table = await prisma.table.findUnique({
    where: { id: tableId },
    include: {
      orders: {
        where: {
          status: { in: ['NEW', 'PREPARING', 'READY'] },
        },
      },
    },
  });

  if (!table) {
    throw new Error('Masa bulunamadı');
  }

  // Eğer masa dolu ve boşaltılmak isteniyorsa, aktif sipariş kontrolü yap
  if (table.status === 'OCCUPIED' && status === 'AVAILABLE') {
    if (table.orders.length > 0) {
      throw new Error('Masada aktif sipariş var, önce siparişi tamamlayın');
    }
  }

  // Masa durumunu güncelle
  const updatedTable = await prisma.table.update({
    where: { id: tableId },
    data: { status },
    include: {
      area: true,
    },
  });

  return updatedTable;
};

// Masaları birleştir
export const mergeTables = async (
  sourceTableId: string,
  targetTableId: string,
  waiterId: string,
  operationType: 'merge' | 'move' = 'move'
) => {
  // Masaları kontrol et
  const [sourceTable, targetTable] = await Promise.all([
    prisma.table.findUnique({
      where: { id: sourceTableId },
      include: {
        orders: {
          where: {
            status: { in: ['NEW', 'PREPARING', 'READY'] },
          },
          include: {
            items: true,
          },
        },
      },
    }),
    prisma.table.findUnique({
      where: { id: targetTableId },
      include: {
        orders: {
          where: {
            status: { in: ['NEW', 'PREPARING', 'READY'] },
          },
          include: {
            items: true,
          },
        },
      },
    }),
  ]);

  if (!sourceTable || !targetTable) {
    throw new Error('Masa bulunamadı');
  }

  // Taşıma işlemi için hedef masanın boş olması gerekiyor
  if (operationType === 'move' && targetTable.orders.length > 0) {
    throw new Error('Taşıma işlemi için hedef masa boş olmalı');
  }

  // Kaynak masada aktif sipariş varsa, hedef masaya taşı
  if (sourceTable.orders.length > 0) {
    const transactions = [
      // Siparişleri taşı
      ...sourceTable.orders.map(order =>
        prisma.order.update({
          where: { id: order.id },
          data: { 
            tableId: targetTableId,
            // Sipariş durumunu güncelle
            status: 'NEW'
          },
        })
      ),
      // Kaynak masayı boşalt
      prisma.table.update({
        where: { id: sourceTableId },
        data: { 
          status: 'AVAILABLE',
          totalAmount: 0
        },
      }),
      // Hedef masayı dolu yap ve toplam tutarı güncelle
      prisma.table.update({
        where: { id: targetTableId },
        data: { 
          status: 'OCCUPIED',
          totalAmount: {
            increment: sourceTable.orders.reduce((total, order) => total + order.total, 0)
          }
        },
      }),
    ];

    // Tüm işlemleri tek bir transaction içinde gerçekleştir
    await prisma.$transaction(transactions);
  }

  // Güncellenmiş masa bilgilerini getir
  const [updatedSourceTable, updatedTargetTable] = await Promise.all([
    prisma.table.findUnique({
      where: { id: sourceTableId },
      include: {
        area: true,
        orders: {
          where: {
            status: { in: ['NEW', 'PREPARING', 'READY'] },
          },
          include: {
            items: {
              include: {
                product: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.table.findUnique({
      where: { id: targetTableId },
      include: {
        area: true,
        orders: {
          where: {
            status: { in: ['NEW', 'PREPARING', 'READY'] },
          },
          include: {
            items: {
              include: {
                product: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    }),
  ]);

  if (!updatedSourceTable || !updatedTargetTable) {
    throw new Error('Masa bilgileri güncellenemedi');
  }

  return {
    sourceTable: updatedSourceTable,
    targetTable: updatedTargetTable,
  };
};

// Masa notunu güncelle - DISABLED: Table model'inde note field'ı yok
export const updateTableNote = async (
  tableId: string,
  note: string,
  waiterId: string
) => {
  // Note field'ı Table model'inde yok, bu fonksiyon devre dışı
  throw new Error('Masa notu özelliği henüz desteklenmiyor');
}; 