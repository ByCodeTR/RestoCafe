import { Router } from 'express';
import {
  updatePrinterSettings,
  printTest,
  checkPrinterStatus,
} from '../controllers/printer.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Tüm route'lar için authentication gerekli
router.use(authenticate);

// PUT /api/printers/settings - Yazıcı ayarlarını güncelle (ADMIN)
router.put('/settings', authorize('ADMIN'), updatePrinterSettings);

// GET /api/printers/test - Test çıktısı al (ADMIN)
router.get('/test', authorize('ADMIN'), printTest);

// GET /api/printers/status - Yazıcı durumunu kontrol et (ADMIN)
router.get('/status', authorize('ADMIN'), checkPrinterStatus);

export default router; 