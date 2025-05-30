import { Request, Response } from 'express';
import { ThermalPrinter, PrinterTypes } from 'node-thermal-printer';
import { printKitchenOrder, printReceipt } from '../services/printer.service';

// Yazıcı ayarlarını güncelle
export const updatePrinterSettings = async (req: Request, res: Response) => {
  try {
    const { type, printerPath, printerType } = req.body;

    if (!type || !printerPath || !printerType) {
      return res.status(400).json({
        message: 'Yazıcı tipi, bağlantı yolu ve yazıcı modeli zorunludur',
      });
    }

    if (!['KITCHEN', 'CASHIER'].includes(type)) {
      return res.status(400).json({
        message: 'Geçersiz yazıcı tipi',
      });
    }

    // Yazıcı bağlantısını test et
    const printer = new ThermalPrinter({
      type: printerType as PrinterTypes,
      interface: printerPath,
      options: {
        timeout: 5000,
      },
    });

    const isConnected = await printer.isPrinterConnected();
    
    if (!isConnected) {
      return res.status(400).json({
        message: 'Yazıcıya bağlanılamadı. Lütfen bağlantıyı kontrol edin.',
      });
    }

    // Yazıcı ayarlarını kaydet
    process.env[`${type}_PRINTER_PATH`] = printerPath;
    process.env[`${type}_PRINTER_TYPE`] = printerType;

    res.json({
      message: 'Yazıcı ayarları güncellendi',
      settings: {
        type,
        printerPath,
        printerType,
      },
    });
  } catch (error) {
    console.error('Update printer settings error:', error);
    res.status(500).json({ message: 'Yazıcı ayarları güncellenemedi' });
  }
};

// Test çıktısı al
export const printTest = async (req: Request, res: Response) => {
  try {
    const { type } = req.query;

    if (!type || !['KITCHEN', 'CASHIER'].includes(type as string)) {
      return res.status(400).json({
        message: 'Geçersiz yazıcı tipi',
      });
    }

    const printer = new ThermalPrinter({
      type: process.env[`${type}_PRINTER_TYPE`] as PrinterTypes || PrinterTypes.EPSON,
      interface: process.env[`${type}_PRINTER_PATH`] || 
        (type === 'KITCHEN' ? 'tcp://192.168.1.100' : 'tcp://192.168.1.101'),
      options: {
        timeout: 5000,
      },
    });

    const isConnected = await printer.isPrinterConnected();
    
    if (!isConnected) {
      return res.status(400).json({
        message: 'Yazıcıya bağlanılamadı. Lütfen bağlantıyı kontrol edin.',
      });
    }

    // Test çıktısı
    printer.alignCenter();
    printer.println('=== TEST ÇIKTISI ===');
    printer.println('RestoCafe Yazıcı Testi');
    printer.println(new Date().toLocaleString('tr-TR'));
    printer.println('==================');
    printer.alignLeft();
    printer.println('Yazıcı tipi: ' + type);
    printer.println('Bağlantı: ' + process.env[`${type}_PRINTER_PATH`]);
    printer.println('Model: ' + process.env[`${type}_PRINTER_TYPE`]);
    printer.drawLine();
    printer.println('Test başarılı!');
    printer.cut();

    await printer.execute();

    res.json({
      message: 'Test çıktısı alındı',
      type,
    });
  } catch (error) {
    console.error('Print test error:', error);
    res.status(500).json({ message: 'Test çıktısı alınamadı' });
  }
};

// Yazıcı durumunu kontrol et
export const checkPrinterStatus = async (req: Request, res: Response) => {
  try {
    const { type } = req.query;

    if (!type || !['KITCHEN', 'CASHIER'].includes(type as string)) {
      return res.status(400).json({
        message: 'Geçersiz yazıcı tipi',
      });
    }

    const printer = new ThermalPrinter({
      type: process.env[`${type}_PRINTER_TYPE`] as PrinterTypes || PrinterTypes.EPSON,
      interface: process.env[`${type}_PRINTER_PATH`] || 
        (type === 'KITCHEN' ? 'tcp://192.168.1.100' : 'tcp://192.168.1.101'),
      options: {
        timeout: 5000,
      },
    });

    const isConnected = await printer.isPrinterConnected();

    res.json({
      type,
      status: isConnected ? 'CONNECTED' : 'DISCONNECTED',
      settings: {
        printerPath: process.env[`${type}_PRINTER_PATH`],
        printerType: process.env[`${type}_PRINTER_TYPE`],
      },
    });
  } catch (error) {
    console.error('Check printer status error:', error);
    res.status(500).json({ message: 'Yazıcı durumu kontrol edilemedi' });
  }
}; 