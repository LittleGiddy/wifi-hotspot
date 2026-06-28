import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import axios from 'axios'
import {
  CLICKPESA_API_KEY,
  CLICKPESA_CLIENT_ID,
  CLICKPESA_BASE_URL,
  NEXT_PUBLIC_APP_URL,
} from '@/lib/env'

export async function POST(req: Request) {
  const { packageId, phone, macAddress } = await req.json()

  try {
    // 1. Get package
    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
    })
    if (!pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    // 2. Find or create customer
    let customer = await prisma.customer.findUnique({
      where: { macAddress },
    })
    if (!customer) {
      customer = await prisma.customer.create({
        data: { phone, macAddress },
      })
    }

    // 3. Create pending payment
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const payment = await prisma.payment.create({
      data: {
        transactionId,
        amount: pkg.price,
        status: 'pending',
        customerId: customer.id,
        packageId: pkg.id,
      },
    })

    // 4. Generate ClickPesa token
    const tokenResponse = await axios.post(
      `${CLICKPESA_BASE_URL}/third-parties/generate-token`,
      {},
      {
        headers: {
          'api-key': CLICKPESA_API_KEY,
          'client-id': CLICKPESA_CLIENT_ID,
        },
      }
    )

    const token = tokenResponse.data.token
    if (!token) {
      throw new Error('Failed to generate ClickPesa token')
    }

    // 5. Generate checkout link
    const checkoutResponse = await axios.post(
      `${CLICKPESA_BASE_URL}/third-parties/checkout-link/generate-checkout-url`,
      {
        totalPrice: pkg.price.toString(),
        orderReference: transactionId,
        customerName: 'WiFi Customer',
        customerEmail: `customer_${customer.id}@example.com`,
        customerPhone: phone,
        description: `WiFi Package: ${pkg.name} - ${pkg.durationHours} hours`,
        callbackUrl: `${NEXT_PUBLIC_APP_URL}/api/payment/webhook`,
        // returnUrl: `${NEXT_PUBLIC_APP_URL}/payment-success`, // optional
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    // Extract the checkout link from the response
    const checkoutLink = checkoutResponse.data.checkoutLink ||
      checkoutResponse.data.url ||
      checkoutResponse.data.paymentUrl

    if (!checkoutLink) {
      throw new Error('No checkout link in response')
    }

    return NextResponse.json({ paymentUrl: checkoutLink })
  } catch (error: any) {
    console.error('=== PAYMENT ERROR ===')
    console.error('Message:', error.message)
    console.error('Status:', error.response?.status)
    console.error('Data:', JSON.stringify(error.response?.data, null, 2))
    console.error('URL:', error.config?.url)
    console.error('Headers sent:', JSON.stringify(error.config?.headers, null, 2))
    console.error('Body sent:', error.config?.data)
    console.error('===================')
    console.error('Payment error:', error.response?.data || error.message)
    return NextResponse.json(
      { error: 'Payment initiation failed' },
      { status: 500 }
    )
  }
}