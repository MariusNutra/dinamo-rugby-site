'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface ChildOption {
  id: string
  name: string
}

const REQUEST_TYPES = [
  { value: 'absenta', label: 'Absenta' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'echipament', label: 'Echipament' },
  { value: 'alta', label: 'Alta cerere' },
]

export default function NewRequestPage() {
  const router = useRouter()
  const [children, setChildren] = useState<ChildOption[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [type, setType] = useState('absenta')
  const [childId, setChildId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    fetch('/api/parinti/me')
      .then(r => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then(data => {
        if (data.children && Array.isArray(data.children)) {
          setChildren(data.children.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })))
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Titlul este obligatoriu.')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/parinti/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          title: title.trim(),
          description: description.trim() || null,
          childId: childId || null,
          startDate: startDate || null,
          endDate: endDate || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Eroare la trimiterea cererii.')
        setSubmitting(false)
        return
      }

      router.push('/parinti/cereri')
    } catch {
      setError('Eroare de conexiune. Incearca din nou.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-dinamo-blue">Cerere noua</h1>
        <p className="text-gray-500 text-sm mt-1">Completeaza formularul pentru a trimite o cerere</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipul cererii</label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red focus:border-dinamo-red outline-none transition-colors"
            >
              {REQUEST_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Child */}
          {children.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Copilul</label>
              <select
                value={childId}
                onChange={e => setChildId(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red focus:border-dinamo-red outline-none transition-colors"
              >
                <option value="">-- Selecteaza copilul --</option>
                {children.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Titlu *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="ex: Absenta 3-7 martie"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red focus:border-dinamo-red outline-none transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descriere</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              placeholder="Detalii despre cerere..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red focus:border-dinamo-red outline-none transition-colors resize-none"
            />
          </div>

          {/* Dates - shown primarily for absenta but available for all */}
          {(type === 'absenta' || startDate || endDate) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Data inceput</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red focus:border-dinamo-red outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Data sfarsit</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red focus:border-dinamo-red outline-none transition-colors"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-dinamo-red text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Se trimite...' : 'Trimite cererea'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/parinti/cereri')}
              className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors border border-gray-300"
            >
              Anuleaza
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
