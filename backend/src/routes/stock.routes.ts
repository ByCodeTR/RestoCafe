import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { StockController } from '../controllers/stock.controller';

const router = Router();
const stockController = new StockController();

// Stock routes
router.get('/', authMiddleware, (req, res) => stockController.getAllStock(req, res));
router.get('/:id', authMiddleware, (req, res) => stockController.getStockById(req, res));
router.post('/', authMiddleware, (req, res) => stockController.createStock(req, res));
router.put('/:id', authMiddleware, (req, res) => stockController.updateStock(req, res));
router.delete('/:id', authMiddleware, (req, res) => stockController.deleteStock(req, res));

// Low stock alerts
router.get('/alerts/low', authMiddleware, (req, res) => stockController.getLowStockAlerts(req, res));

export default router; 