import { Router } from 'express';
import { getAllCategories, getCategoryById, createCategory, updateCategory, deleteCategory } from '../controllers/category.controller';
import { authMiddleware as authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/categories - Tüm kategorileri listele
router.get('/', authenticate, getAllCategories);

// GET /api/categories/:id - Belirli bir kategoriyi getir
router.get('/:id', authenticate, getCategoryById);

// POST /api/categories - Yeni kategori oluştur (Sadece ADMIN)
router.post('/', authenticate, authorize('ADMIN'), createCategory);

// PUT /api/categories/:id - Kategori güncelle (Sadece ADMIN)
router.put('/:id', authenticate, authorize('ADMIN'), updateCategory);

// DELETE /api/categories/:id - Kategori sil (Sadece ADMIN)
router.delete('/:id', authenticate, authorize('ADMIN'), deleteCategory);

export default router; 