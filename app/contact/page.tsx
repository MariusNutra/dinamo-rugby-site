'use client'

import { useState } from 'react'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
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
        setForm({ name: '', email: '', message: '' })
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
                <button
                  type="submit"
                  disabled={status === 'sending'}
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
                  <p className="text-gray-600">Șoseaua Ștefan cel Mare nr. 7-9, Sector 2, București</p>
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
                    <a href="https://www.facebook.com/DinamoRugbyJuniorTeams" target="_blank" rel="noopener noreferrer" className="text-dinamo-red hover:underline inline-flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      Facebook
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
