import { PrismaClient } from '../src/generated/prisma';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Admin kullanıcısı oluştur
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  // Örnek bölge oluştur
  const mainArea = await prisma.area.create({
    data: {
      name: 'Ana Salon',
      tables: {
        create: [
          { number: 1, capacity: 4, status: 'AVAILABLE' },
          { number: 2, capacity: 4, status: 'AVAILABLE' },
          { number: 3, capacity: 6, status: 'AVAILABLE' },
        ],
      },
    },
  });

  // Örnek kategoriler oluştur
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'İçecekler',
        products: {
          create: [
            {
              name: 'Kola',
              description: '330ml',
              price: 15.0,
              stock: 100,
              minStock: 20,
            },
            {
              name: 'Su',
              description: '500ml',
              price: 5.0,
              stock: 200,
              minStock: 50,
            },
          ],
        },
      },
    }),
    prisma.category.create({
      data: {
        name: 'Ana Yemekler',
        products: {
          create: [
            {
              name: 'Köfte',
              description: 'Izgara köfte, pilav ve salata ile',
              price: 85.0,
              stock: 50,
              minStock: 10,
            },
            {
              name: 'Tavuk Şiş',
              description: 'Pilav ve salata ile',
              price: 75.0,
              stock: 50,
              minStock: 10,
            },
          ],
        },
      },
    }),
  ]);

  console.log('Seed data oluşturuldu:');
  console.log('- Admin kullanıcısı:', admin.username);
  console.log('- Bölge:', mainArea.name);
  console.log('- Kategoriler:', categories.map(c => c.name).join(', '));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 