'use client'

import { useState, useEffect } from 'react'
import { getCsrfToken } from '@/lib/csrf-client'

interface BrandingData {
  logo: string | null
  primaryColor: string
  secondaryColor: string
  accentColor: string
  fontFamily: string
  heroTitle: string | null
  heroSubtitle: string | null
  clubName: string
  clubAddress: string | null
  clubPhone: string | null
  clubEmail: string | null
  favicon: string | null
  ogImage: string | null
}

const DEFAULTS: BrandingData = {
  logo: null,
  primaryColor: '#dc2626',
  secondaryColor: '#1e3a5f',
  accentColor: '#f59e0b',
  fontFamily: 'Montserrat',
  heroTitle: null,
  heroSubtitle: null,
  clubName: 'CS Dinamo București Rugby',
  clubAddress: null,
  clubPhone: null,
  clubEmail: null,
  favicon: null,
  ogImage: null,
}

const FONT_OPTIONS = [
  'Montserrat',
  'Inter',
  'Roboto',
  'Poppins',
  'Open Sans',
  'Lato',
]

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (val: string) => void
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const v = e.target.value
            if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v)
          }}
          placeholder="#000000"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-red-500 focus:border-red-500"
          maxLength={7}
        />
        <div
          className="w-10 h-10 rounded-lg border border-gray-200 shadow-inner flex-shrink-0"
          style={{ backgroundColor: value }}
        />
      </div>
    </div>
  )
}

export default function BrandingSettingsPage() {
  const [data, setData] = useState<BrandingData>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => {
    fetch('/api/admin/settings/branding')
      .then((r) => r.json())
      .then((res) => {
        setData({
          logo: res.logo ?? null,
          primaryColor: res.primaryColor ?? DEFAULTS.primaryColor,
          secondaryColor: res.secondaryColor ?? DEFAULTS.secondaryColor,
          accentColor: res.accentColor ?? DEFAULTS.accentColor,
          fontFamily: res.fontFamily ?? DEFAULTS.fontFamily,
          heroTitle: res.heroTitle ?? null,
          heroSubtitle: res.heroSubtitle ?? null,
          clubName: res.clubName ?? DEFAULTS.clubName,
          clubAddress: res.clubAddress ?? null,
          clubPhone: res.clubPhone ?? null,
          clubEmail: res.clubEmail ?? null,
          favicon: res.favicon ?? null,
          ogImage: res.ogImage ?? null,
        })
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  const update = <K extends keyof BrandingData>(key: K, value: BrandingData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings/branding', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': getCsrfToken(),
        },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        showToast('Eroare la salvare', 'err')
      } else {
        showToast('Setarile de branding au fost salvate!')
      }
    } catch {
      showToast('Eroare la salvare', 'err')
    }
    setSaving(false)
  }

  const resetColors = () => {
    setData((prev) => ({
      ...prev,
      primaryColor: DEFAULTS.primaryColor,
      secondaryColor: DEFAULTS.secondaryColor,
      accentColor: DEFAULTS.accentColor,
    }))
  }

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-dinamo-blue">Branding & Identitate</h1>
          <p className="text-gray-500 text-sm mt-1">Personalizeaza aspectul site-ului clubului tau</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column: Form */}
        <div className="xl:col-span-2 space-y-6">
          {/* Identitate Club */}
          <section className="bg-white rounded-xl shadow-md p-6">
            <h2 className="font-heading font-bold text-lg text-dinamo-blue mb-4">Identitate Club</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nume Club</label>
                <input
                  type="text"
                  value={data.clubName}
                  onChange={(e) => update('clubName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="CS Dinamo București Rugby"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Logo URL</label>
                <input
                  type="url"
                  value={data.logo ?? ''}
                  onChange={(e) => update('logo', e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="https://exemplu.ro/logo.png"
                />
                {data.logo && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg inline-block">
                    <img
                      src={data.logo}
                      alt="Logo preview"
                      className="max-h-16 max-w-[200px] object-contain"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Favicon URL</label>
                <input
                  type="url"
                  value={data.favicon ?? ''}
                  onChange={(e) => update('favicon', e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="https://exemplu.ro/favicon.ico"
                />
                {data.favicon && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg inline-flex items-center gap-2">
                    <img
                      src={data.favicon}
                      alt="Favicon preview"
                      className="w-8 h-8 object-contain"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                    <span className="text-xs text-gray-500">32x32 recomandat</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">OG Image URL</label>
                <input
                  type="url"
                  value={data.ogImage ?? ''}
                  onChange={(e) => update('ogImage', e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="https://exemplu.ro/og-image.jpg"
                />
                <p className="text-xs text-gray-400 mt-1">Imaginea care apare cand distribui link-ul pe social media (1200x630 recomandat)</p>
                {data.ogImage && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg inline-block">
                    <img
                      src={data.ogImage}
                      alt="OG Image preview"
                      className="max-h-24 max-w-[300px] object-contain rounded"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Culori */}
          <section className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-bold text-lg text-dinamo-blue">Culori</h2>
              <button
                type="button"
                onClick={resetColors}
                className="text-xs text-gray-500 hover:text-dinamo-red transition-colors underline"
              >
                Reseteaza la valori implicite
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <ColorPicker
                label="Culoare Principala"
                value={data.primaryColor}
                onChange={(v) => update('primaryColor', v)}
              />
              <ColorPicker
                label="Culoare Secundara"
                value={data.secondaryColor}
                onChange={(v) => update('secondaryColor', v)}
              />
              <ColorPicker
                label="Culoare Accent"
                value={data.accentColor}
                onChange={(v) => update('accentColor', v)}
              />
            </div>
          </section>

          {/* Tipografie */}
          <section className="bg-white rounded-xl shadow-md p-6">
            <h2 className="font-heading font-bold text-lg text-dinamo-blue mb-4">Tipografie</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Familie Font</label>
              <select
                value={data.fontFamily}
                onChange={(e) => update('fontFamily', e.target.value)}
                className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-400 mb-2">Preview font:</p>
              <p
                className="text-2xl font-bold text-gray-800"
                style={{ fontFamily: `'${data.fontFamily}', sans-serif` }}
              >
                {data.clubName || 'Numele Clubului Tau'}
              </p>
              <p
                className="text-base text-gray-600 mt-1"
                style={{ fontFamily: `'${data.fontFamily}', sans-serif` }}
              >
                Aceasta este o previzualizare a fontului selectat pentru site-ul clubului.
              </p>
            </div>
          </section>

          {/* Hero Section */}
          <section className="bg-white rounded-xl shadow-md p-6">
            <h2 className="font-heading font-bold text-lg text-dinamo-blue mb-4">Hero Section</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Titlu Hero</label>
                <input
                  type="text"
                  value={data.heroTitle ?? ''}
                  onChange={(e) => update('heroTitle', e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="CS Dinamo București Rugby"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Subtitlu Hero</label>
                <textarea
                  value={data.heroSubtitle ?? ''}
                  onChange={(e) => update('heroSubtitle', e.target.value || null)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-y"
                  placeholder="Descrie clubul tau in cateva cuvinte..."
                />
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-white rounded-xl shadow-md p-6">
            <h2 className="font-heading font-bold text-lg text-dinamo-blue mb-4">Contact</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresa Club</label>
                <input
                  type="text"
                  value={data.clubAddress ?? ''}
                  onChange={(e) => update('clubAddress', e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Str. Stadionului nr. 1, București"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefon</label>
                  <input
                    type="tel"
                    value={data.clubPhone ?? ''}
                    onChange={(e) => update('clubPhone', e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="+40 7XX XXX XXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={data.clubEmail ?? ''}
                    onChange={(e) => update('clubEmail', e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="contact@club.ro"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-dinamo-red text-white font-bold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 shadow-md"
            >
              {saving ? 'Se salveaza...' : 'Salveaza Setarile'}
            </button>
          </div>
        </div>

        {/* Right column: Live Preview */}
        <div className="xl:col-span-1">
          <div className="sticky top-4 space-y-4">
            <h2 className="font-heading font-bold text-lg text-dinamo-blue">Previzualizare Live</h2>

            {/* Mini website mockup */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
              {/* Mini header bar */}
              <div
                className="px-4 py-3 flex items-center gap-2"
                style={{ backgroundColor: data.secondaryColor }}
              >
                {data.logo ? (
                  <img
                    src={data.logo}
                    alt="Logo"
                    className="w-6 h-6 object-contain rounded"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                ) : (
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: data.primaryColor }}
                  >
                    {data.clubName?.charAt(0) || 'C'}
                  </div>
                )}
                <span
                  className="text-white text-sm font-bold truncate"
                  style={{ fontFamily: `'${data.fontFamily}', sans-serif` }}
                >
                  {data.clubName || 'Numele Clubului'}
                </span>
              </div>

              {/* Mini hero area */}
              <div
                className="px-4 py-6 text-center"
                style={{
                  background: `linear-gradient(135deg, ${data.secondaryColor} 0%, ${data.primaryColor} 100%)`,
                }}
              >
                <h3
                  className="text-white font-bold text-base leading-tight"
                  style={{ fontFamily: `'${data.fontFamily}', sans-serif` }}
                >
                  {data.heroTitle || data.clubName || 'Titlu Hero'}
                </h3>
                {(data.heroSubtitle) && (
                  <p
                    className="text-white/80 text-xs mt-1"
                    style={{ fontFamily: `'${data.fontFamily}', sans-serif` }}
                  >
                    {data.heroSubtitle}
                  </p>
                )}
              </div>

              {/* Content preview */}
              <div className="px-4 py-4 space-y-3">
                {/* Accent highlight bar */}
                <div
                  className="h-1 w-12 rounded-full"
                  style={{ backgroundColor: data.accentColor }}
                />

                {/* Fake content lines */}
                <div className="space-y-1.5">
                  <div className="h-2 bg-gray-200 rounded-full w-full" />
                  <div className="h-2 bg-gray-200 rounded-full w-4/5" />
                  <div className="h-2 bg-gray-200 rounded-full w-3/5" />
                </div>

                {/* Accent tag */}
                <div className="flex gap-2">
                  <span
                    className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: data.accentColor }}
                  >
                    Nou
                  </span>
                  <span
                    className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: data.secondaryColor }}
                  >
                    Echipe
                  </span>
                </div>

                {/* CTA button */}
                <button
                  className="w-full py-2 text-white text-xs font-bold rounded-lg transition-opacity hover:opacity-90"
                  style={{ backgroundColor: data.primaryColor }}
                >
                  Inscrie-te acum
                </button>
              </div>

              {/* Mini footer */}
              <div
                className="px-4 py-2 text-center"
                style={{ backgroundColor: data.secondaryColor }}
              >
                <p className="text-white/60 text-[10px]">
                  {data.clubEmail || 'contact@club.ro'} | {data.clubPhone || '+40 7XX XXX XXX'}
                </p>
              </div>
            </div>

            {/* Color swatches summary */}
            <div className="bg-white rounded-xl shadow-md p-4">
              <p className="text-xs font-medium text-gray-500 mb-3">Paleta de culori</p>
              <div className="flex gap-2">
                <div className="flex-1 text-center">
                  <div
                    className="w-full h-10 rounded-lg shadow-inner border border-gray-100"
                    style={{ backgroundColor: data.primaryColor }}
                  />
                  <p className="text-[10px] text-gray-500 mt-1 font-mono">{data.primaryColor}</p>
                  <p className="text-[10px] text-gray-400">Principala</p>
                </div>
                <div className="flex-1 text-center">
                  <div
                    className="w-full h-10 rounded-lg shadow-inner border border-gray-100"
                    style={{ backgroundColor: data.secondaryColor }}
                  />
                  <p className="text-[10px] text-gray-500 mt-1 font-mono">{data.secondaryColor}</p>
                  <p className="text-[10px] text-gray-400">Secundara</p>
                </div>
                <div className="flex-1 text-center">
                  <div
                    className="w-full h-10 rounded-lg shadow-inner border border-gray-100"
                    style={{ backgroundColor: data.accentColor }}
                  />
                  <p className="text-[10px] text-gray-500 mt-1 font-mono">{data.accentColor}</p>
                  <p className="text-[10px] text-gray-400">Accent</p>
                </div>
              </div>
            </div>

            {/* Font preview */}
            <div className="bg-white rounded-xl shadow-md p-4">
              <p className="text-xs font-medium text-gray-500 mb-2">Font activ</p>
              <p
                className="text-lg font-bold text-gray-800"
                style={{ fontFamily: `'${data.fontFamily}', sans-serif` }}
              >
                {data.fontFamily}
              </p>
              <p
                className="text-sm text-gray-500"
                style={{ fontFamily: `'${data.fontFamily}', sans-serif` }}
              >
                AaBbCcDdEe 0123456789
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium z-50 transition-all ${
            toast.type === 'ok' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  )
}
