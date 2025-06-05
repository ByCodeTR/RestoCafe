import React, { useState, useEffect } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { api } from '@/lib/api';

interface CompanyInfo {
  id?: string;
  name: string;
  address: string;
  phone: string;
  website?: string;
  email?: string;
  taxNumber?: string;
  taxOffice?: string;
  logo?: string;
}

interface Printer {
  id?: string;
  name: string;
  type: 'KITCHEN' | 'CASHIER';
  ipAddress: string;
  port: number;
  isActive: boolean;
}

interface SystemSettings {
  id?: string;
  backupEnabled: boolean;
  backupFrequency: number;
  backupPath?: string;
  autoTableClose: boolean;
  orderNumberPrefix: string;
  tableNumberPrefix: string;
  defaultLanguage: string;
  theme: string;
  lastBackupAt?: string;
}

interface BackupHistory {
  id: string;
  filename: string;
  path: string;
  size: number;
  status: string;
  error?: string;
  createdAt: string;
}

const SettingsPage = () => {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: '',
    address: '',
    phone: '',
  });

  const [printers, setPrinters] = useState<Printer[]>([]);
  const [newPrinter, setNewPrinter] = useState<Printer>({
    name: '',
    type: 'KITCHEN',
    ipAddress: '',
    port: 9100,
    isActive: true,
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    backupEnabled: true,
    backupFrequency: 24,
    autoTableClose: false,
    orderNumberPrefix: 'ORD',
    tableNumberPrefix: 'T',
    defaultLanguage: 'tr',
    theme: 'light',
  });

  const [backupHistory, setBackupHistory] = useState<BackupHistory[]>([]);

  // Şirket bilgilerini yükle
  useEffect(() => {
    const loadCompanyInfo = async () => {
      try {
        const response = await api.get('/settings/company-info');
        if (response.data) {
          setCompanyInfo(response.data);
        }
      } catch (error) {
        toast({
          title: "Hata",
          description: "Şirket bilgileri yüklenemedi.",
          variant: "destructive",
        });
      }
    };
    loadCompanyInfo();
  }, []);

  // Yazıcıları yükle
  useEffect(() => {
    const loadPrinters = async () => {
      try {
        const response = await api.get('/settings/printers');
        setPrinters(response.data);
      } catch (error) {
        toast({
          title: "Hata",
          description: "Yazıcılar yüklenemedi.",
          variant: "destructive",
        });
      }
    };
    loadPrinters();
  }, []);

  // Sistem ayarlarını yükle
  useEffect(() => {
    const loadSystemSettings = async () => {
      try {
        const response = await api.get('/settings/system');
        if (response.data) {
          setSystemSettings(response.data);
        }
      } catch (error) {
        toast({
          title: "Hata",
          description: "Sistem ayarları yüklenemedi.",
          variant: "destructive",
        });
      }
    };
    loadSystemSettings();
  }, []);

  // Yedekleme geçmişini yükle
  useEffect(() => {
    const loadBackupHistory = async () => {
      try {
        const response = await api.get('/settings/backup-history');
        setBackupHistory(response.data);
      } catch (error) {
        toast({
          title: "Hata",
          description: "Yedekleme geçmişi yüklenemedi.",
          variant: "destructive",
        });
      }
    };
    loadBackupHistory();
  }, []);

  // Şirket bilgilerini güncelle
  const handleCompanyInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/settings/company-info', companyInfo);
      toast({
        title: "Başarılı",
        description: "Şirket bilgileri güncellendi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Şirket bilgileri güncellenemedi.",
        variant: "destructive",
      });
    }
  };

  // Yazıcı ekle/güncelle
  const handlePrinterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.put('/settings/printers', newPrinter);
      setPrinters([...printers.filter(p => p.id !== response.data.id), response.data]);
      setNewPrinter({
        name: '',
        type: 'KITCHEN',
        ipAddress: '',
        port: 9100,
        isActive: true,
      });
      toast({
        title: "Başarılı",
        description: "Yazıcı kaydedildi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Yazıcı kaydedilemedi.",
        variant: "destructive",
      });
    }
  };

  // Yazıcı sil
  const handleDeletePrinter = async (id: string) => {
    try {
      await api.delete(`/settings/printers/${id}`);
      setPrinters(printers.filter(p => p.id !== id));
      toast({
        title: "Başarılı",
        description: "Yazıcı silindi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Yazıcı silinemedi.",
        variant: "destructive",
      });
    }
  };

  // Sistem ayarlarını güncelle
  const handleSystemSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/settings/system', systemSettings);
      toast({
        title: "Başarılı",
        description: "Sistem ayarları güncellendi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Sistem ayarları güncellenemedi.",
        variant: "destructive",
      });
    }
  };

  // Manuel yedekleme
  const handleManualBackup = async () => {
    try {
      await api.post('/settings/backup');
      const response = await api.get('/settings/backup-history');
      setBackupHistory(response.data);
      toast({
        title: "Başarılı",
        description: "Yedekleme oluşturuldu.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Yedekleme oluşturulamadı.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Ayarlar</h1>

      <Tabs defaultValue="company">
        <TabsList className="mb-4">
          <TabsTrigger value="company">Şirket Bilgileri</TabsTrigger>
          <TabsTrigger value="printers">Yazıcılar</TabsTrigger>
          <TabsTrigger value="system">Sistem</TabsTrigger>
          <TabsTrigger value="backup">Yedekleme</TabsTrigger>
        </TabsList>

        {/* Şirket Bilgileri */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Şirket Bilgileri</CardTitle>
              <CardDescription>
                Adisyonda görünecek şirket bilgilerini buradan düzenleyebilirsiniz.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCompanyInfoSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Şirket Adı</Label>
                    <Input
                      id="name"
                      value={companyInfo.name}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      value={companyInfo.phone}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Adres</Label>
                    <Input
                      id="address"
                      value={companyInfo.address}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Web Sitesi</Label>
                    <Input
                      id="website"
                      value={companyInfo.website}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, website: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-posta</Label>
                    <Input
                      id="email"
                      type="email"
                      value={companyInfo.email}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxNumber">Vergi Numarası</Label>
                    <Input
                      id="taxNumber"
                      value={companyInfo.taxNumber}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, taxNumber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxOffice">Vergi Dairesi</Label>
                    <Input
                      id="taxOffice"
                      value={companyInfo.taxOffice}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, taxOffice: e.target.value })}
                    />
                  </div>
                </div>
                <Button type="submit">Kaydet</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Yazıcılar */}
        <TabsContent value="printers">
          <Card>
            <CardHeader>
              <CardTitle>Yazıcı Ayarları</CardTitle>
              <CardDescription>
                Mutfak ve kasa yazıcılarını buradan yönetebilirsiniz.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Mevcut Yazıcılar */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Mevcut Yazıcılar</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Yazıcı Adı</TableHead>
                        <TableHead>Tip</TableHead>
                        <TableHead>IP Adresi</TableHead>
                        <TableHead>Port</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead>İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {printers.map((printer) => (
                        <TableRow key={printer.id}>
                          <TableCell>{printer.name}</TableCell>
                          <TableCell>{printer.type === 'KITCHEN' ? 'Mutfak' : 'Kasa'}</TableCell>
                          <TableCell>{printer.ipAddress}</TableCell>
                          <TableCell>{printer.port}</TableCell>
                          <TableCell>
                            <Switch
                              checked={printer.isActive}
                              onCheckedChange={async (checked) => {
                                try {
                                  await api.put('/settings/printers', {
                                    ...printer,
                                    isActive: checked,
                                  });
                                  setPrinters(printers.map(p =>
                                    p.id === printer.id ? { ...p, isActive: checked } : p
                                  ));
                                } catch (error) {
                                  toast({
                                    title: "Hata",
                                    description: "Yazıcı durumu güncellenemedi.",
                                    variant: "destructive",
                                  });
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => printer.id && handleDeletePrinter(printer.id)}
                            >
                              Sil
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Yeni Yazıcı Ekle */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Yeni Yazıcı Ekle</h3>
                  <form onSubmit={handlePrinterSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="printerName">Yazıcı Adı</Label>
                        <Input
                          id="printerName"
                          value={newPrinter.name}
                          onChange={(e) => setNewPrinter({ ...newPrinter, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="printerType">Yazıcı Tipi</Label>
                        <select
                          id="printerType"
                          className="w-full px-3 py-2 border rounded-md"
                          value={newPrinter.type}
                          onChange={(e) => setNewPrinter({ ...newPrinter, type: e.target.value as 'KITCHEN' | 'CASHIER' })}
                          required
                        >
                          <option value="KITCHEN">Mutfak</option>
                          <option value="CASHIER">Kasa</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ipAddress">IP Adresi</Label>
                        <Input
                          id="ipAddress"
                          value={newPrinter.ipAddress}
                          onChange={(e) => setNewPrinter({ ...newPrinter, ipAddress: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="port">Port</Label>
                        <Input
                          id="port"
                          type="number"
                          value={newPrinter.port}
                          onChange={(e) => setNewPrinter({ ...newPrinter, port: parseInt(e.target.value) })}
                          required
                        />
                      </div>
                    </div>
                    <Button type="submit">Yazıcı Ekle</Button>
                  </form>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sistem Ayarları */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>Sistem Ayarları</CardTitle>
              <CardDescription>
                Genel sistem ayarlarını buradan yapılandırabilirsiniz.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSystemSettingsSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="orderNumberPrefix">Sipariş Numarası Öneki</Label>
                    <Input
                      id="orderNumberPrefix"
                      value={systemSettings.orderNumberPrefix}
                      onChange={(e) => setSystemSettings({ ...systemSettings, orderNumberPrefix: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tableNumberPrefix">Masa Numarası Öneki</Label>
                    <Input
                      id="tableNumberPrefix"
                      value={systemSettings.tableNumberPrefix}
                      onChange={(e) => setSystemSettings({ ...systemSettings, tableNumberPrefix: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="defaultLanguage">Varsayılan Dil</Label>
                    <select
                      id="defaultLanguage"
                      className="w-full px-3 py-2 border rounded-md"
                      value={systemSettings.defaultLanguage}
                      onChange={(e) => setSystemSettings({ ...systemSettings, defaultLanguage: e.target.value })}
                    >
                      <option value="tr">Türkçe</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="theme">Tema</Label>
                    <select
                      id="theme"
                      className="w-full px-3 py-2 border rounded-md"
                      value={systemSettings.theme}
                      onChange={(e) => setSystemSettings({ ...systemSettings, theme: e.target.value })}
                    >
                      <option value="light">Açık</option>
                      <option value="dark">Koyu</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="autoTableClose"
                    checked={systemSettings.autoTableClose}
                    onCheckedChange={(checked) =>
                      setSystemSettings({ ...systemSettings, autoTableClose: checked })
                    }
                  />
                  <Label htmlFor="autoTableClose">Ödeme Sonrası Otomatik Masa Kapatma</Label>
                </div>

                <Button type="submit">Kaydet</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Yedekleme */}
        <TabsContent value="backup">
          <Card>
            <CardHeader>
              <CardTitle>Yedekleme Ayarları</CardTitle>
              <CardDescription>
                Veritabanı yedekleme ayarlarını buradan yapılandırabilirsiniz.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Yedekleme Ayarları */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="backupEnabled"
                      checked={systemSettings.backupEnabled}
                      onCheckedChange={(checked) =>
                        setSystemSettings({ ...systemSettings, backupEnabled: checked })
                      }
                    />
                    <Label htmlFor="backupEnabled">Otomatik Yedekleme</Label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="backupFrequency">Yedekleme Sıklığı (Saat)</Label>
                      <Input
                        id="backupFrequency"
                        type="number"
                        min="1"
                        value={systemSettings.backupFrequency}
                        onChange={(e) => setSystemSettings({
                          ...systemSettings,
                          backupFrequency: parseInt(e.target.value)
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="backupPath">Yedekleme Dizini</Label>
                      <Input
                        id="backupPath"
                        value={systemSettings.backupPath}
                        onChange={(e) => setSystemSettings({
                          ...systemSettings,
                          backupPath: e.target.value
                        })}
                      />
                    </div>
                  </div>

                  <Button onClick={handleManualBackup}>Manuel Yedekleme Oluştur</Button>
                </div>

                {/* Yedekleme Geçmişi */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Yedekleme Geçmişi</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tarih</TableHead>
                        <TableHead>Dosya Adı</TableHead>
                        <TableHead>Boyut</TableHead>
                        <TableHead>Durum</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {backupHistory.map((backup) => (
                        <TableRow key={backup.id}>
                          <TableCell>
                            {new Date(backup.createdAt).toLocaleString('tr-TR')}
                          </TableCell>
                          <TableCell>{backup.filename}</TableCell>
                          <TableCell>{(backup.size / 1024 / 1024).toFixed(2)} MB</TableCell>
                          <TableCell>
                            {backup.status === 'SUCCESS' ? (
                              <span className="text-green-600">Başarılı</span>
                            ) : (
                              <span className="text-red-600" title={backup.error}>
                                Başarısız
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage; 