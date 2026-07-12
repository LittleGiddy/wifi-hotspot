import { Suspense } from 'react'
import PaymentForm from './PaymentForm'

export default function PayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 text-center">
          <p className="text-gray-600">Inapakia...</p>
        </div>
      </div>
    }>
      <PaymentForm />
    </Suspense>
  )
}