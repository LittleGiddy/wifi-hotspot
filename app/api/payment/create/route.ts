import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import axios from 'axios'
import {
  CLICKPESA_API_KEY,
  CLICKPESA_CLIENT_ID,
  CLICKPESA_BASE_URL,
  NEXT_PUBLIC_APP_URL,
} from '@/lib/env'

// Helper: format phone number for ClickPesa (remove leading zero, add country code if missing)
function formatPhone(phone: string): string {
  // Remove any non-digit characters
  let cleaned = phone.replace(/\D/g, '')
  // If starts with 0, remove it (e.g., 0769999902 -> 769999902)
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1)
  }
  // If doesn't start with 255, add it (Tanzania country code)
  if (!cleaned.startsWith('255')) {
    cleaned = '255' + cleaned
  }
  return cleaned
}

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

    const token = tokenResponse.data.token // Already includes "Bearer " prefix
    if (!token) {
      throw new Error('Failed to generate ClickPesa token')
    }

    // 5. Generate checkout link
    const formattedPhone = formatPhone(phone)

    const checkoutResponse = await axios.post(
      `${CLICKPESA_BASE_URL}/third-parties/checkout-link/generate-checkout-url`,
      {
        totalPrice: pkg.price.toString(),
        orderReference: transactionId,
        customerName: 'WiFi Customer',
        customerEmail: `customer_${customer.id}@example.com`,
        customerPhone: formattedPhone,
        description: `WiFi Package: ${pkg.name} - ${pkg.durationHours} hours`,
        callbackUrl: `${NEXT_PUBLIC_APP_URL}/api/payment/webhook`,
        // returnUrl: `${NEXT_PUBLIC_APP_URL}/payment-success`, // optional
      },
      {
        headers: {
          Authorization: token, // ✅ Use token directly (no extra "Bearer ")
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