'use client'
import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function PayPage() {
  const searchParams = useSearchParams()
  const packageId = searchParams.get('package')
  const macFromUrl = searchParams.get('mac') || ''

  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'phone' | 'network' | 'processing' | 'done'>('phone')
  const [networks, setNetworks] = useState<Array<{ name: string }>>([])
  const [selectedNetwork, setSelectedNetwork] = useState('')
  const [senderName, setSenderName] = useState('')
  const [transactionId, setTransactionId] = useState('')

  // Step 1: Validate phone and get available networks
  const validatePhone = async () => {
    if (!phone) {
      alert('Tafadhali ingiza namba yako ya simu.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/payment/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone }),
      })
      const data = await res.json()

      if (data.error) {
        alert(data.error)
        return
      }

      if (data.activeMethods && data.activeMethods.length > 0) {
        setNetworks(data.activeMethods)
        setSenderName(data.sender?.accountName || '')
        setStep('network')
      } else {
        alert('Hakuna mtandao unaosaidia kwa namba hii. Tafadhali jaribu namba nyingine.')
      }
    } catch (error) {
      alert('Hitilafu. Jaribu tena.')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Initiate payment
  const initiatePayment = async () => {
    if (!selectedNetwork) {
      alert('Tafadhali chagua mtandao wako.')
      return
    }

    setLoading(true)
    setStep('processing')
    try {
      const res = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId,
          phoneNumber: phone,
          macAddress: macFromUrl,
          network: selectedNetwork,
        }),
      })
      const data = await res.json()

      if (data.success) {
        setTransactionId(data.transactionId)
        setStep('done')
      } else {
        alert('Imeshindwa kuanzisha malipo. Jaribu tena.')
        setStep('network')
      }
    } catch (error) {
      alert('Hitilafu. Jaribu tena.')
      setStep('network')
    } finally {
      setLoading(false)
    }
  }

  // Step 3: Return to phone input
  const backToPhone = () => {
    setStep('phone')
    setNetworks([])
    setSelectedNetwork('')
    setSenderName('')
  }

  // Render the appropriate step
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8">

        {/* ===== STEP 1: PHONE INPUT ===== */}
        {step === 'phone' && (
          <>
            <h1 className="text-2xl font-bold text-gray-800 text-center">
              Kamilisha Malipo Yako
            </h1>
            <p className="text-sm text-gray-500 text-center mt-1">
              Ingiza namba yako ya simu ili kuunganishwa
            </p>

            {!macFromUrl && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 text-sm">
                ⚠️ Hatuwezi kugundua kifaa chako. <br />
                Hakikisha umeunganishwa kwenye Wi-Fi ya hotspot.
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
                  disabled={loading}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Tutatuma uthibitisho wa malipo kwenye namba hii.
                </p>
              </div>

              <button
                onClick={validatePhone}
                disabled={loading || !phone}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Inasubiri...' : 'Endelea'}
              </button>
            </div>
          </>
        )}

        {/* ===== STEP 2: SELECT NETWORK ===== */}
        {step === 'network' && (
          <>
            <h1 className="text-2xl font-bold text-gray-800 text-center">
              Chagua Mtandao Wako
            </h1>
            <p className="text-sm text-gray-500 text-center mt-1">
              {senderName ? `Jina: ${senderName}` : 'Thibitisha mtandao wako'}
            </p>

            <div className="mt-6 space-y-3">
              {networks.map((network) => (
                <button
                  key={network.name}
                  onClick={() => setSelectedNetwork(network.name)}
                  className={`w-full text-left px-4 py-3 border rounded-xl transition-colors ${
                    selectedNetwork === network.name
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {network.name}
                </button>
              ))}

              <button
                onClick={initiatePayment}
                disabled={!selectedNetwork || loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                {loading ? 'Inasubiri...' : 'Lipia Sasa'}
              </button>

              <button
                onClick={backToPhone}
                className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
              >
                ← Rudi
              </button>
            </div>
          </>
        )}

        {/* ===== STEP 3: PROCESSING ===== */}
        {step === 'processing' && (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">⏳</div>
            <h2 className="text-xl font-bold text-gray-800">Inasubiri...</h2>
            <p className="text-gray-600 mt-2">
              Tafadhali angalia simu yako. <br />
              Utapokea uthibitisho wa malipo kwa USSD.
            </p>
            <p className="text-sm text-gray-400 mt-4">
              Ingiza PIN yako ili kukamilisha malipo.
            </p>
          </div>
        )}

        {/* ===== STEP 4: DONE ===== */}
        {step === 'done' && (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-gray-800">Malipo Yamekamilika!</h2>
            <p className="text-gray-600 mt-2">
              Mtandao wako utaamilishwa ndani ya sekunde chache.
            </p>
            <p className="text-sm text-gray-400 mt-4">
              Muda wa kifurushi chako utaanza kuhesabiwa sasa.
            </p>
            <button
              onClick={() => window.location.href = 'http://example.com'}
              className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Anza Kutumia Mtandao
            </button>
          </div>
        )}

        <p className="text-xs text-gray-400 text-center mt-4">
          Malipo yanashughulikiwa kwa njia salama kupitia ClickPesa.
        </p>
      </div>
    </div>
  )
}