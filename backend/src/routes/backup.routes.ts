import { Router } from 'express';
import {
  createManualBackup,
  restore,
  getBackups,
  startAutomaticBackup,
  stopAutomaticBackup,
} from '../controllers/backup.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Tüm route'lar için authentication gerekli
router.use(authenticate);

// POST /api/backup/manual - Manuel yedekleme oluştur (ADMIN)
router.post('/manual', authorize('ADMIN'), createManualBackup);

// POST /api/backup/restore - Yedekten geri yükle (ADMIN)
router.post('/restore', authorize('ADMIN'), restore);

// GET /api/backup/list - Yedekleme listesini getir (ADMIN)
router.get('/list', authorize('ADMIN'), getBackups);

// POST /api/backup/auto/start - Otomatik yedeklemeyi başlat (ADMIN)
router.post('/auto/start', authorize('ADMIN'), startAutomaticBackup);

// POST /api/backup/auto/stop - Otomatik yedeklemeyi durdur (ADMIN)
router.post('/auto/stop', authorize('ADMIN'), stopAutomaticBackup);

export default router; 