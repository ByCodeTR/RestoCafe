import { Router } from 'express';
import { login, register, getProfile, updateProfile } from '../controllers/auth.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Public routes
router.post('/login', login);
router.post('/register', authenticate, authorize('ADMIN'), register); // Sadece admin yeni kullanıcı ekleyebilir

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);

export default router; 