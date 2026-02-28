'use client'

import { useState, useEffect } from 'react'
import { getQRCodeUrl } from '@/lib/qr'

interface Team {
  id: number
  grupa: string
}

interface Session {
  id: string
  qrToken: string
  teamName: string
  teamId: number
  expiresAt: string
  createdAt: string
}

export default function QRAttendancePage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [duration, setDuration] = useState(120)

  useEffect(() => {
    fetch('/api/teams').then(r => r.json()).then(data => {
      setTeams(data.filter((t: Team & { active?: boolean }) => t.active !== false))
    })
    fetchSessions()
  }, [])

  const fetchSessions = () => {
    fetch('/api/attendance/session')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setSessions(data)
      })
      .catch(() => {})
  }

  const createSession = async () => {
    if (!selectedTeam) return
    setLoading(true)
    try {
      const res = await fetch('/api/attendance/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: selectedTeam, durationMinutes: duration }),
      })
      if (res.ok) {
        fetchSessions()
      }
    } catch {
      // ignore
    }
    setLoading(false)
  }

  const getTimeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now()
    if (diff <= 0) return 'Expirat'
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    if (hours > 0) return `${hours}h ${minutes % 60}min`
    return `${minutes}min`
  }

  const getCheckinUrl = (qrToken: string) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/parinti/checkin?token=${qrToken}`
    }
    return `/parinti/checkin?token=${qrToken}`
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl">Prezență QR Code</h1>
        <p className="text-sm text-gray-400">Generează coduri QR pentru înregistrarea rapidă a prezenței</p>
      </div>

      {/* Create session */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="font-heading font-bold text-lg mb-4">Generează QR nou</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Echipa</label>
            <select
              value={selectedTeam ?? ''}
              onChange={e => setSelectedTeam(e.target.value ? Number(e.target.value) : null)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-dinamo-red"
            >
              <option value="">Selectează echipa</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.grupa}</option>
              ))}
            </select>
          </div>
          <div className="w-32">
            <label className="block text-sm font-medium text-gray-700 mb-1">Durată (min)</label>
            <select
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-dinamo-red"
            >
              <option value={30}>30 min</option>
              <option value={60}>1 oră</option>
              <option value={120}>2 ore</option>
              <option value={180}>3 ore</option>
              <option value={240}>4 ore</option>
            </select>
          </div>
          <button
            onClick={createSession}
            disabled={!selectedTeam || loading}
            className="px-6 py-2 bg-dinamo-red text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm disabled:opacity-50"
          >
            {loading ? 'Se generează...' : 'Generează QR'}
          </button>
        </div>
      </div>

      {/* Active sessions */}
      {sessions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-md">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📱</span>
          </div>
          <h3 className="font-heading font-bold text-lg text-gray-600 mb-1">Nicio sesiune activă</h3>
          <p className="text-gray-400 text-sm">Generează un cod QR pentru a începe înregistrarea prezenței.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sessions.map(session => (
            <div key={session.id} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-heading font-bold text-lg">{session.teamName}</h3>
                  <p className="text-sm text-gray-500">
                    Expiră în: <span className="font-medium text-dinamo-red">{getTimeRemaining(session.expiresAt)}</span>
                  </p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Activ</span>
              </div>

              <div className="flex justify-center mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getQRCodeUrl(getCheckinUrl(session.qrToken))}
                  alt={`QR Code pentru ${session.teamName}`}
                  width={250}
                  height={250}
                  className="rounded-lg border-4 border-gray-100"
                />
              </div>

              <div className="text-center">
                <p className="text-xs text-gray-400 mb-2">Părinții scanează acest cod pentru check-in</p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => {
                      const url = getCheckinUrl(session.qrToken)
                      navigator.clipboard.writeText(url)
                      alert('Link copiat!')
                    }}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200 transition-colors"
                  >
                    Copiază link
                  </button>
                  <button
                    onClick={() => {
                      const url = getQRCodeUrl(getCheckinUrl(session.qrToken), 600)
                      window.open(url, '_blank')
                    }}
                    className="px-3 py-1.5 bg-dinamo-blue text-white rounded-lg text-xs hover:bg-blue-800 transition-colors"
                  >
                    Descarcă QR
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
