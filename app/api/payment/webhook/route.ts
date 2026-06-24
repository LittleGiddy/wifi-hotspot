import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import axios from 'axios'
import { CLICKPESA_API_KEY, CLICKPESA_BASE_URL } from '@/lib/env'

export async function POST(req: Request) {
  try {
    // 1. Get the raw request body
    const rawBody = await req.text()
    const payload = JSON.parse(rawBody)

    // 2. Extract transaction details (adjust keys to match ClickPesa's actual payload)
    const { transaction_id, status, amount, customer_phone } = payload

    // 3. (Optional but recommended) Verify the transaction with ClickPesa
    //    This ensures the webhook is genuine, even without a signature.
    const verification = await axios.get(
      `${CLICKPESA_BASE_URL}/payment/status/${transaction_id}`,
      {
        headers: {
          Authorization: `Bearer ${CLICKPESA_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    // If the transaction is not confirmed as "success", reject the webhook
    if (verification.data.status !== 'success') {
      console.warn(`Transaction ${transaction_id} not confirmed by ClickPesa`)
      return NextResponse.json(
        { error: 'Transaction not confirmed' },
        { status: 400 }
      )
    }

    // 4. Update the payment record in your database
    const payment = await prisma.payment.update({
      where: { transactionId: transaction_id },
      data: { status: status === 'success' ? 'success' : 'failed' },
    })

    // 5. If payment was successful, create a pending activation
    if (status === 'success') {
      // Check if activation already exists (idempotency)
      const existingActivation = await prisma.activation.findFirst({
        where: {
          customerId: payment.customerId,
          packageId: payment.packageId,
          status: 'pending',
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
      }
    }

    // 6. Return a successful response to ClickPesa
    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error.message)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}