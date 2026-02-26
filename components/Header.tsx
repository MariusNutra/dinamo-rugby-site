'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'

const defaultGrupe = ['U10', 'U12', 'U14', 'U16', 'U18']

const allStaticLinks = [
  { href: '/', label: 'Acasa', moduleKey: 'moduleHomepage' },
  { href: '/antrenori', label: 'Antrenori', moduleKey: 'moduleEchipe' },
  { href: '/program', label: 'Program', moduleKey: 'moduleProgram' },
  { href: '/meciuri', label: 'Meciuri', moduleKey: 'moduleMeciuri' },
  { href: '/povesti', label: 'Povesti', moduleKey: 'modulePovesti' },
  { href: '/galerie', label: 'Galerie', moduleKey: 'moduleGalerie' },
  { href: '/rezultate', label: 'Rezultate', moduleKey: 'moduleMeciuri' },
  { href: '/despre', label: 'Despre noi', moduleKey: 'moduleDespre' },
  { href: '/contact', label: 'Contact', moduleKey: 'moduleContact' },
  { href: '/fundraising', label: 'Donatii', moduleKey: 'moduleFundraising' },
  { href: '/inscrieri', label: 'Inscrieri', moduleKey: 'moduleInscrieri' },
  { href: '/calendar', label: 'Calendar', moduleKey: 'moduleCalendar' },
  { href: '/statistici', label: 'Statistici', moduleKey: 'moduleStatistici' },
  { href: '/magazin', label: 'Magazin', moduleKey: 'moduleMagazin' },
  { href: '/video-highlights', label: 'Video', moduleKey: 'moduleVideoHighlights' },
  { href: '/sponsori', label: 'Sponsori', moduleKey: 'moduleSponsori' },
]

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [grupe, setGrupe] = useState<string[]>(defaultGrupe)
  const [moduleSettings, setModuleSettings] = useState<Record<string, boolean> | null>(null)

  useEffect(() => {
    fetch('/api/teams?active=1')
      .then(r => r.json())
      .then((teams: { grupa: string }[]) => {
        if (teams.length > 0) {
          setGrupe(teams.map(t => t.grupa))
        }
      })
      .catch(() => {})

    fetch('/api/modules/active')
      .then(r => r.json())
      .then(data => setModuleSettings(data))
      .catch(() => {})
  }, [])

  const staticLinks = allStaticLinks.filter(link => {
    if (!moduleSettings) {
      // Before settings load, show only default links
      return ['/', '/antrenori', '/program', '/meciuri', '/povesti', '/galerie', '/rezultate', '/despre', '/contact'].includes(link.href)
    }
    return moduleSettings[link.moduleKey] !== false
  })

  const navLinks = [
    staticLinks[0],
    ...(moduleSettings?.moduleEchipe !== false ? [{
      href: grupe[0] ? `/echipe/${grupe[0]}` : '/echipe/U10',
      label: 'Echipe',
      dropdown: grupe.map(g => ({ href: `/echipe/${g}`, label: g })),
    }] : []),
    ...staticLinks.slice(1),
  ]

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/images/dinamo-rugby-bulldog.png" alt="Dinamo Rugby" width={40} height={40} className="w-10 h-10 object-contain" />
          <span className="font-heading font-bold text-dinamo-red text-lg hidden sm:block">
            Dinamo Rugby Juniori
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            link && 'dropdown' in link && link.dropdown ? (
              <div key={link.label} className="relative"
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}>
                <button className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-dinamo-red transition-colors rounded-md hover:bg-gray-50">
                  {link.label} ▾
                </button>
                {dropdownOpen && (
                  <div className="absolute top-full left-0 bg-white shadow-lg rounded-md py-1 min-w-[120px]">
                    {link.dropdown.map((item) => (
                      <Link key={item.href} href={item.href}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-dinamo-red hover:text-white transition-colors">
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : link ? (
              <Link key={link.href} href={link.href}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-dinamo-red transition-colors rounded-md hover:bg-gray-50">
                {link.label}
              </Link>
            ) : null
          ))}
          {(!moduleSettings || moduleSettings.modulePortalParinti !== false) && (
            <Link href="/parinti"
              className="ml-2 px-3 py-1.5 text-sm font-bold text-white bg-dinamo-red rounded-md hover:bg-red-700 transition-colors">
              Portal Parinti
            </Link>
          )}
        </nav>

        <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t">
          {navLinks.map((link) => (
            link && 'dropdown' in link && link.dropdown ? (
              <div key={link.label}>
                <div className="px-4 py-2 text-sm font-bold text-gray-500 uppercase">{link.label}</div>
                {link.dropdown.map((item) => (
                  <Link key={item.href} href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-6 py-2 text-sm text-gray-700 hover:bg-dinamo-red hover:text-white">
                    {item.label}
                  </Link>
                ))}
              </div>
            ) : link ? (
              <Link key={link.href} href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-dinamo-red hover:text-white border-b border-gray-100">
                {link.label}
              </Link>
            ) : null
          ))}
          {(!moduleSettings || moduleSettings.modulePortalParinti !== false) && (
            <Link href="/parinti"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 text-sm font-bold text-dinamo-red hover:bg-dinamo-red hover:text-white border-b border-gray-100">
              Portal Parinti
            </Link>
          )}
        </div>
      )}
    </header>
  )
}
