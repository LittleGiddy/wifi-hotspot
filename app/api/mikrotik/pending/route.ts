import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MIKROTIK_API_KEY } from '@/lib/env'

export async function GET(req: Request) {
  const apiKey = req.headers.get('x-api-key')
  if (apiKey !== MIKROTIK_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const pending = await prisma.activation.findMany({
    where: { status: 'pending' },
    include: {
      customer: true,
      package: true,
    },
  })

  const formatted = pending.map((a) => ({
    id: a.id,
    macAddress: a.customer.macAddress,
    phone: a.customer.phone,
    durationHours: a.package.durationHours,
    speedLimit: a.package.speedLimit,
  }))

  return NextResponse.json(formatted)
}