import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const payload = await req.json()
    console.log('Webhook received:', payload)

    // Extract fields from ClickPesa payload
    const { orderReference, status, paymentReference, collectedAmount, collectedCurrency } = payload

    if (!orderReference) {
      console.error('Missing orderReference in webhook')
      return NextResponse.json({ error: 'Missing orderReference' }, { status: 400 })
    }

    // Find the payment in our database
    const payment = await prisma.payment.findUnique({
      where: { transactionId: orderReference },
      include: { customer: true, package: true },
    })

    if (!payment) {
      console.error('Payment not found for orderReference:', orderReference)
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Check if status is SUCCESS (uppercase)
    const isSuccess = status === 'SUCCESS'

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: isSuccess ? 'success' : 'failed' },
    })

    // If success, create pending activation (if not already exists)
    if (isSuccess) {
      const existing = await prisma.activation.findFirst({
        where: {
          customerId: payment.customerId,
          packageId: payment.packageId,
          status: { in: ['pending', 'active'] },
        },
      })
      if (!existing) {
        const activation = await prisma.activation.create({
          data: {
            customerId: payment.customerId,
            packageId: payment.packageId,
            status: 'pending',
          },
        })
        console.log(`✅ Activation created with ID: ${activation.id}`)
      } else {
        console.log('Activation already exists, skipping.')
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error.message)
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 })
  }
}