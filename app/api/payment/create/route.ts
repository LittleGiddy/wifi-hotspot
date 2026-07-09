import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import axios from 'axios'
import {
  CLICKPESA_API_KEY,
  CLICKPESA_CLIENT_ID,
  CLICKPESA_BASE_URL,
  NEXT_PUBLIC_APP_URL,
} from '@/lib/env'

function formatPhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1)
  }
  if (!cleaned.startsWith('255')) {
    cleaned = '255' + cleaned
  }
  return cleaned
}

export async function POST(req: Request) {
  const { packageId, phone, macAddress } = await req.json()

  try {
    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
    })
    if (!pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    let customer = await prisma.customer.findUnique({
      where: { macAddress },
    })
    if (!customer) {
      customer = await prisma.customer.create({
        data: { phone, macAddress },
      })
    }

    // ✅ Generate alphanumeric reference only
    const transactionId = `txn${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`

    const payment = await prisma.payment.create({
      data: {
        transactionId,
        amount: pkg.price,
        status: 'pending',
        customerId: customer.id,
        packageId: pkg.id,
      },
    })

    // Generate ClickPesa token
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

    const formattedPhone = formatPhone(phone)

    const checkoutResponse = await axios.post(
      `${CLICKPESA_BASE_URL}/third-parties/checkout-link/generate-checkout-url`,
      {
        totalPrice: pkg.price.toString(),
        orderReference: transactionId,
        orderCurrency: 'TZS',
        customerName: 'WiFi Customer',
        customerEmail: `customer_${customer.id}@example.com`,
        customerPhone: formattedPhone,
        description: `WiFi Package: ${pkg.name} - ${pkg.durationHours} hours`,
        callbackUrl: `${NEXT_PUBLIC_APP_URL}/api/payment/webhook`,
      },
      {
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
      }
    )

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