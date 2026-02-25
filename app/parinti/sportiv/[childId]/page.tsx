'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import AttendanceCalendar from '@/components/sportiv/AttendanceCalendar'
import AttendanceStats from '@/components/sportiv/AttendanceStats'
import MedicalTimeline from '@/components/sportiv/MedicalTimeline'
import PhotoGallery from '@/components/sportiv/PhotoGallery'

const RadarChart = dynamic(() => import('@/components/sportiv/RadarChart'), { ssr: false })
const ProgressChart = dynamic(() => import('@/components/sportiv/ProgressChart'), { ssr: false })

interface ChildSummary {
  id: string; name: string; birthYear: number; teamName: string | null
  photoConsent: boolean
  latestProfile: { height: number | null; weight: number | null } | null
  latestEvaluation: { physical: number; technical: number; tactical: number; mental: number; social: number } | null
  attendanceMonth: { total: number; present: number; percent: number }
}

const TABS = ['Profil', 'Evaluari', 'Prezente', 'Medical', 'Galerie']

export default function ParinteSportivPage() {
  const { childId } = useParams<{ childId: string }>()
  const router = useRouter()
  const [child, setChild] = useState<ChildSummary | null>(null)
  const [tab, setTab] = useState(0)
  const [loading, setLoading] = useState(true)

  // Data per tab
  const [evaluations, setEvaluations] = useState<{ id: string; date: string; period: string; physical: number; technical: number; tactical: number; mental: number; social: number; comments: string | null }[]>([])
  const [attendances, setAttendances] = useState<{ date: string; present: boolean; type?: string }[]>([])
  const [attMonth, setAttMonth] = useState('')
  const [medRecords, setMedRecords] = useState<{ id: string; date: string; type: string; description: string; severity: string | null; returnDate: string | null; resolved: boolean }[]>([])
  const [galerieData, setGalerieData] = useState<{ consentRequired: boolean; photos: { id: string; url: string; caption: string | null; event: string | null; date: string | null }[] }>({ consentRequired: false, photos: [] })

  useEffect(() => {
    fetch(`/api/parinti/sportiv/${childId}`)
      .then(r => {
        if (r.status === 401) { router.push('/parinti'); return null }
        return r.json()
      })
      .then(data => {
        if (data && !data.error) setChild(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [childId, router])

  const fetchEvaluations = useCallback(() => {
    fetch(`/api/parinti/sportiv/${childId}/evaluari`).then(r => r.json()).then(d => { if (Array.isArray(d)) setEvaluations(d) })
  }, [childId])

  const fetchAttendances = useCallback((month?: string) => {
    const q = month ? `?month=${month}` : ''
    fetch(`/api/parinti/sportiv/${childId}/prezente${q}`).then(r => r.json()).then(d => { if (Array.isArray(d)) setAttendances(d) })
  }, [childId])

  const fetchMedical = useCallback(() => {
    fetch(`/api/parinti/sportiv/${childId}/medical`).then(r => r.json()).then(d => { if (Array.isArray(d)) setMedRecords(d) })
  }, [childId])

  const fetchGalerie = useCallback(() => {
    fetch(`/api/parinti/sportiv/${childId}/galerie`).then(r => r.json()).then(d => { if (d) setGalerieData(d) })
  }, [childId])

  useEffect(() => {
    if (tab === 0) { fetchEvaluations() }
    if (tab === 1) fetchEvaluations()
    if (tab === 2) fetchAttendances()
    if (tab === 3) fetchMedical()
    if (tab === 4) fetchGalerie()
  }, [tab, fetchEvaluations, fetchAttendances, fetchMedical, fetchGalerie])

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full"></div></div>
  }

  if (!child) return <div className="text-center py-20 text-gray-500">Sportiv negasit.</div>

  const attTotal = attendances.length
  const attPresent = attendances.filter(a => a.present).length

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button onClick={() => router.push('/parinti/dashboard')} className="text-gray-400 hover:text-gray-600 text-sm mb-2">&larr; Inapoi</button>
        <h1 className="font-heading font-bold text-2xl text-dinamo-blue">{child.name}</h1>
        <p className="text-sm text-gray-500">
          An nastere: {child.birthYear}
          {child.teamName && <span className="ml-2 text-xs bg-dinamo-blue text-white px-2 py-0.5 rounded-full">{child.teamName}</span>}
        </p>
      </div>

      {/* Tabs - scrollable on mobile */}
      <div className="flex overflow-x-auto gap-1 mb-6 -mx-4 px-4 scrollbar-hide">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              tab === i ? 'bg-dinamo-red text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >{t}</button>
        ))}
      </div>

      {/* Tab: Profil */}
      {tab === 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-lg border p-3 text-center">
              <div className="text-xs text-gray-500">Inaltime</div>
              <div className="font-bold text-lg">{child.latestProfile?.height ? `${child.latestProfile.height} cm` : '-'}</div>
            </div>
            <div className="bg-white rounded-lg border p-3 text-center">
              <div className="text-xs text-gray-500">Greutate</div>
              <div className="font-bold text-lg">{child.latestProfile?.weight ? `${child.latestProfile.weight} kg` : '-'}</div>
            </div>
            <div className="bg-white rounded-lg border p-3 text-center">
              <div className="text-xs text-gray-500">Prezenta luna</div>
              <div className="font-bold text-lg">{child.attendanceMonth.percent}%</div>
            </div>
            <div className="bg-white rounded-lg border p-3 text-center">
              <div className="text-xs text-gray-500">Ultima evaluare</div>
              <div className="font-bold text-lg">{child.latestEvaluation ? ((child.latestEvaluation.physical + child.latestEvaluation.technical + child.latestEvaluation.tactical + child.latestEvaluation.mental + child.latestEvaluation.social) / 5).toFixed(1) : '-'}</div>
            </div>
          </div>
          {child.latestEvaluation && (
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-medium text-sm mb-2 text-center">Ultima evaluare</h3>
              <RadarChart current={child.latestEvaluation} />
            </div>
          )}
        </div>
      )}

      {/* Tab: Evaluari */}
      {tab === 1 && (
        <div className="space-y-6">
          {evaluations.length >= 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg border p-4">
                <h3 className="font-medium text-sm mb-2 text-center">Ultima evaluare</h3>
                <RadarChart current={evaluations[0]} previous={evaluations[1] || null} />
              </div>
              <div className="bg-white rounded-lg border p-4">
                <h3 className="font-medium text-sm mb-2 text-center">Evolutie</h3>
                <ProgressChart evaluations={evaluations} />
              </div>
            </div>
          )}
          {evaluations.length > 0 ? (
            <div className="space-y-2">
              {evaluations.map(ev => (
                <details key={ev.id} className="bg-white rounded-lg border">
                  <summary className="p-3 cursor-pointer hover:bg-gray-50 text-sm">
                    <span className="font-medium">{ev.period}</span>
                    <span className="text-gray-500 ml-2">{new Date(ev.date).toLocaleDateString('ro-RO')}</span>
                    <span className="float-right text-gray-600">Media: {((ev.physical + ev.technical + ev.tactical + ev.mental + ev.social) / 5).toFixed(1)}</span>
                  </summary>
                  <div className="px-3 pb-3 border-t text-sm space-y-1 pt-2">
                    <div className="grid grid-cols-5 gap-2 text-center">
                      <div><div className="text-xs text-gray-500">Fizic</div><div className="font-bold">{ev.physical}</div></div>
                      <div><div className="text-xs text-gray-500">Tehnic</div><div className="font-bold">{ev.technical}</div></div>
                      <div><div className="text-xs text-gray-500">Tactic</div><div className="font-bold">{ev.tactical}</div></div>
                      <div><div className="text-xs text-gray-500">Mental</div><div className="font-bold">{ev.mental}</div></div>
                      <div><div className="text-xs text-gray-500">Social</div><div className="font-bold">{ev.social}</div></div>
                    </div>
                    {ev.comments && <p className="text-gray-600 mt-2">{ev.comments}</p>}
                  </div>
                </details>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">Nu exista evaluari.</p>
          )}
        </div>
      )}

      {/* Tab: Prezente */}
      {tab === 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border p-4">
            <AttendanceCalendar
              attendances={attendances}
              month={attMonth}
              onMonthChange={m => { setAttMonth(m); fetchAttendances(m) }}
            />
          </div>
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-medium text-sm mb-3">Statistici</h3>
            <AttendanceStats total={attTotal} present={attPresent} />
          </div>
        </div>
      )}

      {/* Tab: Medical */}
      {tab === 3 && (
        <div className="bg-white rounded-lg border p-4">
          <MedicalTimeline records={medRecords} />
        </div>
      )}

      {/* Tab: Galerie */}
      {tab === 4 && (
        <PhotoGallery
          photos={galerieData.photos}
          consentRequired={galerieData.consentRequired}
          consentUrl={`/parinti/acord-foto/${childId}`}
        />
      )}
    </div>
  )
}
