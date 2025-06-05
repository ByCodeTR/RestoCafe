import { Router } from 'express';
import { createOrder, getOrders, getOrder, updateOrderStatus, deleteOrder, processPayment, clearTableOrders, printBill } from '../controllers/order.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Tüm rotalar için authentication gerekli
router.use(authMiddleware);

// Sipariş route'ları
router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrder);
router.patch('/:id', updateOrderStatus);
router.delete('/:id', deleteOrder);

// Ödeme route'u
router.post('/:id/payment', processPayment);

// Adisyon yazdırma route'u
router.post('/:id/print-bill', printBill);

// Masa temizleme route'u
router.delete('/table/:tableNumber/clear', clearTableOrders);

export default router; 