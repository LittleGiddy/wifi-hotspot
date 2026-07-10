export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-gray-800">Malipo Yamekamilika!</h1>
        <p className="text-gray-600 mt-2">
          Mtandao wako utaamilishwa ndani ya sekunde chache.
        </p>
        <p className="text-sm text-gray-400 mt-4">
          Utapokea uthibitisho kwa SMS.
        </p>
      </div>
    </div>
  )
}