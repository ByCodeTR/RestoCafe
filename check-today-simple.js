const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function checkTodaySimple() {
  try {
    console.log('=== BUGÜNKÜ SİPARİŞLER (4 HAZİRAN) ===\n');

    // Raw SQL ile bugünkü siparişleri al
    const todayOrders = await prisma.$queryRaw`
      SELECT 
        id, 
        status, 
        total, 
        "paymentMethod", 
        "paidAt", 
        "createdAt"
      FROM "Order" 
      WHERE DATE("createdAt") = CURRENT_DATE
      ORDER BY "createdAt" DESC;
    `;

    console.log(`Bugün toplam ${todayOrders.length} sipariş var:\n`);

    let totalSales = 0;
    let creditTotal = 0;
    let cashTotal = 0;
    let paidOrdersCount = 0;

    todayOrders.forEach((order, index) => {
      console.log(`${index + 1}. Sipariş ID: ${order.id}`);
      console.log(`   Durum: ${order.status}`);
      console.log(`   Toplam: ₺${order.total}`);
      console.log(`   Ödeme Yöntemi: ${order.paymentMethod || 'Belirtilmemiş'}`);
      console.log(`   Ödeme Tarihi: ${order.paidAt ? new Date(order.paidAt).toLocaleString('tr-TR') : 'Ödenmemiş'}`);
      console.log(`   Oluşturma: ${new Date(order.createdAt).toLocaleString('tr-TR')}`);
      
      // Ödemesi alınan siparişleri hesapla
      if (order.paidAt && order.status === 'COMPLETED') {
        totalSales += order.total;
        paidOrdersCount++;
        
        if (order.paymentMethod === 'CREDIT' || order.paymentMethod === 'DEBIT') {
          creditTotal += order.total;
        } else if (order.paymentMethod === 'CASH') {
          cashTotal += order.total;
        }
      }
      
      console.log('   ---');
    });

    console.log('\n=== GÜNLÜK İSTATİSTİKLER ===');
    console.log(`Toplam Satış: ₺${totalSales}`);
    console.log(`Ödemesi Alınan Sipariş Sayısı: ${paidOrdersCount}`);
    console.log(`Kredi Kartı/Banka Kartı: ₺${creditTotal}`);
    console.log(`Nakit: ₺${cashTotal}`);

  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTodaySimple(); 