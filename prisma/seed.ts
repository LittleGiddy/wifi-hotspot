import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Clear existing packages (optional)
  await prisma.package.deleteMany()

  const packages = [
    {
      name: 'Masaa 12',
      price: 500,
      durationHours: 12,
      speedLimit: '10M/sekunde',   // optional
    },
    {
      name: 'Masaa 24',
      price: 1000,
      durationHours: 24,
      speedLimit: '20M/sekunde',
    },
  ]

  for (const pkg of packages) {
    await prisma.package.create({ data: pkg })
  }

  console.log('✅ Packages seeded: Masaa 12 & Masaa 24')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())