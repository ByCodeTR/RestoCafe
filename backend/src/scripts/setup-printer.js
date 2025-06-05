const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupKitchenPrinter() {
  try {
    // Önce mevcut mutfak yazıcısını kontrol et
    const existingPrinter = await prisma.printer.findFirst({
      where: { type: 'KITCHEN' }
    });

    if (existingPrinter) {
      console.log('Mutfak yazıcısı zaten mevcut:', existingPrinter);
      return existingPrinter;
    }

    // Yeni mutfak yazıcısı ekle
    const printer = await prisma.printer.create({
      data: {
        name: 'Mutfak Yazıcısı',
        type: 'KITCHEN',
        ipAddress: '192.168.1.100',
        port: 9100,
        isActive: true
      }
    });

    console.log('Mutfak yazıcısı eklendi:', printer);
    return printer;
  } catch (error) {
    console.error('Yazıcı ayarlama hatası:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupKitchenPrinter(); 