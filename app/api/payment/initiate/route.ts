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
    const body = await req.json()
    console.log('📥 Initiate request body:', body)

    const { packageId, phoneNumber, macAddress } = body

    // Validate input
    if (!packageId || !phoneNumber || !macAddress) {
      console.error('❌ Missing required fields:', { packageId, phoneNumber, macAddress })
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
      console.error('❌ Package not found:', packageId)
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }
    console.log('✅ Package found:', pkg.name)

    // 2. Find or create customer
    let customer = await prisma.customer.findUnique({
      where: { macAddress },
    })
    if (!customer) {
      customer = await prisma.customer.create({
        data: { phone: phoneNumber, macAddress },
      })
      console.log('✅ Customer created:', customer.id)
    } else {
      console.log('✅ Customer found:', customer.id)
    }

    // 3. Format phone
    const formattedPhone = phoneNumber.replace(/^0/, '').replace(/^\+?255/, '')
    const finalPhone = formattedPhone.startsWith('255') ? formattedPhone : `255${formattedPhone}`
    console.log('📞 Formatted phone:', finalPhone)

    // 4. Create pending payment
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
    console.log('💰 Payment created:', payment.id)

    // 5. Get ClickPesa token
    console.log('🔑 Generating ClickPesa token...')
    const tokenResponse = await axios.post(
      `${CLICKPESA_BASE_URL}/third-parties/generate-token`,
      {},
      {
        headers: {
          'api-key': CLICKPESA_API_KEY,
          'client-id': CLICKPESA_CLIENT_ID,
        },
        timeout: 10000,
      }
    )
    const token = tokenResponse.data.token
    if (!token) {
      console.error('❌ Failed to get token')
      return NextResponse.json({ error: 'Failed to authenticate with ClickPesa' }, { status: 500 })
    }
    console.log('✅ Token generated')

    // 6. Send USSD push
    console.log('📤 Sending USSD push to:', finalPhone, 'Amount:', pkg.price)
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
        timeout: 30000,
      }
    )
    console.log('✅ USSD push response:', initiateResponse.data)

    return NextResponse.json({
      success: true,
      transactionId,
      status: initiateResponse.data.status || 'PROCESSING',
    })

  } catch (error: any) {
    console.error('❌ Initiate error:')
    console.error('  Message:', error.message)
    console.error('  Status:', error.response?.status)
    console.error('  Data:', JSON.stringify(error.response?.data, null, 2))
    console.error('  URL:', error.config?.url)

    return NextResponse.json(
      {
        error: error.response?.data?.message || error.message || 'Payment initiation failed',
        details: error.response?.data || null,
      },
      { status: error.response?.status || 500 }
    )
  }
}