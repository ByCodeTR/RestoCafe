import { Router } from 'express';
import { 
  getAllCategories, 
  getCategoryById, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} from '../controllers/category.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Tüm route'lar için authentication gerekli
router.use(authenticate);

// GET /api/categories - Tüm kategorileri listele
router.get('/', getAllCategories);

// GET /api/categories/:id - Belirli bir kategoriyi getir
router.get('/:id', getCategoryById);

// POST /api/categories - Yeni kategori oluştur (Sadece ADMIN)
router.post('/', authorize('ADMIN'), createCategory);

// PUT /api/categories/:id - Kategori güncelle (Sadece ADMIN)
router.put('/:id', authorize('ADMIN'), updateCategory);

// DELETE /api/categories/:id - Kategori sil (Sadece ADMIN)
router.delete('/:id', authorize('ADMIN'), deleteCategory);

export default router; 