import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Image from 'next/image'
import { Package } from '@prisma/client'

export default async function Home() {
  const packages: Package[] = await prisma.package.findMany()

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-yellow-100">
      {/* Header Banner with Logo */}
      <div className="w-full bg-gradient-to-r from-gray-600 to-gray-700 py-6 px-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Image
              src="/OBEM logo Transparent-01.png"
              alt="WiFi Ya Jero Logo"
              width={370}
              height={370}
            />
          </div>
          {/* Text */}
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              WiFi <span className="text-yellow-300">Ya Jero</span>
            </h1>
            <p className="text-white/90 text-sm sm:text-base md:text-lg mt-1">
              Chagua Kifurushi na uunganishe mtandao papo hapo
            </p>
          </div>
        </div>
      </div>

      {/* Package Cards Section */}
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
          {packages.map((pkg) => {
            const isPopular = pkg.durationHours === 24
            return (
              <div
                key={pkg.id}
                className={`relative bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-3xl border ${
                  isPopular ? 'border-yellow-500 ring-2 ring-yellow-500' : 'border-gray-200'
                }`}
              >
                {isPopular && (
                  <div className="absolute top-0 right-0 bg-yellow-500 text-white text-xs sm:text-sm font-bold px-3 py-1 rounded-bl-2xl">
                    Coming Soon
                  </div>
                )}
                <div className="p-6 sm:p-8 flex flex-col h-full">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{pkg.name}</h2>
                  <div className="mt-2">
                    <span className="text-3xl sm:text-4xl font-extrabold text-yellow-600">
                      Tsh {pkg.price.toLocaleString()}
                    </span>
                    <span className="text-gray-500 text-sm ml-1">/ package</span>
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-gray-600">
                    <p className="flex items-center gap-2">
                      <span className="text-yellow-600">✓</span> Muda: Masaa {pkg.durationHours}
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-yellow-600">✓</span> Kasi: {pkg.speedLimit || 'Kawaida'}
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-yellow-600">✓</span> Msaada 24/7
                    </p>
                  </div>
                  <div className="mt-6 sm:mt-8">
                    {isPopular ? (
                      <span className="block w-full text-center font-semibold py-3 rounded-2xl bg-gray-400 text-white cursor-not-allowed">
                        Hivi Karibuni
                      </span>
                    ) : (
                      <Link
                        href={`/pay?package=${pkg.id}`}
                        className="block w-full text-center font-semibold py-3 rounded-2xl transition-colors bg-gray-800 hover:bg-gray-900 text-white"
                      >
                        Chagua
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-xs sm:text-sm">
          <p>Malipo salama kupitia ClickPesa • Pata kitambulisho chako kwa SMS</p>
          <p className="mt-1">© 2026 WiFi Ya Jero. Haki zote zimehifadhiwa.</p>
        </div>
      </div>
    </main>
  )
}