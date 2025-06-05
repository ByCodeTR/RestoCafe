import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, authorize } from '../middlewares/auth.middleware';
import { 
  getAllTables, 
  getTableById, 
  createTable, 
  updateTable, 
  deleteTable, 
  updateTableStatus,
  moveTable,
  mergeTables
} from '../controllers/table.controller';

const router = Router();
const prisma = new PrismaClient();

// Tüm route'lar için authentication gerekli
// router.use(authMiddleware); // Development için geçici olarak devre dışı bırakıldı

// Tüm masaları getir
router.get('/', getAllTables);

// Tek masa getir
router.get('/:id', getTableById);

// Yeni masa ekle
router.post('/', createTable);

// Masa güncelle
router.put('/:id', updateTable);

// Masa sil
router.delete('/:id', deleteTable);

// Masa durumunu güncelle
router.patch('/:id/status', updateTableStatus);

// Masa taşıma
router.post('/move', moveTable);

// Masa birleştirme  
router.post('/merge', mergeTables);

export default router; 