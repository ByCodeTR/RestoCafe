import { PrismaClient, BillRequestStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Adisyon talebi oluştur
export const createBillRequest = async (
  tableId: string,
  waiterId: string,
  note?: string
) => {
  // Masayı kontrol et
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

  if (table.orders.length === 0) {
    throw new Error('Masada aktif sipariş bulunmuyor');
  }

  // Aktif adisyon talebi var mı kontrol et
  const existingRequest = await prisma.billRequest.findFirst({
    where: {
      tableId,
      status: { in: ['PENDING', 'IN_PROGRESS'] },
    },
  });

  if (existingRequest) {
    throw new Error('Bu masa için zaten aktif bir adisyon talebi var');
  }

  // Adisyon talebi oluştur
  const billRequest = await prisma.billRequest.create({
    data: {
      tableId,
      waiterId,
      note,
      status: BillRequestStatus.PENDING,
    },
    include: {
      table: {
        include: {
          area: true,
        },
      },
      waiter: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Aktivite logu oluştur
  await prisma.userActivity.create({
    data: {
      userId: waiterId,
      action: 'CREATE_BILL_REQUEST',
      details: `Adisyon talebi oluşturuldu: ${table.name}`,
    },
  });

  return billRequest;
};

// Adisyon talebini güncelle
export const updateBillRequest = async (
  requestId: string,
  status: BillRequestStatus,
  userId: string,
  note?: string
) => {
  // Talebi kontrol et
  const request = await prisma.billRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new Error('Adisyon talebi bulunamadı');
  }

  // Durumu güncelle
  const updatedRequest = await prisma.billRequest.update({
    where: { id: requestId },
    data: {
      status,
      note: note || request.note,
    },
    include: {
      table: {
        include: {
          area: true,
        },
      },
      waiter: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Aktivite logu oluştur
  await prisma.userActivity.create({
    data: {
      userId,
      action: 'UPDATE_BILL_REQUEST',
      details: `Adisyon talebi güncellendi: ${status}`,
    },
  });

  return updatedRequest;
};

// Masa için aktif adisyon talebini getir
export const getActiveBillRequest = async (tableId: string) => {
  return await prisma.billRequest.findFirst({
    where: {
      tableId,
      status: { in: ['PENDING', 'IN_PROGRESS'] },
    },
    include: {
      table: {
        include: {
          area: true,
        },
      },
      waiter: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
};

// Garsonun aktif adisyon taleplerini getir
export const getWaiterActiveBillRequests = async (waiterId: string) => {
  return await prisma.billRequest.findMany({
    where: {
      waiterId,
      status: { in: ['PENDING', 'IN_PROGRESS'] },
    },
    include: {
      table: {
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
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

// Tüm aktif adisyon taleplerini getir
export const getAllActiveBillRequests = async () => {
  return await prisma.billRequest.findMany({
    where: {
      status: { in: ['PENDING', 'IN_PROGRESS'] },
    },
    include: {
      table: {
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
      },
      waiter: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}; 