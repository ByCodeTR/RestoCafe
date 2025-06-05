import { Router } from 'express';
import {
  updatePrinterSettings,
  printTest,
  checkPrinterStatus,
  printReceipt,
  diagnosePrinter,
  advancedPrinterTest,
  listAllPrinters,
  restartPrinterSpooler,
  checkSystemPrinterStatus,
  checkAndFixPrinterSettings,
  printTestReceipt
} from '../controllers/printer.controller';
import { authMiddleware as authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// PUT /api/printers/settings - Yazıcı ayarlarını güncelle (ADMIN)
router.route('/settings')
  .put(authenticate, authorize('ADMIN'), updatePrinterSettings);

// GET /api/printers/test - Test çıktısı al (ADMIN)
router.route('/test')
  .get(authenticate, authorize('ADMIN'), printTest);

// GET /api/printers/status - Yazıcı durumunu kontrol et (ADMIN)
router.route('/status')
  .get(authenticate, authorize('ADMIN'), checkPrinterStatus);

// POST /api/printers/print-receipt - Fiş yazdır
router.route('/print-receipt')
  .post(authenticate, printReceipt);

// YENİ ENDPOINT'LER - Yazıcı Tanı ve Sorun Giderme

// POST /api/printers/diagnose - Yazıcı tanısı yap (ADMIN)
router.route('/diagnose')
  .post(authenticate, authorize('ADMIN'), diagnosePrinter);

// POST /api/printers/advanced-test - Gelişmiş yazıcı testi (ADMIN)
router.route('/advanced-test')
  .post(authenticate, authorize('ADMIN'), advancedPrinterTest);

// GET /api/printers/list-all - Tüm yazıcıları listele (ADMIN)
router.route('/list-all')
  .get(authenticate, authorize('ADMIN'), listAllPrinters);

// POST /api/printers/restart-spooler - Yazıcı spooler'ı yeniden başlat (ADMIN)
router.route('/restart-spooler')
  .post(authenticate, authorize('ADMIN'), restartPrinterSpooler);

// POST /api/printers/system-status - Sistem yazıcısı durumunu kontrol et (ADMIN)
router.route('/system-status')
  .post(authenticate, authorize('ADMIN'), checkSystemPrinterStatus);

// KASA YAZICI ÖZEL ENDPOINT'LERİ

// GET /api/printers/health - Basit sağlık kontrolü (AUTH YOK - TEST İÇİN)
router.route('/health')
  .get((req, res) => {
    res.json({
      success: true,
      message: 'Printer service is running',
      timestamp: new Date().toISOString()
    });
  });

// GET /api/printers/check-fix - Yazıcı ayarlarını kontrol et ve düzelt (ADMIN)
router.route('/check-fix')
  .get(authenticate, authorize('ADMIN'), checkAndFixPrinterSettings);

// POST /api/printers/test-receipt - Test fişi yazdır (ADMIN)
router.route('/test-receipt')
  .post(authenticate, authorize('ADMIN'), printTestReceipt);

export default router; 