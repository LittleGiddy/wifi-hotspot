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
  try {
    const { packageId, phoneNumber, macAddress } = await req.json()

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
        data: { phone: phoneNumber, macAddress },
      })
    }

    // 3. Create pending payment
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

    // 5. Format phone
    const formattedPhone = phoneNumber.replace(/^0/, '').replace(/^\+?255/, '')
    const finalPhone = formattedPhone.startsWith('255') ? formattedPhone : `255${formattedPhone}`

    // 6. Initiate USSD Push
    const initiateResponse = await axios.post(
      `${CLICKPESA_BASE_URL}/third-parties/payments/initiate-ussd-push-request`,
      {
        amount: pkg.price.toString(),
        orderReference: transactionId,
        phoneNumber: finalPhone,
      },
      {
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
      }
    )

    return NextResponse.json({
      success: true,
      transactionId: transactionId,
      status: initiateResponse.data.status || 'PROCESSING',
    })

  } catch (error: any) {
    console.error('Initiate error:', error.response?.data || error.message)
    return NextResponse.json(
      { error: 'Failed to initiate payment' },
      { status: 500 }
    )
  }
}