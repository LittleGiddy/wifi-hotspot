import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function Home() {
  const packages = await prisma.package.findMany()

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">Choose a Package</h1>
      <div className="grid gap-4 mt-4">
        {packages.map((pkg) => (
          <div key={pkg.id} className="border p-4 rounded shadow">
            <h2 className="text-xl font-semibold">{pkg.name}</h2>
            <p>Price: ${pkg.price} for {pkg.durationHours} hours</p>
            <p>Speed: {pkg.speedLimit || 'Unlimited'}</p>
            <Link href={`/pay?package=${pkg.id}`} className="text-blue-600 underline">
              Select
            </Link>
          </div>
        ))}
      </div>
    </main>
  )
}