'use client'

import { useState } from 'react'

const coaches = [
  { key: 'hildan-cristian', name: 'Hildan Cristian' },
  { key: 'curea-darie', name: 'Curea Darie' },
  { key: 'andrei-guranescu', name: 'Andrei Guranescu' },
  { key: 'stefan-demici', name: 'Stefan Demici' },
]

export default function UploadAntrenoriPage() {
  const [files, setFiles] = useState<Record<string, File | null>>({})
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [results, setResults] = useState<string[]>([])

  const handleFile = (key: string, file: File | null) => {
    setFiles(prev => ({ ...prev, [key]: file }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('uploading')
    setResults([])

    try {
      const formData = new FormData()
      for (const coach of coaches) {
        const file = files[coach.key]
        if (file) {
          formData.append(coach.key, file)
        }
      }

      const res = await fetch('/api/upload-antrenori', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (res.ok) {
        setStatus('done')
        setResults(data.uploaded || [])
      } else {
        setStatus('error')
        setResults([data.error || 'Eroare necunoscută'])
      }
    } catch {
      setStatus('error')
      setResults(['Eroare de conexiune'])
    }
  }

  const selectedCount = Object.values(files).filter(Boolean).length

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-heading font-extrabold text-3xl text-center text-gray-900 mb-2">
          Upload Poze Antrenori
        </h1>
        <p className="text-center text-gray-500 mb-8">
          Selecteaza poza pentru fiecare antrenor, apoi apasa butonul de upload.
        </p>

        {status === 'done' ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-green-800 font-bold text-lg mb-2">Pozele au fost incarcate cu succes!</p>
            <ul className="text-green-700 text-sm space-y-1">
              {results.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
            <a href="/antrenori" className="inline-block mt-6 bg-dinamo-red text-white font-bold px-6 py-3 rounded-lg hover:bg-dinamo-dark transition-colors">
              Vezi pagina Antrenori
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {coaches.map(coach => (
              <div key={coach.key} className="bg-white rounded-xl shadow-md p-6">
                <label className="block font-heading font-bold text-lg text-gray-900 mb-3">
                  {coach.name}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => handleFile(coach.key, e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-dinamo-red/10 file:text-dinamo-red file:font-bold hover:file:bg-dinamo-red/20 file:cursor-pointer"
                />
                {files[coach.key] && (
                  <p className="text-sm text-green-600 mt-2">
                    Selectat: {files[coach.key]!.name}
                  </p>
                )}
              </div>
            ))}

            <button
              type="submit"
              disabled={selectedCount === 0 || status === 'uploading'}
              className="w-full bg-dinamo-red text-white py-4 rounded-xl font-heading font-bold text-lg hover:bg-dinamo-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'uploading'
                ? 'Se incarca...'
                : `Incarca ${selectedCount} ${selectedCount === 1 ? 'poza' : 'poze'}`}
            </button>

            {status === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <p className="text-red-700">{results[0] || 'A aparut o eroare.'}</p>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
