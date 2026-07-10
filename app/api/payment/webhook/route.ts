import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const payload = await req.json()
    console.log('Webhook received:', payload)

    // Extract fields – adjust based on ClickPesa's actual payload
    const { orderReference, status, transactionId } = payload

    // Use orderReference as transactionId
    const txnId = orderReference || transactionId
    if (!txnId) {
      console.error('No orderReference/transactionId in webhook')
      return NextResponse.json({ error: 'Missing reference' }, { status: 400 })
    }

    // Find payment
    const payment = await prisma.payment.findUnique({
      where: { transactionId: txnId },
      include: { customer: true, package: true },
    })

    if (!payment) {
      console.error('Payment not found:', txnId)
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Update payment status
    const isSuccess = status === 'success' || status === 'completed'
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
        await prisma.activation.create({
          data: {
            customerId: payment.customerId,
            packageId: payment.packageId,
            status: 'pending',
          },
        })
        console.log(`✅ Activation created for MAC: ${payment.customer.macAddress}`)
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