import { Router } from 'express';
import productController from '../controllers/product.controller';
import { authMiddleware as authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/products - Tüm ürünleri listele
router.get('/', authenticate, productController.getAllProducts);

// GET /api/products/category/:categoryId - Kategoriye göre ürünleri listele
router.get('/category/:categoryId', authenticate, productController.getProductsByCategory);

// GET /api/products/:id - Belirli bir ürünü getir
router.get('/:id', authenticate, productController.getProductById);

// POST /api/products - Yeni ürün oluştur (Sadece ADMIN)
router.post('/', authenticate, authorize('ADMIN'), productController.createProduct);

// PUT /api/products/:id - Ürün güncelle (Sadece ADMIN)
router.put('/:id', authenticate, authorize('ADMIN'), productController.updateProduct);

// DELETE /api/products/:id - Ürün sil (Sadece ADMIN)
router.delete('/:id', authenticate, authorize('ADMIN'), productController.deleteProduct);

export default router; 