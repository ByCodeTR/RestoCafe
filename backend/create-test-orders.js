const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestOrders() {
  try {
    // Kullanıcıları ve masaları al
    const users = await prisma.user.findMany();
    const tables = await prisma.table.findMany();
    const products = await prisma.product.findMany();

    if (users.length === 0 || tables.length === 0 || products.length === 0) {
      console.log('Önce seed verilerini çalıştırın: npm run prisma:seed');
      return;
    }

    const admin = users.find(u => u.role === 'ADMIN');
    const waiter = users.find(u => u.role === 'WAITER');

    // Son 30 gün için test siparişleri oluştur
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));

    const paymentMethods = ['CASH', 'CREDIT', 'DEBIT'];
    let orderNumber = 1000;

    for (let i = 0; i < 50; i++) {
      // Rastgele tarih (son 30 gün içinde)
      const randomDate = new Date(
        thirtyDaysAgo.getTime() + Math.random() * (today.getTime() - thirtyDaysAgo.getTime())
      );

      // Rastgele masa ve kullanıcı
      const randomTable = tables[Math.floor(Math.random() * tables.length)];
      const randomUser = Math.random() > 0.5 ? admin : waiter;

      // Rastgele ürünler (1-5 adet)
      const orderItemsCount = Math.floor(Math.random() * 5) + 1;
      const selectedProducts = [];
      
      for (let j = 0; j < orderItemsCount; j++) {
        const randomProduct = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        selectedProducts.push({
          productId: randomProduct.id,
          name: randomProduct.name,
          quantity: quantity,
          price: randomProduct.price,
        });
      }

      // Toplam tutarı hesapla
      const totalAmount = selectedProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // Rastgele ödeme yöntemi
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

      // Sipariş oluştur
      const order = await prisma.order.create({
        data: {
          tableId: randomTable.id,
          userId: randomUser.id,
          status: 'COMPLETED',
          total: totalAmount,
          paymentMethod: paymentMethod,
          paidAt: randomDate,
          createdAt: randomDate,
          updatedAt: randomDate,
          items: {
            create: selectedProducts
          }
        }
      });

      console.log(`Sipariş oluşturuldu: ${order.id} - ${totalAmount.toFixed(2)} TL`);
    }

    console.log('Test siparişleri başarıyla oluşturuldu!');
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestOrders(); 