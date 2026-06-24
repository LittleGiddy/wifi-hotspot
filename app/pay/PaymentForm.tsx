'use client'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'

export default function PaymentForm() {
  const searchParams = useSearchParams()
  const packageId = searchParams.get('package')
  const macFromUrl = searchParams.get('mac') || ''

  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  const handlePay = async () => {
    if (!packageId) {
      alert('Pakiti haijachaguliwa.')
      return
    }
    if (!phone) {
      alert('Tafadhali ingiza namba yako ya simu.')
      return
    }
    if (!macFromUrl) {
      alert('Hatuwezi kugundua kifaa chako. Hakikisha umeunganishwa kwenye Wi-Fi na ujaribu tena.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId,
          phone,
          macAddress: macFromUrl,
        }),
      })
      const data = await res.json()
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl
      } else {
        alert('Imeshindwa kuanzisha malipo. Jaribu tena.')
      }
    } catch (error) {
      alert('Hitilafu. Hakikisha umeunganishwa kwenye intaneti.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-gray-800 text-center">
          Kamilisha Malipo Yako
        </h1>
        <p className="text-sm text-gray-500 text-center mt-1">
          Ingiza namba yako ya simu ili kuunganishwa
        </p>

        {!macFromUrl && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 text-sm">
            ⚠️ Hatuwezi kugundua kifaa chako. <br />
            Hakikisha umeunganishwa kwenye Wi-Fi ya hotspot na ujaribu kupakia ukurasa huu tena.
          </div>
        )}

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Namba ya Simu
            </label>
            <input
              type="tel"
              placeholder="e.g. 0712345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Tutatuma uthibitisho wa malipo kwenye namba hii.
            </p>
          </div>

          <input type="hidden" value={macFromUrl} />

          <button
            onClick={handlePay}
            disabled={loading || !phone || !macFromUrl}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Inasubiri...' : 'Lipia Sasa'}
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">
          Malipo yatashughulikiwa kwa njia salama kupitia ClickPesa.
        </p>
      </div>
    </div>
  )
}