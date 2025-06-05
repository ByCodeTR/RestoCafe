import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Printer, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface PrinterStatus {
  cashPrinter: any;
  isConfigured: boolean;
  hasUSBPort: boolean;
  hasIPAddress: boolean;
  connectionType: string;
}

const PrinterDebug: React.FC = () => {
  const [printerStatus, setPrinterStatus] = useState<PrinterStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('tr-TR');
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const checkPrinterStatus = async () => {
    setLoading(true);
    addLog('Yazıcı durumu kontrol ediliyor...');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/printers/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPrinterStatus(data.data);
        addLog(`✅ Yazıcı durumu alındı: ${data.data.connectionType}`);
      } else {
        addLog(`❌ Yazıcı durumu alınamadı: ${data.message}`);
      }
    } catch (error) {
      addLog(`❌ Hata: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const checkAndFixSettings = async () => {
    setLoading(true);
    addLog('Yazıcı ayarları kontrol ediliyor ve düzeltiliyor...');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/printers/check-fix', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        addLog(`✅ ${data.message}: ${data.data.status}`);
        // Durumu yeniden kontrol et
        await checkPrinterStatus();
      } else {
        addLog(`❌ Ayarlar düzeltilemedi: ${data.message}`);
      }
    } catch (error) {
      addLog(`❌ Hata: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const printTestReceipt = async () => {
    setLoading(true);
    addLog('Test fişi yazdırılıyor...');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/printers/test-receipt', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      setTestResult(data);
      
      if (data.success) {
        addLog(`✅ Test fişi yazdırıldı: ${data.message}`);
      } else {
        addLog(`❌ Test fişi yazdırılamadı: ${data.message}`);
      }
    } catch (error) {
      addLog(`❌ Hata: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  useEffect(() => {
    checkPrinterStatus();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center">
          <Printer className="mr-3 h-8 w-8" />
          Yazıcı Sorun Giderme
        </h1>
        <Button onClick={checkPrinterStatus} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </Button>
      </div>

      {/* Yazıcı Durumu */}
      <Card>
        <CardHeader>
          <CardTitle>Kasa Yazıcısı Durumu</CardTitle>
        </CardHeader>
        <CardContent>
          {printerStatus ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  {printerStatus.isConfigured ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span>Yapılandırılmış</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {printerStatus.hasUSBPort ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-400" />
                  )}
                  <span>USB Port</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {printerStatus.hasIPAddress ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-400" />
                  )}
                  <span>IP Adresi</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Bağlantı: {printerStatus.connectionType}</span>
                </div>
              </div>
              
              {printerStatus.cashPrinter && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Yazıcı Detayları:</h4>
                  <div className="text-sm space-y-1">
                    <div><strong>Adı:</strong> {printerStatus.cashPrinter.name}</div>
                    <div><strong>Tip:</strong> {printerStatus.cashPrinter.type}</div>
                    <div><strong>USB Port:</strong> {printerStatus.cashPrinter.usbPort || 'Belirtilmemiş'}</div>
                    <div><strong>IP Adresi:</strong> {printerStatus.cashPrinter.ipAddress || 'Belirtilmemiş'}</div>
                    <div><strong>Aktif:</strong> {printerStatus.cashPrinter.isActive ? 'Evet' : 'Hayır'}</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <p>Yazıcı durumu yükleniyor...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hızlı Eylemler */}
      <Card>
        <CardHeader>
          <CardTitle>Hızlı Eylemler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={checkAndFixSettings} 
              disabled={loading}
              variant="outline"
              className="h-20 flex flex-col items-center justify-center"
            >
              <CheckCircle className="h-6 w-6 mb-2" />
              Ayarları Kontrol Et & Düzelt
            </Button>
            
            <Button 
              onClick={printTestReceipt} 
              disabled={loading || !printerStatus?.isConfigured}
              className="h-20 flex flex-col items-center justify-center"
            >
              <Printer className="h-6 w-6 mb-2" />
              Test Fişi Yazdır
            </Button>
            
            <Button 
              onClick={() => window.open('/admin/settings', '_blank')} 
              variant="outline"
              className="h-20 flex flex-col items-center justify-center"
            >
              <AlertTriangle className="h-6 w-6 mb-2" />
              Yazıcı Ayarları
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Sonucu */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle>Son Test Sonucu</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className={testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <AlertDescription>
                <strong>{testResult.success ? '✅ Başarılı' : '❌ Başarısız'}:</strong> {testResult.message}
              </AlertDescription>
            </Alert>
            
            {testResult.data && (
              <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Test Detayları:</h4>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(testResult.data, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Loglar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            İşlem Logları
            <Button onClick={clearLogs} variant="outline" size="sm">
              Temizle
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">Henüz log kaydı yok...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrinterDebug; 