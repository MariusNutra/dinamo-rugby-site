'use client'

import { useState } from 'react'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '', gdpr: false })
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setStatus('sent')
        setForm({ name: '', email: '', message: '', gdpr: false })
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <>
      <section className="bg-dinamo-blue text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center fade-in">
          <h1 className="font-heading font-extrabold text-4xl md:text-5xl mb-2">Contact</h1>
          <p className="text-lg opacity-80">Ia legătura cu noi</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Formular */}
          <div>
            <h2 className="font-heading font-bold text-2xl mb-6 text-gray-900">Trimite-ne un mesaj</h2>
            {status === 'sent' ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <div className="text-4xl mb-2">✅</div>
                <p className="text-green-800 font-bold">Mesajul a fost trimis cu succes!</p>
                <p className="text-green-600 text-sm mt-1">Te vom contacta în cel mai scurt timp.</p>
                <button onClick={() => setStatus('idle')} className="mt-4 text-dinamo-red font-bold text-sm">
                  Trimite alt mesaj
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nume complet</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red focus:border-dinamo-red outline-none"
                    placeholder="Ion Popescu"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red focus:border-dinamo-red outline-none"
                    placeholder="ion@exemplu.ro"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mesaj</label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red focus:border-dinamo-red outline-none resize-none"
                    placeholder="Scrie mesajul tău aici..."
                  />
                </div>
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="gdpr-consent"
                    required
                    checked={form.gdpr}
                    onChange={e => setForm({ ...form, gdpr: e.target.checked })}
                    className="mt-1 w-4 h-4 accent-dinamo-red cursor-pointer flex-shrink-0"
                  />
                  <label htmlFor="gdpr-consent" className="text-sm text-gray-600 cursor-pointer">
                    Sunt de acord cu prelucrarea datelor personale conform{' '}
                    <a href="/politica-confidentialitate" target="_blank" className="text-dinamo-red underline hover:text-dinamo-dark">
                      Politicii de Confidențialitate
                    </a>{' '}
                    și{' '}
                    <a href="/politica-cookies-gdpr" target="_blank" className="text-dinamo-red underline hover:text-dinamo-dark">
                      Politicii de Cookies &amp; GDPR
                    </a>. *
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={status === 'sending' || !form.gdpr}
                  className="w-full bg-dinamo-red text-white py-3 rounded-lg font-heading font-bold hover:bg-dinamo-dark transition-colors disabled:opacity-50"
                >
                  {status === 'sending' ? 'Se trimite...' : 'Trimite mesajul'}
                </button>
                {status === 'error' && (
                  <p className="text-red-500 text-sm text-center">A apărut o eroare. Încercați din nou.</p>
                )}
              </form>
            )}
          </div>

          {/* Info contact */}
          <div>
            <h2 className="font-heading font-bold text-2xl mb-6 text-gray-900">Informații de contact</h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-dinamo-red/10 rounded-lg flex items-center justify-center text-xl flex-shrink-0">📍</div>
                <div>
                  <h3 className="font-bold text-gray-900">Adresă</h3>
                  <p className="text-gray-600">Bd. Camil Ressu nr. 2, bl. R1, sc. 1, et. 5, ap. 18, Sector 3, București</p>
                  <p className="text-gray-400 text-xs mt-1">Asociația Sportivă Dinamo Rugby Junior · Reg. Special nr. 73/14.05.2024 · CIF 50227280<br />IBAN: RO77 RNCB 0082 1792 8045 0001 (BCR)</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-dinamo-red/10 rounded-lg flex items-center justify-center text-xl flex-shrink-0">📧</div>
                <div>
                  <h3 className="font-bold text-gray-900">Email</h3>
                  <a href="mailto:contact@dinamorugby.ro" className="text-dinamo-red hover:underline">contact@dinamorugby.ro</a>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-dinamo-red/10 rounded-lg flex items-center justify-center text-xl flex-shrink-0">📞</div>
                <div>
                  <h3 className="font-bold text-gray-900">Telefon</h3>
                  <a href="tel:+40767858858" className="text-dinamo-red hover:underline">+40 767 858 858</a>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-dinamo-red/10 rounded-lg flex items-center justify-center text-xl flex-shrink-0">🌐</div>
                <div>
                  <h3 className="font-bold text-gray-900">Social media</h3>
                  <div className="flex gap-3 mt-1">
                    <a href="https://www.facebook.com/profile.php?id=61592998121958" target="_blank" rel="noopener noreferrer" className="text-dinamo-red hover:underline inline-flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      Facebook
                    </a>
                    <a href="https://www.instagram.com/dinamorugbyjuniori/" target="_blank" rel="noopener noreferrer" className="text-dinamo-red hover:underline inline-flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                      Instagram
                    </a>
                    <a href="https://www.tiktok.com/@dinamo.rugby" target="_blank" rel="noopener noreferrer" className="text-dinamo-red hover:underline inline-flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                      TikTok
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Hartă */}
            <div className="mt-8 rounded-xl overflow-hidden shadow-lg">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2848.8!2d26.1122!3d44.4519!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40b1ff4c7f8ef3e7%3A0x8f2e5c2e5b5f5f5f!2s%C8%98oseaua%20%C8%98tefan%20cel%20Mare%207-9%2C%20Bucure%C8%99ti!5e0!3m2!1sro!2sro!4v1700000000000"
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
