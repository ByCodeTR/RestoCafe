import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from 'date-fns';

const prisma = new PrismaClient();

// Yardımcı fonksiyonlar
const calculateTotalAmount = (orders: any[]) => {
  return orders.reduce((total, order) => total + order.total, 0);
};

const calculatePaymentMethodTotals = (orders: any[]) => {
  return orders.reduce((acc, order) => {
    acc[order.paymentMethod] = (acc[order.paymentMethod] || 0) + order.total;
    return acc;
  }, {});
};

const getTopSellingProducts = async (startDate: Date, endDate: Date, limit = 10) => {
  const orderItems = await prisma.orderItem.findMany({
    where: {
      order: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: 'COMPLETED',
        paidAt: {
          not: null, // Ödemesi alınan siparişler
        },
      },
    },
    include: {
      product: true,
    },
  });

  const productSales = orderItems.reduce((acc, item) => {
    const key = item.productId;
    if (!acc[key]) {
      acc[key] = {
        productId: item.productId,
        productName: item.product.name,
        quantity: 0,
        totalAmount: 0,
      };
    }
    acc[key].quantity += item.quantity;
    acc[key].totalAmount += item.price * item.quantity;
    return acc;
  }, {});

  return Object.values(productSales)
    .sort((a: any, b: any) => b.quantity - a.quantity)
    .slice(0, limit);
};

// Dashboard günlük istatistikleri
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const startToday = startOfDay(today);
    const endToday = endOfDay(today);

    console.log('Dashboard Stats Debug:');
    console.log('Today:', today.toISOString());
    console.log('Start Today:', startToday.toISOString());
    console.log('End Today:', endToday.toISOString());

    // Bugünkü ödemesi alınan siparişler
    const todayOrders = await prisma.order.findMany({
      where: {
        paidAt: {
          gte: startToday,
          lte: endToday,
          not: null,
        },
        status: 'COMPLETED',
      },
    });

    console.log('Today Orders Found:', todayOrders.length);
    todayOrders.forEach(order => {
      console.log(`Order: ${order.id}, Total: ${order.total}, Payment: ${order.paymentMethod}, PaidAt: ${order.paidAt}`);
    });

    // Toplam günlük satış
    const dailySales = calculateTotalAmount(todayOrders);

    // Aktif masa sayısı - sadece ödemesi alınmamış aktif siparişleri olan masalar
    const activeTables = await prisma.table.findMany({
      where: {
        orders: {
          some: {
            AND: [
              {
                status: {
                  in: ['PENDING', 'PREPARING', 'READY', 'SERVED'] // Aktif durumlar
                }
              },
              {
                OR: [
                  { paidAt: null }, // Ödeme alınmamış
                  { status: { not: 'PAID' } } // PAID durumunda değil
                ]
              }
            ]
          }
        }
      },
      distinct: ['id'] // Tekrarlı masaları sayma
    });

    const activeTableCount = activeTables.length;

    // Ödeme yöntemlerine göre dağılım - Doğru ödeme yöntemlerini kullan
    const paymentTotals = calculatePaymentMethodTotals(todayOrders);
    const dailyCreditCard = (paymentTotals['CREDIT'] || 0) + (paymentTotals['DEBIT'] || 0); // CREDIT ve DEBIT'i birleştir
    const dailyCash = paymentTotals['CASH'] || 0;

    console.log('Payment Totals:', paymentTotals);
    console.log('Daily Credit Card:', dailyCreditCard);
    console.log('Daily Cash:', dailyCash);

    const stats = {
      dailySales,
      activeTableCount,
      dailyCreditCard,
      dailyCash,
    };

    console.log('Final Stats:', stats);

    res.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Dashboard istatistikleri alınamadı' });
  }
};

// Günlük rapor
export const getDailyReport = async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const targetDate = date ? parseISO(date as string) : new Date();
    const start = startOfDay(targetDate);
    const end = endOfDay(targetDate);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
        status: 'COMPLETED',
        paidAt: {
          not: null,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        table: {
          include: {
            area: true,
          },
        },
        user: true,
      },
      orderBy: {
        paidAt: 'desc',
      },
    });

    const totalAmount = calculateTotalAmount(orders);
    const paymentMethodTotals = calculatePaymentMethodTotals(orders);
    const topSellingProducts = await getTopSellingProducts(start, end, 5);

    const report = {
      date: targetDate,
      totalOrders: orders.length,
      totalAmount,
      paymentMethodTotals,
      topSellingProducts,
      orders,
    };

    res.json(report);
  } catch (error) {
    console.error('Daily report error:', error);
    res.status(500).json({ message: 'Günlük rapor oluşturulamadı' });
  }
};

// Haftalık rapor
export const getWeeklyReport = async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const targetDate = date ? parseISO(date as string) : new Date();
    const start = startOfWeek(targetDate, { weekStartsOn: 1 }); // Pazartesi
    const end = endOfWeek(targetDate, { weekStartsOn: 1 }); // Pazar

    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
        status: 'COMPLETED',
        paidAt: {
          not: null, // Ödemesi alınan siparişler
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        table: {
          include: {
            area: true,
          },
        },
        user: true, // Kullanıcı bilgisini de ekle
      },
      orderBy: {
        paidAt: 'desc', // Ödeme tarihine göre sırala
      },
    });

    const totalAmount = calculateTotalAmount(orders);
    const paymentMethodTotals = calculatePaymentMethodTotals(orders);
    const topSellingProducts = await getTopSellingProducts(start, end, 10);

    // Günlük dağılım
    const dailyDistribution = orders.reduce((acc: any, order) => {
      const day = startOfDay(order.createdAt).toISOString();
      if (!acc[day]) {
        acc[day] = {
          totalOrders: 0,
          totalAmount: 0,
        };
      }
      acc[day].totalOrders++;
      acc[day].totalAmount += order.total;
      return acc;
    }, {});

    const report = {
      startDate: start,
      endDate: end,
      totalOrders: orders.length,
      totalAmount,
      paymentMethodTotals,
      topSellingProducts,
      dailyDistribution,
      orders,
    };

    res.json(report);
  } catch (error) {
    console.error('Weekly report error:', error);
    res.status(500).json({ message: 'Haftalık rapor oluşturulamadı' });
  }
};

// Aylık rapor
export const getMonthlyReport = async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const targetDate = date ? parseISO(date as string) : new Date();
    const start = startOfMonth(targetDate);
    const end = endOfMonth(targetDate);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
        status: 'COMPLETED',
        paidAt: {
          not: null, // Ödemesi alınan siparişler
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        table: {
          include: {
            area: true,
          },
        },
        user: true, // Kullanıcı bilgisini de ekle
      },
      orderBy: {
        paidAt: 'desc', // Ödeme tarihine göre sırala
      },
    });

    const totalAmount = calculateTotalAmount(orders);
    const paymentMethodTotals = calculatePaymentMethodTotals(orders);
    const topSellingProducts = await getTopSellingProducts(start, end, 15);

    // Haftalık dağılım
    const weeklyDistribution = orders.reduce((acc: any, order) => {
      const week = startOfWeek(order.createdAt, { weekStartsOn: 1 }).toISOString();
      if (!acc[week]) {
        acc[week] = {
          totalOrders: 0,
          totalAmount: 0,
        };
      }
      acc[week].totalOrders++;
      acc[week].totalAmount += order.total;
      return acc;
    }, {});

    const report = {
      startDate: start,
      endDate: end,
      totalOrders: orders.length,
      totalAmount,
      paymentMethodTotals,
      topSellingProducts,
      weeklyDistribution,
      orders,
    };

    res.json(report);
  } catch (error) {
    console.error('Monthly report error:', error);
    res.status(500).json({ message: 'Aylık rapor oluşturulamadı' });
  }
};

// Özel tarih aralığı raporu
export const getCustomReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        message: 'Başlangıç ve bitiş tarihleri zorunludur' 
      });
    }

    const start = startOfDay(parseISO(startDate as string));
    const end = endOfDay(parseISO(endDate as string));

    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
        status: 'COMPLETED',
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        table: {
          include: {
            area: true,
          },
        },
      },
    });

    const totalAmount = calculateTotalAmount(orders);
    const paymentMethodTotals = calculatePaymentMethodTotals(orders);
    const topSellingProducts = await getTopSellingProducts(start, end, 20);

    // Günlük dağılım
    const dailyDistribution = orders.reduce((acc: any, order) => {
      const day = startOfDay(order.createdAt).toISOString();
      if (!acc[day]) {
        acc[day] = {
          totalOrders: 0,
          totalAmount: 0,
        };
      }
      acc[day].totalOrders++;
      acc[day].totalAmount += order.total;
      return acc;
    }, {});

    const report = {
      startDate: start,
      endDate: end,
      totalOrders: orders.length,
      totalAmount,
      paymentMethodTotals,
      topSellingProducts,
      dailyDistribution,
      orders,
    };

    res.json(report);
  } catch (error) {
    console.error('Custom report error:', error);
    res.status(500).json({ message: 'Özel rapor oluşturulamadı' });
  }
}; 