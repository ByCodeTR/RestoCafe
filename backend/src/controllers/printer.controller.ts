import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import { PrinterDiagnostic, PrinterDiagnosticResult } from '../utils/printer-diagnostic';
import { printCashReceipt, getCashPrinterSettings } from '../services/printer.service';

const prisma = new PrismaClient();
const execAsync = promisify(exec);

// Yazıcı ayarlarını güncelle
export const updatePrinterSettings = async (req: Request, res: Response) => {
  try {
    const { type, enabled, connectionType, ipAddress, port, usbPort } = req.body;

    console.log('Yazıcı ayarları güncelleniyor:', { type, enabled, connectionType, ipAddress, port, usbPort });

    // Yazıcı kaydını güncelle veya oluştur
    const printer = await prisma.printer.upsert({
      where: { type },
      update: {
        isActive: enabled,
        ipAddress: connectionType === 'ip' ? ipAddress : null,
        port: connectionType === 'ip' ? parseInt(port) : null,
        usbPort: connectionType === 'usb' ? usbPort : null,
        name: connectionType === 'usb' ? usbPort : `${type}_PRINTER`,
      },
      create: {
        type,
        name: connectionType === 'usb' ? usbPort : `${type}_PRINTER`,
        isActive: enabled,
        ipAddress: connectionType === 'ip' ? ipAddress : null,
        port: connectionType === 'ip' ? parseInt(port) : null,
        usbPort: connectionType === 'usb' ? usbPort : null,
      }
    });

    console.log('Yazıcı ayarları kaydedildi:', printer);

    res.json({
      success: true,
      message: 'Yazıcı ayarları başarıyla güncellendi',
      data: printer
    });
  } catch (error) {
    console.error('Yazıcı ayarları güncellenirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Yazıcı ayarları güncellenemedi'
    });
  }
};

// Yazıcı test çıktısı al
export const printTest = async (req: Request, res: Response) => {
  try {
    const { printerType, printerConfig } = req.body;

    console.log('Yazıcı testi başlatılıyor:', { printerType, printerConfig });

    if (!printerConfig || !printerConfig.enabled) {
      return res.status(400).json({
        success: false,
        message: 'Yazıcı etkin değil'
      });
    }

    let testResult;

    if (printerConfig.connectionType === 'usb') {
      testResult = await testUSBPrinter(printerConfig.usbPort);
    } else {
      testResult = await testIPPrinter(printerConfig.ipAddress, printerConfig.port);
    }

    res.json({
      success: testResult.success,
      message: testResult.message
    });

  } catch (error) {
    console.error('Yazıcı test hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Yazıcı test edilemedi'
    });
  }
};

// USB yazıcı test fonksiyonu
const testUSBPrinter = async (usbPort: string): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('[TestPrinter] USB yazıcı test ediliyor:', usbPort);
    
    // Windows için PowerShell ile test
    if (process.platform === 'win32') {
      const testText = `RestoCafe Test Çıktısı
=============================
Tarih: ${new Date().toLocaleString('tr-TR')}
Yazıcı: ${usbPort}
Test başarılı!
=============================

`.replace(/'/g, "''"); // PowerShell için tek tırnak escape

      // Check if it's a system printer name or a port
      const isSystemPrinter = !usbPort.match(/^(USB\d+|COM\d+|LPT\d+)$/i);
      
      console.log('[TestPrinter]', usbPort, 'yazıcısına test çıktısı gönderiliyor...');
      
      let command;
      if (isSystemPrinter) {
        // System printer için daha güçlü bir metod
        const escapedText = testText.replace(/\r?\n/g, '`r`n');
        command = `powershell -Command "& { $text = '${escapedText}'; Add-Type -AssemblyName System.Drawing; Add-Type -AssemblyName System.Windows.Forms; $printDoc = New-Object System.Drawing.Printing.PrintDocument; $printDoc.PrinterSettings.PrinterName = '${usbPort}'; $printDoc.add_PrintPage({ param($sender, $e) $font = New-Object System.Drawing.Font('Courier New', 10); $e.Graphics.DrawString($text, $font, [System.Drawing.Brushes]::Black, 10, 10); }); try { $printDoc.Print(); Write-Host 'PRINT_SUCCESS'; } catch { Write-Host 'PRINT_ERROR:' $_.Exception.Message; } }"`;
      } else {
        // Direct port için eski metod
        command = `powershell -Command "echo '${testText}' > ${usbPort}"`;
      }

      console.log('[TestPrinter] PowerShell komutu çalıştırılıyor:', usbPort);

      try {
        const { stdout, stderr } = await execAsync(command, { 
          timeout: 15000,
          encoding: 'utf8'
        });
        
        console.log('[TestPrinter] PowerShell çıktısı:', stdout);
        if (stderr) {
          console.log('[TestPrinter] PowerShell hatası:', stderr);
        }

        // Başarı kontrolü
        if (isSystemPrinter) {
          if (stdout.includes('PRINT_SUCCESS')) {
            console.log('[TestPrinter] ✅ Fiziksel baskı başarılı!');
            return {
              success: true,
              message: 'Test çıktısı fiziksel olarak yazıcıdan çıktı!'
            };
          } else if (stdout.includes('PRINT_ERROR')) {
            const errorMsg = stdout.split('PRINT_ERROR:')[1]?.trim() || 'Bilinmeyen hata';
            console.log('[TestPrinter] ❌ Baskı hatası:', errorMsg);
            return {
              success: false,
              message: `Yazıcı hatası: ${errorMsg}`
            };
          }
        }
        
        console.log('[TestPrinter] 🔄 Test komutu gönderildi:', usbPort);
        return {
          success: true,
          message: 'Test komutu yazıcıya gönderildi (fiziksel çıktı kontrol edin)'
        };
        
      } catch (error: any) {
        console.error('[TestPrinter] USB printer error:', error);
        
        // Timeout hatası için özel mesaj
        if (error.message.includes('timeout')) {
          return {
            success: false,
            message: 'Yazıcı yanıt vermedi (15 saniye timeout)'
          };
        }
        
        return {
          success: false,
          message: `Yazıcı hatası: ${error.message}`
        };
      }
    }

    return {
      success: false,
      message: 'USB yazıcı test özelliği sadece Windows destekler'
    };

  } catch (error: any) {
    console.error('[TestPrinter] USB test error:', error);
    return {
      success: false,
      message: `Test hatası: ${error.message}`
    };
  }
};

// IP yazıcı test fonksiyonu
const testIPPrinter = async (ipAddress: string, port: number): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('[TestPrinter] IP yazıcı test ediliyor:', `${ipAddress}:${port}`);
    
    // ESC/POS thermal printer komutları
    const testText = `\x1B\x40` + // ESC @ - Initialize printer
                    `\x1B\x61\x01` + // ESC a 1 - Center align
                    `RestoCafe Test\n` +
                    `===============\n` +
                    `\x1B\x61\x00` + // ESC a 0 - Left align
                    `Tarih: ${new Date().toLocaleString('tr-TR')}\n` +
                    `IP: ${ipAddress}:${port}\n` +
                    `Test basarili!\n\n` +
                    `\x1D\x56\x00`; // GS V 0 - Cut paper

    // Node.js net module ile TCP bağlantısı test et
    const net = require('net');
    
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let isResolved = false;
      
      // Timeout ayarla
      const timeoutId = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          socket.destroy();
          console.log('[TestPrinter] ❌ IP yazıcı timeout:', `${ipAddress}:${port}`);
          resolve({
            success: false,
            message: `IP yazıcı bağlantı timeout (${ipAddress}:${port})`
          });
        }
      }, 5000);
      
      // Bağlantı başarılı
      socket.connect(port, ipAddress, () => {
        console.log('[TestPrinter] ✅ IP yazıcı bağlantısı başarılı:', `${ipAddress}:${port}`);
        
        // Test verisini gönder
        socket.write(testText, (error) => {
          clearTimeout(timeoutId);
          socket.end();
          
          if (!isResolved) {
            isResolved = true;
            if (error) {
              console.log('[TestPrinter] ❌ IP yazıcı yazma hatası:', error.message);
              resolve({
                success: false,
                message: `IP yazıcı yazma hatası: ${error.message}`
              });
            } else {
              console.log('[TestPrinter] ✅ IP yazıcı test verisi gönderildi!');
              resolve({
                success: true,
                message: `IP yazıcı test çıktısı gönderildi (${ipAddress}:${port})`
              });
            }
          }
        });
      });
      
      // Bağlantı hatası
      socket.on('error', (error) => {
        clearTimeout(timeoutId);
        if (!isResolved) {
          isResolved = true;
          console.log('[TestPrinter] ❌ IP yazıcı bağlantı hatası:', error.message);
          resolve({
            success: false,
            message: `IP yazıcı bağlantı hatası: ${error.message}`
          });
        }
      });
      
      // Bağlantı kapandı
      socket.on('close', () => {
        clearTimeout(timeoutId);
        console.log('[TestPrinter] IP yazıcı bağlantısı kapandı');
      });
    });

  } catch (error: any) {
    console.error('[TestPrinter] IP test error:', error);
    return {
      success: false,
      message: `IP test hatası: ${error.message}`
    };
  }
};

// Yazıcı durumunu kontrol et
export const checkPrinterStatus = async (req: Request, res: Response) => {
  try {
    const cashPrinter = await getCashPrinterSettings();
    
    return res.json({
      success: true,
      data: {
        cashPrinter,
        isConfigured: !!cashPrinter,
        hasUSBPort: !!(cashPrinter?.usbPort),
        hasIPAddress: !!(cashPrinter?.ipAddress),
        connectionType: cashPrinter?.usbPort ? 'USB' : cashPrinter?.ipAddress ? 'IP' : 'Yapılandırılmamış'
      }
    });
    
  } catch (error) {
    console.error('Yazıcı durumu kontrol hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Yazıcı durumu kontrol edilirken hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

// Fiş yazdır (basitleştirilmiş)
export const printReceipt = async (req: Request, res: Response) => {
  try {
    const { tableNumber, orders, payment, timestamp, tableId } = req.body;

    console.log('=== ADISYON YAZDIRILDI ===');
    console.log('Masa:', tableNumber);
    console.log('Siparişler:', orders);
    console.log('Ödeme:', payment);
    console.log('========================');

    // Masayı boş konuma geçir ve siparişleri temizle
    if (tableId) {
      // Masayı güncelle
      await prisma.table.update({
        where: { id: tableId },
        data: { status: 'AVAILABLE' }
      });

      // Masaya ait aktif siparişleri tamamlandı olarak işaretle
      await prisma.order.updateMany({
        where: {
          tableId,
          status: {
            in: ['ACTIVE', 'PENDING']
          }
        },
        data: {
          status: 'COMPLETED',
          paidAt: new Date()
        }
      });

      // Socket.IO ile masa durumu değişikliğini bildir
      req.app.get('io').emit('tableStatusUpdated', {
        id: tableId,
        status: 'AVAILABLE'
      });

      // Socket.IO ile sipariş durumu değişikliğini bildir
      req.app.get('io').emit('ordersUpdated', {
        tableId,
        status: 'COMPLETED'
      });
    }

    return res.json({
      success: true,
      message: 'Adisyon başarıyla yazdırıldı ve masa temizlendi (console log)'
    });

  } catch (error) {
    console.error('Adisyon yazdırma hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Adisyon yazdırılırken bir hata oluştu'
    });
  }
};

// Yazıcı tanı endpoint'i - YENİ
export const diagnosePrinter = async (req: Request, res: Response) => {
  try {
    const { printerNameOrPort } = req.body;

    console.log('[PrinterDiagnostic] Yazıcı tanısı başlatılıyor:', printerNameOrPort);

    if (!printerNameOrPort) {
      return res.status(400).json({
        success: false,
        message: 'Yazıcı adı veya port belirtilmedi'
      });
    }

    // Gelişmiş tanı yap
    const diagnosis = await PrinterDiagnostic.diagnosePrinter(printerNameOrPort);

    res.json({
      success: diagnosis.success,
      message: diagnosis.message,
      details: diagnosis.details,
      recommendations: generateRecommendations(diagnosis)
    });

  } catch (error) {
    console.error('Yazıcı tanı hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Yazıcı tanısı yapılamadı'
    });
  }
};

// Gelişmiş yazıcı test endpoint'i - YENİ
export const advancedPrinterTest = async (req: Request, res: Response) => {
  try {
    const { printerNameOrPort, testContent } = req.body;

    console.log('[AdvancedTest] Gelişmiş yazıcı testi:', printerNameOrPort);

    if (!printerNameOrPort) {
      return res.status(400).json({
        success: false,
        message: 'Yazıcı adı veya port belirtilmedi'
      });
    }

    // Gelişmiş test gönder
    const testResult = await PrinterDiagnostic.sendTestPrint(printerNameOrPort, testContent);

    res.json({
      success: testResult.success,
      message: testResult.message,
      details: testResult.details
    });

  } catch (error) {
    console.error('Gelişmiş yazıcı test hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Yazıcı test edilemedi'
    });
  }
};

// Tüm yazıcıları listele - YENİ
export const listAllPrinters = async (req: Request, res: Response) => {
  try {
    console.log('[PrinterList] Tüm yazıcılar listeleniyor...');

    const printers = await PrinterDiagnostic.listAllPrinters();

    res.json({
      success: true,
      message: `${printers.length} yazıcı bulundu`,
      printers: printers
    });

  } catch (error) {
    console.error('Yazıcı listesi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Yazıcı listesi alınamadı',
      printers: []
    });
  }
};

// Yazıcı sorun giderme önerileri oluştur
function generateRecommendations(diagnosis: PrinterDiagnosticResult): string[] {
  const recommendations: string[] = [];

  if (!diagnosis.success) {
    if (diagnosis.details?.portType === 'not_found') {
      recommendations.push('Yazıcının Windows\'ta kurulu olduğunu kontrol edin');
      recommendations.push('Yazıcı sürücüsünü yeniden yükleyin');
      recommendations.push('Cihaz Yöneticisi\'nde yazıcının görünüp görünmediğini kontrol edin');
    }

    if (diagnosis.details?.portType === 'COM') {
      recommendations.push('COM portun mevcut olduğunu kontrol edin');
      recommendations.push('Başka bir COM port deneyin (COM1, COM2)');
      recommendations.push('Seri port kablolarını kontrol edin');
    }

    if (diagnosis.details?.portType === 'USB') {
      recommendations.push('USB kablosunun sağlam bağlı olduğunu kontrol edin');
      recommendations.push('Yazıcıyı farklı bir USB portuna takın');
      recommendations.push('Yazıcıyı yeniden başlatın');
      recommendations.push('Windows\'ta sistem yazıcısı olarak ekleyin');
    }

    if (!diagnosis.details?.driverFound) {
      recommendations.push('Yazıcı sürücüsünü indirin ve kurun');
      recommendations.push('Windows Update ile sürücü güncellemesi yapın');
      recommendations.push('Generic/Text Only sürücüsü deneyin');
    }

    if (!diagnosis.details?.isOnline) {
      recommendations.push('Yazıcının açık ve hazır durumda olduğunu kontrol edin');
      recommendations.push('Yazıcıda kağıt ve mürekkep/toner olduğunu kontrol edin');
      recommendations.push('Yazıcı hatalarını ve uyarılarını temizleyin');
    }

    // Genel öneriler
    recommendations.push('RestoCafe\'yi "Yönetici olarak çalıştır" ile açın');
    recommendations.push('Windows yazıcı spooler servisini yeniden başlatın');
    recommendations.push('Notepad ile manuel test yazdırımı deneyin');
  } else {
    recommendations.push('Yazıcı düzgün çalışıyor gibi görünüyor');
    recommendations.push('Test çıktısı almayı deneyin');
    recommendations.push('Gerçek bir sipariş yazdırmayı test edin');
  }

  return recommendations;
}

// Yazıcı spooler yenileme - YENİ
export const restartPrinterSpooler = async (req: Request, res: Response) => {
  try {
    console.log('[SpoolerRestart] Yazıcı spooler servisi yeniden başlatılıyor...');

    // Windows Spooler servisini yeniden başlat
    await execAsync('net stop spooler', { timeout: 10000 });
    await execAsync('net start spooler', { timeout: 10000 });

    res.json({
      success: true,
      message: 'Yazıcı spooler servisi başarıyla yeniden başlatıldı'
    });

  } catch (error: any) {
    console.error('Spooler yenileme hatası:', error);
    res.status(500).json({
      success: false,
      message: `Spooler servisi yenilenemedi: ${error.message}`
    });
  }
};

// Sistem yazıcı durumunu kontrol et - YENİ
export const checkSystemPrinterStatus = async (req: Request, res: Response) => {
  try {
    const { printerName } = req.body;

    console.log('[SystemStatus] Sistem yazıcısı durumu kontrol ediliyor:', printerName);

    const command = `powershell -Command "Get-Printer -Name '${printerName}' | Select-Object Name, PrinterStatus, JobCount, PortName | ConvertTo-Json"`;
    
    const { stdout } = await execAsync(command, { timeout: 5000 });
    const printerInfo = JSON.parse(stdout);

    const status = {
      name: printerInfo.Name,
      status: printerInfo.PrinterStatus,
      jobCount: printerInfo.JobCount || 0,
      port: printerInfo.PortName,
      isOnline: printerInfo.PrinterStatus === 'Normal' || printerInfo.PrinterStatus === 'Idle',
      hasJobs: (printerInfo.JobCount || 0) > 0
    };

    res.json({
      success: true,
      message: `Yazıcı durumu: ${status.status}`,
      status: status
    });

  } catch (error: any) {
    console.error('Sistem yazıcı durumu hatası:', error);
    res.status(500).json({
      success: false,
      message: `Yazıcı durumu kontrol edilemedi: ${error.message}`
    });
  }
};

// Yazıcı ayarlarını kontrol et ve düzelt
export const checkAndFixPrinterSettings = async (req: Request, res: Response) => {
  try {
    console.log('🔍 Yazıcı ayarları kontrol ediliyor...');
    
    // Mevcut kasa yazıcısını kontrol et
    let cashPrinter = await prisma.printer.findFirst({
      where: { 
        type: 'CASH',
        isActive: true 
      }
    });
    
    if (!cashPrinter) {
      console.log('❌ Kasa yazıcısı bulunamadı, oluşturuluyor...');
      
      // Kasa yazıcısı oluştur
      cashPrinter = await prisma.printer.create({
        data: {
          name: 'Kasa Yazıcısı',
          type: 'CASH',
          usbPort: 'USB001',
          isActive: true
        }
      });
      
      console.log('✅ Kasa yazıcısı oluşturuldu:', cashPrinter);
    }
    
    // Tüm yazıcıları listele
    const allPrinters = await prisma.printer.findMany();
    
    return res.json({
      success: true,
      message: 'Yazıcı ayarları kontrol edildi',
      data: {
        cashPrinter,
        allPrinters,
        status: cashPrinter ? 'Kasa yazıcısı aktif' : 'Kasa yazıcısı oluşturuldu'
      }
    });
    
  } catch (error) {
    console.error('Yazıcı ayarları kontrol hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Yazıcı ayarları kontrol edilirken hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

// Test fişi yazdır
export const printTestReceipt = async (req: Request, res: Response) => {
  try {
    console.log('🧾 Test fişi yazdırılıyor...');
    
    // Test verisi oluştur
    const testOrderData = {
      id: 'TEST-' + Date.now(),
      table: { name: 'Test Masası', number: '99' },
      items: [
        { name: 'Test Ürün 1', quantity: 2, price: 15.50 },
        { name: 'Test Ürün 2', quantity: 1, price: 25.00 }
      ],
      total: 56.00,
      paymentMethod: 'CASH',
      cashReceived: 60.00,
      waiter: 'Test Garson',
      createdAt: new Date()
    };
    
    // Kasa fişi yazdır
    const printResult = await printCashReceipt(testOrderData);
    
    return res.json({
      success: printResult.success,
      message: printResult.message,
      data: {
        testData: testOrderData,
        printResult
      }
    });
    
  } catch (error) {
    console.error('Test fişi yazdırma hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Test fişi yazdırılırken hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
}; 