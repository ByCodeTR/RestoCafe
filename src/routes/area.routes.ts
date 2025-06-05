import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, authorize } from '../middlewares/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// Tüm route'lar için authentication gerekli
// router.use(authMiddleware); // Development için geçici olarak devre dışı bırakıldı

// GET /api/areas - Tüm bölgeleri listele
router.get('/', async (req, res) => {
  try {
    const areas = await prisma.area.findMany({
      include: {
        tables: true
      }
    });
    res.json(areas);
  } catch (error) {
    console.error('Areas fetch error:', error);
    res.status(500).json({ error: 'Bölgeler getirilirken bir hata oluştu' });
  }
});

// GET /api/areas/:id - Belirli bir bölgeyi getir
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const area = await prisma.area.findUnique({
      where: { id },
      include: {
        tables: true
      }
    });
    if (area) {
      res.json(area);
    } else {
      res.status(404).json({ error: 'Bölge bulunamadı' });
    }
  } catch (error) {
    console.error('Area fetch error:', error);
    res.status(500).json({ error: 'Bölge getirilirken bir hata oluştu' });
  }
});

// POST /api/areas - Yeni bölge oluştur
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    const area = await prisma.area.create({
      data: { name }
    });
    res.json(area);
  } catch (error) {
    res.status(500).json({ error: 'Bölge eklenirken bir hata oluştu' });
  }
});

// PUT /api/areas/:id - Bölge güncelle
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const area = await prisma.area.update({
      where: { id },
      data: { name }
    });
    res.json(area);
  } catch (error) {
    res.status(500).json({ error: 'Bölge güncellenirken bir hata oluştu' });
  }
});

// DELETE /api/areas/:id - Bölge sil
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.area.delete({
      where: { id }
    });
    res.json({ message: 'Bölge başarıyla silindi' });
  } catch (error) {
    res.status(500).json({ error: 'Bölge silinirken bir hata oluştu' });
  }
});

export default router; 