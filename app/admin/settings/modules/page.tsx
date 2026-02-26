'use client'

import { useState, useEffect } from 'react'
import { getCsrfToken } from '@/lib/csrf-client'

interface ModuleDef {
  key: string
  label: string
  description: string
  icon: string
  isNew: boolean
  canDisable: boolean
}

const MODULE_DEFINITIONS: ModuleDef[] = [
  { key: 'moduleHomepage', label: 'Pagina principala', description: 'Pagina de start a site-ului', icon: '🏠', isNew: false, canDisable: false },
  { key: 'moduleEchipe', label: 'Echipe', description: 'Paginile echipelor si antrenorilor', icon: '🏉', isNew: false, canDisable: true },
  { key: 'moduleProgram', label: 'Program', description: 'Programul de antrenamente', icon: '📅', isNew: false, canDisable: true },
  { key: 'moduleMeciuri', label: 'Meciuri', description: 'Programul meciurilor si rezultate', icon: '🏆', isNew: false, canDisable: true },
  { key: 'moduleGalerie', label: 'Galerie', description: 'Galeria foto a clubului', icon: '📸', isNew: false, canDisable: true },
  { key: 'modulePovesti', label: 'Povesti', description: 'Articole si povesti ale clubului', icon: '📝', isNew: false, canDisable: true },
  { key: 'moduleContact', label: 'Contact', description: 'Pagina de contact', icon: '✉️', isNew: false, canDisable: true },
  { key: 'moduleDespre', label: 'Despre noi', description: 'Pagina despre club', icon: 'ℹ️', isNew: false, canDisable: true },
  { key: 'modulePortalParinti', label: 'Portal Parinti', description: 'Portalul dedicat parintilor', icon: '👨‍👩‍👧', isNew: false, canDisable: true },
  { key: 'moduleFundraising', label: 'Fundraising', description: 'Campanii de strangere de fonduri', icon: '💰', isNew: true, canDisable: true },
  { key: 'modulePlati', label: 'Plati / Cotizatii', description: 'Sistem de plati cu Stripe', icon: '💳', isNew: true, canDisable: true },
  { key: 'moduleInscrieri', label: 'Inscrieri', description: 'Formular de inscriere online', icon: '📋', isNew: true, canDisable: true },
  { key: 'moduleCalendar', label: 'Calendar', description: 'Calendar cu evenimente', icon: '🗓️', isNew: true, canDisable: true },
  { key: 'moduleNotificari', label: 'Notificari', description: 'Sistem de notificari', icon: '🔔', isNew: true, canDisable: true },
  { key: 'moduleStatistici', label: 'Statistici', description: 'Statistici publice', icon: '📊', isNew: true, canDisable: true },
  { key: 'moduleMagazin', label: 'Magazin', description: 'Magazin online', icon: '🛒', isNew: true, canDisable: true },
  { key: 'moduleVideoHighlights', label: 'Video Highlights', description: 'Clipuri video cu momente', icon: '🎬', isNew: true, canDisable: true },
  { key: 'moduleSponsori', label: 'Sponsori', description: 'Pagina cu sponsorii clubului', icon: '🤝', isNew: true, canDisable: true },
]

export default function ModulesSettingsPage() {
  const [settings, setSettings] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => {
    fetch('/api/admin/settings/modules')
      .then(r => r.json())
      .then(data => {
        const s: Record<string, boolean> = {}
        for (const mod of MODULE_DEFINITIONS) {
          s[mod.key] = data[mod.key] ?? false
        }
        setSettings(s)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const toggleModule = async (key: string) => {
    const newValue = !settings[key]
    setSettings(prev => ({ ...prev, [key]: newValue }))

    try {
      const res = await fetch('/api/admin/settings/modules', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': getCsrfToken(),
        },
        body: JSON.stringify({ [key]: newValue }),
      })

      if (!res.ok) {
        setSettings(prev => ({ ...prev, [key]: !newValue }))
        showToast('Eroare la salvare', 'err')
        return
      }

      showToast(newValue ? 'Modul activat' : 'Modul dezactivat')
      // Notify admin layout to refresh sidebar
      window.dispatchEvent(new Event('modules-changed'))
    } catch {
      setSettings(prev => ({ ...prev, [key]: !newValue }))
      showToast('Eroare la salvare', 'err')
    }
  }

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-dinamo-blue">Module Site</h1>
          <p className="text-gray-500 text-sm mt-1">Activeaza sau dezactiveaza sectiunile site-ului</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MODULE_DEFINITIONS.map(mod => (
          <div
            key={mod.key}
            className={`bg-white rounded-lg shadow-sm border p-4 transition-all ${
              settings[mod.key] ? 'border-green-200 bg-green-50/30' : 'border-gray-200 opacity-75'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{mod.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-bold text-sm">{mod.label}</h3>
                    {mod.isNew && (
                      <span className="text-[10px] font-bold bg-dinamo-red text-white px-1.5 py-0.5 rounded-full uppercase">
                        Nou
                      </span>
                    )}
                    {!mod.canDisable && (
                      <span className="text-[10px] font-bold bg-gray-400 text-white px-1.5 py-0.5 rounded-full">
                        Mereu activ
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{mod.description}</p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer ml-3 flex-shrink-0">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings[mod.key] ?? false}
                  disabled={!mod.canDisable}
                  onChange={() => toggleModule(mod.key)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-dinamo-red/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
              </label>
            </div>
          </div>
        ))}
      </div>

      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium z-50 transition-all ${
          toast.type === 'ok' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
