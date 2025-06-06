import { Router } from 'express';
import {
  resetSystem,
  loadSampleData,
  createBackup,
  getSystemStats,
  seedDatabase
} from '../controllers/system.controller';
import { authMiddleware as authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// POST /api/system/seed - Veritabanını seed et (PUBLIC - İlk kurulum için)
router.route('/seed')
  .post(seedDatabase);

// POST /api/system/reset - Sistemi sıfırla (ADMIN)
router.route('/reset')
  .post(authenticate, authorize('ADMIN'), resetSystem);

// POST /api/system/sample-data - Demo verileri yükle (ADMIN)
router.route('/sample-data')
  .post(authenticate, authorize('ADMIN'), loadSampleData);

// POST /api/system/backup - Sistem yedeği oluştur (ADMIN)
router.route('/backup')
  .post(authenticate, authorize('ADMIN'), createBackup);

// GET /api/system/stats - Sistem istatistikleri (ADMIN)
router.route('/stats')
  .get(authenticate, authorize('ADMIN'), getSystemStats);

export default router; 