const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function checkDbSchema() {
  try {
    // Raw SQL ile Order tablosunun kolonlarını kontrol et
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Order' 
      ORDER BY ordinal_position;
    `;
    
    console.log('Order tablosundaki kolonlar:');
    columns.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type}`);
    });

    // Son birkaç siparişi basit şekilde çek
    const recentOrders = await prisma.$queryRaw`
      SELECT id, status, total, "paymentMethod", "paidAt", "createdAt"
      FROM "Order" 
      ORDER BY "createdAt" DESC 
      LIMIT 5;
    `;

    console.log('\nSon 5 sipariş:');
    recentOrders.forEach((order, index) => {
      console.log(`${index + 1}. ID: ${order.id}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Total: ₺${order.total}`);
      console.log(`   Payment Method: ${order.paymentMethod || 'null'}`);
      console.log(`   Paid At: ${order.paidAt || 'null'}`);
      console.log(`   Created: ${order.createdAt}`);
      console.log('   ---');
    });

  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDbSchema(); 