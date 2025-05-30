import { Router } from 'express';
import {
  getAllStockLogs,
  getStockLogById,
  getStockLogsByProduct,
  getStockLogsBySupplier,
  createStockLog,
  updateStockLog,
  deleteStockLog,
} from '../controllers/stock.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Tüm route'lar için authentication gerekli
router.use(authenticate);

// GET /api/stock - Tüm stok hareketlerini listele (ADMIN)
router.get('/', authorize('ADMIN'), getAllStockLogs);

// GET /api/stock/:id - Belirli bir stok hareketini getir (ADMIN)
router.get('/:id', authorize('ADMIN'), getStockLogById);

// GET /api/stock/product/:productId - Ürüne ait stok hareketlerini getir (ADMIN)
router.get('/product/:productId', authorize('ADMIN'), getStockLogsByProduct);

// GET /api/stock/supplier/:supplierId - Tedarikçiye ait stok hareketlerini getir (ADMIN)
router.get('/supplier/:supplierId', authorize('ADMIN'), getStockLogsBySupplier);

// POST /api/stock - Yeni stok hareketi oluştur (ADMIN)
router.post('/', authorize('ADMIN'), createStockLog);

// PUT /api/stock/:id - Stok hareketi güncelle (ADMIN)
router.put('/:id', authorize('ADMIN'), updateStockLog);

// DELETE /api/stock/:id - Stok hareketi sil (ADMIN)
router.delete('/:id', authorize('ADMIN'), deleteStockLog);

export default router; 