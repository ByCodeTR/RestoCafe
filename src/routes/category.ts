import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { validateRequest } from "../middlewares/validateRequest";

const router = Router();
const prisma = new PrismaClient();

// Kategori oluşturma şeması
const createCategorySchema = z.object({
  name: z.string().min(1, "Kategori adı zorunludur"),
});

// Kategori güncelleme şeması
const updateCategorySchema = z.object({
  name: z.string().min(1, "Kategori adı zorunludur"),
});

// Tüm kategorileri getir
router.get("/", async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        products: true,
      },
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: "Kategoriler getirilirken bir hata oluştu" });
  }
});

// Kategori detayını getir
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        products: true,
      },
    });

    if (!category) {
      return res.status(404).json({ error: "Kategori bulunamadı" });
    }

    res.json(category);
  } catch (error) {
    res.status(500).json({ error: "Kategori getirilirken bir hata oluştu" });
  }
});

// Yeni kategori oluştur
router.post("/", validateRequest(createCategorySchema), async (req, res) => {
  try {
    const { name } = req.body;
    const category = await prisma.category.create({
      data: { name },
    });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: "Kategori oluşturulurken bir hata oluştu" });
  }
});

// Kategori güncelle
router.put("/:id", validateRequest(updateCategorySchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const category = await prisma.category.update({
      where: { id },
      data: { name },
    });

    res.json(category);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Kategori bulunamadı" });
    }
    res.status(500).json({ error: "Kategori güncellenirken bir hata oluştu" });
  }
});

// Kategori sil
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.category.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Kategori bulunamadı" });
    }
    res.status(500).json({ error: "Kategori silinirken bir hata oluştu" });
  }
});

export default router; 