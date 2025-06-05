import { PrismaClient, Role, TableStatus, OrderStatus, PaymentType, StockLogType } from '@prisma/client';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Başlıyor...');

    // Create users
    console.log('Kullanıcılar oluşturuluyor...');
    
    // Hash all passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const garsonPassword = await bcrypt.hash('garson123', 10);
    const kasiyerPassword = await bcrypt.hash('kasiyer123', 10);
    
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        password: adminPassword,
        name: 'Admin User',
        role: Role.ADMIN
      },
    });
    console.log('Admin oluşturuldu:', admin);

    const waiter1 = await prisma.user.create({
      data: {
        username: 'garson1',
        password: garsonPassword,
        name: 'Ahmet Garson',
        role: Role.WAITER
      },
    });
    console.log('Garson 1 oluşturuldu:', waiter1);

    const waiter2 = await prisma.user.create({
      data: {
        username: 'garson2',
        password: garsonPassword,
        name: 'Mehmet Garson',
        role: Role.WAITER
      },
    });

    const cashier = await prisma.user.create({
      data: {
        username: 'kasiyer1',
        password: kasiyerPassword,
        name: 'Ayşe Kasiyer',
        role: Role.CASHIER
      },
    });

    // Create areas
    console.log('Bölgeler oluşturuluyor...');
    const salon = await prisma.area.create({
      data: {
        name: 'Salon',
        tables: {
          create: [
            { number: 1, capacity: 4 },
            { number: 2, capacity: 4 },
            { number: 3, capacity: 6 },
          ],
        },
      },
    });
    console.log('Salon oluşturuldu:', salon);

    const bahce = await prisma.area.create({
      data: {
        name: 'Bahçe',
        tables: {
          create: [
            { number: 4, capacity: 4 },
            { number: 5, capacity: 4 },
            { number: 6, capacity: 8 },
          ],
        },
      },
    });
    console.log('Bahçe oluşturuldu:', bahce);

    // Create tables
    console.log('Masalar oluşturuluyor...');
    const tables = await Promise.all([
      prisma.table.create({
        data: {
          number: 1,
          capacity: 4,
          status: TableStatus.AVAILABLE,
          areaId: salon.id,
        },
      }),
      prisma.table.create({
        data: {
          number: 2,
          capacity: 4,
          status: TableStatus.AVAILABLE,
          areaId: salon.id,
        },
      }),
      prisma.table.create({
        data: {
          number: 3,
          capacity: 6,
          status: TableStatus.AVAILABLE,
          areaId: salon.id,
        },
      }),
      prisma.table.create({
        data: {
          number: 4,
          capacity: 4,
          status: TableStatus.AVAILABLE,
          areaId: bahce.id,
        },
      }),
      prisma.table.create({
        data: {
          number: 5,
          capacity: 4,
          status: TableStatus.AVAILABLE,
          areaId: bahce.id,
        },
      }),
      prisma.table.create({
        data: {
          number: 6,
          capacity: 8,
          status: TableStatus.AVAILABLE,
          areaId: bahce.id,
        },
      }),
    ]);

    // Create categories
    console.log('Kategoriler oluşturuluyor...');
    const icecekler = await prisma.category.create({
      data: {
        name: 'İçecekler',
        products: {
          create: [
            { name: 'Çay', price: 15, stock: 100, minStock: 50 },
            { name: 'Kahve', price: 30, stock: 50, minStock: 20 },
            { name: 'Limonata', price: 25, stock: 30, minStock: 10 },
          ],
        },
      },
    });
    console.log('İçecekler kategorisi oluşturuldu:', icecekler);

    const yemekler = await prisma.category.create({
      data: {
        name: 'Yemekler',
        products: {
          create: [
            { name: 'Köfte', price: 120, stock: 50, minStock: 10 },
            { name: 'Pide', price: 90, stock: 30, minStock: 5 },
            { name: 'Lahmacun', price: 50, stock: 40, minStock: 10 },
          ],
        },
      },
    });
    console.log('Yemekler kategorisi oluşturuldu:', yemekler);

    // Create products
    console.log('Ürünler oluşturuluyor...');
    const cola = await prisma.product.create({
      data: {
        name: 'Cola',
        description: 'Soğuk içecek',
        price: 15.0,
        categoryId: icecekler.id,
        stock: 100,
        minStock: 20,
      },
    });
    console.log('Cola ürünü oluşturuldu:', cola);

    const ayran = await prisma.product.create({
      data: {
        name: 'Ayran',
        description: 'Soğuk içecek',
        price: 10.0,
        categoryId: icecekler.id,
        stock: 50,
        minStock: 10,
      },
    });
    console.log('Ayran ürünü oluşturuldu:', ayran);

    const kebab = await prisma.product.create({
      data: {
        name: 'Adana Kebap',
        description: 'Acılı kebap',
        price: 120.0,
        categoryId: yemekler.id,
        stock: 50,
        minStock: 10,
      },
    });
    console.log('Adana Kebap ürünü oluşturuldu:', kebab);

    const iskender = await prisma.product.create({
      data: {
        name: 'İskender',
        description: 'Döner, yoğurt ve domates sosu',
        price: 100.0,
        categoryId: yemekler.id,
        stock: 30,
        minStock: 5,
      },
    });
    console.log('İskender ürünü oluşturuldu:', iskender);

    const künefe = await prisma.product.create({
      data: {
        name: 'Künefe',
        description: 'Sıcak servis',
        price: 60.0,
        categoryId: yemekler.id,
        stock: 20,
        minStock: 5,
      },
    });
    console.log('Künefe ürünü oluşturuldu:', künefe);

    const çobanSalata = await prisma.product.create({
      data: {
        name: 'Çoban Salata',
        description: 'Domates, salatalık, biber, soğan',
        price: 35.0,
        categoryId: yemekler.id,
        stock: 40,
        minStock: 8,
      },
    });
    console.log('Çoban Salata ürünü oluşturuldu:', çobanSalata);

    // Create suppliers
    const supplier1 = await prisma.supplier.create({
      data: {
        name: 'ABC Tedarik',
        phone: '0212 123 4567',
        email: 'abc@tedarik.com',
        address: 'İstanbul',
      },
    });

    const supplier2 = await prisma.supplier.create({
      data: {
        name: 'XYZ Gıda',
        phone: '0216 987 6543',
        email: 'xyz@gida.com',
        address: 'Ankara',
      },
    });

    // Create some orders
    await prisma.order.create({
      data: {
        tableId: tables[0].id,
        userId: waiter1.id,
        status: OrderStatus.ACTIVE,
        total: 165.0,
        items: {
          create: [
            {
              productId: cola.id, // Cola
              quantity: 1,
              price: 15.0,
            },
            {
              productId: kebab.id, // Adana Kebap
              quantity: 1,
              price: 120.0,
            },
            {
              productId: çobanSalata.id, // Çoban Salata
              quantity: 1,
              price: 30.0,
            },
          ],
        },
      },
    });

    await prisma.order.create({
      data: {
        tableId: tables[2].id,
        userId: waiter2.id,
        status: OrderStatus.COMPLETED,
        total: 170.0,
        paymentType: PaymentType.CREDIT_CARD,
        items: {
          create: [
            {
              productId: iskender.id, // İskender
              quantity: 1,
              price: 100.0,
            },
            {
              productId: künefe.id, // Künefe
              quantity: 1,
              price: 60.0,
            },
            {
              productId: ayran.id, // Ayran
              quantity: 1,
              price: 10.0,
            },
          ],
        },
      },
    });

    // Create some stock logs
    await Promise.all([
      prisma.stockLog.create({
        data: {
          productId: cola.id,
          supplierId: supplier1.id,
          quantity: 100,
          type: StockLogType.IN,
        },
      }),
      prisma.stockLog.create({
        data: {
          productId: kebab.id,
          supplierId: supplier2.id,
          quantity: 50,
          type: StockLogType.IN,
        },
      }),
    ]);

    console.log('Tüm veriler başarıyla oluşturuldu! 🎉');
  } catch (error) {
    console.error('Bir hata oluştu:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('Ana fonksiyonda hata:', e);
    process.exit(1);
  })
  .finally(async () => {
    console.log('Bağlantı kapatılıyor...');
    await prisma.$disconnect();
  }); 