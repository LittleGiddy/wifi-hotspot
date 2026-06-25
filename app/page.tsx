import { prisma } from '@/lib/prisma'
import { Package } from '@prisma/client'
import PackageList from '@/app/components/PackageList'
import { Suspense } from 'react'

export default async function Home() {
  const packages: Package[] = await prisma.package.findMany()
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Inapakia...</div>}>
      <PackageList packages={packages} />
    </Suspense>
  )
}