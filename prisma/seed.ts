import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  await prisma.package.createMany({
    data: [
      { name: '1 Hour', price: 1.00, durationHours: 1, speedLimit: '1M/512K' },
      { name: '1 Day', price: 3.00, durationHours: 24, speedLimit: '2M/1M' },
      { name: '1 Week', price: 15.00, durationHours: 168, speedLimit: '4M/2M' },
    ],
  })
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())