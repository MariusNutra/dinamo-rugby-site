'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ButonNotificari from '@/components/sportiv/ButonNotificari'

interface DateSportiv {
  name: string
  teamName: string | null
  prezenta: { procent: number; prezent: number; total: number }
  puncte: { total: number; ultimele: { amount: number; reason: string; createdAt: string }[] }
  insigne: { id: string; nume: string; descriere: string | null; icon: string | null; castigataLa: string }[]
  program: { zi: string; deLa: string; panaLa: string; locatie: string }[]
  ultimaEvaluare: { data: string; medie: number } | null
}

export default function AcasaSportiv() {
  const [d, setD] = useState<DateSportiv | null>(null)

  useEffect(() => {
    fetch('/api/sportiv/me')
      .then((r) => (r.ok ? r.json() : null))
      .then(setD)
      .catch(() => setD(null))
  }, [])

  if (!d) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-dinamo-red border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-dinamo-blue">Salut, {d.name.split(' ')[0]}!</h1>
        {d.teamName && <p className="text-sm text-gray-600">Echipa {d.teamName}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Caseta valoare={`${d.prezenta.procent}%`} eticheta="Prezenta luna asta" />
        <Caseta valoare={String(d.puncte.total)} eticheta="Puncte" />
        <Caseta valoare={String(d.insigne.length)} eticheta="Insigne" />
        <Caseta
          valoare={d.ultimaEvaluare ? d.ultimaEvaluare.medie.toFixed(1) : '—'}
          eticheta="Ultima evaluare"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/sportiv/prezenta"
          className="rounded-lg bg-dinamo-red px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700"
        >
          Da prezenta
        </Link>
        <Link
          href="/sportiv/clasament"
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-dinamo-red hover:text-dinamo-red"
        >
          Vezi clasamentul
        </Link>
        <ButonNotificari />
      </div>

      {d.program.length > 0 && (
        <Sectiune titlu="Programul echipei">
          <ul className="divide-y divide-gray-100">
            {d.program.map((t, i) => (
              <li key={i} className="flex flex-wrap items-baseline gap-x-2 py-2 text-sm">
                <span className="font-medium text-gray-900">{t.zi}</span>
                <span className="text-gray-600">{t.deLa}–{t.panaLa}</span>
                <span className="text-gray-400">·</span>
                <span className="text-gray-500">{t.locatie}</span>
              </li>
            ))}
          </ul>
        </Sectiune>
      )}

      {d.insigne.length > 0 && (
        <Sectiune titlu="Insignele tale">
          <ul className="flex flex-wrap gap-2">
            {d.insigne.map((i) => (
              <li
                key={i.id}
                title={i.descriere ?? undefined}
                className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-800"
              >
                {i.icon && <span aria-hidden>{i.icon}</span>}
                {i.nume}
              </li>
            ))}
          </ul>
        </Sectiune>
      )}

      {d.puncte.ultimele.length > 0 && (
        <Sectiune titlu="Ultimele puncte">
          <ul className="divide-y divide-gray-100">
            {d.puncte.ultimele.map((p, i) => (
              <li key={i} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                <span className="min-w-0 text-gray-700">{p.reason}</span>
                <span className="shrink-0 font-bold text-dinamo-red">+{p.amount}</span>
              </li>
            ))}
          </ul>
        </Sectiune>
      )}
    </div>
  )
}

function Caseta({ valoare, eticheta }: { valoare: string; eticheta: string }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <p className="font-heading text-2xl font-bold text-dinamo-blue">{valoare}</p>
      <p className="text-xs text-gray-500">{eticheta}</p>
    </div>
  )
}

function Sectiune({ titlu, children }: { titlu: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-white p-5">
      <h2 className="mb-3 font-heading text-lg font-bold">{titlu}</h2>
      {children}
    </div>
  )
}
