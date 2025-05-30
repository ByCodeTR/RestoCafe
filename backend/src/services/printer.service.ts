import { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } from 'node-thermal-printer';
import { Order, OrderItem, Table, Area } from '../../src/generated/prisma';
import { format } from 'date-fns';

// Yazıcı yapılandırması
const createPrinter = (type: 'KITCHEN' | 'CASHIER') => {
  const printer = new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface: type === 'KITCHEN' 
      ? process.env.KITCHEN_PRINTER_PATH || 'tcp://192.168.1.100'
      : process.env.CASHIER_PRINTER_PATH || 'tcp://192.168.1.101',
    characterSet: CharacterSet.PC857_TURKEY,
    removeSpecialCharacters: false,
    options: {
      timeout: 5000,
    },
    width: 42, // Standart termal yazıcı genişliği
  });
  return printer;
};

// Başlık yazdırma
const printHeader = async (printer: ThermalPrinter, title: string) => {
  printer.alignCenter();
  printer.bold(true);
  printer.setTextSize(1, 1);
  printer.println('RESTO CAFE');
  printer.setTextNormal();
  printer.println('------------------------');
  printer.println(title);
  printer.println('------------------------');
  printer.bold(false);
  printer.alignLeft();
};

// Masa bilgisi yazdırma
const printTableInfo = async (
  printer: ThermalPrinter, 
  table: Table & { area: Area }
) => {
  printer.tableCustom([
    { text: 'MASA:', align: 'LEFT', width: 0.4 },
    { text: `${table.area.name} - ${table.name}`, align: 'LEFT', width: 0.6 },
  ]);
  printer.drawLine();
};

// Sipariş detayları yazdırma
const printOrderItems = async (
  printer: ThermalPrinter,
  items: OrderItem[],
  type: 'KITCHEN' | 'CASHIER'
) => {
  if (type === 'KITCHEN') {
    // Mutfak için sadece ürün adı ve miktarı
    printer.tableCustom([
      { text: 'ÜRÜN', align: 'LEFT', width: 0.7 },
      { text: 'ADET', align: 'RIGHT', width: 0.3 },
    ]);
    printer.drawLine();

    items.forEach(item => {
      printer.tableCustom([
        { text: item.product.name, align: 'LEFT', width: 0.7 },
        { text: item.quantity.toString(), align: 'RIGHT', width: 0.3 },
      ]);
      if (item.notes) {
        printer.indent(2);
        printer.println(`Not: ${item.notes}`);
        printer.indent(0);
      }
    });
  } else {
    // Kasa için detaylı fiyat bilgisi
    printer.tableCustom([
      { text: 'ÜRÜN', align: 'LEFT', width: 0.5 },
      { text: 'ADET', align: 'CENTER', width: 0.2 },
      { text: 'FİYAT', align: 'RIGHT', width: 0.3 },
    ]);
    printer.drawLine();

    items.forEach(item => {
      printer.tableCustom([
        { text: item.product.name, align: 'LEFT', width: 0.5 },
        { text: item.quantity.toString(), align: 'CENTER', width: 0.2 },
        { text: `${item.price.toFixed(2)} ₺`, align: 'RIGHT', width: 0.3 },
      ]);
      if (item.notes) {
        printer.indent(2);
        printer.println(`Not: ${item.notes}`);
        printer.indent(0);
      }
    });
  }
};

// Alt bilgi yazdırma
const printFooter = async (
  printer: ThermalPrinter,
  order: Order,
  type: 'KITCHEN' | 'CASHIER'
) => {
  printer.drawLine();
  
  if (type === 'CASHIER') {
    printer.tableCustom([
      { text: 'TOPLAM:', align: 'LEFT', width: 0.7 },
      { text: `${order.totalAmount.toFixed(2)} ₺`, align: 'RIGHT', width: 0.3 },
    ]);
    
    if (order.status === 'COMPLETED') {
      printer.tableCustom([
        { text: 'ÖDEME YÖNTEMİ:', align: 'LEFT', width: 0.7 },
        { text: order.paymentMethod, align: 'RIGHT', width: 0.3 },
      ]);
    }
  }

  printer.println('------------------------');
  printer.alignCenter();
  printer.println(`Tarih: ${format(order.createdAt, 'dd.MM.yyyy HH:mm')}`);
  printer.println(`Sipariş No: ${order.id}`);
  printer.println('Afiyet olsun!');
  printer.alignLeft();
};

// Mutfak fişi yazdırma
export const printKitchenOrder = async (order: Order) => {
  try {
    const printer = createPrinter('KITCHEN');
    await printer.clear();

    await printHeader(printer, 'MUTFAK SİPARİŞİ');
    await printTableInfo(printer, order.table);
    await printOrderItems(printer, order.items, 'KITCHEN');
    await printFooter(printer, order, 'KITCHEN');

    printer.cut();
    await printer.execute();
    
    return true;
  } catch (error) {
    console.error('Kitchen printer error:', error);
    return false;
  }
};

// Adisyon yazdırma
export const printReceipt = async (order: Order) => {
  try {
    const printer = createPrinter('CASHIER');
    await printer.clear();

    await printHeader(printer, 'ADİSYON');
    await printTableInfo(printer, order.table);
    await printOrderItems(printer, order.items, 'CASHIER');
    await printFooter(printer, order, 'CASHIER');

    printer.cut();
    await printer.execute();
    
    return true;
  } catch (error) {
    console.error('Cashier printer error:', error);
    return false;
  }
}; 