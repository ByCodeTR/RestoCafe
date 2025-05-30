import { Router } from 'express';
import { 
  getAllSuppliers, 
  getSupplierById, 
  createSupplier, 
  updateSupplier, 
  deleteSupplier 
} from '../controllers/supplier.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Tüm route'lar için authentication gerekli
router.use(authenticate);

// GET /api/suppliers - Tüm tedarikçileri listele (ADMIN)
router.get('/', authorize('ADMIN'), getAllSuppliers);

// GET /api/suppliers/:id - Belirli bir tedarikçiyi getir (ADMIN)
router.get('/:id', authorize('ADMIN'), getSupplierById);

// POST /api/suppliers - Yeni tedarikçi oluştur (ADMIN)
router.post('/', authorize('ADMIN'), createSupplier);

// PUT /api/suppliers/:id - Tedarikçi güncelle (ADMIN)
router.put('/:id', authorize('ADMIN'), updateSupplier);

// DELETE /api/suppliers/:id - Tedarikçi sil (ADMIN)
router.delete('/:id', authorize('ADMIN'), deleteSupplier);

export default router; 