'use client'

import { useEffect, useState } from 'react'

interface Rand {
  childId: string
  name: string
  teamName: string | null
  totalPoints: number
  badgeCount: number
}

export default function ClasamentSportiv() {
  const [randuri, setRanduri] = useState<Rand[] | null>(null)
  const [euId, setEuId] = useState<string | null>(null)

  useEffect(() => {
    // Serverul limiteaza singur clasamentul la echipa sportivului; nu trimitem
    // `teamId`, tocmai ca sa nu para ca l-ar putea alege clientul.
    Promise.all([
      fetch('/api/gamification/leaderboard?limit=50').then((r) => (r.ok ? r.json() : [])),
      fetch('/api/sportiv/me').then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([lista, eu]) => {
        setRanduri(lista)
        setEuId(eu?.id ?? null)
      })
      .catch(() => setRanduri([]))
  }, [])

  if (!randuri) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-dinamo-red border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-dinamo-blue">Clasament</h1>
      <p className="mb-4 text-sm text-gray-600">Echipa ta</p>

      {randuri.length === 0 ? (
        <p className="rounded-lg border bg-white py-8 text-center text-gray-500">
          Inca nu s-au acordat puncte.
        </p>
      ) : (
        <ol className="space-y-2">
          {randuri.map((r, i) => {
            const euSunt = r.childId === euId
            return (
              <li
                key={r.childId}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
                  euSunt ? 'border-dinamo-red bg-red-50' : 'bg-white'
                }`}
              >
                <span className="w-6 shrink-0 text-center font-heading font-bold text-gray-400">{i + 1}</span>
                <span className={`min-w-0 flex-1 ${euSunt ? 'font-bold text-dinamo-red' : 'text-gray-900'}`}>
                  {r.name}
                  {euSunt && <span className="ml-1 text-xs font-normal text-gray-500">(tu)</span>}
                </span>
                {r.badgeCount > 0 && (
                  <span className="shrink-0 text-xs text-amber-700">{r.badgeCount} insigne</span>
                )}
                <span className="shrink-0 font-bold text-dinamo-blue">{r.totalPoints}p</span>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
