import Image from 'next/image'
import Link from 'next/link'

export const metadata = {
  title: 'Portal Sportivi — CS Dinamo București Rugby',
}

export default function SportivPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
        <Image
          src="/images/dinamo-rugby-bulldog.png"
          alt="Dinamo Rugby"
          width={80}
          height={80}
          className="w-20 h-20 mx-auto mb-4 object-contain"
        />
        <h1 className="font-heading font-bold text-2xl text-gray-900 mb-2">Portal Sportivi</h1>
        <p className="text-gray-600 mb-6">
          Portalul sportivilor este disponibil în aplicația mobilă <strong>Dinamo Rugby</strong>.
        </p>
        <p className="text-gray-500 text-sm mb-6">
          Descarcă aplicația pentru a vedea evaluările, badge-urile, programul antrenamentelor și progresul tău.
        </p>
        <div className="space-y-3">
          <a
            href="https://apps.apple.com/app/dinamo-rugby"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-gray-900 text-white py-3 rounded-lg font-heading font-bold hover:bg-gray-800 transition-colors"
          >
            App Store (iOS)
          </a>
          <a
            href="https://play.google.com/store/apps/details?id=com.dinamorugby"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-dinamo-red text-white py-3 rounded-lg font-heading font-bold hover:bg-dinamo-dark transition-colors"
          >
            Google Play (Android)
          </a>
        </div>
        <Link href="/" className="inline-block mt-6 text-sm text-gray-400 hover:text-gray-600">
          ← Înapoi la site
        </Link>
      </div>
    </div>
  )
}
