import { Router } from 'express';
import { notifyKitchen, printReceipt } from '../controllers/kitchen.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Mutfak bildirimleri route'ları
router.post('/notify', authMiddleware, notifyKitchen);
router.post('/print', authMiddleware, printReceipt);

export default router; 