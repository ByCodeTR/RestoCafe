import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { validateRequest } from "../middlewares/validateRequest";

const router = Router();
const prisma = new PrismaClient();

// Ürün oluşturma şeması
const createProductSchema = z.object({
  name: z.string().min(1, "Ürün adı zorunludur"),
  description: z.string().optional(),
  price: z.number().min(0, "Fiyat 0'dan küçük olamaz"),
  categoryId: z.string().min(1, "Kategori seçimi zorunludur"),
  stock: z.number().int().min(0, "Stok 0'dan küçük olamaz").default(0),
  minStock: z.number().int().min(0, "Minimum stok 0'dan küçük olamaz").default(10),
});

// Ürün güncelleme şeması
const updateProductSchema = z.object({
  name: z.string().min(1, "Ürün adı zorunludur"),
  description: z.string().optional(),
  price: z.number().min(0, "Fiyat 0'dan küçük olamaz"),
  categoryId: z.string().min(1, "Kategori seçimi zorunludur"),
  stock: z.number().int().min(0, "Stok 0'dan küçük olamaz"),
  minStock: z.number().int().min(0, "Minimum stok 0'dan küçük olamaz"),
});

// Stok güncelleme şeması
const updateStockSchema = z.object({
  quantity: z.number().int(),
  type: z.enum(["IN", "OUT", "ADJUSTMENT"]),
  supplierId: z.string().optional(),
});

// Tüm ürünleri getir
router.get("/", async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
      },
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Ürünler getirilirken bir hata oluştu" });
  }
});

// Ürün detayını getir
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        stockLogs: {
          include: {
            supplier: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: "Ürün bulunamadı" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: "Ürün getirilirken bir hata oluştu" });
  }
});

// Yeni ürün oluştur
router.post("/", validateRequest(createProductSchema), async (req, res) => {
  try {
    const { name, description, price, categoryId, stock, minStock } = req.body;

    // Önce kategorinin var olduğunu kontrol et
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return res.status(404).json({ error: "Kategori bulunamadı" });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        categoryId,
        stock,
        minStock,
      },
      include: {
        category: true,
      },
    });

    // İlk stok kaydını oluştur
    if (stock > 0) {
      await prisma.stockLog.create({
        data: {
          productId: product.id,
          quantity: stock,
          type: "IN",
        },
      });
    }

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: "Ürün oluşturulurken bir hata oluştu" });
  }
});

// Ürün güncelle
router.put("/:id", validateRequest(updateProductSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, categoryId, stock, minStock } = req.body;

    // Önce kategorinin var olduğunu kontrol et
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return res.status(404).json({ error: "Kategori bulunamadı" });
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        price,
        categoryId,
        stock,
        minStock,
      },
      include: {
        category: true,
      },
    });

    res.json(product);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Ürün bulunamadı" });
    }
    res.status(500).json({ error: "Ürün güncellenirken bir hata oluştu" });
  }
});

// Stok güncelle
router.post("/:id/stock", validateRequest(updateStockSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, type, supplierId } = req.body;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({ error: "Ürün bulunamadı" });
    }

    // Stok çıkışı için kontrol
    if (type === "OUT" && product.stock < quantity) {
      return res.status(400).json({ error: "Yetersiz stok" });
    }

    // Yeni stok miktarını hesapla
    const newStock = type === "OUT" 
      ? product.stock - quantity 
      : type === "IN" 
        ? product.stock + quantity 
        : quantity;

    // Stok logunu oluştur
    await prisma.stockLog.create({
      data: {
        productId: id,
        quantity,
        type,
        supplierId,
      },
    });

    // Ürün stok miktarını güncelle
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        stock: newStock,
      },
      include: {
        category: true,
      },
    });

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ error: "Stok güncellenirken bir hata oluştu" });
  }
});

// Ürün sil
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Önce ilişkili stok kayıtlarını sil
    await prisma.stockLog.deleteMany({
      where: { productId: id },
    });

    // Sonra ürünü sil
    await prisma.product.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Ürün bulunamadı" });
    }
    res.status(500).json({ error: "Ürün silinirken bir hata oluştu" });
  }
});

export default router; 