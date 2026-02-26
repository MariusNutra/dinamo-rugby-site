'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import EvalSlider from '@/components/sportiv/EvalSlider'
import AttendanceCalendar from '@/components/sportiv/AttendanceCalendar'
import AttendanceStats from '@/components/sportiv/AttendanceStats'
import MedicalTimeline from '@/components/sportiv/MedicalTimeline'
import PhotoGallery from '@/components/sportiv/PhotoGallery'

const RadarChart = dynamic(() => import('@/components/sportiv/RadarChart'), { ssr: false })
const ProgressChart = dynamic(() => import('@/components/sportiv/ProgressChart'), { ssr: false })
const PhysicalChart = dynamic(() => import('@/components/sportiv/PhysicalChart'), { ssr: false })

interface ChildInfo {
  id: string; name: string; birthYear: number; teamId: number | null
  team?: { grupa: string } | null; photoConsent: boolean
}

const TABS = ['Profil Fizic', 'Evaluari', 'Prezente', 'Medical', 'Galerie']

export default function AdminSportivPage() {
  const { childId } = useParams<{ childId: string }>()
  const [child, setChild] = useState<ChildInfo | null>(null)
  const [tab, setTab] = useState(0)
  const [loading, setLoading] = useState(true)

  // Profil fizic state
  const [profiles, setProfiles] = useState<{ id: string; date: string; height: number | null; weight: number | null; position: string | null; notes: string | null }[]>([])
  const [pfForm, setPfForm] = useState({ height: '', weight: '', position: '', notes: '' })
  const [pfSaving, setPfSaving] = useState(false)

  // Evaluari state
  const [evaluations, setEvaluations] = useState<{ id: string; date: string; period: string; physical: number; technical: number; tactical: number; mental: number; social: number; comments: string | null }[]>([])
  const [evalForm, setEvalForm] = useState({ period: '', physical: 5, technical: 5, tactical: 5, mental: 5, social: 5, comments: '' })
  const [evalSaving, setEvalSaving] = useState(false)

  // Prezente state
  const [attendances, setAttendances] = useState<{ date: string; present: boolean; type?: string }[]>([])
  const [attMonth, setAttMonth] = useState('')

  // Medical state
  const [medRecords, setMedRecords] = useState<{ id: string; date: string; type: string; description: string; severity: string | null; returnDate: string | null; resolved: boolean }[]>([])
  const [medForm, setMedForm] = useState({ type: '', description: '', severity: '', returnDate: '' })
  const [medSaving, setMedSaving] = useState(false)

  // Galerie state
  const [photos, setPhotos] = useState<{ id: string; url: string; caption: string | null; event: string | null; date: string | null }[]>([])
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadCaption, setUploadCaption] = useState('')
  const [uploading, setUploading] = useState(false)

  // Fetch child info
  useEffect(() => {
    fetch('/api/admin/parinti').then(r => r.json()).then(data => {
      if (!Array.isArray(data)) return
      for (const p of data) {
        const c = p.children?.find((c: { id: string }) => c.id === childId)
        if (c) {
          setChild({ ...c, team: c.teamName ? { grupa: c.teamName } : null })
          break
        }
      }
      setLoading(false)
    })
  }, [childId])

  const fetchProfiles = useCallback(() => {
    fetch(`/api/admin/sportivi/${childId}/profil-fizic`).then(r => r.json()).then(d => { if (Array.isArray(d)) setProfiles(d) })
  }, [childId])

  const fetchEvaluations = useCallback(() => {
    fetch(`/api/admin/evaluari?childId=${childId}`).then(r => r.json()).then(d => { if (Array.isArray(d)) setEvaluations(d) })
  }, [childId])

  const fetchAttendances = useCallback((month?: string) => {
    const q = month ? `?childId=${childId}&month=${month}` : `?childId=${childId}`
    fetch(`/api/admin/prezente${q}`).then(r => r.json()).then(d => { if (Array.isArray(d)) setAttendances(d) })
  }, [childId])

  const fetchMedical = useCallback(() => {
    fetch(`/api/admin/sportivi/${childId}/medical`).then(r => r.json()).then(d => { if (Array.isArray(d)) setMedRecords(d) })
  }, [childId])

  const fetchPhotos = useCallback(() => {
    fetch(`/api/admin/sportivi/${childId}/galerie`).then(r => r.json()).then(d => { if (Array.isArray(d)) setPhotos(d) })
  }, [childId])

  useEffect(() => {
    if (tab === 0) fetchProfiles()
    if (tab === 1) fetchEvaluations()
    if (tab === 2) fetchAttendances()
    if (tab === 3) fetchMedical()
    if (tab === 4) fetchPhotos()
  }, [tab, fetchProfiles, fetchEvaluations, fetchAttendances, fetchMedical, fetchPhotos])

  // Handlers
  const handleAddProfile = async () => {
    setPfSaving(true)
    await fetch(`/api/admin/sportivi/${childId}/profil-fizic`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ height: pfForm.height || null, weight: pfForm.weight || null, position: pfForm.position || null, notes: pfForm.notes || null }),
    })
    setPfForm({ height: '', weight: '', position: '', notes: '' })
    fetchProfiles()
    setPfSaving(false)
  }

  const handleDeleteProfile = async (id: string) => {
    if (!confirm('Sterge acest profil fizic?')) return
    await fetch(`/api/admin/sportivi/${childId}/profil-fizic/${id}`, { method: 'DELETE' })
    fetchProfiles()
  }

  const handleAddEval = async () => {
    if (!evalForm.period) return
    setEvalSaving(true)
    await fetch('/api/admin/evaluari', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ childId, ...evalForm }),
    })
    setEvalForm({ period: '', physical: 5, technical: 5, tactical: 5, mental: 5, social: 5, comments: '' })
    fetchEvaluations()
    setEvalSaving(false)
  }

  const handleDeleteEval = async (id: string) => {
    if (!confirm('Sterge aceasta evaluare?')) return
    await fetch(`/api/admin/evaluari/${id}`, { method: 'DELETE' })
    fetchEvaluations()
  }

  const handleAddMedical = async () => {
    if (!medForm.type || !medForm.description) return
    setMedSaving(true)
    await fetch(`/api/admin/sportivi/${childId}/medical`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(medForm),
    })
    setMedForm({ type: '', description: '', severity: '', returnDate: '' })
    fetchMedical()
    setMedSaving(false)
  }

  const handleResolveMedical = async (id: string) => {
    await fetch(`/api/admin/sportivi/${childId}/medical/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolved: true }),
    })
    fetchMedical()
  }

  const handleDeleteMedical = async (id: string) => {
    if (!confirm('Sterge aceasta inregistrare?')) return
    await fetch(`/api/admin/sportivi/${childId}/medical/${id}`, { method: 'DELETE' })
    fetchMedical()
  }

  const handleUploadPhoto = async () => {
    if (!uploadFile) return
    setUploading(true)
    const form = new FormData()
    form.append('file', uploadFile)
    if (uploadCaption) form.append('caption', uploadCaption)
    const res = await fetch(`/api/admin/sportivi/${childId}/galerie`, { method: 'POST', body: form })
    if (!res.ok) {
      const err = await res.json()
      alert(err.error || 'Eroare la upload')
    }
    setUploadFile(null)
    setUploadCaption('')
    fetchPhotos()
    setUploading(false)
  }

  const handleDeletePhoto = async (id: string) => {
    if (!confirm('Sterge aceasta fotografie?')) return
    await fetch(`/api/admin/sportivi/${childId}/galerie/${id}`, { method: 'DELETE' })
    fetchPhotos()
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full"></div></div>
  }

  if (!child) {
    return <div className="text-center py-20 text-gray-500">Sportiv negasit. <Link href="/admin/sportivi" className="text-dinamo-blue hover:underline">Inapoi la lista</Link></div>
  }

  const attTotal = attendances.length
  const attPresent = attendances.filter(a => a.present).length

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/sportivi" className="text-gray-400 hover:text-gray-600">&larr;</Link>
        <div>
          <h1 className="font-heading font-bold text-2xl">{child.name}</h1>
          <p className="text-sm text-gray-500">
            An nastere: {child.birthYear}
            {child.team && <span className="ml-2 text-xs bg-dinamo-blue text-white px-2 py-0.5 rounded-full">{child.team.grupa}</span>}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-1 mb-6 -mx-4 px-4">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              tab === i ? 'bg-dinamo-red text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >{t}</button>
        ))}
      </div>

      {/* Tab: Profil Fizic */}
      {tab === 0 && (
        <div className="space-y-6">
          <PhysicalChart profiles={profiles} />
          {/* Add form */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-medium text-sm mb-3">Adauga masuratori</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <input type="number" placeholder="Inaltime (cm)" value={pfForm.height} onChange={e => setPfForm(p => ({ ...p, height: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
              <input type="number" placeholder="Greutate (kg)" value={pfForm.weight} onChange={e => setPfForm(p => ({ ...p, weight: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
              <select value={pfForm.position} onChange={e => setPfForm(p => ({ ...p, position: e.target.value }))} className="border rounded px-3 py-2 text-sm bg-white">
                <option value="">Pozitie...</option>
                <option value="Pilon stanga">Pilon stanga</option>
                <option value="Talonat">Talonat</option>
                <option value="Pilon dreapta">Pilon dreapta</option>
                <option value="A doua linie">A doua linie</option>
                <option value="Flanker">Flanker</option>
                <option value="Nr. 8">Nr. 8</option>
                <option value="Mijlocas la gramada">Mijlocas la gramada</option>
                <option value="Deschizator">Deschizator</option>
                <option value="Centru">Centru</option>
                <option value="Aripa">Aripa</option>
                <option value="Fundas">Fundas</option>
              </select>
              <input type="text" placeholder="Note" value={pfForm.notes} onChange={e => setPfForm(p => ({ ...p, notes: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
            </div>
            <button onClick={handleAddProfile} disabled={pfSaving} className="mt-3 bg-dinamo-blue text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50">
              {pfSaving ? 'Se salveaza...' : 'Adauga'}
            </button>
          </div>
          {/* Table */}
          {profiles.length > 0 && (
            <div className="bg-white rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50"><tr>
                  <th className="text-left p-3 font-medium">Data</th>
                  <th className="text-center p-3 font-medium">Inaltime</th>
                  <th className="text-center p-3 font-medium">Greutate</th>
                  <th className="text-left p-3 font-medium">Pozitie</th>
                  <th className="p-3"></th>
                </tr></thead>
                <tbody>
                  {profiles.map(p => (
                    <tr key={p.id} className="border-t">
                      <td className="p-3">{new Date(p.date).toLocaleDateString('ro-RO')}</td>
                      <td className="p-3 text-center">{p.height ? `${p.height} cm` : '-'}</td>
                      <td className="p-3 text-center">{p.weight ? `${p.weight} kg` : '-'}</td>
                      <td className="p-3">{p.position || '-'}</td>
                      <td className="p-3 text-right"><button onClick={() => handleDeleteProfile(p.id)} className="text-red-500 text-xs">Sterge</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
          {/* Add eval form */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-medium text-sm mb-3">Adauga evaluare</h3>
            <input type="text" placeholder="Perioada (ex: T1 2026)" value={evalForm.period} onChange={e => setEvalForm(f => ({ ...f, period: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm mb-3" />
            <div className="space-y-2">
              {(['physical', 'technical', 'tactical', 'mental', 'social'] as const).map(k => (
                <EvalSlider key={k} label={{ physical: 'Fizic', technical: 'Tehnic', tactical: 'Tactic', mental: 'Mental', social: 'Social' }[k]} value={evalForm[k]} onChange={v => setEvalForm(f => ({ ...f, [k]: v }))} />
              ))}
            </div>
            <textarea placeholder="Comentarii" value={evalForm.comments} onChange={e => setEvalForm(f => ({ ...f, comments: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm mt-3" rows={2} />
            <button onClick={handleAddEval} disabled={evalSaving || !evalForm.period} className="mt-3 bg-dinamo-blue text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50">
              {evalSaving ? 'Se salveaza...' : 'Adauga evaluare'}
            </button>
          </div>
          {/* Table */}
          {evaluations.length > 0 && (
            <div className="bg-white rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50"><tr>
                  <th className="text-left p-3 font-medium">Perioada</th>
                  <th className="text-left p-3 font-medium">Data</th>
                  <th className="text-center p-3 font-medium">F</th>
                  <th className="text-center p-3 font-medium">Te</th>
                  <th className="text-center p-3 font-medium">Ta</th>
                  <th className="text-center p-3 font-medium">M</th>
                  <th className="text-center p-3 font-medium">S</th>
                  <th className="p-3"></th>
                </tr></thead>
                <tbody>
                  {evaluations.map(ev => (
                    <tr key={ev.id} className="border-t">
                      <td className="p-3">{ev.period}</td>
                      <td className="p-3 text-gray-600">{new Date(ev.date).toLocaleDateString('ro-RO')}</td>
                      <td className="p-3 text-center">{ev.physical}</td>
                      <td className="p-3 text-center">{ev.technical}</td>
                      <td className="p-3 text-center">{ev.tactical}</td>
                      <td className="p-3 text-center">{ev.mental}</td>
                      <td className="p-3 text-center">{ev.social}</td>
                      <td className="p-3 text-right"><button onClick={() => handleDeleteEval(ev.id)} className="text-red-500 text-xs">Sterge</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
        <div className="space-y-6">
          <MedicalTimeline records={medRecords} onResolve={handleResolveMedical} onDelete={handleDeleteMedical} />
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-medium text-sm mb-3">Adauga inregistrare medicala</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select value={medForm.type} onChange={e => setMedForm(f => ({ ...f, type: e.target.value }))} className="border rounded px-3 py-2 text-sm">
                <option value="">Tip...</option>
                <option value="Accidentare">Accidentare</option>
                <option value="Viza medicala">Viza medicala</option>
                <option value="Alergie">Alergie</option>
                <option value="Altul">Altul</option>
              </select>
              <select value={medForm.severity} onChange={e => setMedForm(f => ({ ...f, severity: e.target.value }))} className="border rounded px-3 py-2 text-sm">
                <option value="">Severitate...</option>
                <option value="Usoara">Usoara</option>
                <option value="Moderata">Moderata</option>
                <option value="Severa">Severa</option>
              </select>
              <textarea placeholder="Descriere" value={medForm.description} onChange={e => setMedForm(f => ({ ...f, description: e.target.value }))} className="border rounded px-3 py-2 text-sm md:col-span-2" rows={2} />
              <div>
                <label className="text-xs text-gray-500">Data revenire (optional)</label>
                <input type="date" value={medForm.returnDate} onChange={e => setMedForm(f => ({ ...f, returnDate: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" />
              </div>
            </div>
            <button onClick={handleAddMedical} disabled={medSaving || !medForm.type || !medForm.description} className="mt-3 bg-dinamo-blue text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50">
              {medSaving ? 'Se salveaza...' : 'Adauga'}
            </button>
          </div>
        </div>
      )}

      {/* Tab: Galerie */}
      {tab === 4 && (
        <div className="space-y-6">
          {!child.photoConsent && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
              Acest copil nu are acord foto semnat. Upload-ul nu este permis.
            </div>
          )}
          {child.photoConsent && (
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-medium text-sm mb-3">Upload fotografie</h3>
              <div className="flex flex-col md:flex-row gap-3">
                <input type="file" accept="image/*" onChange={e => setUploadFile(e.target.files?.[0] || null)} className="text-sm" />
                <input type="text" placeholder="Legenda (optional)" value={uploadCaption} onChange={e => setUploadCaption(e.target.value)} className="border rounded px-3 py-2 text-sm flex-1" />
                <button onClick={handleUploadPhoto} disabled={uploading || !uploadFile} className="bg-dinamo-blue text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50">
                  {uploading ? 'Se incarca...' : 'Upload'}
                </button>
              </div>
            </div>
          )}
          <PhotoGallery photos={photos} onDelete={handleDeletePhoto} />
        </div>
      )}
    </div>
  )
}
