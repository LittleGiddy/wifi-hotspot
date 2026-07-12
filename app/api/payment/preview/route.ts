import { NextResponse } from 'next/server'
import axios from 'axios'
import {
  CLICKPESA_API_KEY,
  CLICKPESA_CLIENT_ID,
  CLICKPESA_BASE_URL,
} from '@/lib/env'

export async function POST(req: Request) {
  try {
    const { phoneNumber } = await req.json()

    // Format phone number: remove leading zero, add country code
    const formattedPhone = phoneNumber.replace(/^0/, '').replace(/^\+?255/, '')
    const finalPhone = formattedPhone.startsWith('255') ? formattedPhone : `255${formattedPhone}`

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

    // Call ClickPesa Preview API
    const previewResponse = await axios.post(
      `${CLICKPESA_BASE_URL}/third-parties/payments/preview-ussd-push-request`,
      {
        amount: "0", // Amount will be set later based on package
        orderReference: `preview_${Date.now()}`,
        phoneNumber: finalPhone,
        fetchSenderDetails: true,
      },
      {
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
      }
    )

    return NextResponse.json({
      activeMethods: previewResponse.data.activeMethods || [],
      sender: previewResponse.data.sender || null,
    })

  } catch (error: any) {
    console.error('Preview error:', error.response?.data || error.message)
    return NextResponse.json(
      { error: 'Failed to validate phone number' },
      { status: 500 }
    )
  }
}