import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface PrinterDiagnosticResult {
  success: boolean;
  message: string;
  details?: {
    isSystemPrinter: boolean;
    driverFound: boolean;
    isOnline: boolean;
    portType: string;
    errorCode?: string;
  };
}

// Windows yazıcı tanı sistemi
export class PrinterDiagnostic {
  
  /**
   * Yazıcı durumunu kapsamlı olarak kontrol eder
   */
  static async diagnosePrinter(printerNameOrPort: string): Promise<PrinterDiagnosticResult> {
    console.log(`[PrinterDiagnostic] Yazıcı tanısı başlıyor: ${printerNameOrPort}`);
    
    try {
      // 1. Yazıcı türünü belirle (sistem yazıcısı vs port)
      const isSystemPrinter = !printerNameOrPort.match(/^(USB\d+|COM\d+|LPT\d+)$/i);
      
      if (isSystemPrinter) {
        return await this.diagnoseSystemPrinter(printerNameOrPort);
      } else {
        return await this.diagnosePortPrinter(printerNameOrPort);
      }
      
    } catch (error: any) {
      console.error('[PrinterDiagnostic] Genel tanı hatası:', error);
      return {
        success: false,
        message: `Yazıcı tanısı yapılamadı: ${error.message}`
      };
    }
  }

  /**
   * Windows sistem yazıcısını tanılar
   */
  private static async diagnoseSystemPrinter(printerName: string): Promise<PrinterDiagnosticResult> {
    try {
      console.log(`[PrinterDiagnostic] Sistem yazıcısı kontrol ediliyor: ${printerName}`);
      
      // PowerShell ile yazıcı bilgilerini al
      const command = `powershell -Command "Get-Printer -Name '${printerName}' | Select-Object Name, PrinterStatus, DriverName, PortName | ConvertTo-Json"`;
      
      const { stdout, stderr } = await execAsync(command, { 
        timeout: 10000,
        encoding: 'utf8'
      });
      
      if (stderr) {
        console.log('[PrinterDiagnostic] PowerShell uyarısı:', stderr);
      }
      
      // JSON parse et
      let printerInfo;
      try {
        printerInfo = JSON.parse(stdout);
      } catch (parseError) {
        console.error('[PrinterDiagnostic] JSON parse hatası:', parseError);
        return {
          success: false,
          message: `Yazıcı bilgileri alınamadı: ${printerName} bulunamadı`,
          details: {
            isSystemPrinter: true,
            driverFound: false,
            isOnline: false,
            portType: 'unknown'
          }
        };
      }
      
      console.log('[PrinterDiagnostic] Yazıcı bilgileri:', printerInfo);
      
      // Yazıcı durumunu analiz et
      const isOnline = printerInfo.PrinterStatus === 'Normal' || printerInfo.PrinterStatus === 'Idle';
      const driverFound = !!printerInfo.DriverName;
      
      let statusMessage = `✅ Yazıcı bulundu: ${printerInfo.Name}`;
      if (!isOnline) {
        statusMessage = `⚠️ Yazıcı çevrimdışı: ${printerInfo.Name} (Durum: ${printerInfo.PrinterStatus})`;
      }
      if (!driverFound) {
        statusMessage = `❌ Yazıcı sürücüsü bulunamadı: ${printerInfo.Name}`;
      }
      
      return {
        success: isOnline && driverFound,
        message: statusMessage,
        details: {
          isSystemPrinter: true,
          driverFound,
          isOnline,
          portType: printerInfo.PortName || 'unknown'
        }
      };
      
    } catch (error: any) {
      console.error('[PrinterDiagnostic] Sistem yazıcısı hatası:', error);
      
      if (error.message.includes('Cannot find printer')) {
        return {
          success: false,
          message: `❌ Yazıcı bulunamadı: "${printerName}" Windows'ta kurulu değil`,
          details: {
            isSystemPrinter: true,
            driverFound: false,
            isOnline: false,
            portType: 'not_found'
          }
        };
      }
      
      return {
        success: false,
        message: `Sistem yazıcısı kontrol edilemedi: ${error.message}`,
        details: {
          isSystemPrinter: true,
          driverFound: false,
          isOnline: false,
          portType: 'error',
          errorCode: error.code
        }
      };
    }
  }

  /**
   * Manuel port yazıcısını tanılar
   */
  private static async diagnosePortPrinter(portName: string): Promise<PrinterDiagnosticResult> {
    try {
      console.log(`[PrinterDiagnostic] Port yazıcısı kontrol ediliyor: ${portName}`);
      
      // Port türüne göre kontrol
      if (portName.startsWith('COM')) {
        return await this.diagnoseCOMPort(portName);
      } else if (portName.startsWith('USB')) {
        return await this.diagnoseUSBPort(portName);
      } else if (portName.startsWith('LPT')) {
        return await this.diagnoseLPTPort(portName);
      } else {
        return {
          success: false,
          message: `❌ Bilinmeyen port türü: ${portName}`,
          details: {
            isSystemPrinter: false,
            driverFound: false,
            isOnline: false,
            portType: 'unknown'
          }
        };
      }
      
    } catch (error: any) {
      console.error('[PrinterDiagnostic] Port yazıcısı hatası:', error);
      return {
        success: false,
        message: `Port yazıcısı kontrol edilemedi: ${error.message}`,
        details: {
          isSystemPrinter: false,
          driverFound: false,
          isOnline: false,
          portType: 'error',
          errorCode: error.code
        }
      };
    }
  }

  /**
   * COM port kontrol et
   */
  private static async diagnoseCOMPort(comPort: string): Promise<PrinterDiagnosticResult> {
    try {
      // COM portlarını listele
      const command = `powershell -Command "[System.IO.Ports.SerialPort]::getportnames() | ConvertTo-Json"`;
      const { stdout } = await execAsync(command, { timeout: 5000 });
      
      let availablePorts = [];
      try {
        const result = JSON.parse(stdout);
        availablePorts = Array.isArray(result) ? result : [result];
      } catch {
        availablePorts = [];
      }
      
      const isAvailable = availablePorts.includes(comPort);
      
      return {
        success: isAvailable,
        message: isAvailable 
          ? `✅ COM port mevcut: ${comPort}` 
          : `⚠️ COM port bulunamadı: ${comPort} (Mevcut: ${availablePorts.join(', ')})`,
        details: {
          isSystemPrinter: false,
          driverFound: isAvailable,
          isOnline: isAvailable,
          portType: 'COM'
        }
      };
      
    } catch (error: any) {
      return {
        success: false,
        message: `COM port kontrol edilemedi: ${error.message}`,
        details: {
          isSystemPrinter: false,
          driverFound: false,
          isOnline: false,
          portType: 'COM',
          errorCode: error.code
        }
      };
    }
  }

  /**
   * USB port kontrol et
   */
  private static async diagnoseUSBPort(usbPort: string): Promise<PrinterDiagnosticResult> {
    try {
      // USB aygıtlarını listele
      const command = `powershell -Command "Get-WmiObject -Class Win32_USBHub | Select-Object Name, DeviceID | ConvertTo-Json"`;
      const { stdout } = await execAsync(command, { timeout: 10000 });
      
      let usbDevices = [];
      try {
        const result = JSON.parse(stdout);
        usbDevices = Array.isArray(result) ? result : [result];
      } catch {
        usbDevices = [];
      }
      
      // USB yazıcı aygıtlarını ara
      const printerDevices = usbDevices.filter((device: any) => 
        device.Name && (
          device.Name.toLowerCase().includes('printer') ||
          device.Name.toLowerCase().includes('pos') ||
          device.DeviceID.includes('USB\\PRINT')
        )
      );
      
      const hasUSBPrinter = printerDevices.length > 0;
      
      return {
        success: hasUSBPrinter,
        message: hasUSBPrinter 
          ? `✅ USB yazıcı aygıtı bulundu (${printerDevices.length} adet)` 
          : `⚠️ USB yazıcı aygıtı bulunamadı (${usbPort})`,
        details: {
          isSystemPrinter: false,
          driverFound: hasUSBPrinter,
          isOnline: hasUSBPrinter,
          portType: 'USB'
        }
      };
      
    } catch (error: any) {
      return {
        success: false,
        message: `USB port kontrol edilemedi: ${error.message}`,
        details: {
          isSystemPrinter: false,
          driverFound: false,
          isOnline: false,
          portType: 'USB',
          errorCode: error.code
        }
      };
    }
  }

  /**
   * LPT port kontrol et
   */
  private static async diagnoseLPTPort(lptPort: string): Promise<PrinterDiagnosticResult> {
    try {
      // LPT portlarını kontrol et
      const command = `powershell -Command "Get-WmiObject -Class Win32_ParallelPort | Select-Object Name, DeviceID | ConvertTo-Json"`;
      const { stdout } = await execAsync(command, { timeout: 5000 });
      
      let parallelPorts = [];
      try {
        const result = JSON.parse(stdout);
        parallelPorts = Array.isArray(result) ? result : [result];
      } catch {
        parallelPorts = [];
      }
      
      const isAvailable = parallelPorts.some((port: any) => 
        port.Name && port.Name.includes(lptPort)
      );
      
      return {
        success: isAvailable,
        message: isAvailable 
          ? `✅ LPT port mevcut: ${lptPort}` 
          : `⚠️ LPT port bulunamadı: ${lptPort}`,
        details: {
          isSystemPrinter: false,
          driverFound: isAvailable,
          isOnline: isAvailable,
          portType: 'LPT'
        }
      };
      
    } catch (error: any) {
      return {
        success: false,
        message: `LPT port kontrol edilemedi: ${error.message}`,
        details: {
          isSystemPrinter: false,
          driverFound: false,
          isOnline: false,
          portType: 'LPT',
          errorCode: error.code
        }
      };
    }
  }

  /**
   * Tüm mevcut yazıcıları listele
   */
  static async listAllPrinters(): Promise<any[]> {
    try {
      console.log('[PrinterDiagnostic] Tüm yazıcılar listeleniyor...');
      
      // Sistem yazıcıları
      const systemCommand = `powershell -Command "Get-Printer | Select-Object Name, PrinterStatus, DriverName, PortName | ConvertTo-Json"`;
      const { stdout: systemOut } = await execAsync(systemCommand, { timeout: 10000 });
      
      let systemPrinters = [];
      try {
        const result = JSON.parse(systemOut);
        systemPrinters = Array.isArray(result) ? result : [result];
      } catch {
        systemPrinters = [];
      }
      
      // COM portları
      const comCommand = `powershell -Command "[System.IO.Ports.SerialPort]::getportnames() | ConvertTo-Json"`;
      const { stdout: comOut } = await execAsync(comCommand, { timeout: 5000 });
      
      let comPorts = [];
      try {
        const result = JSON.parse(comOut);
        comPorts = Array.isArray(result) ? result : [result];
      } catch {
        comPorts = [];
      }
      
      // Tüm yazıcıları birleştir
      const allPrinters = [
        ...systemPrinters.map((p: any) => ({
          ...p,
          Type: 'System',
          Available: p.PrinterStatus === 'Normal' || p.PrinterStatus === 'Idle'
        })),
        ...comPorts.map((port: string) => ({
          Name: `${port} (Seri Port)`,
          Type: 'COM',
          PortName: port,
          Available: true
        })),
        // Varsayılan portlar
        { Name: 'USB001 (USB Yazıcı)', Type: 'USB', PortName: 'USB001', Available: true },
        { Name: 'LPT1 (Paralel Port)', Type: 'LPT', PortName: 'LPT1', Available: true }
      ];
      
      console.log(`[PrinterDiagnostic] ${allPrinters.length} yazıcı bulundu`);
      return allPrinters;
      
    } catch (error: any) {
      console.error('[PrinterDiagnostic] Yazıcı listesi alınamadı:', error);
      return [];
    }
  }

  /**
   * Yazıcı test çıktısı gönder (gelişmiş)
   */
  static async sendTestPrint(printerNameOrPort: string, testContent?: string): Promise<PrinterDiagnosticResult> {
    try {
      console.log(`[PrinterDiagnostic] Test çıktısı gönderiliyor: ${printerNameOrPort}`);
      
      // Önce yazıcı tanısını yap
      const diagnosis = await this.diagnosePrinter(printerNameOrPort);
      
      if (!diagnosis.success) {
        return {
          success: false,
          message: `Test başarısız - ${diagnosis.message}`,
          details: diagnosis.details
        };
      }
      
      // Test içeriği
      const content = testContent || `RestoCafe Yazıcı Testi
================================
Yazıcı: ${printerNameOrPort}
Tarih: ${new Date().toLocaleString('tr-TR')}
Test durumu: BAŞARILI
================================

Bu çıktı RestoCafe yazıcı test 
sistemi tarafından üretilmiştir.

Eğer bu metni okuyabiliyorsanız,
yazıcınız düzgün çalışıyor! ✓
`;

      // Test çıktısını gönder
      const isSystemPrinter = diagnosis.details?.isSystemPrinter || false;
      
      if (isSystemPrinter) {
        return await this.sendSystemPrinterTest(printerNameOrPort, content);
      } else {
        return await this.sendPortPrinterTest(printerNameOrPort, content);
      }
      
    } catch (error: any) {
      console.error('[PrinterDiagnostic] Test çıktısı hatası:', error);
      return {
        success: false,
        message: `Test çıktısı gönderilemedi: ${error.message}`
      };
    }
  }

  /**
   * Sistem yazıcısına test gönder
   */
  private static async sendSystemPrinterTest(printerName: string, content: string): Promise<PrinterDiagnosticResult> {
    try {
      const escapedContent = content
        .replace(/'/g, "''")
        .replace(/\r?\n/g, '`r`n')
        // Türkçe karakterleri temizle
        .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
        .replace(/ü/g, 'u').replace(/Ü/g, 'U')
        .replace(/ş/g, 's').replace(/Ş/g, 'S')
        .replace(/ı/g, 'i').replace(/İ/g, 'I')
        .replace(/ö/g, 'o').replace(/Ö/g, 'O')
        .replace(/ç/g, 'c').replace(/Ç/g, 'C');

      const command = `powershell -Command "& { 
        $$text = '${escapedContent}'; 
        Add-Type -AssemblyName System.Drawing; 
        $$printDoc = New-Object System.Drawing.Printing.PrintDocument; 
        $$printDoc.PrinterSettings.PrinterName = '${printerName}'; 
        $$printDoc.add_PrintPage({ 
          param($$sender, $$e) 
          $$font = New-Object System.Drawing.Font('Courier New', 10); 
          $$brush = [System.Drawing.Brushes]::Black; 
          $$lines = $$text -split \\\`r\\\`n; 
          $$y = 10; 
          foreach($$line in $$lines) { 
            if ($$y -gt ($$e.PageBounds.Height - 50)) { break; } 
            $$e.Graphics.DrawString($$line, $$font, $$brush, 10, $$y); 
            $$y += 15; 
          } 
        }); 
        try { 
          $$printDoc.Print(); 
          Write-Host 'TEST_SUCCESS'; 
        } catch { 
          Write-Host 'TEST_ERROR:' $$_.Exception.Message; 
        } 
      }"`;

      const { stdout, stderr } = await execAsync(command, { timeout: 15000 });
      
      if (stdout.includes('TEST_SUCCESS')) {
        return {
          success: true,
          message: `✅ Test çıktısı başarıyla gönderildi: ${printerName}`
        };
      } else if (stdout.includes('TEST_ERROR')) {
        const errorMsg = stdout.split('TEST_ERROR:')[1]?.trim() || 'Bilinmeyen hata';
        return {
          success: false,
          message: `❌ Test çıktısı hatası: ${errorMsg}`
        };
      } else {
        return {
          success: false,
          message: `⚠️ Test çıktısı durumu belirsiz (${printerName})`
        };
      }
      
    } catch (error: any) {
      return {
        success: false,
        message: `Test çıktısı gönderilemedi: ${error.message}`
      };
    }
  }

  /**
   * Port yazıcısına test gönder
   */
  private static async sendPortPrinterTest(portName: string, content: string): Promise<PrinterDiagnosticResult> {
    try {
      // ESC/POS komutları ile
      const rawData = content.replace(/\n/g, '\r\n') + '\r\n\r\n\r\n';
      const command = `powershell -Command "echo '${rawData}' > ${portName}"`;
      
      await execAsync(command, { timeout: 5000 });
      
      return {
        success: true,
        message: `✅ Test çıktısı porta gönderildi: ${portName}`
      };
      
    } catch (error: any) {
      return {
        success: false,
        message: `Port test hatası: ${error.message}`
      };
    }
  }
} 