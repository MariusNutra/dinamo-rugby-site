'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

interface SidebarItem {
  href: string
  label: string
  icon: string
  moduleKey: string | null
  badge?: number
}

interface SidebarGroup {
  key: string
  label: string
  icon: string
  items: SidebarItem[]
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<boolean | null>(null)
  const [unreadCount, setUnreadCount] = useState<number | null>(null)
  const [moduleSettings, setModuleSettings] = useState<Record<string, boolean> | null>(null)
  const [pendingRequests, setPendingRequests] = useState(0)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [drawerOpen, setDrawerOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const fetchUnread = useCallback(() => {
    fetch('/api/email/unread')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.unread !== null) setUnreadCount(data.unread)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/auth/check')
      .then(r => r.json())
      .then(data => {
        if (!data.authenticated && pathname !== '/admin/login') {
          router.push('/admin/login')
        } else {
          setAuth(data.authenticated)
        }
      })
  }, [pathname, router])

  useEffect(() => {
    if (!auth) return
    fetchUnread()
    const interval = setInterval(fetchUnread, 5 * 60 * 1000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchUnread()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [auth, fetchUnread])

  useEffect(() => {
    if (!auth) return
    fetch('/api/admin/cereri-acces?status=pending')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && Array.isArray(data.requests)) setPendingRequests(data.requests.length)
      })
      .catch(() => {})
  }, [auth, pathname])

  useEffect(() => {
    if (!auth) return
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
    window.addEventListener('modules-changed', fetchModules)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('modules-changed', fetchModules)
    }
  }, [auth])

  // Auto-expand the group containing the current page
  useEffect(() => {
    const groups = getSidebarGroups()
    for (const group of groups) {
      const visibleItems = group.items.filter(item => isItemVisible(item))
      if (visibleItems.some(item => pathname === item.href || pathname.startsWith(item.href + '/'))) {
        setExpandedGroups(prev => {
          const next = new Set(prev)
          next.add(group.key)
          return next
        })
        break
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, moduleSettings])

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  if (pathname === '/admin/login') return <>{children}</>

  if (auth === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
      </div>
    )
  }

  function isItemVisible(item: SidebarItem): boolean {
    if (!item.moduleKey) return true
    if (!moduleSettings) return !['moduleFundraising', 'modulePlati', 'moduleMagazin'].includes(item.moduleKey)
    return moduleSettings[item.moduleKey] !== false
  }

  function getSidebarGroups(): SidebarGroup[] {
    return [
      {
        key: 'continut',
        label: 'CONTINUT',
        icon: '📋',
        items: [
          { href: '/admin/povesti', label: 'Povesti', icon: '📝', moduleKey: 'modulePovesti' },
          { href: '/admin/galerie', label: 'Galerie', icon: '📸', moduleKey: 'moduleGalerie' },
          { href: '/admin/video-highlights', label: 'Video Highlights', icon: '🎬', moduleKey: 'moduleVideoHighlights' },
        ],
      },
      {
        key: 'sport',
        label: 'SPORT',
        icon: '⚽',
        items: [
          { href: '/admin/echipe', label: 'Echipe', icon: '🏉', moduleKey: 'moduleEchipe' },
          { href: '/admin/sportivi', label: 'Sportivi', icon: '🏃', moduleKey: null },
          { href: '/admin/meciuri', label: 'Meciuri', icon: '🏆', moduleKey: 'moduleMeciuri' },
          { href: '/admin/program', label: 'Program', icon: '📅', moduleKey: 'moduleProgram' },
          { href: '/admin/prezente', label: 'Prezente', icon: '✅', moduleKey: null },
          { href: '/admin/evaluari', label: 'Evaluari', icon: '📊', moduleKey: null },
          { href: '/admin/statistici', label: 'Statistici', icon: '📈', moduleKey: 'moduleStatistici' },
        ],
      },
      {
        key: 'utilizatori',
        label: 'UTILIZATORI',
        icon: '👥',
        items: [
          { href: '/admin/parinti', label: 'Parinti', icon: '👨‍👩‍👧', moduleKey: 'modulePortalParinti' },
          { href: '/admin/cereri-acces', label: 'Cereri', icon: '📩', moduleKey: 'modulePortalParinti', badge: pendingRequests },
          { href: '/admin/acorduri', label: 'Acorduri', icon: '📋', moduleKey: 'modulePortalParinti' },
          { href: '/admin/inscrieri', label: 'Inscrieri', icon: '📋', moduleKey: 'moduleInscrieri' },
        ],
      },
      {
        key: 'financiar',
        label: 'FINANCIAR',
        icon: '💰',
        items: [
          { href: '/admin/plati', label: 'Plati / Cotizatii', icon: '💳', moduleKey: 'modulePlati' },
          { href: '/admin/fundraising', label: 'Fundraising', icon: '💰', moduleKey: 'moduleFundraising' },
          { href: '/admin/magazin', label: 'Magazin', icon: '🛒', moduleKey: 'moduleMagazin' },
        ],
      },
      {
        key: 'setari',
        label: 'SETARI',
        icon: '⚙️',
        items: [
          { href: '/admin/settings/modules', label: 'Module', icon: '🧩', moduleKey: null },
          { href: '/admin/settings/notificari', label: 'Notificari', icon: '🔔', moduleKey: 'moduleNotificari' },
          { href: '/admin/settings/sponsori', label: 'Sponsori', icon: '🤝', moduleKey: 'moduleSponsori' },
        ],
      },
    ]
  }

  const sidebarGroups = getSidebarGroups()

  const visibleGroups = sidebarGroups.filter(group => {
    return group.items.some(item => isItemVisible(item))
  })

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  const openDrawerWithGroup = (groupKey: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      next.add(groupKey)
      return next
    })
    setDrawerOpen(true)
  }

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname === href || pathname.startsWith(href + '/')
  }

  const renderSidebarContent = (onNavigate?: () => void) => (
    <>
      {/* Header */}
      <div className="px-4 py-4 border-b border-white/10">
        <Link href="/admin" className="flex items-center gap-2" onClick={onNavigate}>
          <span className="font-heading font-bold text-lg text-white">Admin Panel</span>
        </Link>
      </div>

      {/* Dashboard link */}
      <div className="px-3 py-2">
        <Link href="/admin"
          onClick={onNavigate}
          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            isActive('/admin') ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
          }`}>
          <span>📊</span>
          Dashboard
        </Link>
      </div>

      {/* Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-1">
        {visibleGroups.map(group => {
          const visibleItems = group.items.filter(item => isItemVisible(item))
          const isExpanded = expandedGroups.has(group.key)
          return (
            <div key={group.key} className="mb-1">
              <button
                onClick={() => toggleGroup(group.key)}
                className="flex items-center justify-between w-full px-3 py-2 text-xs font-bold text-white/50 uppercase tracking-wider hover:text-white/70 transition-colors">
                <span className="flex items-center gap-1.5">
                  <span>{group.icon}</span>
                  {group.label}
                </span>
                <svg className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isExpanded && (
                <div className="space-y-0.5 mb-2">
                  {visibleItems.map(item => (
                    <Link key={item.href} href={item.href}
                      onClick={onNavigate}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors relative ${
                        isActive(item.href) ? 'bg-white/20 text-white font-medium' : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`}>
                      <span className="text-base">{item.icon}</span>
                      {item.label}
                      {item.badge && item.badge > 0 ? (
                        <span className="ml-auto w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Bottom actions */}
      <div className="px-3 py-3 border-t border-white/10 space-y-1">
        <a href="https://mail.dinamorugby.ro" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors relative">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Webmail
          {unreadCount !== null && unreadCount > 0 && (
            <span className="ml-auto w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </a>
        <Link href="/" target="_blank"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Vezi site-ul
        </Link>
        <button onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Deconectare
        </button>
      </div>
    </>
  )

  // Bottom nav items for mobile
  const bottomNavItems = [
    { key: 'dashboard', label: 'Dashboard', icon: '📊', action: () => router.push('/admin') },
    { key: 'sport', label: 'Sport', icon: '⚽', action: () => openDrawerWithGroup('sport') },
    { key: 'utilizatori', label: 'Utilizatori', icon: '👥', action: () => openDrawerWithGroup('utilizatori') },
    { key: 'setari', label: 'Setari', icon: '⚙️', action: () => openDrawerWithGroup('setari') },
  ]

  const activeBottomNav = (() => {
    if (pathname === '/admin') return 'dashboard'
    for (const group of sidebarGroups) {
      if (group.items.some(item => isActive(item.href))) return group.key
    }
    return null
  })()

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 bg-dinamo-blue text-white z-40">
        {renderSidebarContent()}
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden bg-dinamo-blue text-white h-14 flex items-center justify-between px-4 sticky top-0 z-40">
        <button onClick={() => setDrawerOpen(true)} className="p-2 -ml-2" aria-label="Deschide meniu">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="font-heading font-bold">Admin Panel</span>
        <button onClick={handleLogout} className="p-2 -mr-2 text-white/70 hover:text-white" aria-label="Deconectare">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-dinamo-blue text-white flex flex-col shadow-xl">
            {renderSidebarContent(() => setDrawerOpen(false))}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="lg:ml-64">
        <div className="max-w-7xl mx-auto px-4 py-6 pb-24 lg:pb-6">
          {children}
        </div>
      </div>

      {/* Mobile bottom navigation bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-dinamo-blue border-t border-white/10 z-40">
        <div className="flex items-center justify-around h-14">
          {bottomNavItems.map(item => (
            <button key={item.key}
              onClick={item.action}
              className={`flex flex-col items-center justify-center flex-1 h-full text-xs transition-colors ${
                activeBottomNav === item.key ? 'text-white' : 'text-white/50'
              }`}>
              <span className="text-lg">{item.icon}</span>
              <span className="mt-0.5">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
