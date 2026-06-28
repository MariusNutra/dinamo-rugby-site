'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

export default function AntrenorPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    fetch('/api/antrenor/auth/check')
      .then(r => r.json())
      .then(data => {
        if (data.authenticated) {
          router.push('/antrenor/dashboard')
        } else {
          setChecking(false)
        }
      })
      .catch(() => setChecking(false))
  }, [router])

  if (checking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="w-full max-w-md text-center">
        <Image
          src="/images/dinamo-rugby-bulldog.png"
          alt="Dinamo Rugby"
          width={80}
          height={80}
          className="w-20 h-20 mx-auto mb-4 object-contain"
        />
        <h1 className="font-heading font-bold text-2xl text-gray-900 mb-2">Portal Antrenori</h1>
        <p className="text-gray-600 mb-6">
          Gestioneaza echipa, prezenta sportivilor si programul de antrenamente.
        </p>
        <div className="space-y-3">
          <Link
            href="/antrenor/login"
            className="block w-full bg-dinamo-red text-white py-3 rounded-lg font-heading font-bold hover:bg-red-700 transition-colors"
          >
            Conecteaza-te
          </Link>
          <Link
            href="/antrenor/inregistrare"
            className="block w-full bg-white text-dinamo-red py-3 rounded-lg font-heading font-bold border-2 border-dinamo-red hover:bg-red-50 transition-colors"
          >
            Creeaza cont nou
          </Link>
        </div>
        <Link href="/" className="inline-block mt-6 text-sm text-gray-400 hover:text-gray-600">
          &larr; Inapoi la site
        </Link>
      </div>
    </div>
  )
}
