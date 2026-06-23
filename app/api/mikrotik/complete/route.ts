import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MIKROTIK_API_KEY } from '@/lib/env'

export async function POST(req: Request) {
  const apiKey = req.headers.get('x-api-key')
  if (apiKey !== MIKROTIK_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { activationId } = await req.json()

  const activation = await prisma.activation.findUnique({
    where: { id: activationId },
    include: { package: true },
  })

  if (!activation) {
    return NextResponse.json({ error: 'Activation not found' }, { status: 404 })
  }

  const now = new Date()
  const expiresAt = new Date(now.getTime() + activation.package.durationHours * 60 * 60 * 1000)

  await prisma.activation.update({
    where: { id: activationId },
    data: {
      status: 'active',
      activatedAt: now,
      expiresAt,
    },
  })

  return NextResponse.json({ success: true })
}