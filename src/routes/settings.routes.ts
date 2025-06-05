import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  getCompanyInfo,
  updateCompanyInfo,
  getPrinters,
  updatePrinter,
  deletePrinter,
  getSystemSettings,
  updateSystemSettings,
  createBackup,
  getBackupHistory,
  testPrinter,
  getAvailablePrinters,
} from '../controllers/settings.controller';

const router = Router();

// Şirket bilgileri
router.get('/company-info', authMiddleware, getCompanyInfo);
router.put('/company-info', authMiddleware, updateCompanyInfo);

// Yazıcı ayarları
router.get('/printers', authMiddleware, getPrinters);
router.get('/available-printers', authMiddleware, getAvailablePrinters);
router.put('/printers', authMiddleware, updatePrinter);
router.delete('/printers/:id', authMiddleware, deletePrinter);
router.post('/printer-test', authMiddleware, testPrinter);

// Sistem ayarları
router.get('/system', authMiddleware, getSystemSettings);
router.put('/system', authMiddleware, updateSystemSettings);

// Yedekleme
router.post('/backup', authMiddleware, createBackup);
router.get('/backup-history', authMiddleware, getBackupHistory);

export default router; 