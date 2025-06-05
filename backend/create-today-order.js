const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function createTodayOrder() {
  try {
    // Bugünün tarihi
    const now = new Date();
    
    // Raw SQL ile kullanıcı ve masa al
    const users = await prisma.$queryRaw`SELECT id, name FROM "User" LIMIT 1;`;
    const tables = await prisma.$queryRaw`SELECT id, name FROM "Table" LIMIT 1;`;
    
    if (users.length === 0) {
      console.log('Kullanıcı bulunamadı');
      return;
    }
    
    if (tables.length === 0) {
      console.log('Masa bulunamadı');
      return;
    }

    const user = users[0];
    const table = tables[0];

    // Raw SQL ile bugün için test siparişi oluştur
    const orderId1 = await prisma.$queryRaw`
      INSERT INTO "Order" (id, "tableId", "userId", status, total, "paymentMethod", "paidAt", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${table.id}, ${user.id}, 'COMPLETED', 150.00, 'CASH', ${now}, ${now}, ${now})
      RETURNING id;
    `;

    console.log('Bugün için nakit test siparişi oluşturuldu:');
    console.log(`ID: ${orderId1[0].id}`);
    console.log(`Masa: ${table.name}`);
    console.log(`Toplam: ₺150.00`);
    console.log(`Ödeme: CASH`);
    console.log(`Ödeme Tarihi: ${now.toLocaleString('tr-TR')}`);

    // İkinci sipariş - kredi kartı
    const orderId2 = await prisma.$queryRaw`
      INSERT INTO "Order" (id, "tableId", "userId", status, total, "paymentMethod", "paidAt", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${table.id}, ${user.id}, 'COMPLETED', 275.50, 'CREDIT', ${now}, ${now}, ${now})
      RETURNING id;
    `;

    console.log('\nİkinci test siparişi oluşturuldu:');
    console.log(`ID: ${orderId2[0].id}`);
    console.log(`Toplam: ₺275.50`);
    console.log(`Ödeme: CREDIT`);

    // Üçüncü sipariş - banka kartı
    const orderId3 = await prisma.$queryRaw`
      INSERT INTO "Order" (id, "tableId", "userId", status, total, "paymentMethod", "paidAt", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${table.id}, ${user.id}, 'COMPLETED', 89.75, 'DEBIT', ${now}, ${now}, ${now})
      RETURNING id;
    `;

    console.log('\nÜçüncü test siparişi oluşturuldu:');
    console.log(`ID: ${orderId3[0].id}`);
    console.log(`Toplam: ₺89.75`);
    console.log(`Ödeme: DEBIT`);

    console.log('\n=== TOPLAM ===');
    console.log(`Toplam Satış: ₺${150.00 + 275.50 + 89.75}`);
    console.log(`Nakit: ₺150.00`);
    console.log(`Kredi/Banka Kartı: ₺${275.50 + 89.75}`);

  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTodayOrder(); 