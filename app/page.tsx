import { prisma } from '@/lib/prisma'
import { Package } from '@prisma/client'
import PackageList from '@/app/components/PackageList'

export default async function Home() {
  const packages: Package[] = await prisma.package.findMany()
  return <PackageList packages={packages} />
}