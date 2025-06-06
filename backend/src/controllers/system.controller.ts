import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Sistemi sıfırla - Tüm verileri sil
export const resetSystem = async (req: Request, res: Response) => {
  try {
    console.log('🔄 Sistem sıfırlama başlatılıyor...');
    
    // Veritabanı tablolarını sıfırla (foreign key constraints nedeniyle sırayla)
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.table.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.printer.deleteMany();
    
    // Kullanıcıları sıfırla (admin hariç)
    await prisma.user.deleteMany({
      where: {
        role: {
          not: 'ADMIN'
        }
      }
    });
    
    console.log('✅ Sistem başarıyla sıfırlandı');
    
    return res.json({
      success: true,
      message: 'Sistem başarıyla sıfırlandı. Tüm veriler temizlendi.'
    });
    
  } catch (error) {
    console.error('❌ Sistem sıfırlama hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Sistem sıfırlanırken hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

// Demo verileri yükle
export const loadSampleData = async (req: Request, res: Response) => {
  try {
    console.log('📦 Demo verileri yükleniyor...');
    
    // Kategoriler oluştur
    const categories = await Promise.all([
      prisma.category.create({
        data: {
          name: 'Ana Yemekler'
        }
      }),
      prisma.category.create({
        data: {
          name: 'İçecekler'
        }
      }),
      prisma.category.create({
        data: {
          name: 'Tatlılar'
        }
      }),
      prisma.category.create({
        data: {
          name: 'Salatalar'
        }
      })
    ]);
    
    // Ürünler oluştur
    const products = await Promise.all([
      // Ana Yemekler
      prisma.product.create({
        data: {
          name: 'Izgara Tavuk',
          description: 'Özel baharatlarla marine edilmiş izgara tavuk',
          price: 45.00,
          categoryId: categories[0].id,
          stock: 50
        }
      }),
      prisma.product.create({
        data: {
          name: 'Köfte',
          description: 'Ev yapımı köfte, pilav ve salata ile',
          price: 38.00,
          categoryId: categories[0].id,
          stock: 30
        }
      }),
      prisma.product.create({
        data: {
          name: 'Balık Izgara',
          description: 'Günün taze balığı, ızgara',
          price: 65.00,
          categoryId: categories[0].id,
          stock: 20
        }
      }),
      
      // İçecekler
      prisma.product.create({
        data: {
          name: 'Çay',
          description: 'Geleneksel Türk çayı',
          price: 8.00,
          categoryId: categories[1].id,
          stock: 100
        }
      }),
      prisma.product.create({
        data: {
          name: 'Türk Kahvesi',
          description: 'Geleneksel Türk kahvesi',
          price: 15.00,
          categoryId: categories[1].id,
          stock: 50
        }
      }),
      prisma.product.create({
        data: {
          name: 'Ayran',
          description: 'Ev yapımı ayran',
          price: 12.00,
          categoryId: categories[1].id,
          stock: 80
        }
      }),
      
      // Tatlılar
      prisma.product.create({
        data: {
          name: 'Baklava',
          description: 'Antep fıstıklı baklava',
          price: 25.00,
          categoryId: categories[2].id,
          stock: 25
        }
      }),
      prisma.product.create({
        data: {
          name: 'Sütlaç',
          description: 'Ev yapımı sütlaç',
          price: 18.00,
          categoryId: categories[2].id,
          stock: 15
        }
      }),
      
      // Salatalar
      prisma.product.create({
        data: {
          name: 'Çoban Salata',
          description: 'Domates, salatalık, soğan, maydanoz',
          price: 22.00,
          categoryId: categories[3].id,
          stock: 40
        }
      }),
      prisma.product.create({
        data: {
          name: 'Mevsim Salata',
          description: 'Mevsim yeşillikleri ile',
          price: 28.00,
          categoryId: categories[3].id,
          stock: 35
        }
      })
    ]);
    
    // Bölge oluştur
    const area = await prisma.area.create({
      data: {
        name: 'Ana Salon'
      }
    });
    
    // Masalar oluştur
    const tables = await Promise.all([
      prisma.table.create({
        data: {
          name: 'Masa 1',
          number: '1',
          capacity: 4,
          status: 'AVAILABLE',
          areaId: area.id
        }
      }),
      prisma.table.create({
        data: {
          name: 'Masa 2',
          number: '2',
          capacity: 2,
          status: 'AVAILABLE',
          areaId: area.id
        }
      }),
      prisma.table.create({
        data: {
          name: 'Masa 3',
          number: '3',
          capacity: 6,
          status: 'AVAILABLE',
          areaId: area.id
        }
      }),
      prisma.table.create({
        data: {
          name: 'Masa 4',
          number: '4',
          capacity: 4,
          status: 'AVAILABLE',
          areaId: area.id
        }
      }),
      prisma.table.create({
        data: {
          name: 'Masa 5',
          number: '5',
          capacity: 8,
          status: 'AVAILABLE',
          areaId: area.id
        }
      })
    ]);
    
    // Kasa yazıcısı oluştur (eğer yoksa)
    const existingCashPrinter = await prisma.printer.findFirst({
      where: { type: 'CASH' }
    });
    
    if (!existingCashPrinter) {
      await prisma.printer.create({
        data: {
          name: 'Kasa Yazıcısı',
          type: 'CASH',
          usbPort: 'USB001',
          isActive: true
        }
      });
    }
    
    console.log('✅ Demo verileri başarıyla yüklendi');
    console.log(`📊 Yüklenen veriler:
    - ${categories.length} kategori
    - ${products.length} ürün
    - ${tables.length} masa
    - 1 yazıcı ayarı`);
    
    return res.json({
      success: true,
      message: 'Demo verileri başarıyla yüklendi',
      data: {
        categories: categories.length,
        products: products.length,
        tables: tables.length,
        printers: 1
      }
    });
    
  } catch (error) {
    console.error('❌ Demo veri yükleme hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Demo verileri yüklenirken hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

// Sistem yedeği oluştur
export const createBackup = async (req: Request, res: Response) => {
  try {
    console.log('💾 Sistem yedeği oluşturuluyor...');
    
    // Tüm verileri al
    const [
      categories,
      products,
      tables,
      orders,
      orderItems,
      users,
      printers
    ] = await Promise.all([
      prisma.category.findMany(),
      prisma.product.findMany({ include: { category: true } }),
      prisma.table.findMany(),
      prisma.order.findMany({ include: { table: true } }),
      prisma.orderItem.findMany({ include: { product: true, order: true } }),
      prisma.user.findMany({ select: { id: true, username: true, role: true, createdAt: true } }), // Şifreleri dahil etme
      prisma.printer.findMany()
    ]);
    
    const backupData = {
      metadata: {
        version: '1.0',
        createdAt: new Date().toISOString(),
        system: 'RestoCafe',
        recordCounts: {
          categories: categories.length,
          products: products.length,
          tables: tables.length,
          orders: orders.length,
          orderItems: orderItems.length,
          users: users.length,
          printers: printers.length
        }
      },
      data: {
        categories,
        products,
        tables,
        orders,
        orderItems,
        users,
        printers
      }
    };
    
    console.log('✅ Sistem yedeği oluşturuldu');
    console.log(`📊 Yedeklenen veriler:
    - ${categories.length} kategori
    - ${products.length} ürün
    - ${tables.length} masa
    - ${orders.length} sipariş
    - ${orderItems.length} sipariş kalemi
    - ${users.length} kullanıcı
    - ${printers.length} yazıcı`);
    
    return res.json({
      success: true,
      message: 'Sistem yedeği başarıyla oluşturuldu',
      backup: backupData
    });
    
  } catch (error) {
    console.error('❌ Sistem yedeği oluşturma hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Sistem yedeği oluşturulurken hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

// Sistem istatistikleri
export const getSystemStats = async (req: Request, res: Response) => {
  try {
    console.log('📊 Sistem istatistikleri alınıyor...');
    
    const [
      categoryCount,
      productCount,
      tableCount,
      orderCount,
      userCount,
      printerCount,
      todayOrderCount,
      todayRevenue
    ] = await Promise.all([
      prisma.category.count(),
      prisma.product.count(),
      prisma.table.count(),
      prisma.order.count(),
      prisma.user.count(),
      prisma.printer.count(),
      prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      prisma.order.aggregate({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          },
          status: 'COMPLETED'
        },
        _sum: {
          total: true
        }
      })
    ]);
    
    const stats = {
      totalRecords: {
        categories: categoryCount,
        products: productCount,
        tables: tableCount,
        orders: orderCount,
        users: userCount,
        printers: printerCount
      },
      today: {
        orders: todayOrderCount,
        revenue: todayRevenue._sum.total || 0
      },
      system: {
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform
      }
    };
    
    return res.json({
      success: true,
      message: 'Sistem istatistikleri alındı',
      stats
    });
    
  } catch (error) {
    console.error('❌ Sistem istatistikleri hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Sistem istatistikleri alınırken hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

// Public seed endpoint - İlk kurulum için
export const seedDatabase = async (req: Request, res: Response) => {
  try {
    console.log('🌱 Veritabanı seed işlemi başlatılıyor...');
    
    // Admin kullanıcısı var mı kontrol et
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (existingAdmin) {
      return res.json({
        success: true,
        message: 'Veritabanı zaten seed edilmiş',
        data: { adminExists: true }
      });
    }
    
    // Admin kullanıcısı oluştur
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        password: adminPassword,
        name: 'Admin User',
        email: 'admin@restocafe.com',
        role: 'ADMIN'
      }
    });
    
    console.log('✅ Admin kullanıcısı oluşturuldu');
    
    return res.json({
      success: true,
      message: 'Veritabanı başarıyla seed edildi',
      data: { 
        adminCreated: true,
        adminUsername: 'admin',
        adminPassword: 'admin123'
      }
    });
    
  } catch (error) {
    console.error('❌ Seed hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Seed işlemi başarısız',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
}; 