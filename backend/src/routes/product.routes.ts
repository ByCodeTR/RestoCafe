import { Router } from 'express';
import { 
  getAllProducts, 
  getProductById,
  getProductsByCategory,
  createProduct, 
  updateProduct, 
  deleteProduct 
} from '../controllers/product.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Tüm route'lar için authentication gerekli
router.use(authenticate);

// GET /api/products - Tüm ürünleri listele
router.get('/', getAllProducts);

// GET /api/products/category/:categoryId - Kategoriye göre ürünleri listele
router.get('/category/:categoryId', getProductsByCategory);

// GET /api/products/:id - Belirli bir ürünü getir
router.get('/:id', getProductById);

// POST /api/products - Yeni ürün oluştur (Sadece ADMIN)
router.post('/', authorize('ADMIN'), createProduct);

// PUT /api/products/:id - Ürün güncelle (Sadece ADMIN)
router.put('/:id', authorize('ADMIN'), updateProduct);

// DELETE /api/products/:id - Ürün sil (Sadece ADMIN)
router.delete('/:id', authorize('ADMIN'), deleteProduct);

export default router; 