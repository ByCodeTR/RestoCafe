import { Router } from 'express';
import {
  getDailyReport,
  getWeeklyReport,
  getMonthlyReport,
  getCustomReport,
  getDashboardStats,
} from '../controllers/report.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Tüm route'lar için authentication gerekli
router.use(authenticate);

// GET /api/reports/dashboard-stats - Dashboard günlük istatistikleri (ADMIN)
router.get('/dashboard-stats', authorize('ADMIN'), getDashboardStats);

// GET /api/reports/daily - Günlük rapor (ADMIN)
router.get('/daily', authorize('ADMIN'), getDailyReport);

// GET /api/reports/weekly - Haftalık rapor (ADMIN)
router.get('/weekly', authorize('ADMIN'), getWeeklyReport);

// GET /api/reports/monthly - Aylık rapor (ADMIN)
router.get('/monthly', authorize('ADMIN'), getMonthlyReport);

// GET /api/reports/custom - Özel tarih aralığı raporu (ADMIN)
router.get('/custom', authorize('ADMIN'), getCustomReport);

export default router; 