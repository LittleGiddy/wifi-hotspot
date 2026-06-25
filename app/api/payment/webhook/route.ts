import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const payload = await req.json()
    
    // Extract payment data (adjust field names to match ClickPesa's webhook payload)
    const {
      orderReference,  // Your transaction ID
      status,          // 'success', 'failed', 'pending'
      amount,
      customerPhone,
    } = payload

    if (!orderReference || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Find the payment
    const payment = await prisma.payment.findUnique({
      where: { transactionId: orderReference },
      include: { customer: true, package: true },
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: status === 'success' ? 'success' : 'failed' },
    })

    // If payment successful, create pending activation
    if (status === 'success') {
      // Check if activation already exists (idempotency)
      const existingActivation = await prisma.activation.findFirst({
        where: {
          customerId: payment.customerId,
          packageId: payment.packageId,
          status: { in: ['pending', 'active'] },
        },
      })

      if (!existingActivation) {
        await prisma.activation.create({
          data: {
            customerId: payment.customerId,
            packageId: payment.packageId,
            status: 'pending',
          },
        })
        console.log(`✅ Activation created for MAC: ${payment.customer.macAddress}`)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error.message)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}