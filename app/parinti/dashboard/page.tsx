'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ChildData {
  id: string
  name: string
  birthYear: number
  teamId: number | null
  teamName: string | null
  photoConsent: boolean
  photoConsentWA: boolean
  photoConsentDate: string | null
  signatureData: boolean
  sportivStats?: {
    attendancePercent: number
    lastEvalAvg: number | null
    lastEvalDate: string | null
  }
}

interface ParentData {
  id: string
  name: string
  email: string
  phone: string | null
  children: ChildData[]
}

interface PaymentRecord {
  id: string
  amount: number
  type: string
  status: string
  description: string | null
  receiptNumber: string | null
  createdAt: string
  child: { name: string } | null
}

interface DocItem {
  id: string
  title: string
  category: string
  filePath: string
  fileSize: number
  mimeType: string
  createdAt: string
  team: { grupa: string } | null
}

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

function PushNotificationToggle() {
  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window && VAPID_PUBLIC_KEY) {
      setSupported(true)
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          setSubscribed(!!sub)
          setLoading(false)
        })
      }).catch(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const handleToggle = async () => {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready

      if (subscribed) {
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          await fetch('/api/push/unsubscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          })
          await sub.unsubscribe()
        }
        setSubscribed(false)
      } else {
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        })
        const subJson = sub.toJSON()
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: subJson.endpoint,
            keys: subJson.keys,
          }),
        })
        setSubscribed(true)
      }
    } catch {
      // Permission denied or error
    }
    setLoading(false)
  }

  if (!supported) return null

  return (
    <div className="bg-white rounded-lg shadow-sm border p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-lg">Notificări push</h2>
          <p className="text-gray-500 text-sm mt-0.5">Primește notificări instant pe telefon</p>
        </div>
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`relative w-12 h-7 rounded-full transition-colors ${
            subscribed ? 'bg-green-500' : 'bg-gray-300'
          } ${loading ? 'opacity-50' : ''}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
            subscribed ? 'translate-x-5' : ''
          }`} />
        </button>
      </div>
    </div>
  )
}

function DocumentsSection() {
  const [documents, setDocuments] = useState<DocItem[]>([])
  const [loadingDocs, setLoadingDocs] = useState(true)

  useEffect(() => {
    fetch('/api/parinti/documents')
      .then(r => r.ok ? r.json() : [])
      .then(data => { setDocuments(Array.isArray(data) ? data : []); setLoadingDocs(false) })
      .catch(() => setLoadingDocs(false))
  }, [])

  const fileIcon = (mime: string) => {
    if (mime.includes('pdf')) return '📄'
    if (mime.includes('word') || mime.includes('document')) return '📝'
    if (mime.includes('excel') || mime.includes('sheet')) return '📊'
    if (mime.includes('image')) return '🖼️'
    return '📁'
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-5">
      <h2 className="font-heading font-bold text-lg mb-4">Documente</h2>
      {loadingDocs ? (
        <div className="text-center py-4">
          <div className="animate-spin w-6 h-6 border-3 border-dinamo-red border-t-transparent rounded-full mx-auto" />
        </div>
      ) : documents.length === 0 ? (
        <p className="text-gray-500 text-sm">Niciun document disponibil momentan.</p>
      ) : (
        <div className="space-y-2">
          {documents.map(doc => (
            <a
              key={doc.id}
              href={doc.filePath}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <span className="text-xl">{fileIcon(doc.mimeType)}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">{doc.title}</p>
                <p className="text-xs text-gray-400">
                  {formatSize(doc.fileSize)} &middot; {new Date(doc.createdAt).toLocaleDateString('ro-RO')}
                  {doc.team && <span className="ml-1">· {doc.team.grupa}</span>}
                </p>
              </div>
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

function PaymentsSection({ parentId, childrenList }: { parentId: string; childrenList: ChildData[] }) {
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [loadingPayments, setLoadingPayments] = useState(true)
  const [modulePlatiActive, setModulePlatiActive] = useState(false)
  const [payingChildId, setPayingChildId] = useState<string | null>(null)
  const [subscribingChildId, setSubscribingChildId] = useState<string | null>(null)
  const [openingPortal, setOpeningPortal] = useState(false)

  useEffect(() => {
    fetch('/api/modules/active')
      .then(r => r.json())
      .then(data => {
        if (data.modulePlati) {
          setModulePlatiActive(true)
          fetch(`/api/parinti-secure/plati`)
            .then(r => r.ok ? r.json() : [])
            .then(data => {
              setPayments(Array.isArray(data) ? data : [])
              setLoadingPayments(false)
            })
            .catch(() => setLoadingPayments(false))
        } else {
          setLoadingPayments(false)
        }
      })
      .catch(() => setLoadingPayments(false))
  }, [])

  const handlePayCotizatie = async (childId: string) => {
    setPayingChildId(childId)
    try {
      const res = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 200,
          type: 'cotizatie',
          childId,
          parentId,
        }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      // fail silently
    }
    setPayingChildId(null)
  }

  const handleSubscribe = async (childId: string) => {
    setSubscribingChildId(childId)
    try {
      const res = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      // fail silently
    }
    setSubscribingChildId(null)
  }

  const handleOpenPortal = async () => {
    setOpeningPortal(true)
    try {
      const res = await fetch('/api/subscriptions/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      // fail silently
    }
    setOpeningPortal(false)
  }

  if (!modulePlatiActive) return null

  return (
    <div className="bg-white rounded-lg shadow-sm border p-5">
      <h2 className="font-heading font-bold text-lg mb-4">Plati</h2>
      {childrenList.length > 0 && (
        <div className="mb-4 space-y-2">
          {childrenList.map(child => (
            <div key={child.id} className="border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{child.name}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePayCotizatie(child.id)}
                    disabled={payingChildId === child.id}
                    className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                  >
                    {payingChildId === child.id ? 'Se redirecteaza...' : 'Plata unica'}
                  </button>
                  <button
                    onClick={() => handleSubscribe(child.id)}
                    disabled={subscribingChildId === child.id}
                    className="text-xs bg-dinamo-blue text-white px-3 py-1.5 rounded-lg hover:bg-blue-800 transition-colors font-medium disabled:opacity-50"
                  >
                    {subscribingChildId === child.id ? 'Se redirecteaza...' : 'Abonament lunar'}
                  </button>
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={handleOpenPortal}
            disabled={openingPortal}
            className="mt-2 text-xs text-dinamo-blue hover:underline font-medium disabled:opacity-50"
          >
            {openingPortal ? 'Se deschide...' : 'Gestioneaza abonamente →'}
          </button>
        </div>
      )}
      {loadingPayments ? (
        <div className="text-center py-4">
          <div className="animate-spin w-6 h-6 border-3 border-dinamo-red border-t-transparent rounded-full mx-auto"></div>
        </div>
      ) : payments.length === 0 ? (
        <p className="text-gray-500 text-sm">Nicio plata inregistrata.</p>
      ) : (
        <div className="space-y-2">
          {payments.map(p => (
            <div key={p.id} className="flex items-center justify-between text-sm border-b border-gray-100 py-2">
              <div>
                <span className="capitalize font-medium">{p.type}</span>
                {p.child && <span className="text-gray-500 ml-2">- {p.child.name}</span>}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold">{p.amount.toLocaleString('ro-RO')} RON</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  p.status === 'completed' ? 'bg-green-100 text-green-700' :
                  p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {p.status === 'completed' ? 'Platit' : p.status === 'pending' ? 'In asteptare' : 'Esuat'}
                </span>
                <span className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString('ro-RO')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const [parent, setParent] = useState<ParentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingPhone, setEditingPhone] = useState(false)
  const [phone, setPhone] = useState('')
  const [savingPhone, setSavingPhone] = useState(false)
  const router = useRouter()

  const fetchData = () => {
    fetch('/api/parinti/me')
      .then(r => {
        if (r.status === 401) { router.push('/parinti'); return null }
        return r.json()
      })
      .then(data => {
        if (data && !data.error) {
          setParent(data)
          setPhone(data.phone || '')
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSavePhone = async () => {
    setSavingPhone(true)
    const res = await fetch('/api/parinti/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    })
    if (res.ok) {
      fetchData()
      setEditingPhone(false)
    }
    setSavingPhone(false)
  }

  const handleRetractConsent = async (childId: string, childName: string) => {
    if (!confirm(`Retrage acordul foto pentru ${childName}? Vei putea semna din nou oricand.`)) return
    const res = await fetch(`/api/parinti/acord-foto/${childId}`, { method: 'DELETE' })
    if (res.ok) fetchData()
  }

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!parent) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-dinamo-blue">
          Bine ai venit, {parent.name}!
        </h1>
        <p className="text-gray-600 text-sm">{parent.email}</p>
      </div>

      {/* Children Card */}
      <div className="bg-white rounded-lg shadow-sm border p-5">
        <h2 className="font-heading font-bold text-lg mb-4">Copiii mei</h2>
        {parent.children.length === 0 ? (
          <p className="text-gray-500 text-sm">Nu ai copii inregistrati. Contacteaza antrenorul pentru adaugare.</p>
        ) : (
          <div className="space-y-3">
            {parent.children.map(child => (
              <div key={child.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{child.name}</span>
                    <span className="text-gray-500 text-sm ml-2">({child.birthYear})</span>
                    {child.teamName && (
                      <span className="ml-2 text-xs bg-dinamo-blue text-white px-2 py-0.5 rounded-full">{child.teamName}</span>
                    )}
                  </div>
                  <Link href={`/parinti/sportiv/${child.id}`} className="text-xs bg-dinamo-red text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors font-medium">
                    Profil sportiv &rarr;
                  </Link>
                </div>
                {child.sportivStats && (
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <span>Prezenta: <strong className="text-gray-700">{child.sportivStats.attendancePercent}%</strong></span>
                    {child.sportivStats.lastEvalAvg !== null && (
                      <span>Ultima evaluare: <strong className="text-gray-700">{child.sportivStats.lastEvalAvg.toFixed(1)}</strong></span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Requests Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/parinti/cereri" className="block bg-white rounded-lg shadow-sm border p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading font-bold text-lg">Cererile mele</h2>
              <p className="text-gray-500 text-sm mt-0.5">Absente, transferuri si alte cereri</p>
            </div>
            <span className="text-2xl">📋</span>
          </div>
        </Link>
        <Link href="/parinti/mesaje" className="block bg-white rounded-lg shadow-sm border p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading font-bold text-lg">Mesaje</h2>
              <p className="text-gray-500 text-sm mt-0.5">Comunicare cu antrenorii si administrația</p>
            </div>
            <span className="text-2xl">💬</span>
          </div>
        </Link>
      </div>

      {/* Photo Consent Card */}
      <div className="bg-white rounded-lg shadow-sm border p-5">
        <h2 className="font-heading font-bold text-lg mb-4">Acorduri foto</h2>
        {parent.children.length === 0 ? (
          <p className="text-gray-500 text-sm">Nu ai copii inregistrati.</p>
        ) : (
          <div className="space-y-3">
            {parent.children.map(child => (
              <div key={child.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{child.name}</span>
                  {child.photoConsentDate ? (
                    <span className="text-green-600 text-sm font-medium">
                      Semnat pe {new Date(child.photoConsentDate).toLocaleDateString('ro-RO')}
                    </span>
                  ) : (
                    <span className="text-amber-600 text-sm font-medium">Nesemnat</span>
                  )}
                </div>
                <div className="flex gap-2">
                  {child.photoConsentDate ? (
                    <>
                      <Link
                        href={`/parinti/acord-foto/${child.id}`}
                        className="text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-200 transition-colors"
                      >
                        Vezi acord
                      </Link>
                      <button
                        onClick={() => handleRetractConsent(child.id, child.name)}
                        className="text-sm text-red-500 px-3 py-1.5 rounded hover:bg-red-50 transition-colors"
                      >
                        Retrage acord
                      </button>
                    </>
                  ) : (
                    <Link
                      href={`/parinti/acord-foto/${child.id}`}
                      className="text-sm bg-dinamo-red text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      Semneaza acum &rarr;
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Phone / Profile Card */}
      <div className="bg-white rounded-lg shadow-sm border p-5">
        <h2 className="font-heading font-bold text-lg mb-4">Datele mele</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Nume:</span>
            <span className="font-medium">{parent.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Email:</span>
            <span className="font-medium">{parent.email}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Telefon:</span>
            {editingPhone ? (
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm w-36"
                  placeholder="07xx xxx xxx"
                />
                <button onClick={handleSavePhone} disabled={savingPhone}
                  className="text-xs bg-dinamo-blue text-white px-2 py-1 rounded">
                  {savingPhone ? '...' : 'Salveaza'}
                </button>
                <button onClick={() => { setEditingPhone(false); setPhone(parent.phone || '') }}
                  className="text-xs text-gray-500 px-2 py-1">Anuleaza</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-medium">{parent.phone || '—'}</span>
                <button onClick={() => setEditingPhone(true)} className="text-xs text-dinamo-blue hover:underline">
                  Modifica
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Push Notifications Card */}
      <PushNotificationToggle />

      {/* Payments Card */}
      <PaymentsSection parentId={parent.id} childrenList={parent.children} />

      {/* Documents Card */}
      <DocumentsSection />
    </div>
  )
}
