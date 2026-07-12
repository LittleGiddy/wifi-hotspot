'use client'
import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function PaymentForm() {
  const searchParams = useSearchParams()
  const packageId = searchParams.get('package')
  const macFromUrl = searchParams.get('mac') || ''

  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle')
  const [transactionId, setTransactionId] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Polling logic
  useEffect(() => {
    if (status !== 'processing') return

    let attempts = 0
    const maxAttempts = 30 // 30 * 2s = 60 seconds timeout

    const interval = setInterval(async () => {
      attempts++
      try {
        const res = await fetch(`/api/payment/status?transactionId=${transactionId}`)
        const data = await res.json()

        if (data.status === 'success') {
          clearInterval(interval)
          setStatus('done')
        } else if (data.status === 'failed') {
          clearInterval(interval)
          setStatus('error')
          setErrorMessage('Malipo yamekataliwa. Jaribu tena.')
        } else if (attempts >= maxAttempts) {
          clearInterval(interval)
          setStatus('error')
          setErrorMessage('Muda umeisha. Tafadhali hakikisha umeingiza PIN yako.')
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }, 2000) // Poll every 2 seconds

    return () => clearInterval(interval)
  }, [status, transactionId])

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
      alert('Hatuwezi kugundua kifaa chako. Hakikisha umeunganishwa kwenye Wi-Fi.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId,
          phoneNumber: phone,
          macAddress: macFromUrl,
        }),
      })
      const data = await res.json()

      if (data.success) {
        setTransactionId(data.transactionId)
        setStatus('processing')
      } else {
        setStatus('error')
        setErrorMessage(data.error || 'Imeshindwa kuanzisha malipo.')
      }
    } catch (error) {
      setStatus('error')
      setErrorMessage('Hitilafu. Hakikisha umeunganishwa kwenye intaneti.')
    } finally {
      setLoading(false)
    }
  }

  // ===== RENDER STATES =====

  // Done (success)
  if (status === 'done') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-800">Malipo Yamekamilika!</h1>
          <p className="text-gray-600 mt-2">Mtandao wako utaamilishwa ndani ya sekunde chache.</p>
          <a href="http://example.com" className="mt-6 inline-block bg-blue-600 text-white px-6 py-3 rounded-xl">
            Anza Kutumia Mtandao
          </a>
        </div>
      </div>
    )
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 text-center">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-red-600">Hitilafu</h2>
          <p className="text-gray-600 mt-2">{errorMessage}</p>
          <button
            onClick={() => setStatus('idle')}
            className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl"
          >
            Jaribu Tena
          </button>
        </div>
      </div>
    )
  }

  // Processing state
  if (status === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="text-xl font-bold text-gray-800">Inasubiri...</h2>
          <p className="text-gray-600 mt-2">
            Tafadhali angalia simu yako. <br />
            Ingiza PIN yako ili kukamilisha malipo.
          </p>
          <p className="text-sm text-gray-400 mt-4">Usifunge ukurasa huu.</p>
        </div>
      </div>
    )
  }

  // Idle state – show phone input
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-gray-800 text-center">Kamilisha Malipo Yako</h1>
        <p className="text-sm text-gray-500 text-center mt-1">Ingiza namba yako ya simu</p>

        {!macFromUrl && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 text-sm">
            ⚠️ Hatuwezi kugundua kifaa chako. Hakikisha umeunganishwa kwenye Wi-Fi.
          </div>
        )}

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Namba ya Simu</label>
            <input
              type="tel"
              placeholder="e.g. 0712345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
              disabled={loading}
            />
          </div>

          <button
            onClick={handlePay}
            disabled={loading || !phone || !macFromUrl}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Inasubiri...' : 'Lipia Sasa'}
          </button>
        </div>
      </div>
    </div>
  )
}