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
              <li><Link href="/contact" className="text-gray-300 hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>Șoseaua Ștefan cel Mare nr. 7-9, Sector 2, București</li>
              <li>contact@dinamorugby.ro</li>
              <li>+40 767 858 858</li>
            </ul>
            <div className="flex gap-4 mt-4">
              <a href="https://www.facebook.com/DinamoRugbyJuniorTeams" target="_blank" rel="noopener noreferrer"
                className="text-gray-300 hover:text-white transition-colors inline-flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Facebook
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-600 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} CS Dinamo București — Secția Rugby Juniori. Toate drepturile rezervate.</p>
        </div>
      </div>
    </footer>
  )
}
