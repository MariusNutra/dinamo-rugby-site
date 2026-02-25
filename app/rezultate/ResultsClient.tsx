'use client'

import { useState, useMemo } from 'react'
import type { ScrapedData, EtapaGroup, StandingRow } from '@/types/results'

interface Props {
  data: ScrapedData
}

type SubTab = 'results' | 'standings'

export default function ResultsClient({ data }: Props) {
  const categories = Object.keys(data.categories)

  // Default to category with most recent Dinamo match
  const defaultCategory = useMemo(() => {
    for (const cat of categories) {
      const catData = data.categories[cat]
      for (const regionData of Object.values(catData.regions)) {
        if (regionData.results.some((e) => e.matches.some((m) => m.isDinamo))) {
          return cat
        }
      }
    }
    return categories[0] || 'U16'
  }, [categories, data.categories])

  const [activeCategory, setActiveCategory] = useState(defaultCategory)
  const [activeRegion, setActiveRegion] = useState<string>('')
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('results')
  const [dinamoOnly, setDinamoOnly] = useState(false)

  const catData = data.categories[activeCategory]
  const regions = catData ? Object.keys(catData.regions) : []
  const isNational = regions.length === 1 && regions[0] === 'National'

  // Set default region when category changes
  const currentRegion = activeRegion && regions.includes(activeRegion)
    ? activeRegion
    : regions[0] || ''

  const regionData = catData?.regions[currentRegion]

  // Find next and latest Dinamo matches in current view
  const nextDinamoMatch = useMemo(() => {
    if (!regionData) return null
    for (const etapa of regionData.results) {
      for (const m of etapa.matches) {
        if (m.isDinamo && !m.played) return m
      }
    }
    return null
  }, [regionData])

  const lastDinamoResult = useMemo(() => {
    if (!regionData) return null
    const played = regionData.results
      .flatMap((e) => e.matches)
      .filter((m) => m.isDinamo && m.played)
    return played.length > 0 ? played[played.length - 1] : null
  }, [regionData])

  return (
    <div>
      {/* Category Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setActiveCategory(cat)
              setActiveRegion('')
              setActiveSubTab('results')
            }}
            className={`px-5 py-2.5 rounded-lg font-heading font-bold text-sm transition-colors shrink-0 ${
              activeCategory === cat
                ? 'bg-dinamo-red text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Region Tabs (only for U16/U18) */}
      {!isNational && regions.length > 1 && (
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {regions.map((region) => (
            <button
              key={region}
              onClick={() => setActiveRegion(region)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors shrink-0 ${
                currentRegion === region
                  ? 'bg-dinamo-blue text-white'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {region}
            </button>
          ))}
        </div>
      )}

      {/* Sub-tabs: Results / Standings */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6 border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveSubTab('results')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeSubTab === 'results'
                ? 'border-dinamo-red text-dinamo-red'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Program & Rezultate
          </button>
          <button
            onClick={() => setActiveSubTab('standings')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeSubTab === 'standings'
                ? 'border-dinamo-red text-dinamo-red'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Clasament
          </button>
        </div>

        {/* Dinamo only toggle */}
        {activeSubTab === 'results' && (
          <label className="flex items-center gap-2 cursor-pointer py-2">
            <input
              type="checkbox"
              checked={dinamoOnly}
              onChange={(e) => setDinamoOnly(e.target.checked)}
              className="w-4 h-4 accent-dinamo-red rounded"
            />
            <span className="text-sm text-gray-600">Doar Dinamo</span>
          </label>
        )}
      </div>

      {/* Content */}
      {!regionData ? (
        <p className="text-gray-400 text-center py-12">Nu sunt date disponibile.</p>
      ) : activeSubTab === 'results' ? (
        <ResultsView
          etape={regionData.results}
          dinamoOnly={dinamoOnly}
          nextDinamoMatch={nextDinamoMatch}
          lastDinamoResult={lastDinamoResult}
        />
      ) : (
        <StandingsView
          standings={regionData.standings}
          lastUpdated={data.lastUpdated}
        />
      )}
    </div>
  )
}

/* ========== Results View ========== */

function ResultsView({
  etape,
  dinamoOnly,
  nextDinamoMatch,
  lastDinamoResult,
}: {
  etape: EtapaGroup[]
  dinamoOnly: boolean
  nextDinamoMatch: ReturnType<typeof Object> | null
  lastDinamoResult: ReturnType<typeof Object> | null
}) {
  // Reverse order: show latest etapa first
  const sortedEtape = [...etape].reverse()

  const filtered = dinamoOnly
    ? sortedEtape
        .map((e) => ({
          ...e,
          matches: e.matches.filter((m) => m.isDinamo),
        }))
        .filter((e) => e.matches.length > 0)
    : sortedEtape

  if (filtered.length === 0) {
    return (
      <p className="text-gray-400 text-center py-12">
        {dinamoOnly ? 'Nu sunt meciuri Dinamo în această categorie.' : 'Nu sunt meciuri disponibile.'}
      </p>
    )
  }

  return (
    <div className="space-y-6">
      {filtered.map((etapa, idx) => (
        <div key={idx}>
          <h3 className="font-heading font-bold text-lg text-gray-800 mb-3 pb-2 border-b border-gray-100">
            {etapa.name}
          </h3>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs uppercase">
                  <th className="pb-2 pr-4">Data</th>
                  <th className="pb-2 pr-4">Stadion</th>
                  <th className="pb-2 pr-4">Meci</th>
                  <th className="pb-2 pr-4 text-center">Scor</th>
                </tr>
              </thead>
              <tbody>
                {etapa.matches.map((match, mIdx) => {
                  const isNext = nextDinamoMatch === match
                  const isLast = lastDinamoResult === match

                  return (
                    <tr
                      key={mIdx}
                      className={`border-b border-gray-50 ${
                        match.isDinamo
                          ? 'bg-red-50/60 border-l-4 border-l-dinamo-red font-semibold'
                          : ''
                      }`}
                    >
                      <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">
                        {match.date}
                      </td>
                      <td className="py-2.5 pr-4 text-gray-500 max-w-[200px] truncate">
                        {match.stadium}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span>{match.homeTeam}</span>
                        <span className="mx-2 text-gray-400">
                          {match.played ? '–' : 'vs'}
                        </span>
                        <span>{match.awayTeam}</span>
                        {isNext && (
                          <span className="ml-2 inline-block bg-dinamo-red text-white text-xs px-2 py-0.5 rounded-full font-bold">
                            Următorul meci
                          </span>
                        )}
                        {isLast && (
                          <span className="ml-2 inline-block bg-dinamo-blue text-white text-xs px-2 py-0.5 rounded-full font-bold">
                            Ultimul rezultat
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 text-center whitespace-nowrap">
                        {match.played ? (
                          <span className="font-bold">
                            {match.scoreHome} – {match.scoreAway}
                          </span>
                        ) : (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">
                            Urmează
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {etapa.matches.map((match, mIdx) => {
              const isNext = nextDinamoMatch === match
              const isLast = lastDinamoResult === match

              return (
                <div
                  key={mIdx}
                  className={`rounded-lg p-3 ${
                    match.isDinamo
                      ? 'bg-red-50 border-l-4 border-l-dinamo-red'
                      : 'bg-gray-50'
                  }`}
                >
                  {(isNext || isLast) && (
                    <div className="mb-2">
                      {isNext && (
                        <span className="bg-dinamo-red text-white text-xs px-2 py-0.5 rounded-full font-bold">
                          Următorul meci
                        </span>
                      )}
                      {isLast && (
                        <span className="bg-dinamo-blue text-white text-xs px-2 py-0.5 rounded-full font-bold">
                          Ultimul rezultat
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className={`text-sm leading-tight flex-1 min-w-0 ${match.isDinamo ? 'font-bold' : ''}`}>
                      {match.homeTeam}
                    </span>
                    {match.played ? (
                      <span className="font-bold text-lg shrink-0">
                        {match.scoreHome}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`text-sm leading-tight flex-1 min-w-0 ${match.isDinamo ? 'font-bold' : ''}`}>
                      {match.awayTeam}
                    </span>
                    {match.played ? (
                      <span className="font-bold text-lg shrink-0">
                        {match.scoreAway}
                      </span>
                    ) : (
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded shrink-0">
                        Urmează
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {match.date}
                    {match.stadium && ` · ${match.stadium}`}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ========== Standings View ========== */

function StandingsView({
  standings,
  lastUpdated,
}: {
  standings: StandingRow[]
  lastUpdated: string
}) {
  if (standings.length === 0) {
    return (
      <p className="text-gray-400 text-center py-12">
        Clasamentul nu este disponibil.
      </p>
    )
  }

  const medalColors: Record<number, string> = {
    1: 'text-yellow-500',
    2: 'text-gray-400',
    3: 'text-amber-700',
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 text-xs uppercase border-b border-gray-200">
              <th className="pb-2 pr-2 w-8">#</th>
              <th className="pb-2 pr-4">Echipa</th>
              <th className="pb-2 pr-2 text-center">M</th>
              <th className="pb-2 pr-2 text-center">V</th>
              <th className="pb-2 pr-2 text-center">E</th>
              <th className="pb-2 pr-2 text-center">I</th>
              <th className="pb-2 pr-2 text-center hidden sm:table-cell">M-P</th>
              <th className="pb-2 pr-2 text-center hidden sm:table-cell">Dif</th>
              <th className="pb-2 pr-2 text-center hidden sm:table-cell">Pct</th>
              <th className="pb-2 pr-2 text-center hidden sm:table-cell">Bonus</th>
              <th className="pb-2 text-center font-bold">Total</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row) => (
              <tr
                key={row.position}
                className={`border-b border-gray-50 ${
                  row.isDinamo
                    ? 'bg-red-50/60 font-bold'
                    : ''
                }`}
              >
                <td className="py-2.5 pr-2">
                  <span className={medalColors[row.position] || 'text-gray-600'}>
                    {row.position <= 3 ? ['', '🥇', '🥈', '🥉'][row.position] : row.position}
                  </span>
                </td>
                <td className="py-2.5 pr-4">{row.team}</td>
                <td className="py-2.5 pr-2 text-center text-gray-600">{row.played}</td>
                <td className="py-2.5 pr-2 text-center text-green-600">{row.wins}</td>
                <td className="py-2.5 pr-2 text-center text-gray-500">{row.draws}</td>
                <td className="py-2.5 pr-2 text-center text-red-500">{row.losses}</td>
                <td className="py-2.5 pr-2 text-center text-gray-600 hidden sm:table-cell">
                  {row.pointsFor}-{row.pointsAgainst}
                </td>
                <td className="py-2.5 pr-2 text-center text-gray-600 hidden sm:table-cell">
                  {row.diff > 0 ? `+${row.diff}` : row.diff}
                </td>
                <td className="py-2.5 pr-2 text-center text-gray-600 hidden sm:table-cell">
                  {row.points}
                </td>
                <td className="py-2.5 pr-2 text-center text-gray-600 hidden sm:table-cell">
                  {row.bonus}
                </td>
                <td className="py-2.5 text-center font-bold">{row.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 mt-4 text-right">
        Ultima actualizare:{' '}
        {new Date(lastUpdated).toLocaleDateString('ro-RO', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </p>
    </div>
  )
}
