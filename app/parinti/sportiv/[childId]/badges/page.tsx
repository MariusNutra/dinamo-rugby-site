'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface BadgeData {
  id: string
  badgeId: string
  name: string
  icon: string
  description: string | null
  category: string
  earnedAt: string
}

interface PointRecord {
  id: string
  amount: number
  reason: string
  createdAt: string
}

const CATEGORY_COLORS: Record<string, string> = {
  attendance: 'from-blue-400 to-blue-600',
  performance: 'from-purple-400 to-purple-600',
  special: 'from-amber-400 to-amber-600',
  general: 'from-gray-400 to-gray-600',
}

const CATEGORY_LABELS: Record<string, string> = {
  attendance: 'Prezenta',
  performance: 'Performanta',
  special: 'Special',
  general: 'General',
}

export default function ParentChildBadgesPage() {
  const { childId } = useParams<{ childId: string }>()
  const router = useRouter()
  const [badges, setBadges] = useState<BadgeData[]>([])
  const [pointsTotal, setPointsTotal] = useState(0)
  const [pointsHistory, setPointsHistory] = useState<PointRecord[]>([])
  const [childName, setChildName] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedBadge, setSelectedBadge] = useState<BadgeData | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      try {
        // Fetch child info
        const childRes = await fetch(`/api/parinti/sportiv/${childId}`)
        if (childRes.status === 401) {
          router.push('/parinti')
          return
        }
        const childData = await childRes.json()
        if (!cancelled && childData && !childData.error) {
          setChildName(childData.name)
        }

        // Fetch badges
        const badgesRes = await fetch(`/api/gamification/badges?childId=${childId}`)
        const badgesData = await badgesRes.json()
        if (!cancelled && Array.isArray(badgesData)) {
          setBadges(badgesData)
        }

        // Fetch points
        const pointsRes = await fetch(`/api/gamification/points?childId=${childId}`)
        const pointsData = await pointsRes.json()
        if (!cancelled && pointsData) {
          setPointsTotal(pointsData.total || 0)
          setPointsHistory((pointsData.history || []).slice(0, 10))
        }
      } catch {
        // Silently fail
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [childId, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/parinti/sportiv/${childId}`}
          className="text-gray-400 hover:text-gray-600 text-sm inline-block mb-2"
        >
          &larr; Inapoi la profil
        </Link>
        <h1 className="font-heading font-bold text-2xl text-dinamo-blue">
          {childName ? `${childName} - Realizari` : 'Realizari'}
        </h1>
      </div>

      {/* Points summary card */}
      <div className="bg-gradient-to-r from-dinamo-red to-dinamo-dark rounded-xl p-6 text-white mb-8 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm font-medium">Puncte totale</p>
            <p className="text-4xl font-heading font-bold mt-1">{pointsTotal}</p>
          </div>
          <div className="text-right">
            <p className="text-white/70 text-sm font-medium">Badge-uri castigate</p>
            <p className="text-4xl font-heading font-bold mt-1">{badges.length}</p>
          </div>
        </div>
      </div>

      {/* Badges grid */}
      <h2 className="font-heading font-bold text-lg mb-4">Badge-uri castigate</h2>
      {badges.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-8 text-center mb-8">
          <p className="text-5xl mb-3">🏅</p>
          <p className="text-gray-500 font-medium">Inca nu a fost castigat niciun badge.</p>
          <p className="text-gray-400 text-sm mt-1">Badge-urile se acorda pentru prezenta, performanta si realizari speciale.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {badges.map(badge => (
            <button
              key={badge.id}
              onClick={() => setSelectedBadge(badge)}
              className="bg-white rounded-xl shadow-md p-5 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer border border-transparent hover:border-dinamo-red/20"
            >
              <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br ${CATEGORY_COLORS[badge.category] || CATEGORY_COLORS.general} flex items-center justify-center mb-3 shadow-inner`}>
                <span className="text-3xl filter drop-shadow">{badge.icon}</span>
              </div>
              <h3 className="font-heading font-bold text-sm mb-1">{badge.name}</h3>
              <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium ${
                badge.category === 'attendance' ? 'bg-blue-100 text-blue-700' :
                badge.category === 'performance' ? 'bg-purple-100 text-purple-700' :
                badge.category === 'special' ? 'bg-amber-100 text-amber-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {CATEGORY_LABELS[badge.category] || badge.category}
              </span>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(badge.earnedAt).toLocaleDateString('ro-RO', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Points history */}
      <h2 className="font-heading font-bold text-lg mb-4">Istoric puncte</h2>
      {pointsHistory.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
          <p className="text-5xl mb-3">⭐</p>
          <p className="text-gray-500 font-medium">Inca nu au fost acordate puncte.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {pointsHistory.map((p, idx) => (
            <div
              key={p.id}
              className={`flex items-center justify-between px-5 py-3 ${idx > 0 ? 'border-t' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  p.amount >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  {p.amount >= 0 ? '+' : ''}{p.amount}
                </div>
                <div>
                  <p className="text-sm font-medium">{p.reason}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(p.createdAt).toLocaleDateString('ro-RO', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Badge detail modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedBadge(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full p-8 text-center">
            <div className={`w-24 h-24 mx-auto rounded-full bg-gradient-to-br ${CATEGORY_COLORS[selectedBadge.category] || CATEGORY_COLORS.general} flex items-center justify-center mb-4 shadow-lg`}>
              <span className="text-5xl filter drop-shadow">{selectedBadge.icon}</span>
            </div>
            <h2 className="font-heading font-bold text-xl mb-2">{selectedBadge.name}</h2>
            {selectedBadge.description && (
              <p className="text-gray-600 text-sm mb-3">{selectedBadge.description}</p>
            )}
            <span className={`inline-block text-xs px-3 py-1 rounded-full font-medium mb-3 ${
              selectedBadge.category === 'attendance' ? 'bg-blue-100 text-blue-700' :
              selectedBadge.category === 'performance' ? 'bg-purple-100 text-purple-700' :
              selectedBadge.category === 'special' ? 'bg-amber-100 text-amber-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {CATEGORY_LABELS[selectedBadge.category] || selectedBadge.category}
            </span>
            <p className="text-sm text-gray-500">
              Castigat pe {new Date(selectedBadge.earnedAt).toLocaleDateString('ro-RO', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
            <button
              onClick={() => setSelectedBadge(null)}
              className="mt-6 px-6 py-2 bg-dinamo-blue text-white rounded-lg text-sm font-medium hover:bg-dinamo-blue/90 transition-colors"
            >
              Inchide
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
