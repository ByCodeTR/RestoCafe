import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Önce mevcut verileri temizle
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  // Kategorileri oluştur
  const categories = await Promise.all([
    prisma.category.create({
      data: { name: "Ana Yemekler" },
    }),
    prisma.category.create({
      data: { name: "İçecekler" },
    }),
    prisma.category.create({
      data: { name: "Tatlılar" },
    }),
    prisma.category.create({
      data: { name: "Başlangıçlar" },
    }),
  ]);

  // Her kategoriye ürünler ekle
  await Promise.all([
    // Ana Yemekler
    prisma.product.create({
      data: {
        name: "Karışık Pizza",
        description: "Sucuk, salam, mantar, yeşil biber, mozzarella peyniri",
        price: 150.00,
        categoryId: categories[0].id,
        stock: 50,
        minStock: 10,
      },
    }),
    prisma.product.create({
      data: {
        name: "Izgara Köfte",
        description: "Özel baharatlarla marine edilmiş dana kıyma, yanında pilav ve közlenmiş sebzeler",
        price: 120.00,
        categoryId: categories[0].id,
        stock: 40,
        minStock: 5,
      },
    }),

    // İçecekler
    prisma.product.create({
      data: {
        name: "Taze Sıkılmış Portakal Suyu",
        description: "330ml",
        price: 35.00,
        categoryId: categories[1].id,
        stock: 100,
        minStock: 20,
      },
    }),
    prisma.product.create({
      data: {
        name: "Türk Kahvesi",
        description: "Özel kavrulmuş Türk kahvesi",
        price: 25.00,
        categoryId: categories[1].id,
        stock: 200,
        minStock: 50,
      },
    }),

    // Tatlılar
    prisma.product.create({
      data: {
        name: "Künefe",
        description: "Antep fıstığı ile servis edilir",
        price: 80.00,
        categoryId: categories[2].id,
        stock: 30,
        minStock: 5,
      },
    }),
    prisma.product.create({
      data: {
        name: "Sütlaç",
        description: "Fırında pişirilmiş geleneksel sütlaç",
        price: 45.00,
        categoryId: categories[2].id,
        stock: 40,
        minStock: 10,
      },
    }),

    // Başlangıçlar
    prisma.product.create({
      data: {
        name: "Mercimek Çorbası",
        description: "Geleneksel tarif ile hazırlanmış mercimek çorbası",
        price: 35.00,
        categoryId: categories[3].id,
        stock: 60,
        minStock: 15,
      },
    }),
    prisma.product.create({
      data: {
        name: "Meze Tabağı",
        description: "Humus, babagannuş, patlıcan salatası, havuç tarator",
        price: 65.00,
        categoryId: categories[3].id,
        stock: 25,
        minStock: 5,
      },
    }),
  ]);

  console.log("✅ Örnek veriler başarıyla oluşturuldu");
}

main()
  .catch((e) => {
    console.error("❌ Hata:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 