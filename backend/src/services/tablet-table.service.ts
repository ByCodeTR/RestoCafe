import { PrismaClient, TableStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Boş masaları getir
export const getEmptyTables = async () => {
  return await prisma.table.findMany({
    where: {
      status: TableStatus.EMPTY,
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
          waiter: {
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
  status: TableStatus,
  waiterId: string
) => {
  // Önce masayı kontrol et
  const table = await prisma.table.findUnique({
    where: { id: tableId },
    include: {
      orders: {
        where: {
          status: { in: ['ACTIVE', 'IN_PROGRESS'] },
        },
      },
    },
  });

  if (!table) {
    throw new Error('Masa bulunamadı');
  }

  // Eğer masa dolu ve boşaltılmak isteniyorsa, aktif sipariş kontrolü yap
  if (table.status === TableStatus.OCCUPIED && status === TableStatus.EMPTY) {
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

  // Aktivite logu oluştur
  await prisma.userActivity.create({
    data: {
      userId: waiterId,
      action: 'UPDATE_TABLE_STATUS',
      details: `Masa durumu güncellendi: ${table.status} -> ${status}`,
    },
  });

  return updatedTable;
};

// Masaları birleştir
export const mergeTables = async (
  sourceTableId: string,
  targetTableId: string,
  waiterId: string
) => {
  // Masaları kontrol et
  const [sourceTable, targetTable] = await Promise.all([
    prisma.table.findUnique({
      where: { id: sourceTableId },
      include: {
        orders: {
          where: {
            status: { in: ['ACTIVE', 'IN_PROGRESS'] },
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
            status: { in: ['ACTIVE', 'IN_PROGRESS'] },
          },
        },
      },
    }),
  ]);

  if (!sourceTable || !targetTable) {
    throw new Error('Masa bulunamadı');
  }

  // Hedef masa boş olmalı
  if (targetTable.status !== TableStatus.EMPTY) {
    throw new Error('Hedef masa boş olmalı');
  }

  // Kaynak masada aktif sipariş varsa, hedef masaya taşı
  if (sourceTable.orders.length > 0) {
    await prisma.$transaction([
      // Siparişleri taşı
      ...sourceTable.orders.map(order =>
        prisma.order.update({
          where: { id: order.id },
          data: { tableId: targetTableId },
        })
      ),
      // Kaynak masayı boşalt
      prisma.table.update({
        where: { id: sourceTableId },
        data: { status: TableStatus.EMPTY },
      }),
      // Hedef masayı dolu yap
      prisma.table.update({
        where: { id: targetTableId },
        data: { status: TableStatus.OCCUPIED },
      }),
    ]);
  }

  // Aktivite logu oluştur
  await prisma.userActivity.create({
    data: {
      userId: waiterId,
      action: 'MERGE_TABLES',
      details: `Masalar birleştirildi: ${sourceTable.name} -> ${targetTable.name}`,
    },
  });

  return {
    sourceTable: await prisma.table.findUnique({
      where: { id: sourceTableId },
      include: { area: true },
    }),
    targetTable: await prisma.table.findUnique({
      where: { id: targetTableId },
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
          },
        },
      },
    }),
  };
};

// Masa notunu güncelle
export const updateTableNote = async (
  tableId: string,
  note: string,
  waiterId: string
) => {
  const table = await prisma.table.update({
    where: { id: tableId },
    data: { note },
    include: {
      area: true,
    },
  });

  // Aktivite logu oluştur
  await prisma.userActivity.create({
    data: {
      userId: waiterId,
      action: 'UPDATE_TABLE_NOTE',
      details: `Masa notu güncellendi: ${table.name}`,
    },
  });

  return table;
}; 