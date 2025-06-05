import { Request, Response } from 'express';
import { PrismaClient, OrderStatus } from '@prisma/client';
import { io } from '../index';
import { printKitchenOrder } from '../services/printer.service';
import { printCashReceipt, printBillSummary } from '../services/printer.service';

const prisma = new PrismaClient();

// Input validasyonu
const validateOrderInput = (data: any) => {
  const errors = [];

  if (!data.tableId) {
    errors.push('Masa seçimi zorunludur');
  }

  if (!Array.isArray(data.items) || data.items.length === 0) {
    errors.push('En az bir ürün seçmelisiniz');
  }

  for (const item of data.items || []) {
    if (!item.productId || !item.quantity || item.quantity < 1) {
      errors.push('Geçersiz ürün veya miktar');
      break;
    }
  }

  return errors;
};

// Tüm siparişleri getir
export const getOrders = async (req: Request, res: Response) => {
  try {
    const { 'table.number': tableNumber, 'table.id': tableId } = req.query;

    let whereCondition: any = {
      status: {
        not: OrderStatus.PAID // Ödenmiş siparişleri hariç tut
      }
    };

    // Table ID ile filtreleme
    if (tableId) {
      whereCondition.tableId = tableId as string;
    }
    // Table number ile filtreleme (eski uyumluluk için)
    else if (tableNumber) {
      whereCondition.table = {
        number: tableNumber as string
      };
    }

    const orders = await prisma.order.findMany({
      where: whereCondition,
      include: {
        table: {
          include: {
            area: true
          }
        },
        user: {
          select: {
            id: true,
            name: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Yanıtı kontrol et
    console.log('Orders Response:', {
      success: true,
      data: orders
    });

    return res.json({
      success: true,
      data: orders
    });

  } catch (error) {
    console.error('Siparişler getirilirken hata:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Siparişler getirilemedi'
    });
  }
};

// Sipariş detayı getir
export const getOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    console.log('Sipariş detayı istendi:', id);

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        table: true,
        user: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Sipariş bulunamadı' 
      });
    }

    // Sipariş verisini frontend'in beklediği formata dönüştür
    const formattedOrder = {
      id: order.id,
      tableId: order.tableId,
      tableNumber: order.table.number,
      tableName: order.table.name,
      status: order.status,
      total: order.total,
      formattedTotal: new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY'
      }).format(order.total),
      createdAt: order.createdAt,
      items: order.items.map(item => ({
        id: item.id,
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        formattedPrice: new Intl.NumberFormat('tr-TR', {
          style: 'currency',
          currency: 'TRY'
        }).format(item.price),
        note: item.note || '',
        product: {
          id: item.product.id,
          name: item.product.name,
          price: item.product.price
        }
      })),
      user: {
        id: order.user.id,
        name: order.user.name
      }
    };

    return res.status(200).json({
      success: true,
      data: formattedOrder,
      message: 'Sipariş detayı başarıyla getirildi'
    });

  } catch (error) {
    console.error('Sipariş detayı getirilirken hata:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Sipariş detayı getirilemedi',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Yeni sipariş oluştur
export const createOrder = async (req: Request, res: Response) => {
  try {
    const { tableId, items } = req.body;
    const userId = req.user?.id;

    console.log('Gelen sipariş verisi:', { tableId, items, userId });

    if (!tableId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        message: 'Geçersiz sipariş verisi. tableId ve items alanları zorunludur.' 
      });
    }

    if (!userId) {
      return res.status(401).json({
        message: 'Kullanıcı kimliği bulunamadı. Lütfen tekrar giriş yapın.'
      });
    }

    // Masa kontrolü
    const table = await prisma.table.findUnique({
      where: { id: tableId }
    });

    console.log('Masa bilgisi:', table);

    if (!table) {
      return res.status(404).json({ message: 'Masa bulunamadı' });
    }

    // Ürün bilgilerini ve toplam tutarı hesapla
    let total = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      });

      console.log('Ürün bilgisi:', product);

      if (!product) {
        return res.status(404).json({ message: `Ürün bulunamadı: ${item.productId}` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `${product.name} için yeterli stok yok. Mevcut stok: ${product.stock}` 
        });
      }

      const itemTotal = product.price * item.quantity;
      total += itemTotal;

      orderItems.push({
        productId: product.id,
        name: product.name,
        quantity: item.quantity,
        price: product.price,
        note: item.note
      });
    }

    console.log('Transaction başlatılıyor...');

    // Transaction ile işlemleri gerçekleştir
    const result = await prisma.$transaction(async (tx) => {
      // Masa durumunu güncelle
      console.log('Masa durumu güncelleniyor...');
      const updatedTable = await tx.table.update({
        where: { id: tableId },
        data: {
          status: 'OCCUPIED',
          totalAmount: {
            increment: total
          },
          updatedAt: new Date()
        }
      });

      // Socket.IO ile masa durumu güncellemesini bildir
      console.log('Masa durumu Socket.IO ile gönderiliyor...');
      if (io) {
        io.emit('tableStatusUpdated', {
          id: updatedTable.id,
          status: updatedTable.status,
          number: updatedTable.number,
          totalAmount: updatedTable.totalAmount
        });
      }

      // Siparişi oluştur
      console.log('Sipariş oluşturuluyor...');
      const order = await tx.order.create({
        data: {
          tableId,
          userId,
          total,
          items: {
            create: orderItems
          }
        },
        include: {
          table: {
            include: {
              area: true
            }
          },
          user: true,
          items: {
            include: {
              product: true
            }
          }
        }
      });

      // Stok güncelle
      console.log('Stok güncelleniyor...');
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });

        // Stok hareketi kaydet
        await tx.stockLog.create({
          data: {
            productId: item.productId,
            quantity: -item.quantity,
            type: 'OUT',
            notes: `Sipariş: ${order.id}`
          }
        });
      }

      return order;
    });

    // Socket.IO ile sipariş bildirimini gönder
    console.log('Sipariş Socket.IO ile gönderiliyor...');
    if (io) {
      io.to('kitchen').emit('newOrder', {
        id: result.id,
        table: result.table,
        items: result.items,
        createdAt: result.createdAt
      });
      
      // Admin paneline de bildirim gönder
      io.to('admin').emit('newOrder', {
        id: result.id,
        table: result.table,
        items: result.items,
        total: result.total,
        createdAt: result.createdAt
      });
    }

    // Mutfak yazıcısına gönder (fiyatsız)
    console.log('Mutfak yazıcısına gönderiliyor...');
    try {
      const kitchenPrintData = {
        orderId: result.id,
        tableNumber: result.table.name || result.table.number,
        areaName: result.table.area?.name || 'Bilinmeyen Bölge',
        items: result.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          notes: item.note || ''
        })),
        createdAt: result.createdAt,
        waiter: result.user.name
      };

      // Gerçek yazıcıya yazdır
      const printResult = await printKitchenOrder(kitchenPrintData);
      console.log('Mutfak yazıcısı sonucu:', printResult);
      
      // Socket.IO ile de bildir (ekran görüntüsü için)
      if (io) {
        io.to('kitchen').emit('printKitchenOrder', {
          ...kitchenPrintData,
          printResult
        });
      }
    } catch (printError) {
      console.error('Yazıcı hatası:', printError);
      // Yazıcı hatası sipariş oluşturmayı engellemez
    }

    return res.status(201).json({
      success: true,
      data: result,
      message: 'Sipariş başarıyla oluşturuldu'
    });

  } catch (error) {
    console.error('Sipariş oluşturma hatası:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Sipariş oluşturulamadı',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Sipariş durumunu güncelle
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        table: true,
        user: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    // Socket.IO ile sipariş durumu güncellemesi gönder
    if (io) {
      io.emit('orderUpdated', {
        id: order.id,
        tableNumber: order.table.number,
        status: order.status,
        total: order.total,
        createdAt: order.createdAt,
        items: order.items.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.price
        }))
      });
    }

    res.json(order);
  } catch (error) {
    console.error('Sipariş durumu güncellenirken hata:', error);
    res.status(500).json({ message: 'Sipariş durumu güncellenemedi' });
  }
};

// Siparişi iptal et
export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Önce siparişi kontrol et
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Sipariş bulunamadı' });
    }

    // Transaction ile siparişi sil ve stokları geri yükle
    await prisma.$transaction(async (tx) => {
      // Stokları geri yükle
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity
            }
          }
        });

        // Stok log kaydı
        await tx.stockLog.create({
          data: {
            productId: item.productId,
            type: 'IN',
            quantity: item.quantity,
            notes: `Sipariş #${order.id} iptal edildi - ${item.quantity} adet iade`
          }
        });
      }

      // Masa durumunu güncelle
      await tx.table.update({
        where: { id: order.tableId },
        data: { status: 'AVAILABLE' }
      });

      // Siparişi sil
      await tx.orderItem.deleteMany({
        where: { orderId: id }
      });
      await tx.order.delete({
        where: { id }
      });
    });

    // Socket.IO ile sipariş silindi bildirimi gönder
    if (io) {
      io.emit('orderDeleted', id);
    }

    res.status(204).send();
  } catch (error) {
    console.error('Sipariş silinirken hata:', error);
    res.status(500).json({ message: 'Sipariş silinemedi' });
  }
};

// Mutfak yazdırma durumunu güncelle
export const updatePrintStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id }
    });

    if (!order) {
      return res.status(404).json({ message: 'Sipariş bulunamadı' });
    }

    order.isPrinted = true;
    await prisma.order.update({
      where: { id },
      data: { isPrinted: true }
    });

    res.json(order);
  } catch (error) {
    console.error('Update print status error:', error);
    res.status(500).json({ message: 'Yazdırma durumu güncellenemedi' });
  }
};

// Ödeme işlemi
export const processPayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentMethod, cashAmount, creditAmount } = req.body;
    
    console.log('Ödeme isteği alındı:', {
      orderId: id,
      paymentMethod,
      cashAmount,
      creditAmount
    });

    // Siparişi kontrol et
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        table: true
      }
    });

    console.log('Sipariş bulundu:', order);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı'
      });
    }

    if (order.status === 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'Bu sipariş zaten ödenmiş'
      });
    }

    // Transaction ile ödeme işlemini gerçekleştir
    const result = await prisma.$transaction(async (tx) => {
      // Siparişi güncelle
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.PAID,
          paymentMethod: paymentMethod.toUpperCase(),
          cashAmount: cashAmount || null,
          creditAmount: creditAmount || null,
          paidAt: new Date()
        },
        include: {
          table: true,
          items: {
            include: {
              product: true
            }
          },
          user: true // Kasa fişi için user bilgisi de dahil et
        }
      });

      // Masanın başka aktif siparişi var mı kontrol et
      const activeOrders = await tx.order.count({
        where: {
          tableId: order.tableId,
          status: {
            notIn: [OrderStatus.PAID, OrderStatus.CANCELLED]
          }
        }
      });

      // Eğer masada başka aktif sipariş yoksa masayı temizle
      if (activeOrders === 0) {
        await tx.table.update({
          where: { id: order.tableId },
          data: {
            status: 'AVAILABLE',
            totalAmount: 0,
            updatedAt: new Date()
          }
        });

        // Önce tamamlanmış veya ödenmiş siparişlerin order item'larını sil
        const completedOrders = await tx.order.findMany({
          where: {
            tableId: order.tableId,
            status: {
              in: [OrderStatus.SERVED, OrderStatus.PAID]
            }
          },
          select: {
            id: true
          }
        });

        const orderIds = completedOrders.map(order => order.id);

        if (orderIds.length > 0) {
          // Önce order item'ları sil
          await tx.orderItem.deleteMany({
            where: {
              orderId: {
                in: orderIds
              }
            }
          });

          // Sonra siparişleri sil
          await tx.order.deleteMany({
            where: {
              id: {
                in: orderIds
              }
            }
          });
        }
      } else {
        // Masanın toplam tutarını güncelle
        await tx.table.update({
          where: { id: order.tableId },
          data: {
            totalAmount: {
              decrement: order.total
            }
          }
        });
      }

      return updatedOrder;
    });

    console.log('Ödeme işlemi tamamlandı:', result);

    // Kasa yazıcısından ödeme fişi yazdır
    try {
      console.log('[Payment] Kasa yazıcısından fiş yazdırılıyor...');
      
      console.log('[Payment] Sipariş detayları:', {
        id: result?.id,
        tableId: result?.table?.id,
        tableName: result?.table?.name,
        itemCount: result?.items?.length,
        userName: result?.user?.name,
        total: result?.total
      });

      if (result && result.items && result.items.length > 0) {
        // Kasa fişi için veri hazırla
        const receiptData = {
          id: result.id,
          table: result.table,
          items: result.items.map(item => ({
            name: item.product.name,
            quantity: item.quantity,
            price: item.price
          })),
          total: result.total,
          paymentMethod: paymentMethod.toUpperCase(),
          cashReceived: cashAmount,
          waiter: result.user?.name || 'Sistem', // User name'i kullan
          createdAt: result.createdAt
        };

        console.log('[Payment] Kasa fişi verisi:', receiptData);

        const printResult = await printCashReceipt(receiptData);
        
        console.log('[Payment] Kasa yazıcısı sonucu:', printResult);
        
        if (printResult.success) {
          console.log('[Payment] ✅ Kasa fişi başarıyla yazdırıldı:', printResult.message);
        } else {
          console.log('[Payment] ⚠️ Kasa fişi yazdırılamadı:', printResult.message);
        }
      } else {
        console.log('[Payment] ❌ Sipariş detayları eksik veya boş!');
        console.log('[Payment] Result verisi:', JSON.stringify(result, null, 2));
      }
      
    } catch (printError) {
      console.error('[Payment] Kasa fişi yazdırma hatası:', printError);
      // Yazdırma hatası ödeme işlemini engellemez
    }

    // Socket.IO ile bildirimleri gönder
    if (io) {
      // Sipariş güncellemesi
      io.emit('orderUpdated', {
        id: result.id,
        status: OrderStatus.PAID,
        paymentMethod,
        paidAt: new Date()
      });

      // Eğer masa boşaldıysa masa durumu güncellemesi
      if (result.table.status === 'AVAILABLE') {
        io.emit('tableStatusUpdated', {
          id: result.table.id,
          status: 'AVAILABLE',
          number: result.table.number,
          totalAmount: 0
        });
      } else {
        // Masa hala dolu ama toplam tutar güncellendi
        io.emit('tableStatusUpdated', {
          id: result.table.id,
          status: result.table.status,
          number: result.table.number,
          totalAmount: result.table.totalAmount - result.total
        });
      }
    }

    // Başarılı yanıt döndür
    return res.status(200).json({
      success: true,
      data: {
        ...result,
        formattedTotal: new Intl.NumberFormat('tr-TR', {
          style: 'currency',
          currency: 'TRY'
        }).format(result.total)
      },
      message: 'Ödeme başarıyla tamamlandı'
    });

  } catch (error) {
    console.error('Ödeme işlemi hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Ödeme işlemi başarısız oldu',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

export const clearTableOrders = async (req: Request, res: Response) => {
  try {
    const { tableNumber } = req.params;

    // Önce masayı bul
    const table = await prisma.table.findFirst({
      where: {
        number: tableNumber
      }
    });

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Masa bulunamadı'
      });
    }

    // Transaction ile işlemleri gerçekleştir
    await prisma.$transaction(async (tx) => {
      // Masaya ait tamamlanmış veya ödenmiş siparişleri sil
      await tx.order.deleteMany({
        where: {
          tableId: table.id,
          status: {
            in: [OrderStatus.SERVED, OrderStatus.PAID]
          }
        }
      });

      // Masanın durumunu güncelle
      await tx.table.update({
        where: { id: table.id },
        data: {
          status: 'AVAILABLE',
          totalAmount: 0,
          updatedAt: new Date()
        }
      });
    });

    // Socket.IO ile masa durumu güncellemesini bildir
    if (io) {
      io.emit('tableStatusUpdated', {
        id: table.id,
        status: 'AVAILABLE',
        number: table.number,
        totalAmount: 0
      });
    }

    return res.json({
      success: true,
      message: 'Masa siparişleri temizlendi'
    });

  } catch (error) {
    console.error('Masa temizleme hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Masa siparişleri temizlenirken bir hata oluştu'
    });
  }
};

// Adisyon yazdırma
export const printBill = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    console.log('Adisyon yazdırma isteği alındı:', { orderId: id });

    // Siparişi kontrol et
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        table: true,
        user: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    console.log('Sipariş bulundu:', order);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı'
      });
    }

    if (order.status === OrderStatus.PAID) {
      return res.status(400).json({
        success: false,
        message: 'Bu sipariş zaten ödenmiş, adisyon çıkarılamaz'
      });
    }

    // Adisyon için veri hazırla
    const billData = {
      orderId: order.id,
      tableNumber: order.table.name || order.table.number,
      items: order.items.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.price,
        note: item.note
      })),
      total: order.total,
      waiter: order.user?.name || 'Sistem',
      createdAt: order.createdAt
    };

    console.log('Adisyon verisi:', billData);

    // Adisyon yazdır
    try {
      const printResult = await printBillSummary(billData);
      
      console.log('Adisyon yazıcısı sonucu:', printResult);
      
      if (printResult.success) {
        // Socket.IO ile adisyon yazdırıldı bildirimi gönder
        if (io) {
          io.emit('billPrinted', {
            orderId: order.id,
            tableNumber: order.table.number,
            printedAt: new Date()
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Adisyon başarıyla yazdırıldı',
          printResult
        });
      } else {
        return res.status(500).json({
          success: false,
          message: `Adisyon yazdırılamadı: ${printResult.message}`
        });
      }
      
    } catch (printError) {
      console.error('Adisyon yazdırma hatası:', printError);
      return res.status(500).json({
        success: false,
        message: 'Adisyon yazıcısı hatası'
      });
    }

  } catch (error) {
    console.error('Adisyon işlemi hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Adisyon işlemi başarısız oldu',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}; 