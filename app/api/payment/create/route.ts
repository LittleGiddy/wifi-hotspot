import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import axios from 'axios'
import { CLICKPESA_API_KEY, CLICKPESA_BASE_URL } from '@/lib/env'

export async function POST(req: Request) {
  const { packageId, phone, macAddress } = await req.json()

  // Get package
  const pkg = await prisma.package.findUnique({ where: { id: packageId } })
  if (!pkg) {
    return NextResponse.json({ error: 'Package not found' }, { status: 404 })
  }

  // Find or create customer
  let customer = await prisma.customer.findUnique({ where: { macAddress } })
  if (!customer) {
    customer = await prisma.customer.create({
      data: { phone, macAddress },
    })
  }

  // Create pending payment
  const payment = await prisma.payment.create({
    data: {
      transactionId: `txn_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      amount: pkg.price,
      status: 'pending',
      customerId: customer.id,
      packageId: pkg.id,
    },
  })

  // Call ClickPesa
  try {
    const response = await axios.post(
      `${CLICKPESA_BASE_URL}/payment/request`,
      {
        amount: pkg.price,
        phone: phone,
        reference: payment.transactionId,
        // Add other required fields as per ClickPesa docs
      },
      {
        headers: {
          Authorization: `Bearer ${CLICKPESA_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return NextResponse.json({ paymentUrl: response.data.redirect_url })
  } catch (error: any) {
    console.error('ClickPesa error:', error.response?.data || error.message)
    return NextResponse.json({ error: 'Payment initiation failed' }, { status: 500 })
  }
}