const { PrismaClient } = require('./src/generated/prisma');
const { startOfDay, endOfDay } = require('date-fns');

const prisma = new PrismaClient();

async function checkRecentOrders() {
  try {
    console.log('=== SON SİPARİŞLER VE ÖDEME DURUMLARI ===\n');

    // Bugünkü tüm siparişler
    const today = new Date();
    const startToday = startOfDay(today);
    const endToday = endOfDay(today);

    const allTodayOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startToday,
          lte: endToday,
        },
      },
      include: {
        table: true,
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`Bugün toplam ${allTodayOrders.length} sipariş var:\n`);

    allTodayOrders.forEach((order, index) => {
      console.log(`${index + 1}. Sipariş ID: ${order.id}`);
      console.log(`   Masa: ${order.table.name || order.table.number}`);
      console.log(`   Durum: ${order.status}`);
      console.log(`   Toplam: ₺${order.total}`);
      console.log(`   Ödeme Yöntemi: ${order.paymentMethod || 'Belirtilmemiş'}`);
      console.log(`   Ödeme Tarihi: ${order.paidAt ? order.paidAt.toLocaleString('tr-TR') : 'Ödenmemiş'}`);
      console.log(`   Oluşturma: ${order.createdAt.toLocaleString('tr-TR')}`);
      console.log('   ---');
    });

    // Ödemesi alınan siparişler
    const paidOrders = allTodayOrders.filter(order => order.paidAt && order.status === 'COMPLETED');
    console.log(`\n=== ÖDEMESİ ALINAN SİPARİŞLER (${paidOrders.length} adet) ===\n`);

    let totalSales = 0;
    let creditCardTotal = 0;
    let cashTotal = 0;

    paidOrders.forEach((order, index) => {
      console.log(`${index + 1}. Sipariş ID: ${order.id}`);
      console.log(`   Masa: ${order.table.name || order.table.number}`);
      console.log(`   Toplam: ₺${order.total}`);
      console.log(`   Ödeme: ${order.paymentMethod}`);
      console.log(`   Ödeme Tarihi: ${order.paidAt.toLocaleString('tr-TR')}`);
      
      totalSales += order.total;
      if (order.paymentMethod === 'CREDIT_CARD') {
        creditCardTotal += order.total;
      } else if (order.paymentMethod === 'CASH') {
        cashTotal += order.total;
      }
      console.log('   ---');
    });

    console.log('\n=== GÜNLÜK İSTATİSTİKLER ===');
    console.log(`Toplam Satış: ₺${totalSales}`);
    console.log(`Sipariş Sayısı: ${paidOrders.length}`);
    console.log(`Kredi Kartı: ₺${creditCardTotal}`);
    console.log(`Nakit: ₺${cashTotal}`);

  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecentOrders(); 