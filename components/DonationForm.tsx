'use client'

import { useState } from 'react'

interface DonationFormProps {
  campaignId: string
  campaignTitle: string
  onClose: () => void
  onSuccess: () => void
}

export default function DonationForm({ campaignId, campaignTitle, onClose, onSuccess }: DonationFormProps) {
  const [donorName, setDonorName] = useState('')
  const [email, setEmail] = useState('')
  const [amount, setAmount] = useState<number | ''>('')
  const [message, setMessage] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const presetAmounts = [50, 100, 200, 500]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || amount <= 0) {
      setError('Introduceti o suma valida')
      return
    }
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/fundraising/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          donorName: anonymous ? null : donorName,
          email,
          amount: Number(amount),
          message,
          anonymous,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        onSuccess()
      } else {
        setError(data.error || 'Eroare la procesare')
      }
    } catch {
      setError('Eroare de conexiune')
    }
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-lg text-dinamo-blue">Doneaza</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-4">Campanie: {campaignTitle}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Suma (RON) *</label>
              <div className="flex gap-2 mb-2">
                {presetAmounts.map(a => (
                  <button key={a} type="button" onClick={() => setAmount(a)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      amount === a ? 'bg-dinamo-red text-white border-dinamo-red' : 'bg-white text-gray-700 border-gray-300 hover:border-dinamo-red'
                    }`}>
                    {a} RON
                  </button>
                ))}
              </div>
              <input type="number" min={1} value={amount} onChange={e => setAmount(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red/50" placeholder="Alta suma" />
            </div>

            {!anonymous && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nume</label>
                <input type="text" value={donorName} onChange={e => setDonorName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Numele tau" />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email (pentru confirmare)</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="email@exemplu.ro" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mesaj (optional)</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={2} placeholder="Un mesaj de incurajare..." />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)} className="rounded" />
              Doresc sa donez anonim
            </label>

            {error && <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>}

            <button type="submit" disabled={submitting}
              className="w-full py-3 bg-dinamo-red text-white rounded-lg hover:bg-red-700 font-bold disabled:opacity-50 transition-colors">
              {submitting ? 'Se proceseaza...' : `Doneaza ${amount ? amount + ' RON' : ''}`}
            </button>

            <p className="text-xs text-gray-400 text-center">
              Donatia se inregistreaza manual. Veti fi contactat pentru detalii de plata.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
