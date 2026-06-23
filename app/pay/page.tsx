'use client'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'

export default function PayPage() {
  const searchParams = useSearchParams()
  const packageId = searchParams.get('package')
  const [phone, setPhone] = useState('')
  const [mac, setMac] = useState('')
  const [loading, setLoading] = useState(false)

  const handlePay = async () => {
    if (!packageId) return alert('No package selected')
    setLoading(true)
    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId, phone, macAddress: mac }),
      })
      const data = await res.json()
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl  // redirect to ClickPesa
      } else {
        alert('Payment initiation failed')
      }
    } catch (error) {
      alert('Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded">
      <h1 className="text-2xl font-bold">Enter Details</h1>
      <div className="mt-4 space-y-3">
        <input
          type="text"
          placeholder="Phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="MAC Address (e.g., AA:BB:CC:DD:EE:FF)"
          value={mac}
          onChange={(e) => setMac(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full bg-green-600 text-white p-2 rounded disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Pay Now'}
        </button>
      </div>
    </div>
  )
}