import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { CLICKPESA_WEBHOOK_SECRET } from '@/lib/env'

export async function POST(req: Request) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-clickpesa-signature') // adjust header name

  // Verify signature
  const expected = crypto
    .createHmac('sha256', CLICKPESA_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex')

  if (signature !== expected) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const payload = JSON.parse(rawBody)
  const { transaction_id, status } = payload

  // Update payment status
  const payment = await prisma.payment.update({
    where: { transactionId: transaction_id },
    data: { status: status === 'success' ? 'success' : 'failed' },
  })

  // If success, create pending activation
  if (status === 'success') {
    await prisma.activation.create({
      data: {
        customerId: payment.customerId,
        packageId: payment.packageId,
        status: 'pending',
      },
    })
  }

  return NextResponse.json({ received: true })
}