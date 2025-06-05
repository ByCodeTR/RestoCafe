"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { 
  Settings, 
  Shield, 
  Database, 
  Phone,
  MapPin,
  Globe,
  Download,
  Upload,
  Trash2,
  Loader2,
  Save,
  Printer,
  Usb
} from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [settings, setSettings] = useState({
    // Restoran Bilgileri
    restaurantName: "",
    slogan: "",
    address: "",
    phone: "",
    website: "",
    
    // Sistem Ayarları
    autoBackup: true,
    offlineMode: false,
    
    // Yazıcı Ayarları
    cashPrinter: {
      enabled: true,
      connectionType: "usb", // "usb" veya "ip"
      usbPort: "USB001", // USB port adı
      ipAddress: "", // IP adresi
      port: "9100", // Port
      name: "Kasa Yazıcısı"
    },
    kitchenPrinter: {
      enabled: true,
      connectionType: "ip", // "usb" veya "ip"
      usbPort: "USB002", // USB port adı
      ipAddress: "", // IP adresi
      port: "9100", // Port
      name: "Mutfak Yazıcısı"
    }
  })

  const [availablePrinters, setAvailablePrinters] = useState([])
  const [loadingPrinters, setLoadingPrinters] = useState(false)

  // Ayarları yükle
  useEffect(() => {
    loadSettings()
    // Sayfa yüklendiğinde yazıcıları da yükle
    loadAvailablePrinters()
  }, [])

  // USB bağlantısı seçildiğinde yazıcıları yükle
  useEffect(() => {
    if (settings.cashPrinter.connectionType === 'usb' || settings.kitchenPrinter.connectionType === 'usb') {
      loadAvailablePrinters()
    }
  }, [settings.cashPrinter.connectionType, settings.kitchenPrinter.connectionType])

  const loadSettings = async () => {
    setLoading(true)
    try {
      // Şirket bilgilerini al
      const companyResponse = await fetch('/api/settings/company-info', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      // Sistem ayarlarını al
      const systemResponse = await fetch('/api/settings/system', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      // Yazıcı ayarlarını al
      const printersResponse = await fetch('/api/settings/printers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (companyResponse.ok) {
        const companyData = await companyResponse.json()
        if (companyData) {
          setSettings(prev => ({
            ...prev,
            restaurantName: companyData.name || "",
            address: companyData.address || "",
            phone: companyData.phone || "",
            website: companyData.website || "",
            slogan: companyData.slogan || ""
          }))
        }
      }

      if (systemResponse.ok) {
        const systemData = await systemResponse.json()
        if (systemData) {
          setSettings(prev => ({
            ...prev,
            autoBackup: systemData.backupEnabled || false,
          }))
        }
      }

      if (printersResponse.ok) {
        const printersData = await printersResponse.json()
        console.log('Yazıcı verileri yüklendi:', printersData)
        if (printersData && printersData.length > 0) {
          // Yazıcıları türlerine göre ayır
          const cashPrinter = printersData.find((p: any) => p.type === 'CASH')
          const kitchenPrinter = printersData.find((p: any) => p.type === 'KITCHEN')
          
          // Kasa yazıcısı ayarları
          if (cashPrinter) {
            console.log('Kasa yazıcısı bulundu:', cashPrinter)
            setSettings(prev => ({
              ...prev,
              cashPrinter: {
                enabled: cashPrinter.isActive === true,
                connectionType: cashPrinter.connectionType || (cashPrinter.ipAddress ? "ip" : "usb"),
                usbPort: cashPrinter.usbPort || "USB001",
                ipAddress: cashPrinter.ipAddress || "",
                port: cashPrinter.port ? cashPrinter.port.toString() : "9100",
                name: cashPrinter.name || "Kasa Yazıcısı"
              }
            }))
          }
          
          // Mutfak yazıcısı ayarları
          if (kitchenPrinter) {
            console.log('Mutfak yazıcısı bulundu:', kitchenPrinter)
            setSettings(prev => ({
              ...prev,
              kitchenPrinter: {
                enabled: kitchenPrinter.isActive === true,
                connectionType: kitchenPrinter.connectionType || (kitchenPrinter.ipAddress ? "ip" : "usb"),
                usbPort: kitchenPrinter.usbPort || "USB002",
                ipAddress: kitchenPrinter.ipAddress || "",
                port: kitchenPrinter.port ? kitchenPrinter.port.toString() : "9100",
                name: kitchenPrinter.name || "Mutfak Yazıcısı"
              }
            }))
          }
        } else {
          console.log('Hiç yazıcı ayarı bulunamadı')
        }
      }

    } catch (error) {
      console.error('Ayarlar yüklenirken hata:', error)
      toast.error("Ayarlar yüklenirken hata oluştu!")
    } finally {
      setLoading(false)
    }
  }

  const loadAvailablePrinters = async () => {
    setLoadingPrinters(true)
    try {
      const response = await fetch('/api/settings/available-printers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAvailablePrinters(data.printers || [])
          console.log('Available printers loaded:', data.printers?.length || 0)
        } else {
          console.warn('Could not load printers:', data.error)
          setAvailablePrinters([])
        }
      }
    } catch (error) {
      console.error('Error loading available printers:', error)
      setAvailablePrinters([])
    } finally {
      setLoadingPrinters(false)
    }
  }

  const handleSave = async () => {
    setSaveLoading(true)
    
    toast.info("Ayarlar kaydediliyor...")
    
    try {
      const token = localStorage.getItem('token')
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }

      // Şirket bilgilerini kaydet
      const companyResponse = await fetch('/api/settings/company-info', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          name: settings.restaurantName,
          slogan: settings.slogan,
          address: settings.address,
          phone: settings.phone,
          website: settings.website
        })
      })

      // Sistem ayarlarını kaydet
      const systemResponse = await fetch('/api/settings/system', {
        method: 'PUT', 
        headers,
        body: JSON.stringify({
          backupEnabled: settings.autoBackup,
          defaultLanguage: 'tr',
          theme: 'light'
        })
      })

      // Yazıcı ayarlarını kaydet
      const printerPromises = []
      
      // Kasa yazıcısı
      if (settings.cashPrinter.enabled) {
        const cashPrinterData = {
          name: settings.cashPrinter.name,
          type: 'CASH',
          isActive: settings.cashPrinter.enabled
        }
        
        if (settings.cashPrinter.connectionType === 'ip') {
          cashPrinterData.ipAddress = settings.cashPrinter.ipAddress.trim()
          cashPrinterData.port = parseInt(settings.cashPrinter.port) || 9100
          cashPrinterData.usbPort = null
        } else {
          cashPrinterData.usbPort = settings.cashPrinter.usbPort.trim()
          cashPrinterData.ipAddress = null
          cashPrinterData.port = null
        }
        
        printerPromises.push(
          fetch('/api/settings/printers', {
            method: 'PUT',
            headers,
            body: JSON.stringify(cashPrinterData)
          })
        )
      }

      // Mutfak yazıcısı
      if (settings.kitchenPrinter.enabled) {
        const kitchenPrinterData = {
          name: settings.kitchenPrinter.name,
          type: 'KITCHEN',
          isActive: settings.kitchenPrinter.enabled
        }
        
        if (settings.kitchenPrinter.connectionType === 'ip') {
          kitchenPrinterData.ipAddress = settings.kitchenPrinter.ipAddress.trim()
          kitchenPrinterData.port = parseInt(settings.kitchenPrinter.port) || 9100
          kitchenPrinterData.usbPort = null
        } else {
          kitchenPrinterData.usbPort = settings.kitchenPrinter.usbPort.trim()
          kitchenPrinterData.ipAddress = null
          kitchenPrinterData.port = null
        }
        
        printerPromises.push(
          fetch('/api/settings/printers', {
            method: 'PUT',
            headers,
            body: JSON.stringify(kitchenPrinterData)
          })
        )
      }
      
      // Tüm yazıcı kaydetme işlemlerini bekle
      await Promise.all(printerPromises)

      if (companyResponse.ok && systemResponse.ok) {
        toast.success("Ayarlar başarıyla kaydedildi!")
        await loadSettings()
      } else {
        throw new Error("Ayarlar kaydedilemedi")
      }

    } catch (error) {
      console.error('Ayarlar kaydedilirken hata:', error)
      toast.error("Ayarlar kaydedilirken hata oluştu!")
    } finally {
      setSaveLoading(false)
    }
  }

  const handlePrinterTest = async (printerType: 'cash' | 'kitchen') => {
    try {
      toast.info(`📋 ${printerType === 'cash' ? 'Kasa' : 'Mutfak'} yazıcısı test ediliyor...`)

      const response = await fetch('/api/settings/printer-test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          printerType: printerType,
          printerConfig: printerType === 'cash' ? settings.cashPrinter : settings.kitchenPrinter
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Backend successful response
        if (data.success === false) {
          // Backend returned success: false
          toast.error(`❌ ${data.message || 'Yazıcı test edilemedi'}`)
        } else {
          // Backend returned success: true or no success field (assume success)
          toast.success(data.message || `✅ ${printerType === 'cash' ? 'Kasa' : 'Mutfak'} yazıcısı test edildi!`, {
            duration: 4000,
          })
        }
      } else {
        // HTTP error response
        throw new Error(data.message || "Yazıcı test edilemedi")
      }
    } catch (error) {
      console.error('Yazıcı test çıktısı yazdırılırken hata:', error)
      toast.error(`❌ ${printerType === 'cash' ? 'Kasa' : 'Mutfak'} yazıcısı test edilirken hata oluştu!`)
    }
  }

  const handleReset = async () => {
    if (confirm("Tüm veriler silinecek! Bu işlem geri alınamaz. Emin misiniz?")) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/system/reset`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        })

        const data = await response.json()

        if (data.success) {
          toast.success("Sistem başarıyla sıfırlandı!")
          setTimeout(() => window.location.reload(), 2000)
        } else {
          throw new Error(data.message || "Sistem sıfırlanamadı")
        }
      } catch (error) {
        console.error('Sistem sıfırlanırken hata:', error)
        toast.error("Sistem sıfırlanırken hata oluştu!")
      }
    }
  }

  const handleLoadSampleData = async () => {
    if (confirm("Örnek veriler yüklenecek. Mevcut veriler etkilenmeyecek. Devam edilsin mi?")) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/system/sample-data`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        })

        const data = await response.json()

        if (data.success) {
          toast.success(`Demo verileri başarıyla yüklendi! ${data.data ? `(${data.data.categories} kategori, ${data.data.menuItems} ürün, ${data.data.tables} masa)` : ''}`)
          setTimeout(() => window.location.reload(), 2000)
        } else {
          throw new Error(data.message || "Örnek veriler yüklenemedi")
        }
      } catch (error) {
        console.error('Örnek veriler yüklenirken hata:', error)
        toast.error("Örnek veriler yüklenirken hata oluştu!")
      }
    }
  }

  const handleBackup = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/system/backup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (data.success && data.backup) {
        const dataStr = JSON.stringify(data.backup, null, 2)
        const dataBlob = new Blob([dataStr], {type: 'application/json'})
        
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `restocafe-backup-${new Date().toISOString().split('T')[0]}.json`
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        toast.success("Sistem yedeği başarıyla indirildi!")
      } else {
        throw new Error(data.message || "Yedek oluşturulamadı")
      }
    } catch (error) {
      console.error('Yedek oluşturulurken hata:', error)
      toast.error("Yedek oluşturulurken hata oluştu!")
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePrinterChange = (printerType: 'cashPrinter' | 'kitchenPrinter', field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [printerType]: {
        ...prev[printerType],
        [field]: value
      }
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Ayarlar yükleniyor...</span>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Settings className="mr-3 h-8 w-8" />
          Sistem Ayarları
        </h1>
        <Button onClick={handleSave} disabled={saveLoading} className="flex items-center">
          {saveLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Kaydet
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Restoran Bilgileri */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="mr-2 h-5 w-5" />
              Restoran Bilgileri
            </CardTitle>
            <p className="text-sm text-gray-600">Bu bilgiler adisyon çıktılarında görünecek</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="restaurantName">Restoran Adı</Label>
              <Input
                id="restaurantName"
                value={settings.restaurantName}
                onChange={(e) => handleInputChange('restaurantName', e.target.value)}
                placeholder="Restoran adınız"
              />
            </div>
            <div>
              <Label htmlFor="slogan">Slogan</Label>
              <Input
                id="slogan"
                value={settings.slogan}
                onChange={(e) => handleInputChange('slogan', e.target.value)}
                placeholder="Restoran sloganınız"
              />
            </div>
            <div>
              <Label htmlFor="address">Adres</Label>
              <Input
                id="address"
                value={settings.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Restoran adresi"
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                type="tel"
                value={settings.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+90 212 555 1234"
              />
            </div>
            <div>
              <Label htmlFor="website">Web Sitesi</Label>
              <Input
                id="website"
                value={settings.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="www.restoran.com"
              />
              <p className="text-xs text-gray-500 mt-1">Adisyon altında görünecek</p>
            </div>
          </CardContent>
        </Card>

        {/* Yazıcı Ayarları */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Printer className="mr-2 h-5 w-5" />
              Yazıcı Ayarları
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Kasa Yazıcısı */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Kasa Yazıcısı</Label>
                <Switch
                  checked={settings.cashPrinter.enabled}
                  onCheckedChange={(checked) => handlePrinterChange('cashPrinter', 'enabled', checked)}
                />
              </div>
              {settings.cashPrinter.enabled && (
                <div className="space-y-3 pl-4 border-l-2 border-blue-200">
                  <div>
                    <Label>Bağlantı Türü</Label>
                    <select 
                      className="w-full p-2 border rounded-md"
                      value={settings.cashPrinter.connectionType}
                      onChange={(e) => handlePrinterChange('cashPrinter', 'connectionType', e.target.value)}
                    >
                      <option value="usb">USB Bağlantısı</option>
                      <option value="ip">IP Bağlantısı</option>
                    </select>
                  </div>
                  
                  {settings.cashPrinter.connectionType === 'usb' ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>USB Yazıcı</Label>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={loadAvailablePrinters}
                          disabled={loadingPrinters}
                        >
                          {loadingPrinters ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            "Yenile"
                          )}
                        </Button>
                      </div>
                      <select 
                        className="w-full p-2 border rounded-md"
                        value={settings.cashPrinter.usbPort}
                        onChange={(e) => handlePrinterChange('cashPrinter', 'usbPort', e.target.value)}
                      >
                        <option value="">Yazıcı seçiniz...</option>
                        {availablePrinters.map((printer: any, index: number) => (
                          <option key={index} value={printer.Name || printer.DeviceID}>
                            {printer.Name} ({printer.PortName})
                          </option>
                        ))}
                        <option value="USB001">Manuel: USB001</option>
                        <option value="COM1">Manuel: COM1</option>
                        <option value="COM2">Manuel: COM2</option>
                        <option value="LPT1">Manuel: LPT1</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Sistem yazıcıları otomatik yüklenir. Manuel port da seçebilirsiniz.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div>
                        <Label>IP Adresi</Label>
                        <Input
                          value={settings.cashPrinter.ipAddress}
                          onChange={(e) => handlePrinterChange('cashPrinter', 'ipAddress', e.target.value)}
                          placeholder="192.168.1.100"
                        />
                      </div>
                      <div>
                        <Label>Port</Label>
                        <Input
                          value={settings.cashPrinter.port}
                          onChange={(e) => handlePrinterChange('cashPrinter', 'port', e.target.value)}
                          placeholder="9100"
                        />
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handlePrinterTest('cash')}
                    className="w-full"
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Test Yazdır
                  </Button>
                </div>
              )}
            </div>

            <Separator />

            {/* Mutfak Yazıcısı */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Mutfak Yazıcısı</Label>
                <Switch
                  checked={settings.kitchenPrinter.enabled}
                  onCheckedChange={(checked) => handlePrinterChange('kitchenPrinter', 'enabled', checked)}
                />
              </div>
              {settings.kitchenPrinter.enabled && (
                <div className="space-y-3 pl-4 border-l-2 border-orange-200">
                  <div>
                    <Label>Bağlantı Türü</Label>
                    <select 
                      className="w-full p-2 border rounded-md"
                      value={settings.kitchenPrinter.connectionType}
                      onChange={(e) => handlePrinterChange('kitchenPrinter', 'connectionType', e.target.value)}
                    >
                      <option value="usb">USB Bağlantısı</option>
                      <option value="ip">IP Bağlantısı</option>
                    </select>
                  </div>
                  
                  {settings.kitchenPrinter.connectionType === 'usb' ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>USB Yazıcı</Label>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={loadAvailablePrinters}
                          disabled={loadingPrinters}
                        >
                          {loadingPrinters ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            "Yenile"
                          )}
                        </Button>
                      </div>
                      <select 
                        className="w-full p-2 border rounded-md"
                        value={settings.kitchenPrinter.usbPort}
                        onChange={(e) => handlePrinterChange('kitchenPrinter', 'usbPort', e.target.value)}
                      >
                        <option value="">Yazıcı seçiniz...</option>
                        {availablePrinters.map((printer: any, index: number) => (
                          <option key={index} value={printer.Name || printer.DeviceID}>
                            {printer.Name} ({printer.PortName})
                          </option>
                        ))}
                        <option value="USB002">Manuel: USB002</option>
                        <option value="COM1">Manuel: COM1</option>
                        <option value="COM2">Manuel: COM2</option>
                        <option value="LPT1">Manuel: LPT1</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Sistem yazıcıları otomatik yüklenir. Manuel port da seçebilirsiniz.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div>
                        <Label>IP Adresi</Label>
                        <Input
                          value={settings.kitchenPrinter.ipAddress}
                          onChange={(e) => handlePrinterChange('kitchenPrinter', 'ipAddress', e.target.value)}
                          placeholder="192.168.1.101"
                        />
                      </div>
                      <div>
                        <Label>Port</Label>
                        <Input
                          value={settings.kitchenPrinter.port}
                          onChange={(e) => handlePrinterChange('kitchenPrinter', 'port', e.target.value)}
                          placeholder="9100"
                        />
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handlePrinterTest('kitchen')}
                    className="w-full"
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Test Yazdır
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sistem Ayarları */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="mr-2 h-5 w-5" />
            Sistem Ayarları
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database className="h-4 w-4" />
                <Label htmlFor="autoBackup">Otomatik Yedekleme</Label>
              </div>
              <Switch
                id="autoBackup"
                checked={settings.autoBackup}
                onCheckedChange={(checked) => handleInputChange('autoBackup', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4" />
                <Label htmlFor="offlineMode">Çevrimdışı Mod</Label>
              </div>
              <Switch
                id="offlineMode"
                checked={settings.offlineMode}
                onCheckedChange={(checked) => handleInputChange('offlineMode', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sistem Yönetimi */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center text-red-600">
            <Shield className="mr-2 h-5 w-5" />
            Sistem Yönetimi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Sistem Sıfırlama */}
            <div className="flex flex-col items-center justify-center p-4 bg-red-50 rounded-lg border border-red-200">
              <Trash2 className="h-8 w-8 text-red-600 mb-2" />
              <h3 className="font-medium text-red-900 text-center">Sistemi Sıfırla</h3>
              <p className="text-sm text-red-600 text-center mb-3">Tüm veriler silinecek</p>
              <Button variant="destructive" size="sm" onClick={handleReset}>
                Sıfırla
              </Button>
            </div>

            {/* Örnek Veri Yükleme */}
            <div className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Upload className="h-8 w-8 text-blue-600 mb-2" />
              <h3 className="font-medium text-blue-900 text-center">Örnek Veri Yükle</h3>
              <p className="text-sm text-blue-600 text-center mb-3">Demo veriler eklenir</p>
              <Button variant="outline" size="sm" onClick={handleLoadSampleData} className="border-blue-300">
                Yükle
              </Button>
            </div>

            {/* Sistem Yedeği */}
            <div className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg border border-green-200">
              <Download className="h-8 w-8 text-green-600 mb-2" />
              <h3 className="font-medium text-green-900 text-center">Sistem Yedeği</h3>
              <p className="text-sm text-green-600 text-center mb-3">Verileri bilgisayara kaydet</p>
              <Button variant="outline" size="sm" onClick={handleBackup} className="border-green-300">
                İndir
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 