import { Router } from 'express';
import {
  create,
  update,
  remove,
  get,
  getAll,
  search,
  getActivities,
  updateRole,
  updatePassword,
} from '../controllers/user.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Tüm route'lar için authentication gerekli
router.use(authenticate);

// POST /api/users - Yeni kullanıcı oluştur (ADMIN)
router.post('/', authorize('ADMIN'), create);

// PUT /api/users/:id - Kullanıcı güncelle (ADMIN)
router.put('/:id', authorize('ADMIN'), update);

// DELETE /api/users/:id - Kullanıcı sil (ADMIN)
router.delete('/:id', authorize('ADMIN'), remove);

// GET /api/users/:id - Kullanıcı detayı getir (ADMIN)
router.get('/:id', authorize('ADMIN'), get);

// GET /api/users - Tüm kullanıcıları listele (ADMIN)
router.get('/', authorize('ADMIN'), getAll);

// GET /api/users/search - Kullanıcı ara (ADMIN)
router.get('/search', authorize('ADMIN'), search);

// GET /api/users/:id/activities - Kullanıcı aktivitelerini getir (ADMIN)
router.get('/:id/activities', authorize('ADMIN'), getActivities);

// PUT /api/users/:id/role - Kullanıcı rolünü güncelle (ADMIN)
router.put('/:id/role', authorize('ADMIN'), updateRole);

// PUT /api/users/:id/password - Kullanıcı şifresini güncelle (ADMIN veya kendisi)
router.put('/:id/password', updatePassword);

export default router; 