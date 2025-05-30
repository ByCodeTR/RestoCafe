import { Router } from 'express';
import {
  getEmpty,
  getByArea,
  updateStatus,
  merge,
  updateNote,
} from '../controllers/tablet-table.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/tablet/tables/empty - Boş masaları getir
router.get('/empty', authenticate, authorize('WAITER'), getEmpty);

// GET /api/tablet/tables/area/:areaId - Bölgeye göre masaları getir
router.get('/area/:areaId', authenticate, authorize('WAITER'), getByArea);

// PUT /api/tablet/tables/:tableId/status - Masa durumunu güncelle
router.put('/:tableId/status', authenticate, authorize('WAITER'), updateStatus);

// POST /api/tablet/tables/merge - Masaları birleştir
router.post('/merge', authenticate, authorize('WAITER'), merge);

// PUT /api/tablet/tables/:tableId/note - Masa notunu güncelle
router.put('/:tableId/note', authenticate, authorize('WAITER'), updateNote);

export default router; 