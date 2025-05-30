import { Router } from 'express';
import { 
  getAllTables, 
  getTableById, 
  createTable, 
  updateTable, 
  deleteTable,
  updateTableStatus 
} from '../controllers/table.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Tüm route'lar için authentication gerekli
router.use(authenticate);

// GET /api/tables - Tüm masaları listele
router.get('/', getAllTables);

// GET /api/tables/:id - Belirli bir masayı getir
router.get('/:id', getTableById);

// POST /api/tables - Yeni masa oluştur (Sadece ADMIN)
router.post('/', authorize('ADMIN'), createTable);

// PUT /api/tables/:id - Masa güncelle (Sadece ADMIN)
router.put('/:id', authorize('ADMIN'), updateTable);

// DELETE /api/tables/:id - Masa sil (Sadece ADMIN)
router.delete('/:id', authorize('ADMIN'), deleteTable);

// PATCH /api/tables/:id/status - Masa durumunu güncelle (ADMIN ve WAITER)
router.patch('/:id/status', authorize('ADMIN', 'WAITER'), updateTableStatus);

export default router; 