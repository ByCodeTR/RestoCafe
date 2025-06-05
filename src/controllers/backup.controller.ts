import { Request, Response } from 'express';
import {
  createBackup,
  restoreBackup,
  getBackupList,
  startAutoBackup,
  stopAutoBackup,
} from '../services/backup.service';

// Manuel yedekleme oluştur
export const createManualBackup = async (req: Request, res: Response) => {
  try {
    const result = await createBackup();
    res.json({
      message: 'Yedekleme başarıyla oluşturuldu',
      ...result,
    });
  } catch (error) {
    console.error('Create backup error:', error);
    res.status(500).json({ message: 'Yedekleme oluşturulamadı' });
  }
};

// Yedekten geri yükle
export const restore = async (req: Request, res: Response) => {
  try {
    const { backupFile } = req.body;

    if (!backupFile) {
      return res.status(400).json({
        message: 'Yedekleme dosyası seçilmedi',
      });
    }

    const result = await restoreBackup(backupFile);
    res.json({
      message: 'Yedekleme başarıyla geri yüklendi',
      ...result,
    });
  } catch (error) {
    console.error('Restore backup error:', error);
    res.status(500).json({ message: 'Yedekleme geri yüklenemedi' });
  }
};

// Yedekleme listesini getir
export const getBackups = async (req: Request, res: Response) => {
  try {
    const backups = getBackupList();
    res.json(backups);
  } catch (error) {
    console.error('Get backups error:', error);
    res.status(500).json({ message: 'Yedekleme listesi alınamadı' });
  }
};

// Otomatik yedeklemeyi başlat
export const startAutomaticBackup = async (req: Request, res: Response) => {
  try {
    const { intervalHours } = req.body;

    if (!intervalHours || intervalHours < 1) {
      return res.status(400).json({
        message: 'Geçerli bir yedekleme aralığı giriniz (saat cinsinden)',
      });
    }

    const result = startAutoBackup(intervalHours);
    res.json({
      message: 'Otomatik yedekleme başlatıldı',
      intervalHours,
      active: result,
    });
  } catch (error) {
    console.error('Start automatic backup error:', error);
    res.status(500).json({ message: 'Otomatik yedekleme başlatılamadı' });
  }
};

// Otomatik yedeklemeyi durdur
export const stopAutomaticBackup = async (req: Request, res: Response) => {
  try {
    const result = stopAutoBackup();
    res.json({
      message: result ? 'Otomatik yedekleme durduruldu' : 'Otomatik yedekleme zaten kapalı',
      active: !result,
    });
  } catch (error) {
    console.error('Stop automatic backup error:', error);
    res.status(500).json({ message: 'Otomatik yedekleme durdurulamadı' });
  }
}; 