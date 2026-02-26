'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'

interface NavItem {
  href: string
  label: string
  moduleKey: string
}

interface NavEntry {
  key: string
  label: string
  type: 'link' | 'dropdown' | 'teams-dropdown'
  href?: string
  moduleKey?: string
  items?: NavItem[]
}

const NAV_STRUCTURE: NavEntry[] = [
  { key: 'home', label: 'Acasa', type: 'link', href: '/', moduleKey: 'moduleHomepage' },
  { key: 'club', label: 'Clubul', type: 'dropdown', items: [
    { href: '/despre', label: 'Despre noi', moduleKey: 'moduleDespre' },
    { href: '/antrenori', label: 'Antrenori', moduleKey: 'moduleEchipe' },
    { href: '/sponsori', label: 'Sponsori', moduleKey: 'moduleSponsori' },
  ]},
  { key: 'echipe', label: 'Echipe', type: 'teams-dropdown', moduleKey: 'moduleEchipe' },
  { key: 'meciuri', label: 'Meciuri', type: 'dropdown', items: [
    { href: '/program', label: 'Program', moduleKey: 'moduleProgram' },
    { href: '/rezultate', label: 'Rezultate', moduleKey: 'moduleMeciuri' },
    { href: '/calendar', label: 'Calendar', moduleKey: 'moduleCalendar' },
  ]},
  { key: 'media', label: 'Media', type: 'dropdown', items: [
    { href: '/galerie', label: 'Galerie', moduleKey: 'moduleGalerie' },
    { href: '/video-highlights', label: 'Video', moduleKey: 'moduleVideoHighlights' },
    { href: '/povesti', label: 'Povesti', moduleKey: 'modulePovesti' },
  ]},
  { key: 'implica', label: 'Implica-te', type: 'dropdown', items: [
    { href: '/inscrieri', label: 'Inscrieri', moduleKey: 'moduleInscrieri' },
    { href: '/fundraising', label: 'Donatii', moduleKey: 'moduleFundraising' },
    { href: '/magazin', label: 'Magazin', moduleKey: 'moduleMagazin' },
  ]},
  { key: 'contact', label: 'Contact', type: 'link', href: '/contact', moduleKey: 'moduleContact' },
]

const defaultGrupe = ['U10', 'U12', 'U14', 'U16', 'U18']

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileAccordion, setMobileAccordion] = useState<string | null>(null)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [grupe, setGrupe] = useState<string[]>(defaultGrupe)
  const [moduleSettings, setModuleSettings] = useState<Record<string, boolean> | null>(null)
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/teams?active=1')
      .then(r => r.json())
      .then((teams: { grupa: string }[]) => {
        if (teams.length > 0) {
          setGrupe(teams.map(t => t.grupa))
        }
      })
      .catch(() => {})

    const fetchModules = () => {
      fetch('/api/modules/active', { cache: 'no-store' })
        .then(r => r.json())
        .then(data => setModuleSettings(data))
        .catch(() => {})
    }

    fetchModules()

    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchModules()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const isModuleActive = (moduleKey: string) => {
    if (!moduleSettings) {
      // Before settings load, show starter modules by default
      return !['moduleSponsori', 'moduleVideoHighlights', 'moduleMagazin', 'moduleFundraising', 'moduleInscrieri', 'moduleCalendar', 'moduleStatistici'].includes(moduleKey)
    }
    return moduleSettings[moduleKey] !== false
  }

  const getFilteredItems = (items: NavItem[]) => {
    return items.filter(item => isModuleActive(item.moduleKey))
  }

  const handleMouseEnter = (key: string) => {
    if (dropdownTimeout.current) {
      clearTimeout(dropdownTimeout.current)
      dropdownTimeout.current = null
    }
    setOpenDropdown(key)
  }

  const handleMouseLeave = () => {
    dropdownTimeout.current = setTimeout(() => {
      setOpenDropdown(null)
    }, 150)
  }

  const visibleNav = NAV_STRUCTURE.filter(entry => {
    if (entry.type === 'link') {
      return entry.moduleKey ? isModuleActive(entry.moduleKey) : true
    }
    if (entry.type === 'teams-dropdown') {
      return entry.moduleKey ? isModuleActive(entry.moduleKey) : true
    }
    if (entry.type === 'dropdown' && entry.items) {
      return getFilteredItems(entry.items).length > 0
    }
    return true
  })

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <Image src="/images/dinamo-rugby-bulldog.png" alt="Dinamo Rugby" width={40} height={40} className="w-10 h-10 object-contain" />
          <span className="font-heading font-bold text-dinamo-red text-lg hidden sm:block">
            Dinamo Rugby Juniori
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {visibleNav.map((entry) => {
            if (entry.type === 'link') {
              return (
                <Link key={entry.key} href={entry.href!}
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-dinamo-red transition-colors rounded-md hover:bg-gray-50">
                  {entry.label}
                </Link>
              )
            }

            if (entry.type === 'teams-dropdown') {
              return (
                <div key={entry.key} className="relative"
                  onMouseEnter={() => handleMouseEnter(entry.key)}
                  onMouseLeave={handleMouseLeave}>
                  <button className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-dinamo-red transition-colors rounded-md hover:bg-gray-50 flex items-center gap-1">
                    {entry.label}
                    <svg className={`w-3 h-3 transition-transform ${openDropdown === entry.key ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openDropdown === entry.key && (
                    <div className="absolute top-full left-0 bg-white shadow-lg rounded-md py-1 min-w-[140px] border border-gray-100">
                      {grupe.map(g => (
                        <Link key={g} href={`/echipe/${g}`}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-dinamo-red hover:text-white transition-colors">
                          {g}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            }

            if (entry.type === 'dropdown' && entry.items) {
              const filteredItems = getFilteredItems(entry.items)
              if (filteredItems.length === 0) return null
              return (
                <div key={entry.key} className="relative"
                  onMouseEnter={() => handleMouseEnter(entry.key)}
                  onMouseLeave={handleMouseLeave}>
                  <button className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-dinamo-red transition-colors rounded-md hover:bg-gray-50 flex items-center gap-1">
                    {entry.label}
                    <svg className={`w-3 h-3 transition-transform ${openDropdown === entry.key ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openDropdown === entry.key && (
                    <div className="absolute top-full left-0 bg-white shadow-lg rounded-md py-1 min-w-[160px] border border-gray-100">
                      {filteredItems.map(item => (
                        <Link key={item.href} href={item.href}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-dinamo-red hover:text-white transition-colors">
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            }

            return null
          })}
        </nav>

        {/* Right side: Portal Parinti + Hamburger */}
        <div className="flex items-center gap-2">
          {(!moduleSettings || moduleSettings.modulePortalParinti !== false) && (
            <Link href="/parinti"
              className="px-3 py-1.5 text-sm font-bold text-white bg-dinamo-red rounded-md hover:bg-red-700 transition-colors">
              Portal Parinti
            </Link>
          )}
          <button className="lg:hidden p-2" onClick={() => setMobileOpen(true)} aria-label="Deschide meniu">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile fullscreen overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] bg-white lg:hidden flex flex-col">
          {/* Mobile header */}
          <div className="flex items-center justify-between px-4 h-16 border-b border-gray-100 flex-shrink-0">
            <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2">
              <Image src="/images/dinamo-rugby-bulldog.png" alt="Dinamo Rugby" width={36} height={36} className="w-9 h-9 object-contain" />
              <span className="font-heading font-bold text-dinamo-red text-lg">
                Dinamo Rugby
              </span>
            </Link>
            <button className="p-2" onClick={() => setMobileOpen(false)} aria-label="Inchide meniu">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mobile menu items */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {visibleNav.map(entry => {
              if (entry.type === 'link') {
                return (
                  <Link key={entry.key} href={entry.href!}
                    onClick={() => setMobileOpen(false)}
                    className="block py-3 text-base font-medium text-gray-800 border-b border-gray-100"
                    style={{ minHeight: '44px' }}>
                    {entry.label}
                  </Link>
                )
              }

              if (entry.type === 'teams-dropdown') {
                const isOpen = mobileAccordion === entry.key
                return (
                  <div key={entry.key} className="border-b border-gray-100">
                    <button
                      onClick={() => setMobileAccordion(isOpen ? null : entry.key)}
                      className="flex items-center justify-between w-full py-3 text-base font-medium text-gray-800"
                      style={{ minHeight: '44px' }}>
                      {entry.label}
                      <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isOpen && (
                      <div className="pl-4 pb-2">
                        {grupe.map(g => (
                          <Link key={g} href={`/echipe/${g}`}
                            onClick={() => setMobileOpen(false)}
                            className="block py-2.5 text-base text-gray-600 hover:text-dinamo-red"
                            style={{ minHeight: '44px' }}>
                            {g}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }

              if (entry.type === 'dropdown' && entry.items) {
                const filteredItems = getFilteredItems(entry.items)
                if (filteredItems.length === 0) return null
                const isOpen = mobileAccordion === entry.key
                return (
                  <div key={entry.key} className="border-b border-gray-100">
                    <button
                      onClick={() => setMobileAccordion(isOpen ? null : entry.key)}
                      className="flex items-center justify-between w-full py-3 text-base font-medium text-gray-800"
                      style={{ minHeight: '44px' }}>
                      {entry.label}
                      <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isOpen && (
                      <div className="pl-4 pb-2">
                        {filteredItems.map(item => (
                          <Link key={item.href} href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className="block py-2.5 text-base text-gray-600 hover:text-dinamo-red"
                            style={{ minHeight: '44px' }}>
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }

              return null
            })}

            {/* Portal Parinti in mobile menu */}
            {(!moduleSettings || moduleSettings.modulePortalParinti !== false) && (
              <Link href="/parinti"
                onClick={() => setMobileOpen(false)}
                className="block py-3 text-base font-bold text-dinamo-red border-b border-gray-100"
                style={{ minHeight: '44px' }}>
                Portal Parinti
              </Link>
            )}
          </div>

          {/* Bottom area: social + contact */}
          <div className="flex-shrink-0 border-t border-gray-200 px-4 py-4">
            <div className="flex items-center justify-center gap-4">
              <a href="https://www.facebook.com/dinamorugbyjuniori" target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-dinamo-red hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="https://www.instagram.com/dinamorugbyjuniori" target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-dinamo-red hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </a>
              <a href="tel:+40722000000"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-dinamo-red hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
