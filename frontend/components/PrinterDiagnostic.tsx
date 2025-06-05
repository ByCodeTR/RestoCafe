"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Printer, 
  Search, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Settings,
  Usb,
  Wifi,
  Monitor,
  Tool,
  Zap,
  FileText,
  Download
} from "lucide-react";
import { toast } from "sonner";

interface PrinterInfo {
  Name: string;
  Type: string;
  PortName: string;
  Available: boolean;
  PrinterStatus?: string;
  DriverName?: string;
}

interface DiagnosticResult {
  success: boolean;
  message: string;
  details?: {
    isSystemPrinter: boolean;
    driverFound: boolean;
    isOnline: boolean;
    portType: string;
    errorCode?: string;
  };
  recommendations?: string[];
}

export default function PrinterDiagnostic() {
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [availablePrinters, setAvailablePrinters] = useState<PrinterInfo[]>([]);
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosticResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Yazıcıları yükle
  const loadPrinters = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/printers/list-all', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAvailablePrinters(data.printers || []);
        toast.success(`${data.printers?.length || 0} yazıcı bulundu`);
      } else {
        toast.error('Yazıcılar yüklenemedi');
      }
    } catch (error) {
      console.error('Yazıcı listesi hatası:', error);
      toast.error('Yazıcı listesi alınamadı');
    } finally {
      setIsLoading(false);
    }
  };

  // Yazıcı tanısı yap
  const diagnosePrinter = async () => {
    if (!selectedPrinter) {
      toast.error('Lütfen bir yazıcı seçin');
      return;
    }

    setIsDiagnosing(true);
    setDiagnosisResult(null);

    try {
      const response = await fetch('/api/printers/diagnose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ printerNameOrPort: selectedPrinter })
      });

      const data = await response.json();
      setDiagnosisResult(data);

      if (data.success) {
        toast.success('Yazıcı tanısı tamamlandı');
      } else {
        toast.warning('Yazıcıda sorun tespit edildi');
      }
    } catch (error) {
      console.error('Tanı hatası:', error);
      toast.error('Yazıcı tanısı yapılamadı');
    } finally {
      setIsDiagnosing(false);
    }
  };

  // Test çıktısı gönder
  const sendTestPrint = async () => {
    if (!selectedPrinter) {
      toast.error('Lütfen bir yazıcı seçin');
      return;
    }

    setIsTesting(true);

    try {
      const response = await fetch('/api/printers/advanced-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ printerNameOrPort: selectedPrinter })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Test çıktısı gönderildi! Yazıcıyı kontrol edin.');
      } else {
        toast.error(`Test başarısız: ${data.message}`);
      }
    } catch (error) {
      console.error('Test hatası:', error);
      toast.error('Test çıktısı gönderilemedi');
    } finally {
      setIsTesting(false);
    }
  };

  // Spooler servisini yenile
  const restartSpooler = async () => {
    try {
      const response = await fetch('/api/printers/restart-spooler', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Yazıcı spooler servisi yenilendi');
      } else {
        toast.error(`Spooler yenilenemedi: ${data.message}`);
      }
    } catch (error) {
      console.error('Spooler hatası:', error);
      toast.error('Spooler servisi yenilenemedi');
    }
  };

  // Sayfa yüklendiğinde yazıcıları getir
  useEffect(() => {
    loadPrinters();
  }, []);

  // Yazıcı türü simgesi
  const getPrinterIcon = (printer: PrinterInfo) => {
    if (printer.Type === 'System') return <Monitor className="h-4 w-4" />;
    if (printer.Type === 'USB') return <Usb className="h-4 w-4" />;
    if (printer.Type === 'COM') return <Settings className="h-4 w-4" />;
    return <Printer className="h-4 w-4" />;
  };

  // Durum badge rengi
  const getStatusColor = (available: boolean) => {
    return available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Tool className="h-8 w-8" />
            Yazıcı Sorun Giderme
          </h1>
          <p className="text-gray-600 mt-2">
            USB yazıcı ve kasa yazıcısı sorunlarını teşhis edin ve çözün
          </p>
        </div>
        <Button onClick={loadPrinters} disabled={isLoading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Yenile
        </Button>
      </div>

      {/* Hızlı İşlemler */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Hızlı İşlemler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <Button onClick={restartSpooler} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Yazıcı Spooler Yenile
            </Button>
            <Button variant="outline" asChild>
              <a href="/YAZICI_SORUN_GIDERME.md" download>
                <Download className="h-4 w-4 mr-2" />
                Sorun Giderme Rehberi
              </a>
            </Button>
            <Button variant="outline" onClick={() => {
              window.open('ms-settings:printers', '_blank');
            }}>
              <Settings className="h-4 w-4 mr-2" />
              Windows Yazıcı Ayarları
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Yazıcı Seçimi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Yazıcı Seçimi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="printer-select">Tanılanacak Yazıcıyı Seçin</Label>
            <select
              id="printer-select"
              className="w-full p-3 border rounded-md mt-1"
              value={selectedPrinter}
              onChange={(e) => setSelectedPrinter(e.target.value)}
            >
              <option value="">Yazıcı seçiniz...</option>
              {availablePrinters.map((printer, index) => (
                <option key={index} value={printer.Name}>
                  {printer.Name} ({printer.Type})
                </option>
              ))}
            </select>
          </div>

          {/* Mevcut Yazıcılar Listesi */}
          <div>
            <h3 className="font-medium mb-3">Mevcut Yazıcılar ({availablePrinters.length})</h3>
            <div className="grid gap-2">
              {availablePrinters.map((printer, index) => (
                <div 
                  key={index} 
                  className={`p-3 border rounded-md flex items-center justify-between hover:bg-gray-50 cursor-pointer ${
                    selectedPrinter === printer.Name ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedPrinter(printer.Name)}
                >
                  <div className="flex items-center gap-3">
                    {getPrinterIcon(printer)}
                    <div>
                      <div className="font-medium">{printer.Name}</div>
                      <div className="text-sm text-gray-500">
                        {printer.Type} • {printer.PortName}
                      </div>
                    </div>
                  </div>
                  <Badge className={getStatusColor(printer.Available)}>
                    {printer.Available ? 'Mevcut' : 'Mevcut Değil'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Tanı Butonları */}
          <div className="flex gap-3">
            <Button 
              onClick={diagnosePrinter} 
              disabled={!selectedPrinter || isDiagnosing}
              className="flex-1"
            >
              {isDiagnosing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Yazıcı Tanısı Yap
            </Button>
            <Button 
              onClick={sendTestPrint} 
              disabled={!selectedPrinter || isTesting}
              variant="outline"
              className="flex-1"
            >
              {isTesting ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Test Çıktısı Gönder
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tanı Sonuçları */}
      {diagnosisResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {diagnosisResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              Tanı Sonuçları
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {diagnosisResult.message}
              </AlertDescription>
            </Alert>

            {/* Detay Bilgileri */}
            {diagnosisResult.details && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 border rounded-md">
                  <div className="font-medium text-sm text-gray-600">Yazıcı Türü</div>
                  <div className="text-lg">
                    {diagnosisResult.details.isSystemPrinter ? 'Sistem' : 'Port'}
                  </div>
                </div>
                <div className="text-center p-3 border rounded-md">
                  <div className="font-medium text-sm text-gray-600">Sürücü</div>
                  <div className={`text-lg ${diagnosisResult.details.driverFound ? 'text-green-600' : 'text-red-600'}`}>
                    {diagnosisResult.details.driverFound ? 'Bulundu' : 'Bulunamadı'}
                  </div>
                </div>
                <div className="text-center p-3 border rounded-md">
                  <div className="font-medium text-sm text-gray-600">Durum</div>
                  <div className={`text-lg ${diagnosisResult.details.isOnline ? 'text-green-600' : 'text-red-600'}`}>
                    {diagnosisResult.details.isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
                  </div>
                </div>
                <div className="text-center p-3 border rounded-md">
                  <div className="font-medium text-sm text-gray-600">Port Türü</div>
                  <div className="text-lg">
                    {diagnosisResult.details.portType}
                  </div>
                </div>
              </div>
            )}

            {/* Öneriler */}
            {diagnosisResult.recommendations && diagnosisResult.recommendations.length > 0 && (
              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Çözüm Önerileri
                </h3>
                <ul className="space-y-2">
                  {diagnosisResult.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="h-2 w-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Yaygın Sorunlar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Yaygın Sorunlar ve Çözümleri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="p-4 border rounded-md">
              <h4 className="font-medium text-red-600 mb-2">❌ USB yazıcıdan çıktı alamıyorum</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• USB kablosunu kontrol edin ve yeniden takın</li>
                <li>• Yazıcının açık ve hazır durumda olduğunu kontrol edin</li>
                <li>• Windows'ta yazıcının görünüp görünmediğini kontrol edin</li>
                <li>• Farklı bir USB port deneyin (COM1, COM2)</li>
              </ul>
            </div>
            
            <div className="p-4 border rounded-md">
              <h4 className="font-medium text-orange-600 mb-2">⚠️ Kasa yazıcısı yanıt vermiyor</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Yazıcı ayarlarında doğru port'un seçili olduğunu kontrol edin</li>
                <li>• Yazıcı spooler servisini yenileyin</li>
                <li>• RestoCafe'yi "Yönetici olarak çalıştır" ile açın</li>
                <li>• Notepad ile test yazdırımı deneyin</li>
              </ul>
            </div>

            <div className="p-4 border rounded-md">
              <h4 className="font-medium text-blue-600 mb-2">ℹ️ Yazıcı Windows'ta görünmüyor</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Cihaz Yöneticisi'nde USB portlarını kontrol edin</li>
                <li>• Yazıcı sürücüsünü indirin ve kurun</li>
                <li>• Windows Update ile sürücü güncellemesi yapın</li>
                <li>• Generic/Text Only sürücüsü deneyin</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 