import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const transactionId = searchParams.get('transactionId')

  if (!transactionId) {
    return NextResponse.json({ error: 'Missing transactionId' }, { status: 400 })
  }

  try {
    const payment = await prisma.payment.findUnique({
      where: { transactionId },
      select: { status: true },
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    return NextResponse.json({ status: payment.status })
  } catch (error: any) {
    console.error('Status check error:', error.message)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}