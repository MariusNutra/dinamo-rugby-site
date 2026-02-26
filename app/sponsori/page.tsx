'use client'

import { useState, useEffect } from 'react'

interface Sponsor {
  id: string
  name: string
  logo: string | null
  website: string | null
  description: string | null
  tier: string
}

const tierConfig: Record<string, { label: string; color: string; bgColor: string; size: string }> = {
  gold:   { label: 'Gold',   color: 'text-yellow-700', bgColor: 'bg-yellow-50 border-yellow-200', size: 'lg' },
  silver: { label: 'Silver', color: 'text-gray-600',   bgColor: 'bg-gray-50 border-gray-200',     size: 'md' },
  bronze: { label: 'Bronze', color: 'text-orange-700',  bgColor: 'bg-orange-50 border-orange-200', size: 'sm' },
}

const sponsorshipPackages = [
  {
    tier: 'Gold',
    price: 'Premium',
    color: 'from-yellow-500 to-yellow-600',
    borderColor: 'border-yellow-400',
    benefits: [
      'Logo pe echipamentul oficial de joc',
      'Logo pe bannerul principal al clubului',
      'Prezenta pe toate materialele promotionale',
      'Mentiuni in comunicatele de presa',
      'Invitatie VIP la toate evenimentele clubului',
      'Postari dedicate pe retelele sociale',
      'Logo pe site-ul oficial - pozitie principala',
    ],
  },
  {
    tier: 'Silver',
    price: 'Standard',
    color: 'from-gray-400 to-gray-500',
    borderColor: 'border-gray-300',
    benefits: [
      'Logo pe echipamentul de antrenament',
      'Logo pe bannerul secundar',
      'Mentiuni in comunicatele de presa',
      'Invitatie la evenimentele principale',
      'Postari pe retelele sociale',
      'Logo pe site-ul oficial',
    ],
  },
  {
    tier: 'Bronze',
    price: 'Esential',
    color: 'from-orange-500 to-orange-600',
    borderColor: 'border-orange-300',
    benefits: [
      'Logo pe bannerul de la antrenamente',
      'Mentiuni periodice pe retelele sociale',
      'Logo pe site-ul oficial',
      'Invitatie la gala anuala a clubului',
    ],
  },
]

export default function SponsoriPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    message: '',
  })
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  useEffect(() => {
    fetch('/api/sponsori')
      .then(r => r.json())
      .then(data => { setSponsors(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const goldSponsors = sponsors.filter(s => s.tier === 'gold')
  const silverSponsors = sponsors.filter(s => s.tier === 'silver')
  const bronzeSponsors = sponsors.filter(s => s.tier === 'bronze')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${form.contactPerson} (${form.companyName})`,
          email: form.email,
          message: `[Sponsorizare]\n\nCompanie: ${form.companyName}\nPersoana de contact: ${form.contactPerson}\nTelefon: ${form.phone}\n\n${form.message}`,
        }),
      })
      if (res.ok) {
        setStatus('sent')
        setForm({ companyName: '', contactPerson: '', email: '', phone: '', message: '' })
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  const renderSponsorCard = (sponsor: Sponsor, size: 'lg' | 'md' | 'sm') => {
    const config = tierConfig[sponsor.tier] || tierConfig.bronze
    const logoSizeClass = size === 'lg' ? 'w-24 h-24' : size === 'md' ? 'w-16 h-16' : 'w-12 h-12'
    const textSizeClass = size === 'lg' ? 'text-xl' : size === 'md' ? 'text-lg' : 'text-base'

    return (
      <div
        key={sponsor.id}
        className={`bg-white rounded-xl border ${config.bgColor} p-6 hover:shadow-md transition-shadow`}
      >
        <div className="flex items-center gap-4 mb-3">
          {sponsor.logo ? (
            <img
              src={sponsor.logo}
              alt={`Logo ${sponsor.name}`}
              className={`${logoSizeClass} object-contain rounded-lg`}
              loading="lazy"
            />
          ) : (
            <div className={`${logoSizeClass} rounded-lg bg-dinamo-blue/10 flex items-center justify-center flex-shrink-0`}>
              <span className={`font-heading font-extrabold text-dinamo-blue ${size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-2xl' : 'text-lg'}`}>
                {sponsor.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <h3 className={`font-heading font-bold ${textSizeClass} text-gray-900 truncate`}>{sponsor.name}</h3>
            <span className={`text-xs font-bold uppercase tracking-wider ${config.color}`}>
              {config.label}
            </span>
          </div>
        </div>

        {sponsor.description && (
          <p className="text-gray-600 text-sm mb-3">{sponsor.description}</p>
        )}

        {sponsor.website && (
          <a
            href={sponsor.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-dinamo-red text-sm font-medium hover:underline"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            Viziteaza site-ul
          </a>
        )}
      </div>
    )
  }

  const renderTierSection = (title: string, tierSponsors: Sponsor[], size: 'lg' | 'md' | 'sm', cols: string) => {
    if (tierSponsors.length === 0) return null
    return (
      <div className="mb-12">
        <h2 className="font-heading font-bold text-2xl text-dinamo-blue mb-6 flex items-center gap-2">
          {title === 'Sponsori Gold' && (
            <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          )}
          {title === 'Sponsori Silver' && (
            <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          )}
          {title === 'Sponsori Bronze' && (
            <svg className="w-6 h-6 text-orange-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          )}
          {title}
        </h2>
        <div className={`grid grid-cols-1 ${cols} gap-6`}>
          {tierSponsors.map(s => renderSponsorCard(s, size))}
        </div>
      </div>
    )
  }

  return (
    <>
      <section className="bg-dinamo-blue text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center fade-in">
          <h1 className="font-heading font-extrabold text-4xl md:text-5xl mb-2">Sponsori</h1>
          <p className="text-lg opacity-80">Partenerii care sustin rugby-ul juvenil la CS Dinamo</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Sponsors listing */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">
            <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Se incarca...</p>
          </div>
        ) : sponsors.length === 0 ? (
          <div className="text-center py-12 mb-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
            <p className="text-gray-500">Fii primul sponsor al clubului nostru!</p>
          </div>
        ) : (
          <>
            {renderTierSection('Sponsori Gold', goldSponsors, 'lg', 'md:grid-cols-2')}
            {renderTierSection('Sponsori Silver', silverSponsors, 'md', 'md:grid-cols-2 lg:grid-cols-3')}
            {renderTierSection('Sponsori Bronze', bronzeSponsors, 'sm', 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4')}
          </>
        )}

        {/* Sponsorship packages */}
        <div className="mt-8 mb-16">
          <h2 className="font-heading font-extrabold text-3xl text-dinamo-blue text-center mb-3">Pachete Sponsorizare</h2>
          <p className="text-center text-gray-500 mb-10 max-w-2xl mx-auto">
            Alege pachetul de sponsorizare potrivit pentru compania ta si sustine viitorul rugby-ului romanesc.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sponsorshipPackages.map(pkg => (
              <div
                key={pkg.tier}
                className={`rounded-xl border-2 ${pkg.borderColor} overflow-hidden bg-white hover:shadow-lg transition-shadow`}
              >
                <div className={`bg-gradient-to-r ${pkg.color} text-white p-5 text-center`}>
                  <h3 className="font-heading font-extrabold text-2xl">{pkg.tier}</h3>
                  <p className="text-sm opacity-90 mt-1">Pachet {pkg.price}</p>
                </div>
                <div className="p-6">
                  <ul className="space-y-3">
                    {pkg.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sponsorship inquiry form */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border p-8">
            <h2 className="font-heading font-extrabold text-2xl text-dinamo-blue text-center mb-2">Devino Sponsor</h2>
            <p className="text-center text-gray-500 mb-8">Completeaza formularul si te vom contacta cu detalii despre oportunitatile de sponsorizare.</p>

            {status === 'sent' ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <svg className="w-12 h-12 text-green-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                <p className="text-green-800 font-bold text-lg">Mesajul a fost trimis cu succes!</p>
                <p className="text-green-600 text-sm mt-1">Va vom contacta in cel mai scurt timp cu detalii despre sponsorizare.</p>
                <button onClick={() => setStatus('idle')} className="mt-4 text-dinamo-red font-bold text-sm">
                  Trimite alt mesaj
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Numele companiei</label>
                    <input
                      type="text"
                      required
                      value={form.companyName}
                      onChange={e => setForm({ ...form, companyName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red focus:border-dinamo-red outline-none"
                      placeholder="SC Exemplu SRL"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Persoana de contact</label>
                    <input
                      type="text"
                      required
                      value={form.contactPerson}
                      onChange={e => setForm({ ...form, contactPerson: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red focus:border-dinamo-red outline-none"
                      placeholder="Ion Popescu"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red focus:border-dinamo-red outline-none"
                      placeholder="contact@companie.ro"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red focus:border-dinamo-red outline-none"
                      placeholder="+40 7XX XXX XXX"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mesaj</label>
                  <textarea
                    required
                    rows={4}
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red focus:border-dinamo-red outline-none resize-none"
                    placeholder="Spune-ne mai multe despre interesul tau pentru sponsorizare..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full bg-dinamo-red text-white py-3 rounded-lg font-heading font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {status === 'sending' ? 'Se trimite...' : 'Trimite cererea de sponsorizare'}
                </button>
                {status === 'error' && (
                  <p className="text-red-500 text-sm text-center">A aparut o eroare. Incercati din nou.</p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
