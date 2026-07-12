import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import axios from 'axios'
import {
  CLICKPESA_API_KEY,
  CLICKPESA_CLIENT_ID,
  CLICKPESA_BASE_URL,
} from '@/lib/env'

export async function POST(req: Request) {
  try {
    const { packageId, phoneNumber, macAddress } = await req.json()

    // Validate inputs
    if (!packageId || !phoneNumber || !macAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

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

    // 3. Format phone to 255XXXXXXXXX
    const digits = phoneNumber.replace(/\D/g, '')
    const finalPhone = digits.startsWith('255')
      ? digits
      : digits.startsWith('0')
      ? '255' + digits.slice(1)
      : '255' + digits

    // 4. Create pending payment
    const transactionId = `txn${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`
    await prisma.payment.create({
      data: {
        transactionId,
        amount: pkg.price,
        status: 'pending',
        customerId: customer.id,
        packageId: pkg.id,
      },
    })

    // 5. Get ClickPesa token
    console.log('Getting ClickPesa token...')
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
    console.log('Token response:', JSON.stringify(tokenResponse.data, null, 2))
    
    const token = tokenResponse.data.token
    if (!token) {
      throw new Error('Failed to get ClickPesa token')
    }

    // 6. Send USSD push
    const payload = {
      amount: pkg.price.toString(),
      orderReference: transactionId,
      phoneNumber: finalPhone,
      currency: 'TZS',
    }
    console.log('Sending USSD push payload:', JSON.stringify(payload, null, 2))

    const initiateResponse = await axios.post(
      `${CLICKPESA_BASE_URL}/third-parties/payments/initiate-ussd-push-request`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )
    console.log('Initiate response:', JSON.stringify(initiateResponse.data, null, 2))

    return NextResponse.json({
      success: true,
      transactionId,
      status: initiateResponse.data.status || 'PROCESSING',
    })

  } catch (error: any) {
    console.error('=== PAYMENT INITIATE ERROR ===')
    console.error('Message:', error.message)
    console.error('Status:', error.response?.status)
    console.error('Data:', JSON.stringify(error.response?.data, null, 2))
    console.error('URL:', error.config?.url)
    console.error('Body sent:', error.config?.data)
    console.error('==============================')
    return NextResponse.json(
      { error: error.response?.data?.message || error.response?.data?.error || 'Payment initiation failed' },
      { status: 500 }
    )
  }
}