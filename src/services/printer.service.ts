import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const prisma = new PrismaClient();
const execAsync = promisify(exec);

// Basit yazıcı servis implementasyonu
export const createPrinter = async (
  name: string,
  type: string,
  connectionType: 'ip' | 'usb',
  config: any
) => {
  console.log(`Creating printer: ${name} (${type}) via ${connectionType}`);
  
  try {
    // Yazıcı ayarlarını veritabanından al
    const settings = await prisma.printer.findFirst({
      where: { type }
    });

    if (settings) {
      console.log(`Printer settings found for ${type}:`, settings);
      return settings;
  } else {
      console.log(`No printer settings found for ${type}, using defaults`);
      return null;
    }
  } catch (error) {
    console.error('Error fetching printer settings:', error);
    return null;
  }
};

// Mutfak yazıcısı ayarlarını getir
export const getKitchenPrinterSettings = async () => {
  const kitchenPrinter = await prisma.printer.findFirst({
    where: { 
      type: 'KITCHEN',
      isActive: true 
    }
  });
  
  return kitchenPrinter;
};

// Mutfak siparişi yazdırma - Fiziksel yazıcıya yazdır
export const printKitchenOrder = async (orderData: any) => {
  console.log('=== MUTFAK YAZICI ===');
  console.log('Sipariş:', orderData.orderId);
  console.log('Masa:', orderData.tableNumber);
  console.log('Bölge:', orderData.areaName);
  console.log('Garson:', orderData.waiter);
  console.log('Ürünler:');
  
  for (const item of orderData.items) {
    console.log(`- ${item.quantity}x ${item.name}`);
    if (item.notes) {
      console.log(`  Not: ${item.notes}`);
    }
  }
  
  console.log('Zaman:', new Date(orderData.createdAt).toLocaleString('tr-TR'));
  console.log('==================');

  // Fiziksel yazıcıya yazdır
  try {
    console.log('[KitchenPrinter] Mutfak yazıcısı ayarları alınıyor...');
    
    const kitchenPrinter = await getKitchenPrinterSettings();
    
    if (!kitchenPrinter) {
      console.log('[KitchenPrinter] ⚠️ Mutfak yazıcısı ayarları bulunamadı');
      return { success: false, message: 'Mutfak yazıcısı ayarları bulunamadı' };
    }

    console.log('[KitchenPrinter] Yazıcı ayarları:', kitchenPrinter);

    // Mutfak fişi içeriği (fiyatsız)
    const kitchenTicket = `
MUTFAK SİPARİŞİ
===============================
Sipariş No: ${orderData.orderId.substring(0, 8)}
Masa: ${orderData.tableNumber}
Bölge: ${orderData.areaName}
Garson: ${orderData.waiter}
Zaman: ${new Date(orderData.createdAt).toLocaleString('tr-TR')}
===============================

ÜRÜNLER:
${orderData.items.map((item: any) => {
  let line = `${item.quantity}x ${item.name}`;
  if (item.notes) {
    line += `\n   NOT: ${item.notes}`;
  }
  return line;
}).join('\n')}

===============================
Hazırlanma zamanı: ${new Date().toLocaleString('tr-TR')}
    `.trim();

    // USB veya IP bağlantısına göre yazdır
    if (kitchenPrinter.usbPort) {
      // USB yazıcı
      console.log('[KitchenPrinter] USB mutfak yazıcısına yazdırılıyor:', kitchenPrinter.usbPort);
      const result = await printToUSB(kitchenTicket, kitchenPrinter.usbPort);
      return result;
    } else if (kitchenPrinter.ipAddress) {
      // IP yazıcı
      console.log('[KitchenPrinter] IP mutfak yazıcısına yazdırılıyor:', `${kitchenPrinter.ipAddress}:${kitchenPrinter.port}`);
      const result = await printToIP(kitchenTicket, kitchenPrinter.ipAddress, kitchenPrinter.port || 9100);
      return result;
    } else {
      console.log('[KitchenPrinter] ⚠️ Yazıcı bağlantı bilgileri eksik');
      return { success: false, message: 'Yazıcı bağlantı bilgileri eksik' };
    }

  } catch (error) {
    console.error('[KitchenPrinter] Mutfak yazıcısı hatası:', error);
    return { success: false, message: `Mutfak yazıcısı hatası: ${error}` };
  }
};

// USB yazıcıya yazdırma fonksiyonu
const printToUSB = async (content: string, usbPort: string): Promise<{ success: boolean; message: string }> => {
  try {
    if (process.platform === 'win32') {
      // Check if it's a system printer name or a port
      const isSystemPrinter = !usbPort.match(/^(USB\d+|COM\d+|LPT\d+)$/i);
      
      let command;
      if (isSystemPrinter) {
        // System printer için gelişmiş .NET PrintDocument kullan
        const escapedContent = content
          .replace(/'/g, "''")
          .replace(/\r?\n/g, '`r`n')
          // Türkçe karakterleri Unicode'a çevir
          .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
          .replace(/ü/g, 'u').replace(/Ü/g, 'U')
          .replace(/ş/g, 's').replace(/Ş/g, 'S')
          .replace(/ı/g, 'i').replace(/İ/g, 'I')
          .replace(/ö/g, 'o').replace(/Ö/g, 'O')
          .replace(/ç/g, 'c').replace(/Ç/g, 'C');

        command = `powershell -Command "& { 
          $$text = '${escapedContent}'; 
          Add-Type -AssemblyName System.Drawing; 
          Add-Type -AssemblyName System.Windows.Forms; 
          $$printDoc = New-Object System.Drawing.Printing.PrintDocument; 
          $$printDoc.PrinterSettings.PrinterName = '${usbPort}'; 
          
          # Kağıt boyutunu termal yazıcı için ayarla
          $$printDoc.DefaultPageSettings.PaperSize = New-Object System.Drawing.Printing.PaperSize('Custom', 280, 0);
          
          $$printDoc.add_PrintPage({ 
            param($$sender, $$e) 
            $$font = New-Object System.Drawing.Font('Consolas', 8, [System.Drawing.FontStyle]::Regular); 
            $$brush = [System.Drawing.Brushes]::Black; 
            $$lines = $$text -split \\\`r\\\`n; 
            $$y = 10; 
            $$lineHeight = 12; 
            
            foreach($$line in $$lines) { 
              if ($$y -gt ($$e.PageBounds.Height - 50)) { 
                $$e.HasMorePages = $$true; 
                break; 
              } 
              $$e.Graphics.DrawString($$line, $$font, $$brush, 10, $$y); 
              $$y += $$lineHeight; 
            } 
          }); 
          
          try { 
            $$printDoc.Print(); 
            Start-Sleep -Milliseconds 1000;
            Write-Host 'CASH_PRINT_SUCCESS'; 
          } catch { 
            Write-Host 'CASH_PRINT_ERROR:' $$_.Exception.Message; 
          } 
        }"`;
      } else {
        // Direct port için ESC/POS komutları
        const escposContent = 
          '\\x1B\\x40' +  // ESC @ - Initialize
          '\\x1B\\x74\\x20' +  // ESC t - Character code table (CP1254 for Turkish)
          content.replace(/\n/g, '\\x0A') +  // Line feeds
          '\\x0A\\x0A\\x0A' +  // Extra line feeds
          '\\x1D\\x56\\x42\\x00';  // GS V B - Full cut

        command = `powershell -Command "echo -e '${escposContent}' > ${usbPort}"`;
      }

      console.log('[KitchenPrinter] USB komutu çalıştırılıyor...');
      
      const { stdout, stderr } = await execAsync(command, { 
        timeout: 15000,
        encoding: 'utf8'
      });
      
      console.log('[KitchenPrinter] USB çıktısı:', stdout);
      if (stderr) {
        console.log('[KitchenPrinter] USB hatası:', stderr);
      }

      if (isSystemPrinter) {
        if (stdout.includes('CASH_PRINT_SUCCESS')) {
          console.log('[KitchenPrinter] ✅ Mutfak fişi başarıyla yazdırıldı ve kesildi!');
          return { success: true, message: 'Mutfak fişi yazıcıdan çıktı ve kesildi!' };
        } else if (stdout.includes('CASH_PRINT_ERROR')) {
          const errorMsg = stdout.split('CASH_PRINT_ERROR:')[1]?.trim() || 'Bilinmeyen hata';
          return { success: false, message: `Mutfak yazıcısı hatası: ${errorMsg}` };
        }
      }
      
      return { success: true, message: 'Mutfak fişi yazıcıya gönderildi' };
      
    } else {
      return { success: false, message: 'USB yazıcı sadece Windows destekler' };
    }
  } catch (error: any) {
    console.error('[KitchenPrinter] USB print error:', error);
    return { success: false, message: `USB yazıcı hatası: ${error.message}` };
  }
};

// IP yazıcıya yazdırma fonksiyonu
const printToIP = async (content: string, ipAddress: string, port: number): Promise<{ success: boolean; message: string }> => {
  try {
    const net = require('net');
    
    // Türkçe karakterleri CP1254 (Windows-1254) encoding için hazırla
    const turkishContent = content
      .replace(/ğ/g, '\xF0').replace(/Ğ/g, '\xD0')
      .replace(/ü/g, '\xFC').replace(/Ü/g, '\xDC')
      .replace(/ş/g, '\xFE').replace(/Ş/g, '\xDE')
      .replace(/ı/g, '\xFD').replace(/İ/g, '\xDD')
      .replace(/ö/g, '\xF6').replace(/Ö/g, '\xD6')
      .replace(/ç/g, '\xE7').replace(/Ç/g, '\xC7');
    
    // ESC/POS komutları ile Türkçe destekli mutfak fişi
    const escposContent = Buffer.concat([
      Buffer.from([0x1B, 0x40]), // ESC @ - Initialize printer
      Buffer.from([0x1B, 0x74, 0x20]), // ESC t 32 - Select CP1254 character set (Turkish)
      
      // Modern fiş başlığı
      Buffer.from([0x1B, 0x61, 0x01]), // ESC a 1 - Center alignment for header
      Buffer.from([0x1B, 0x45, 0x01]), // ESC E 1 - Bold ON
      Buffer.from([0x1B, 0x21, 0x30]), // ESC ! 48 - Double width and height
      Buffer.from('💳 SATIŞ FİŞİ 💳\n', 'binary'),
      Buffer.from([0x1B, 0x21, 0x00]), // ESC ! 0 - Normal size
      Buffer.from([0x1B, 0x45, 0x00]), // ESC E 0 - Bold OFF
      
      // İçerik
      Buffer.from([0x1B, 0x61, 0x00]), // ESC a 0 - Left alignment
      Buffer.from(turkishContent + '\n', 'binary'),
      
      // Fiş sonu
      Buffer.from([0x1B, 0x61, 0x01]), // ESC a 1 - Center alignment
      Buffer.from([0x1B, 0x45, 0x01]), // ESC E 1 - Bold ON
      Buffer.from('🌟 TEŞEKKÜR EDERİZ! 🌟\n', 'binary'),
      Buffer.from([0x1B, 0x45, 0x00]), // ESC E 0 - Bold OFF
      
      Buffer.from([0x0A, 0x0A, 0x0A, 0x0A]), // 4 line feeds for spacing
      Buffer.from([0x1D, 0x56, 0x42, 0x00]), // GS V B - Full cut (with feeding)
    ]);

    return new Promise((resolve) => {
      const socket = new net.Socket();
      let isResolved = false;
      
      const timeoutId = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          socket.destroy();
          console.log('[KitchenPrinter] ❌ IP yazıcı timeout');
          resolve({ success: false, message: 'Mutfak yazıcısı bağlantı timeout' });
        }
      }, 8000);
      
      socket.connect(port, ipAddress, () => {
        console.log('[KitchenPrinter] ✅ IP yazıcı bağlantısı başarılı');
        
        socket.write(escposContent, (error) => {
          clearTimeout(timeoutId);
          
          // Yazma işlemi tamamlandıktan sonra biraz bekle
          setTimeout(() => {
            socket.end();
            
            if (!isResolved) {
              isResolved = true;
              if (error) {
                console.log('[KitchenPrinter] ❌ IP yazıcı yazma hatası:', error.message);
                resolve({ success: false, message: `IP yazıcı hatası: ${error.message}` });
              } else {
                console.log('[KitchenPrinter] ✅ Mutfak fişi IP yazıcıya gönderildi ve kesildi!');
                resolve({ success: true, message: 'Mutfak fişi IP yazıcıdan çıktı ve kesildi!' });
              }
            }
          }, 1000); // 1 saniye bekle
        });
      });
      
      socket.on('error', (error) => {
        clearTimeout(timeoutId);
        if (!isResolved) {
          isResolved = true;
          console.log('[KitchenPrinter] ❌ IP yazıcı bağlantı hatası:', error.message);
          resolve({ success: false, message: `IP yazıcı bağlantı hatası: ${error.message}` });
        }
      });
    });
    
  } catch (error: any) {
    console.error('[KitchenPrinter] IP print error:', error);
    return { success: false, message: `IP yazıcı hatası: ${error.message}` };
  }
};

// Kasa yazıcısı ayarlarını getir
export const getCashPrinterSettings = async () => {
  const cashPrinter = await prisma.printer.findFirst({
    where: { 
      type: 'CASH',
      isActive: true 
    }
  });
  
  return cashPrinter;
};

// Kasa yazıcısından ödeme fişi yazdırma - Fiziksel yazıcıya yazdır
export const printCashReceipt = async (orderData: any) => {
  console.log('=== KASA YAZICI - ÖDEME FİŞİ ===');
  console.log('Sipariş:', orderData.id);
  console.log('Masa:', orderData.table?.number || 'Paket');
  console.log('Toplam:', orderData.total, '₺');
  console.log('Ödeme:', orderData.paymentMethod);
  console.log('============================');

  // Fiziksel kasa yazıcısına yazdır
  try {
    console.log('[CashPrinter] Kasa yazıcısı ayarları alınıyor...');
    
    const cashPrinter = await getCashPrinterSettings();
    
    if (!cashPrinter) {
      console.log('[CashPrinter] ⚠️ Kasa yazıcısı ayarları bulunamadı');
      return { success: false, message: 'Kasa yazıcısı ayarları bulunamadı' };
    }

    console.log('[CashPrinter] Yazıcı ayarları:', cashPrinter);

    // Şirket bilgilerini al (settings'den)
    const companyInfo = await prisma.companyInfo.findFirst();
    
    // Profesyonel ve modern kasa fişi tasarımı (80mm termal yazıcı için optimize - TAM GENİŞLİK)
    const now = new Date();
    const receiptDate = now.toLocaleDateString('tr-TR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
    const receiptTime = now.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
    
    // Toplam hesaplamaları
    const subtotal = orderData.total || 0;
    const taxRate = 18; // KDV oranı
    const taxAmount = (subtotal * taxRate) / (100 + taxRate); // KDV dahil tutardan KDV'yi çıkar
    const netAmount = subtotal - taxAmount;
    
    // Fiş numarası (sipariş ID'den son 8 karakter)
    const receiptNumber = orderData.id ? orderData.id.slice(-8).toUpperCase() : 'ERR00001';
    
    // Ödeme şeklini Türkçeleştir
    const paymentMethodTR = {
      'CASH': 'NAKİT',
      'CREDIT': 'KREDİ KARTI',
      'DEBIT': 'BANKA KARTI',
      'SPLIT': 'KARMA ÖDEME'
    }[orderData.paymentMethod] || orderData.paymentMethod || 'NAKİT';
    
    // YENİ TASARIM - TAM GENİŞLİK KULLANIMI (48 karakter genişlik)
    const receiptContent = `
${centerTextWide('*** SATIS FISI ***', 48)}
${centerTextWide('Acar Köşe Restorant', 48)}
${centerTextWide('Tel: 0553 718 50 24', 48)}
${centerTextWide('www.acarkoserestorant.com.tr', 48)}
${'='.repeat(48)}
Fis No: ${receiptNumber.padEnd(20)} ${receiptDate}
Masa  : ${(orderData.table?.name || orderData.table?.number || 'Paket').padEnd(20)} ${receiptTime}
Garson: ${(orderData.waiter || 'Sistem').padEnd(32)}
${'='.repeat(48)}

URUNLER:
${'-'.repeat(48)}
${'ADET'.padEnd(6)}${'URUN ADI'.padEnd(26)}${'TUTAR'.padStart(16)}
${'-'.repeat(48)}
${orderData.items?.map((item: any) => {
  const itemTotal = (item.quantity * item.price);
  return formatReceiptItemWide(item.quantity, item.name, itemTotal);
}).join('\n') || 'Urun bilgisi mevcut degil'}
${'-'.repeat(48)}

${formatTotalSection(subtotal, paymentMethodTR, orderData)}
${'='.repeat(48)}
${centerTextWide('TESEKKUR EDERIZ!', 48)}
${centerTextWide('Yeniden bekleriz...', 48)}
${'='.repeat(48)}
    `.trim();

    // ASCII uyumlu karakterlere çevir (termal yazıcılar için)
    const sanitizedReceiptContent = sanitizeForThermalPrinter(receiptContent);

    // USB veya IP bağlantısına göre yazdır
    if (cashPrinter.usbPort) {
      // USB yazıcı
      console.log('[CashPrinter] USB kasa yazıcısına yazdırılıyor:', cashPrinter.usbPort);
      const result = await printCashToUSB(sanitizedReceiptContent, cashPrinter.usbPort);
      return result;
    } else if (cashPrinter.ipAddress) {
      // IP yazıcı
      console.log('[CashPrinter] IP kasa yazıcısına yazdırılıyor:', `${cashPrinter.ipAddress}:${cashPrinter.port}`);
      const result = await printCashToIP(sanitizedReceiptContent, cashPrinter.ipAddress, cashPrinter.port || 9100);
      return result;
    } else {
      console.log('[CashPrinter] ⚠️ Yazıcı bağlantı bilgileri eksik');
      return { success: false, message: 'Kasa yazıcısı bağlantı bilgileri eksik' };
    }

  } catch (error) {
    console.error('[CashPrinter] Kasa yazıcısı hatası:', error);
    return { success: false, message: `Kasa yazıcısı hatası: ${error}` };
  }
};

// ASCII uyumlu karakterlere çevir (termal yazıcılar için)
function sanitizeForThermalPrinter(text: string): string {
  return text
    // Emoji'leri ASCII eşdeğerleriyle değiştir
    .replace(/🏪/g, '[RESTO]')
    .replace(/💳/g, '[KASA]')
    .replace(/🍽️/g, '[MENU]')
    .replace(/💰/g, '[PARA]')
    .replace(/💵/g, '[ODEME]')
    .replace(/🌟/g, '*')
    .replace(/📞/g, 'Tel:')
    .replace(/🌐/g, 'Web:')
    .replace(/📱/g, 'Social:')
    .replace(/⭐/g, '*')
    // Box drawing karakterlerini basit çizgilerle değiştir
    .replace(/┌/g, '+').replace(/┐/g, '+')
    .replace(/└/g, '+').replace(/┘/g, '+')
    .replace(/├/g, '+').replace(/┤/g, '+')
    .replace(/─/g, '-').replace(/│/g, '|')
    // Unicode çizgilerini normal çizgilerle değiştir - 72 karakter genişliği
    .replace(/═{72}/g, '=' + '='.repeat(71))
    .replace(/─{72}/g, '-' + '-'.repeat(71))
    .replace(/═/g, '=')
    .replace(/─/g, '-');
}

// Yardımcı fonksiyonlar 80mm yazıcı formatlaması için - YENİ VERSİYONLAR
function centerTextWide(text: string, width: number = 48): string {
  if (!text) return '';
  // Uzun metinleri kes
  if (text.length > width) {
    text = text.substring(0, width - 3) + '...';
  }
  if (text.length >= width) return text;
  const padding = Math.floor((width - text.length) / 2);
  const rightPadding = width - text.length - padding;
  return ' '.repeat(padding) + text + ' '.repeat(rightPadding);
}

// Yeni ürün satırı formatı - 48 karakter genişlik için optimize
function formatReceiptItemWide(quantity: number, name: string, price: number, width: number = 48): string {
  const qtyPart = quantity.toString().padEnd(6); // 6 karakter (adet kısmı)
  const pricePart = `${price.toFixed(2)} TL`.padStart(16); // 16 karakter (fiyat kısmı)
  const availableWidth = width - 6 - 16; // 26 karakter ürün adı için
  
  let itemName = name;
  if (itemName.length > availableWidth) {
    itemName = itemName.substring(0, availableWidth - 3) + '...';
  }
  
  const nameWithPadding = itemName.padEnd(availableWidth);
  return `${qtyPart}${nameWithPadding}${pricePart}`;
}

// Toplam bölümü formatı
function formatTotalSection(subtotal: number, paymentMethod: string, orderData: any, width: number = 48): string {
  const lines = [];
  
  // Ana toplam
  lines.push(`${'TOPLAM:'.padEnd(width - 12)}${subtotal.toFixed(2).padStart(8)} TL`);
  
  // Ödeme şekli
  lines.push(`${'ODEME:'.padEnd(width - paymentMethod.length)}${paymentMethod}`);
  
  // Nakit ödeme detayları
  if (orderData.paymentMethod === 'CASH' && orderData.cashReceived) {
    lines.push(`${'Alinan:'.padEnd(width - 12)}${orderData.cashReceived.toFixed(2).padStart(8)} TL`);
    const change = orderData.cashReceived - subtotal;
    if (change > 0) {
      lines.push(`${'Para Ustu:'.padEnd(width - 12)}${change.toFixed(2).padStart(8)} TL`);
    }
  } else {
    lines.push(`${'Odenen:'.padEnd(width - 12)}${subtotal.toFixed(2).padStart(8)} TL`);
  }
  
  return lines.join('\n');
}

// USB kasa yazıcıya yazdırma fonksiyonu - SIFIRDAN YENİ KOD
const printCashToUSB = async (content: string, usbPort: string): Promise<{ success: boolean; message: string }> => {
  try {
    if (process.platform === 'win32') {
      // System printer kontrolü
      const isSystemPrinter = !usbPort.match(/^(USB\d+|COM\d+|LPT\d+)$/i);
      
      if (isSystemPrinter) {
        // Windows System Printer - Dosya tabanlı yazdırma
        console.log(`[CashPrinter] Windows yazıcısına yazdırılıyor: ${usbPort}`);
        
        // Türkçe karakterleri temizle
        const cleanContent = content
          .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
          .replace(/ü/g, 'u').replace(/Ü/g, 'U')
          .replace(/ş/g, 's').replace(/Ş/g, 'S')
          .replace(/ı/g, 'i').replace(/İ/g, 'I')
          .replace(/ö/g, 'o').replace(/Ö/g, 'O')
          .replace(/ç/g, 'c').replace(/Ç/g, 'C');

        // Geçici dosya oluştur ve yazdır
        const fs = require('fs');
        const path = require('path');
        const tempFile = path.join(process.cwd(), 'temp_receipt.txt');
        
        try {
          // Dosyayı yaz
          fs.writeFileSync(tempFile, cleanContent, 'utf8');
          
          // Notepad ile yazdır (daha güvenilir)
          const command = `notepad /p "${tempFile}"`;
          
          const { stdout, stderr } = await execAsync(command, { 
            timeout: 10000,
            encoding: 'utf8'
          });
          
          // Kısa bir bekleme (notepad'in dosyayı işlemesi için)
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Geçici dosyayı sil
          try {
            fs.unlinkSync(tempFile);
          } catch (e) {
            console.log('[CashPrinter] Geçici dosya silinemedi:', e);
          }
          
          console.log('[CashPrinter] Notepad ile yazdırma tamamlandı');
          return { success: true, message: 'Kasa fişi başarıyla yazdırıldı!' };
          
        } catch (error) {
          console.error('[CashPrinter] Notepad yazdırma hatası:', error);
          return { success: false, message: `Notepad yazdırma hatası: ${error}` };
        }
        
      } else {
        // Direct Port (USB1, COM1, LPT1 vs.)
        console.log(`[CashPrinter] Direct porta yazdırılıyor: ${usbPort}`);
        
        const rawData = content.replace(/\n/g, '\r\n') + '\r\n\r\n\r\n';
        const command = `echo "${rawData}" > ${usbPort}`;
        
        await execAsync(command, { timeout: 5000 });
        return { success: true, message: 'Kasa fişi porta gönderildi' };
      }
      
    } else {
      return { success: false, message: 'USB yazıcı sadece Windows destekler' };
    }
  } catch (error: any) {
    console.error('[CashPrinter] USB hatası:', error);
    return { success: false, message: `USB yazıcı hatası: ${error.message}` };
  }
};

// IP kasa yazıcıya yazdırma fonksiyonu - SIFIRDAN YENİ KOD
const printCashToIP = async (content: string, ipAddress: string, port: number): Promise<{ success: boolean; message: string }> => {
  try {
    const net = require('net');
    
    console.log(`[CashPrinter] IP yazıcıya bağlanılıyor: ${ipAddress}:${port}`);
    
    // Türkçe karakterleri CP1254 için hazırla
    const turkishContent = content
      .replace(/ğ/g, '\xF0').replace(/Ğ/g, '\xD0')
      .replace(/ü/g, '\xFC').replace(/Ü/g, '\xDC')
      .replace(/ş/g, '\xFE').replace(/Ş/g, '\xDE')
      .replace(/ı/g, '\xFD').replace(/İ/g, '\xDD')
      .replace(/ö/g, '\xF6').replace(/Ö/g, '\xD6')
      .replace(/ç/g, '\xE7').replace(/Ç/g, '\xC7');
    
    // Basit ESC/POS komutları
    const escposData = Buffer.concat([
      Buffer.from([0x1B, 0x40]), // Initialize
      Buffer.from([0x1B, 0x74, 0x20]), // Turkish charset
      Buffer.from(turkishContent + '\n', 'binary'),
      Buffer.from([0x0A, 0x0A, 0x0A]), // Line feeds
      Buffer.from([0x1D, 0x56, 0x42, 0x00]), // Cut
    ]);

    return new Promise((resolve) => {
      const socket = new net.Socket();
      
      const timeout = setTimeout(() => {
        socket.destroy();
        resolve({ success: false, message: 'IP yazıcı bağlantı timeout' });
      }, 5000);
      
      socket.connect(port, ipAddress, () => {
        console.log('[CashPrinter] IP bağlantısı başarılı');
        
        socket.write(escposData, (error) => {
          clearTimeout(timeout);
          socket.end();
          
          if (error) {
            resolve({ success: false, message: `IP yazıcı hatası: ${error.message}` });
          } else {
            resolve({ success: true, message: 'Kasa fişi IP yazıcıdan çıktı!' });
          }
        });
      });
      
      socket.on('error', (error) => {
        clearTimeout(timeout);
        resolve({ success: false, message: `IP bağlantı hatası: ${error.message}` });
      });
    });
    
  } catch (error: any) {
    console.error('[CashPrinter] IP hatası:', error);
    return { success: false, message: `IP yazıcı hatası: ${error.message}` };
  }
};

// Adisyon yazdırma - masaya verilecek hesap özetini yazdırır
export const printBillSummary = async (orderData: any) => {
  console.log('=== KASA YAZICI - ADİSYON ===');
  console.log('Sipariş:', orderData.orderId);
  console.log('Masa:', orderData.tableNumber);
  console.log('Toplam:', orderData.total, '₺');
  console.log('============================');

  // Fiziksel yazıcıya yazdır
  try {
    console.log('[BillPrinter] Kasa yazıcısı ayarları alınıyor...');
    
    const cashPrinter = await getCashPrinterSettings();
    
    if (!cashPrinter) {
      console.log('[BillPrinter] ⚠️ Kasa yazıcısı ayarları bulunamadı');
      return { success: false, message: 'Kasa yazıcısı ayarları bulunamadı' };
    }

    console.log('[BillPrinter] Yazıcı ayarları:', cashPrinter);

    // Adisyon içeriği
    const receiptHeader = `
${centerTextWide('ADİSYON / HESAP ÖZETİ')}
${centerTextWide('================================')}
${centerTextWide('RESTO CAFE')}
${centerTextWide('Tel: 0555 123 45 67')}
${centerTextWide('================================')}

Sipariş No: ${orderData.orderId.substring(0, 8)}
Masa: ${orderData.tableNumber}
Tarih: ${new Date().toLocaleDateString('tr-TR')}
Saat: ${new Date().toLocaleTimeString('tr-TR')}
Garson: ${orderData.waiter || 'Sistem'}

================================
ÜRÜNLER:
================================
`;

    let itemsSection = '';
    let subtotal = 0;

    for (const item of orderData.items) {
      const itemTotal = item.quantity * item.price;
      subtotal += itemTotal;
      itemsSection += formatReceiptItemWide(
        item.quantity, 
        item.name, 
        item.price
      ) + '\n';
    }

    const footerSection = `
================================
${formatTotalSection(subtotal, 'ÖDENMEDİ', orderData)}
================================

Bu adisyondur, ödeme belgesi değildir.
Ödeme işlemi sonrası fiş alınız.

Teşekkür ederiz!

================================


`;

    const billContent = receiptHeader + itemsSection + footerSection;

    // USB veya IP bağlantısına göre yazdır
    if (cashPrinter.usbPort) {
      // USB yazıcı
      console.log('[BillPrinter] USB kasa yazıcısına yazdırılıyor:', cashPrinter.usbPort);
      const result = await printCashToUSB(billContent, cashPrinter.usbPort);
      return result;
    } else if (cashPrinter.ipAddress) {
      // IP yazıcı
      console.log('[BillPrinter] IP kasa yazıcısına yazdırılıyor:', `${cashPrinter.ipAddress}:${cashPrinter.port}`);
      const result = await printCashToIP(billContent, cashPrinter.ipAddress, cashPrinter.port || 9100);
      return result;
    } else {
      console.log('[BillPrinter] ⚠️ Yazıcı bağlantı bilgileri eksik');
      return { success: false, message: 'Yazıcı bağlantı bilgileri eksik' };
    }

  } catch (error) {
    console.error('[BillPrinter] Adisyon yazıcısı hatası:', error);
    return { success: false, message: `Adisyon yazıcısı hatası: ${error}` };
  }
};

// Adisyon yazdırma - DEPRECATED, printCashReceipt kullanın
export const printReceipt = async (orderData: any) => {
  console.log('⚠️ printReceipt deprecated, printCashReceipt kullanın');
  return await printCashReceipt(orderData);
}; 