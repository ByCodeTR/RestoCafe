import { Router } from 'express';
import { 
  getAllAreas, 
  getAreaById, 
  createArea, 
  updateArea, 
  deleteArea 
} from '../controllers/area.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Tüm route'lar için authentication gerekli
router.use(authenticate);

// GET /api/areas - Tüm bölgeleri listele
router.get('/', getAllAreas);

// GET /api/areas/:id - Belirli bir bölgeyi getir
router.get('/:id', getAreaById);

// POST /api/areas - Yeni bölge oluştur (Sadece ADMIN)
router.post('/', authorize('ADMIN'), createArea);

// PUT /api/areas/:id - Bölge güncelle (Sadece ADMIN)
router.put('/:id', authorize('ADMIN'), updateArea);

// DELETE /api/areas/:id - Bölge sil (Sadece ADMIN)
router.delete('/:id', authorize('ADMIN'), deleteArea);

export default router; 