import { Router } from 'express';
import * as tabletTableController from '../controllers/tablet-table.controller';
import { authMiddleware as authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/tablet/tables/empty - Boş masaları getir
router.get('/empty', authenticate, authorize('ADMIN', 'MANAGER', 'WAITER'), tabletTableController.getEmpty);

// GET /api/tablet/tables/area/:areaId - Bölgeye göre masaları getir
router.get('/area/:areaId', authenticate, authorize('ADMIN', 'MANAGER', 'WAITER'), tabletTableController.getByArea);

// PUT /api/tablet/tables/:tableId/status - Masa durumunu güncelle
router.put('/:tableId/status', authenticate, authorize('ADMIN', 'MANAGER', 'WAITER'), tabletTableController.updateStatus);

// POST /api/tablet/tables/merge - Masaları birleştir
router.post('/merge', authenticate, authorize('ADMIN', 'MANAGER', 'WAITER'), tabletTableController.merge);

// PUT /api/tablet/tables/:tableId/note - Masa notunu güncelle
router.put('/:tableId/note', authenticate, authorize('ADMIN', 'MANAGER', 'WAITER'), tabletTableController.updateNote);

export default router; 