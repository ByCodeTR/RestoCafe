const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Önce kullanıcıları oluşturalım
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      password: 'admin123', // Gerçek uygulamada şifrelenmiş olmalı
      name: 'Admin User',
      role: 'ADMIN'
    }
  });

  const waiter = await prisma.user.create({
    data: {
      username: 'garson1',
      password: 'garson123',
      name: 'Ahmet Yılmaz',
      role: 'WAITER'
    }
  });

  // Alanları oluşturalım
  const mainArea = await prisma.area.create({
    data: {
      name: 'Ana Salon',
    }
  });

  const terrace = await prisma.area.create({
    data: {
      name: 'Teras',
    }
  });

  // Masaları oluşturalım
  await prisma.table.createMany({
    data: [
      { number: 1, capacity: 4, status: 'AVAILABLE', areaId: mainArea.id },
      { number: 2, capacity: 2, status: 'AVAILABLE', areaId: mainArea.id },
      { number: 3, capacity: 6, status: 'AVAILABLE', areaId: terrace.id },
      { number: 4, capacity: 4, status: 'AVAILABLE', areaId: terrace.id },
    ]
  });

  // Kategorileri oluşturalım
  const mainDishes = await prisma.category.create({
    data: {
      name: 'Ana Yemekler',
    }
  });

  const drinks = await prisma.category.create({
    data: {
      name: 'İçecekler',
    }
  });

  const desserts = await prisma.category.create({
    data: {
      name: 'Tatlılar',
    }
  });

  // Ürünleri oluşturalım
  await prisma.product.createMany({
    data: [
      {
        name: 'Izgara Köfte',
        description: 'Özel baharatlarla marine edilmiş dana kıyma köfte',
        price: 120.00,
        categoryId: mainDishes.id,
        stock: 50,
        minStock: 10
      },
      {
        name: 'Ayran',
        description: 'Taze ayran',
        price: 15.00,
        categoryId: drinks.id,
        stock: 100,
        minStock: 20
      },
      {
        name: 'Künefe',
        description: 'Antep fıstıklı künefe',
        price: 80.00,
        categoryId: desserts.id,
        stock: 30,
        minStock: 5
      },
      {
        name: 'Tavuk Şiş',
        description: 'Marine edilmiş tavuk şiş',
        price: 100.00,
        categoryId: mainDishes.id,
        stock: 40,
        minStock: 8
      }
    ]
  });

  // Tedarikçileri oluşturalım
  await prisma.supplier.createMany({
    data: [
      {
        name: 'Güven Et',
        phone: '0532 111 2233',
        email: 'guven@et.com',
        address: 'İstanbul'
      },
      {
        name: 'Taze Sebze Meyve',
        phone: '0533 444 5566',
        email: 'taze@sebze.com',
        address: 'Ankara'
      }
    ]
  });

  console.log('Örnek veriler başarıyla eklendi!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 