import { Router } from 'express';
import {
  login,
  logout,
  checkSession,
  getTables,
  getStats,
  getSessionHistory,
} from '../controllers/waiter.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// POST /api/waiters/login - Garson girişi
router.post('/login', login);

// POST /api/waiters/logout - Garson çıkışı
router.post('/logout', authenticate, logout);

// POST /api/waiters/check-session - Oturum kontrolü
router.post('/check-session', checkSession);

// GET /api/waiters/:userId/tables - Garsonun aktif masalarını getir
router.get('/:userId/tables', authenticate, authorize('WAITER'), getTables);

// GET /api/waiters/:userId/stats - Garsonun günlük istatistiklerini getir
router.get('/:userId/stats', authenticate, authorize('WAITER'), getStats);

// GET /api/waiters/:userId/sessions - Garsonun oturum geçmişini getir
router.get('/:userId/sessions', authenticate, authorize('WAITER'), getSessionHistory);

export default router; 