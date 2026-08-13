import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-dinamo-blue text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Dinamo Rugby Juniori</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Secția de juniori rugby a clubului CS Dinamo București.
              Formăm viitorii campioni ai rugby-ului românesc.
            </p>
            <p className="text-gray-400 text-xs leading-relaxed mt-4">
              ASOCIAȚIA SPORTIVĂ DINAMO RUGBY JUNIOR<br />
              Registrul Special nr. 73/14.05.2024, Partea A, Secțiunea I<br />
              CIF 50227280
            </p>
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Link-uri rapide</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/echipe/U10" className="text-gray-300 hover:text-white transition-colors">Echipe Juniori</Link></li>
              <li><Link href="/antrenori" className="text-gray-300 hover:text-white transition-colors">Antrenori</Link></li>
              <li><Link href="/program" className="text-gray-300 hover:text-white transition-colors">Program Antrenamente</Link></li>
              <li><Link href="/meciuri" className="text-gray-300 hover:text-white transition-colors">Calendar Meciuri</Link></li>
              <li><Link href="/povesti" className="text-gray-300 hover:text-white transition-colors">Povești</Link></li>
              <li><Link href="/galerie" className="text-gray-300 hover:text-white transition-colors">Galerie Foto</Link></li>
              <li><Link href="/despre" className="text-gray-300 hover:text-white transition-colors">Despre Noi</Link></li>
              <li><Link href="/parteneri" className="text-gray-300 hover:text-white transition-colors">Parteneri</Link></li>
              <li><Link href="/contact" className="text-gray-300 hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/parinti" className="text-gray-300 hover:text-white transition-colors">Portal Parinti</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="font-semibold text-white">Asociația Sportivă Dinamo Rugby Junior</li>
              <li>Bd. Camil Ressu nr. 2, bl. R1, sc. 1, et. 5, ap. 18, Sector 3, București</li>
              <li>contact@dinamorugby.ro</li>
              <li>+40 767 858 858</li>
            </ul>
            <div className="flex gap-4 mt-4">
              <a href="https://www.facebook.com/profile.php?id=61592998121958" target="_blank" rel="noopener noreferrer"
                className="text-gray-300 hover:text-white transition-colors inline-flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Facebook
              </a>
              <a href="https://www.instagram.com/dinamorugbyjuniori/" target="_blank" rel="noopener noreferrer"
                className="text-gray-300 hover:text-white transition-colors inline-flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                Instagram
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-600 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} Asociația Sportivă Dinamo Rugby Junior. Toate drepturile rezervate.</p>
          <p className="mt-2">
            <Link href="/politica-cookies-gdpr" className="text-gray-400 hover:text-white transition-colors underline">
              Politica de Cookies &amp; GDPR
            </Link>
            <span className="mx-2 text-gray-600">|</span>
            <Link href="/politica-confidentialitate" className="text-gray-400 hover:text-white transition-colors underline">
              Confidențialitate
            </Link>
            <span className="mx-2 text-gray-600">|</span>
            <Link href="/termeni-si-conditii" className="text-gray-400 hover:text-white transition-colors underline">
              Termeni și Condiții
            </Link>
          </p>
          <p className="mt-3 text-gray-500 text-xs">
            Platformă realizată de Nutra Pharma Consulting
          </p>
        </div>
        <p className="mt-4">
          <Link href="/admin" className="text-white/40 text-[11px] no-underline hover:underline transition-colors">
            Administrare
          </Link>
        </p>
      </div>
    </footer>
  )
}
