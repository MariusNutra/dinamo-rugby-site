'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface ConsentData {
  childName: string
  birthYear: number
  teamName: string | null
  parentName: string
  parentEmail: string
  photoConsent: boolean
  photoConsentWA: boolean
  photoConsentDate: string | null
  hasSigned: boolean
}

export default function AcordFotoPage() {
  const params = useParams()
  const router = useRouter()
  const childId = params.childId as string
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [data, setData] = useState<ConsentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [consentSite, setConsentSite] = useState(false)
  const [consentWA, setConsentWA] = useState(false)
  const [noConsent, setNoConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)

  useEffect(() => {
    fetch(`/api/parinti/acord-foto/${childId}`)
      .then(r => {
        if (r.status === 401) { router.push('/parinti'); return null }
        if (!r.ok) { router.push('/parinti/dashboard'); return null }
        return r.json()
      })
      .then(d => {
        if (d) {
          setData(d)
          setConsentSite(d.photoConsent)
          setConsentWA(d.photoConsentWA)
        }
        setLoading(false)
      })
      .catch(() => { setLoading(false); router.push('/parinti/dashboard') })
  }, [childId, router])

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  useEffect(() => { initCanvas() }, [data, initCanvas])

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY }
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    setIsDrawing(true)
    setHasDrawn(true)
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    if (!isDrawing) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const pos = getPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }

  const stopDraw = () => setIsDrawing(false)

  const clearCanvas = () => {
    setHasDrawn(false)
    initCanvas()
  }

  const handleNoConsentChange = (checked: boolean) => {
    setNoConsent(checked)
    if (checked) { setConsentSite(false); setConsentWA(false) }
  }

  const canSubmit = hasDrawn && (consentSite || consentWA || noConsent)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!hasDrawn) { setError('Te rugam sa semnezi in caseta de semnatura.'); return }

    const canvas = canvasRef.current
    if (!canvas) return

    setSubmitting(true)
    const signatureData = canvas.toDataURL('image/png')

    try {
      const res = await fetch(`/api/parinti/acord-foto/${childId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoConsent: consentSite, photoConsentWA: consentWA, signatureData }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error || 'Eroare la salvare.')
        setSubmitting(false)
        return
      }
      router.push('/parinti/dashboard')
    } catch {
      setError('Eroare de conexiune.')
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

  if (!data) return null
  const today = new Date().toLocaleDateString('ro-RO')

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-heading text-2xl font-bold text-dinamo-blue mb-6">
        Acord foto — {data.childName}
      </h1>

      {data.hasSigned && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
          Acest acord a fost semnat pe {new Date(data.photoConsentDate!).toLocaleDateString('ro-RO')}.
          Poti semna din nou pentru a actualiza optiunile.
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border p-5 mb-6 text-sm leading-relaxed text-gray-700">
        <h2 className="font-heading font-bold text-base text-gray-900 mb-3 text-center">
          ACORD DE CONSIMTAMANT PENTRU PRELUCRAREA IMAGINII MINORULUI
        </h2>

        <p className="mb-3">
          Subsemnatul/Subsemnata <strong>{data.parentName}</strong>, in calitate de parinte/tutore legal al
          minorului <strong>{data.childName}</strong>, nascut in anul <strong>{data.birthYear}</strong>,
          legitimat la CS Dinamo Bucuresti — Sectia Rugby Juniori
          {data.teamName && <>, echipa <strong>{data.teamName}</strong></>}:
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
        )}

        <div className="bg-white rounded-lg shadow-sm border p-5 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 border">
            <input type="checkbox" checked={consentSite}
              onChange={e => { setConsentSite(e.target.checked); if (e.target.checked) setNoConsent(false) }}
              className="mt-1 w-5 h-5" />
            <span>
              <strong>ACCEPT</strong> ca imaginea copilului meu sa fie publicata pe site-ul dinamorugby.ro si pe pagina oficiala de Facebook a echipei, in scopul promovarii activitatii sportive.
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 border">
            <input type="checkbox" checked={consentWA}
              onChange={e => { setConsentWA(e.target.checked); if (e.target.checked) setNoConsent(false) }}
              className="mt-1 w-5 h-5" />
            <span>
              <strong>ACCEPT</strong> ca imaginea copilului meu sa fie distribuita in grupurile private WhatsApp ale echipei.
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 border border-red-200">
            <input type="checkbox" checked={noConsent}
              onChange={e => handleNoConsentChange(e.target.checked)}
              className="mt-1 w-5 h-5" />
            <span>
              <strong>NU ACCEPT</strong> publicarea imaginii copilului meu in niciun format.
            </span>
          </label>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-5 text-sm text-gray-600 space-y-1">
          <p>Inteleg ca:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Imaginile vor fi folosite exclusiv in scopul promovarii activitatii sportive</li>
            <li>Pot retrage acest acord oricand din portalul online sau printr-o cerere scrisa</li>
            <li>Retragerea acordului nu afecteaza legalitatea prelucrarii anterioare</li>
            <li>Datele sunt prelucrate conform Regulamentului (UE) 2016/679 (GDPR) si Legii 190/2018</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-bold text-base">Semnatura parintelui/tutorelui legal</h3>
            <button type="button" onClick={clearCanvas} className="text-sm text-gray-500 hover:text-dinamo-red">
              Sterge semnatura
            </button>
          </div>
          <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
            <canvas ref={canvasRef} width={400} height={200}
              className="w-full touch-none cursor-crosshair" style={{ maxWidth: '100%', height: 'auto' }}
              onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
              onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} />
          </div>
          <p className="text-xs text-gray-500 mt-2">Semneaza cu degetul (mobil) sau cu mouse-ul in caseta de mai sus.</p>
        </div>

        <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4">
          <p>Data: <strong>{today}</strong></p>
          <p>Parinte/Tutore: <strong>{data.parentName}</strong></p>
          <p>Pentru copilul: <strong>{data.childName}</strong></p>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={submitting || !canSubmit}
            className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-heading font-bold text-lg hover:bg-green-700 transition-colors disabled:opacity-50">
            {submitting ? 'Se salveaza...' : 'Semneaza si trimite'}
          </button>
          <button type="button" onClick={() => router.push('/parinti/dashboard')}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
            Anuleaza
          </button>
        </div>
      </form>
    </div>
  )
}
