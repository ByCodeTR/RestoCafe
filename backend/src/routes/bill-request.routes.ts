import { Router } from 'express';
import {
  create,
  update,
  getActiveForTable,
  getWaiterActive,
  getAllActive,
} from '../controllers/bill-request.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// POST /api/bill-requests - Adisyon talebi oluştur
router.post('/', authenticate, authorize('WAITER'), create);

// PUT /api/bill-requests/:requestId - Adisyon talebini güncelle
router.put('/:requestId', authenticate, authorize(['WAITER', 'CASHIER']), update);

// GET /api/bill-requests/table/:tableId - Masa için aktif adisyon talebini getir
router.get('/table/:tableId', authenticate, authorize(['WAITER', 'CASHIER']), getActiveForTable);

// GET /api/bill-requests/waiter - Garsonun aktif adisyon taleplerini getir
router.get('/waiter', authenticate, authorize('WAITER'), getWaiterActive);

// GET /api/bill-requests/active - Tüm aktif adisyon taleplerini getir
router.get('/active', authenticate, authorize(['WAITER', 'CASHIER', 'ADMIN']), getAllActive);

export default router; 