import { Router } from 'express';
import { 
  getAllSuppliers, 
  getSupplierById, 
  createSupplier, 
  updateSupplier, 
  deleteSupplier 
} from '../controllers/supplier.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/suppliers - Tüm tedarikçileri listele
router.get('/', authMiddleware, getAllSuppliers);

// GET /api/suppliers/:id - Belirli bir tedarikçiyi getir
router.get('/:id', authMiddleware, getSupplierById);

// POST /api/suppliers - Yeni tedarikçi oluştur
router.post('/', authMiddleware, createSupplier);

// PUT /api/suppliers/:id - Tedarikçi güncelle
router.put('/:id', authMiddleware, updateSupplier);

// DELETE /api/suppliers/:id - Tedarikçi sil
router.delete('/:id', authMiddleware, deleteSupplier);

export default router; 