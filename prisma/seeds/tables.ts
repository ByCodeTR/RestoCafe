import { PrismaClient, TableStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Önce mevcut verileri temizle
  await prisma.table.deleteMany()
  await prisma.area.deleteMany()

  // Örnek bölgeler
  const areas = [
    {
      name: 'İç Mekan',
      tables: [
        { name: 'Pencere Kenarı 1', capacity: 4, status: TableStatus.AVAILABLE },
        { name: 'Pencere Kenarı 2', capacity: 4, status: TableStatus.OCCUPIED },
        { name: 'Orta 1', capacity: 6, status: TableStatus.AVAILABLE },
        { name: 'Bar Yanı 1', capacity: 2, status: TableStatus.RESERVED },
        { name: 'VIP 1', capacity: 8, status: TableStatus.AVAILABLE },
      ]
    },
    {
      name: 'Bahçe',
      tables: [
        { name: 'Bahçe 1', capacity: 4, status: TableStatus.AVAILABLE },
        { name: 'Bahçe 2', capacity: 4, status: TableStatus.MAINTENANCE },
        { name: 'Havuz Kenarı 1', capacity: 6, status: TableStatus.AVAILABLE },
        { name: 'Havuz Kenarı 2', capacity: 2, status: TableStatus.OCCUPIED },
        { name: 'Bahçe VIP', capacity: 8, status: TableStatus.AVAILABLE },
      ]
    },
    {
      name: 'Teras',
      tables: [
        { name: 'Teras 1', capacity: 4, status: TableStatus.AVAILABLE },
        { name: 'Teras 2', capacity: 4, status: TableStatus.AVAILABLE },
        { name: 'Manzara 1', capacity: 6, status: TableStatus.OCCUPIED },
        { name: 'Manzara 2', capacity: 2, status: TableStatus.AVAILABLE },
        { name: 'Teras VIP', capacity: 8, status: TableStatus.RESERVED },
      ]
    }
  ]

  for (const area of areas) {
    const createdArea = await prisma.area.create({
      data: {
        name: area.name,
        tables: {
          create: area.tables
        }
      }
    })
    console.log(`Bölge oluşturuldu: ${createdArea.name}`)
  }

  console.log('Örnek masa verileri oluşturuldu')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 