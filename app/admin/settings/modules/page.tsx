'use client'

import { useState, useEffect } from 'react'
import { getCsrfToken } from '@/lib/csrf-client'

type PackageTier = 'starter' | 'club' | 'pro'

interface ModuleDef {
  key: string
  label: string
  description: string
  icon: string
  isNew: boolean
  canDisable: boolean
  tier: PackageTier
}

const MODULE_DEFINITIONS: ModuleDef[] = [
  { key: 'moduleHomepage', label: 'Pagina principala', description: 'Pagina de start a site-ului', icon: '🏠', isNew: false, canDisable: false, tier: 'starter' },
  { key: 'moduleEchipe', label: 'Echipe', description: 'Paginile echipelor si antrenorilor', icon: '🏉', isNew: false, canDisable: true, tier: 'starter' },
  { key: 'moduleProgram', label: 'Program', description: 'Programul de antrenamente', icon: '📅', isNew: false, canDisable: true, tier: 'starter' },
  { key: 'moduleMeciuri', label: 'Meciuri', description: 'Programul meciurilor si rezultate', icon: '🏆', isNew: false, canDisable: true, tier: 'starter' },
  { key: 'moduleGalerie', label: 'Galerie', description: 'Galeria foto a clubului', icon: '📸', isNew: false, canDisable: true, tier: 'starter' },
  { key: 'modulePovesti', label: 'Povesti', description: 'Articole si povesti ale clubului', icon: '📝', isNew: false, canDisable: true, tier: 'starter' },
  { key: 'moduleContact', label: 'Contact', description: 'Pagina de contact', icon: '✉️', isNew: false, canDisable: true, tier: 'starter' },
  { key: 'moduleDespre', label: 'Despre noi', description: 'Pagina despre club', icon: 'ℹ️', isNew: false, canDisable: true, tier: 'starter' },
  { key: 'modulePortalParinti', label: 'Portal Parinti', description: 'Portalul dedicat parintilor', icon: '👨‍👩‍👧', isNew: false, canDisable: true, tier: 'club' },
  { key: 'moduleInscrieri', label: 'Inscrieri', description: 'Formular de inscriere online', icon: '📋', isNew: true, canDisable: true, tier: 'club' },
  { key: 'moduleCalendar', label: 'Calendar', description: 'Calendar cu evenimente', icon: '🗓️', isNew: true, canDisable: true, tier: 'club' },
  { key: 'moduleNotificari', label: 'Notificari', description: 'Sistem de notificari', icon: '🔔', isNew: true, canDisable: true, tier: 'club' },
  { key: 'moduleStatistici', label: 'Statistici', description: 'Statistici publice', icon: '📊', isNew: true, canDisable: true, tier: 'club' },
  { key: 'modulePlati', label: 'Plati / Cotizatii', description: 'Sistem de plati cu Stripe', icon: '💳', isNew: true, canDisable: true, tier: 'pro' },
  { key: 'moduleFundraising', label: 'Fundraising', description: 'Campanii de strangere de fonduri', icon: '💰', isNew: true, canDisable: true, tier: 'pro' },
  { key: 'moduleMagazin', label: 'Magazin', description: 'Magazin online', icon: '🛒', isNew: true, canDisable: true, tier: 'pro' },
  { key: 'moduleVideoHighlights', label: 'Video Highlights', description: 'Clipuri video cu momente', icon: '🎬', isNew: true, canDisable: true, tier: 'pro' },
  { key: 'moduleSponsori', label: 'Sponsori', description: 'Pagina cu sponsorii clubului', icon: '🤝', isNew: true, canDisable: true, tier: 'pro' },
]

const TIER_ORDER: PackageTier[] = ['starter', 'club', 'pro']

const TIER_CONFIG: Record<PackageTier, { label: string; icon: string; description: string; borderColor: string; badgeColor: string; btnColor: string; btnActiveColor: string }> = {
  starter: {
    label: 'Starter',
    icon: '🌱',
    description: 'Functionalitati de baza pentru prezenta online',
    borderColor: 'border-gray-300',
    badgeColor: 'bg-gray-100 text-gray-700',
    btnColor: 'bg-gray-600 hover:bg-gray-700',
    btnActiveColor: 'bg-green-600',
  },
  club: {
    label: 'Club',
    icon: '🏉',
    description: 'Gestionare completa + comunicare cu parintii',
    borderColor: 'border-blue-400',
    badgeColor: 'bg-blue-100 text-blue-700',
    btnColor: 'bg-blue-600 hover:bg-blue-700',
    btnActiveColor: 'bg-green-600',
  },
  pro: {
    label: 'Pro',
    icon: '🏆',
    description: 'Toate functionalitatile inclusiv plati si magazin',
    borderColor: 'border-dinamo-red',
    badgeColor: 'bg-red-100 text-red-700',
    btnColor: 'bg-dinamo-red hover:bg-red-700',
    btnActiveColor: 'bg-green-600',
  },
}

function getModulesByTier(tier: PackageTier): ModuleDef[] {
  return MODULE_DEFINITIONS.filter(m => m.tier === tier)
}

function getIncludedTiers(tier: PackageTier): PackageTier[] {
  const idx = TIER_ORDER.indexOf(tier)
  return TIER_ORDER.slice(0, idx)
}

function getIncludedModuleCount(tier: PackageTier): number {
  const included = getIncludedTiers(tier)
  return included.reduce((sum, t) => sum + getModulesByTier(t).length, 0)
}

function detectActiveTier(settings: Record<string, boolean>): PackageTier {
  const proModules = getModulesByTier('pro')
  const clubModules = getModulesByTier('club')

  if (proModules.every(m => settings[m.key])) return 'pro'
  if (clubModules.every(m => settings[m.key])) return 'club'
  return 'starter'
}

export default function ModulesSettingsPage() {
  const [settings, setSettings] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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

  const saveModules = async (newSettings: Record<string, boolean>) => {
    setSettings(newSettings)
    try {
      const res = await fetch('/api/admin/settings/modules', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': getCsrfToken(),
        },
        body: JSON.stringify(newSettings),
      })
      if (!res.ok) {
        showToast('Eroare la salvare', 'err')
        return false
      }
      window.dispatchEvent(new Event('modules-changed'))
      return true
    } catch {
      showToast('Eroare la salvare', 'err')
      return false
    }
  }

  const toggleModule = async (key: string) => {
    const newValue = !settings[key]
    const prev = { ...settings }
    const newSettings = { ...settings, [key]: newValue }
    setSettings(newSettings)

    const ok = await saveModules(newSettings)
    if (!ok) {
      setSettings(prev)
    } else {
      showToast(newValue ? 'Modul activat' : 'Modul dezactivat')
    }
  }

  const selectTier = async (tier: PackageTier) => {
    setSaving(true)
    const newSettings: Record<string, boolean> = {}
    const tierIdx = TIER_ORDER.indexOf(tier)

    for (const mod of MODULE_DEFINITIONS) {
      const modTierIdx = TIER_ORDER.indexOf(mod.tier)
      if (!mod.canDisable) {
        newSettings[mod.key] = true
      } else {
        newSettings[mod.key] = modTierIdx <= tierIdx
      }
    }

    const ok = await saveModules(newSettings)
    setSaving(false)
    if (ok) {
      showToast(`Pachet ${TIER_CONFIG[tier].label} activat cu succes!`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
      </div>
    )
  }

  const activeTier = detectActiveTier(settings)

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl font-bold text-dinamo-blue">Module Site</h1>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${TIER_CONFIG[activeTier].badgeColor}`}>
              {TIER_CONFIG[activeTier].icon} {TIER_CONFIG[activeTier].label}
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-1">Alege un pachet sau configureaza modulele individual</p>
        </div>
      </div>

      {/* Package cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {TIER_ORDER.map(tier => {
          const config = TIER_CONFIG[tier]
          const modules = getModulesByTier(tier)
          const isActiveTier = activeTier === tier
          const includedCount = getIncludedModuleCount(tier)
          const includedTiers = getIncludedTiers(tier)

          return (
            <div key={tier}
              className={`bg-white rounded-xl border-2 transition-all ${
                isActiveTier ? `${config.borderColor} shadow-lg ring-2 ring-offset-2 ${tier === 'pro' ? 'ring-dinamo-red/30' : tier === 'club' ? 'ring-blue-400/30' : 'ring-gray-300/30'}` : `${config.borderColor} shadow-sm`
              }`}>
              {/* Card header */}
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{config.icon}</span>
                  <h2 className="font-heading font-bold text-lg">{config.label}</h2>
                </div>
                <p className="text-sm text-gray-500">{config.description}</p>
              </div>

              {/* Included tiers note */}
              {includedCount > 0 && (
                <div className="px-5 py-2 bg-gray-50 text-xs text-gray-500 border-b border-gray-100">
                  + {includedCount} module din {includedTiers.map(t => TIER_CONFIG[t].label).join(' si ')}
                </div>
              )}

              {/* Module list */}
              <div className="px-5 py-3">
                {modules.map(mod => (
                  <div key={mod.key} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base flex-shrink-0">{mod.icon}</span>
                      <span className="text-sm text-gray-700 truncate">{mod.label}</span>
                      {mod.isNew && (
                        <span className="text-[10px] font-bold bg-dinamo-red text-white px-1.5 py-0.5 rounded-full uppercase flex-shrink-0">
                          Nou
                        </span>
                      )}
                      {!mod.canDisable && (
                        <span className="text-[10px] font-bold bg-gray-400 text-white px-1.5 py-0.5 rounded-full flex-shrink-0">
                          Mereu activ
                        </span>
                      )}
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-3 flex-shrink-0">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings[mod.key] ?? false}
                        disabled={!mod.canDisable || saving}
                        onChange={() => toggleModule(mod.key)}
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-dinamo-red/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                    </label>
                  </div>
                ))}
              </div>

              {/* Action button */}
              <div className="px-5 py-4 border-t border-gray-100">
                {isActiveTier ? (
                  <button disabled
                    className={`w-full py-2.5 rounded-lg text-sm font-bold text-white ${config.btnActiveColor} cursor-default`}>
                    Pachet activ
                  </button>
                ) : (
                  <button
                    onClick={() => selectTier(tier)}
                    disabled={saving}
                    className={`w-full py-2.5 rounded-lg text-sm font-bold text-white ${config.btnColor} transition-colors disabled:opacity-50`}>
                    {saving ? 'Se salveaza...' : `Activeaza ${config.label}`}
                  </button>
                )}
              </div>
            </div>
          )
        })}
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
