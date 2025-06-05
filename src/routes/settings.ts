import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Şirket bilgilerini getir
router.get('/company-info', authenticateToken, async (req, res) => {
  try {
    const companyInfo = await prisma.companyInfo.findFirst();
    res.json(companyInfo);
  } catch (error) {
    res.status(500).json({ error: 'Şirket bilgileri alınamadı.' });
  }
});

// Şirket bilgilerini güncelle
router.put('/company-info', authenticateToken, async (req, res) => {
  try {
    const companyInfo = await prisma.companyInfo.upsert({
      where: { id: req.body.id || '' },
      update: req.body,
      create: req.body,
    });
    res.json(companyInfo);
  } catch (error) {
    res.status(500).json({ error: 'Şirket bilgileri güncellenemedi.' });
  }
});

// Yazıcıları getir
router.get('/printers', authenticateToken, async (req, res) => {
  try {
    const printers = await prisma.printer.findMany();
    res.json(printers);
  } catch (error) {
    res.status(500).json({ error: 'Yazıcılar alınamadı.' });
  }
});

// Yazıcı ekle/güncelle
router.put('/printers', authenticateToken, async (req, res) => {
  try {
    const printer = await prisma.printer.upsert({
      where: { id: req.body.id || '' },
      update: req.body,
      create: req.body,
    });
    res.json(printer);
  } catch (error) {
    res.status(500).json({ error: 'Yazıcı kaydedilemedi.' });
  }
});

// Yazıcı sil
router.delete('/printers/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.printer.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Yazıcı silindi.' });
  } catch (error) {
    res.status(500).json({ error: 'Yazıcı silinemedi.' });
  }
});

// Sistem ayarlarını getir
router.get('/system', authenticateToken, async (req, res) => {
  try {
    const systemSettings = await prisma.systemSettings.findFirst();
    res.json(systemSettings);
  } catch (error) {
    res.status(500).json({ error: 'Sistem ayarları alınamadı.' });
  }
});

// Sistem ayarlarını güncelle
router.put('/system', authenticateToken, async (req, res) => {
  try {
    const systemSettings = await prisma.systemSettings.upsert({
      where: { id: req.body.id || '' },
      update: req.body,
      create: req.body,
    });
    res.json(systemSettings);
  } catch (error) {
    res.status(500).json({ error: 'Sistem ayarları güncellenemedi.' });
  }
});

// Yedekleme geçmişini getir
router.get('/backup-history', authenticateToken, async (req, res) => {
  try {
    const backupHistory = await prisma.backupHistory.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(backupHistory);
  } catch (error) {
    res.status(500).json({ error: 'Yedekleme geçmişi alınamadı.' });
  }
});

// Manuel yedekleme oluştur
router.post('/backup', authenticateToken, async (req, res) => {
  try {
    // Burada gerçek yedekleme işlemi yapılacak
    const backup = await prisma.backupHistory.create({
      data: {
        filename: `backup_${new Date().toISOString()}.sql`,
        path: '/backups',
        size: 0,
        status: 'SUCCESS',
      },
    });
    res.json(backup);
  } catch (error) {
    res.status(500).json({ error: 'Yedekleme oluşturulamadı.' });
  }
});

export default router; 