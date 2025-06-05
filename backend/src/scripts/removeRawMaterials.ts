import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    // Hammaddeler kategorisini bul
    const rawMaterialsCategory = await prisma.category.findFirst({
      where: {
        name: "Hammaddeler"
      }
    });

    if (!rawMaterialsCategory) {
      console.log("Hammaddeler kategorisi bulunamadı.");
      return;
    }

    // Önce bu kategoriye ait tüm ürünleri sil
    await prisma.product.deleteMany({
      where: {
        categoryId: rawMaterialsCategory.id
      }
    });

    console.log("Hammadde ürünleri silindi.");

    // Sonra kategoriyi sil
    await prisma.category.delete({
      where: {
        id: rawMaterialsCategory.id
      }
    });

    console.log("Hammaddeler kategorisi silindi.");
  } catch (error) {
    console.error("Hata:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 