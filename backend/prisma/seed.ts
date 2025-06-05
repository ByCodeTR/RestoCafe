import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

// Role enum
enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  CASHIER = 'CASHIER',
  WAITER = 'WAITER',
  KITCHEN = 'KITCHEN',
}

async function main() {
  try {
    // Önce mevcut verileri temizle (sıralı olarak)
    await prisma.orderItem.deleteMany()
    await prisma.order.deleteMany()
    await prisma.stockLog.deleteMany()
    await prisma.product.deleteMany()
    await prisma.category.deleteMany()
    await prisma.table.deleteMany()
    await prisma.area.deleteMany()
    await prisma.supplier.deleteMany()
    await prisma.user.deleteMany()

    console.log('Mevcut veriler temizlendi...')

    // Tedarikçileri oluştur
    const suppliers = [
      {
        name: 'Anadolu Et',
        contactName: 'Mehmet Yılmaz',
        phone: '0532 111 2233',
        email: 'info@anadoluet.com',
        address: 'Ankara Gıda Toptancılar Sitesi No: 123',
      },
      {
        name: 'Ege Sebze Meyve',
        contactName: 'Ayşe Demir',
        phone: '0533 222 3344',
        email: 'satis@egesebze.com',
        address: 'İzmir Sebze Hali No: 45',
      },
      {
        name: 'Marmara İçecek',
        contactName: 'Ali Kaya',
        phone: '0534 333 4455',
        email: 'siparis@marmaraicecek.com',
        address: 'İstanbul Toptancılar Hali Blok C No: 78',
      },
      {
        name: 'Karadeniz Balık',
        contactName: 'Fatma Şahin',
        phone: '0535 444 5566',
        email: 'info@karadenizbalik.com',
        address: 'Trabzon Balık Hali No: 34',
      },
      {
        name: 'Akdeniz Baharat',
        contactName: 'Hasan Öztürk',
        phone: '0536 555 6677',
        email: 'satis@akdenizbaharat.com',
        address: 'Antalya Toptancılar Çarşısı No: 56',
      }
    ]

    for (const supplier of suppliers) {
      await prisma.supplier.create({
        data: supplier,
      })
    }

    console.log('Tedarikçiler oluşturuldu...')

    // Admin kullanıcısı oluştur
    const adminPassword = await bcrypt.hash('admin123', 10)
    const admin = await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        password: adminPassword,
        name: 'Admin User',
        email: 'admin@restocafe.com',
        role: UserRole.ADMIN
      },
    })

    // Manager kullanıcısı oluştur
    const managerPassword = await bcrypt.hash('manager123', 10)
    const manager = await prisma.user.upsert({
      where: { username: 'manager' },
      update: {},
      create: {
        username: 'manager',
        password: managerPassword,
        name: 'Manager User',
        email: 'manager@restocafe.com',
        role: UserRole.MANAGER
      },
    })

    // Garson kullanıcısı oluştur
    const waiterPassword = await bcrypt.hash('waiter123', 10)
    const waiter = await prisma.user.upsert({
      where: { username: 'waiter' },
      update: {},
      create: {
        username: 'waiter',
        password: waiterPassword,
        name: 'Waiter User',
        email: 'waiter@restocafe.com',
        role: UserRole.WAITER
      },
    })

    // Garson1 kullanıcısı oluştur
    const garson1Password = await bcrypt.hash('garson123', 10)
    const garson1 = await prisma.user.upsert({
      where: { username: 'garson1' },
      update: {},
      create: {
        username: 'garson1',
        password: garson1Password,
        name: 'Ahmet Garson',
        email: 'garson1@restocafe.com',
        role: UserRole.WAITER
      },
    })

    // Garson2 kullanıcısı oluştur
    const garson2Password = await bcrypt.hash('garson123', 10)
    const garson2 = await prisma.user.upsert({
      where: { username: 'garson2' },
      update: {},
      create: {
        username: 'garson2',
        password: garson2Password,
        name: 'Mehmet Garson',
        email: 'garson2@restocafe.com',
        role: UserRole.WAITER
      },
    })

    // Mutfak kullanıcısı oluştur
    const kitchenPassword = await bcrypt.hash('kitchen123', 10)
    const kitchen = await prisma.user.upsert({
      where: { username: 'kitchen' },
      update: {},
      create: {
        username: 'kitchen',
        password: kitchenPassword,
        name: 'Kitchen User',
        email: 'kitchen@restocafe.com',
        role: UserRole.KITCHEN
      },
    })

    // Alanlar oluştur
    const mainArea = await prisma.area.create({
      data: {
        name: 'Ana Salon',
      },
    })

    const terrace = await prisma.area.create({
      data: {
        name: 'Teras',
      },
    })

    // Masalar oluştur
    for (let i = 1; i <= 10; i++) {
      await prisma.table.create({
        data: {
          name: `Masa ${i}`,
          number: `T${i}`,
          capacity: i <= 5 ? 4 : 6,
          status: 'AVAILABLE',
          totalAmount: 0,
          areaId: i <= 6 ? mainArea.id : terrace.id,
        },
      })
    }

    // Kategoriler oluştur
    const categories = [
      { name: 'Çorbalar' },
      { name: 'Ana Yemekler' },
      { name: 'Salatalar' },
      { name: 'İçecekler' },
      { name: 'Tatlılar' },
    ]

    const createdCategories = []
    for (const category of categories) {
      const createdCategory = await prisma.category.create({
        data: category,
      })
      createdCategories.push(createdCategory)
    }

    // Ürünler oluştur
    const products = [
      { name: 'Mercimek Çorbası', price: 45.00, categoryName: 'Çorbalar', description: 'Geleneksel mercimek çorbası', stock: 50, minStock: 10 },
      { name: 'Domates Çorbası', price: 45.00, categoryName: 'Çorbalar', description: 'Kremalı domates çorbası', stock: 50, minStock: 10 },
      { name: 'Köfte', price: 120.00, categoryName: 'Ana Yemekler', description: 'Izgara köfte', stock: 30, minStock: 5 },
      { name: 'Tavuk Şiş', price: 100.00, categoryName: 'Ana Yemekler', description: 'Marine edilmiş tavuk şiş', stock: 30, minStock: 5 },
      { name: 'Mevsim Salata', price: 55.00, categoryName: 'Salatalar', description: 'Mevsim yeşillikleri', stock: 20, minStock: 5 },
      { name: 'Çoban Salata', price: 45.00, categoryName: 'Salatalar', description: 'Domates, salatalık, biber', stock: 20, minStock: 5 },
      { name: 'Kola', price: 25.00, categoryName: 'İçecekler', description: 'Soğuk içecek', stock: 100, minStock: 20 },
      { name: 'Ayran', price: 20.00, categoryName: 'İçecekler', description: 'Taze ayran', stock: 100, minStock: 20 },
      { name: 'Künefe', price: 75.00, categoryName: 'Tatlılar', description: 'Sıcak künefe', stock: 15, minStock: 5 },
      { name: 'Sütlaç', price: 55.00, categoryName: 'Tatlılar', description: 'Fırında sütlaç', stock: 15, minStock: 5 },
    ]

    const categoryMap = new Map(createdCategories.map(cat => [cat.name, cat.id]))

    for (const product of products) {
      const categoryId = categoryMap.get(product.categoryName)
      if (categoryId) {
        await prisma.product.create({
          data: {
            name: product.name,
            price: product.price,
            description: product.description,
            categoryId: categoryId,
            stock: product.stock,
            minStock: product.minStock,
          },
        })
      }
    }

    console.log('Seed data created successfully')
  } catch (error) {
    console.error('Error seeding data:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })