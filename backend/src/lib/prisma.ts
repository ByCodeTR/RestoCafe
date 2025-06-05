import { PrismaClient } from '@prisma/client';

// PrismaClient'ı global olarak tanımla
declare global {
  var prisma: PrismaClient | undefined;
}

// Development ortamında hot-reload sırasında birden fazla bağlantı oluşmasını önle
const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma; 