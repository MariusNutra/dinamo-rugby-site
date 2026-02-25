'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<boolean | null>(null)
  const [unreadCount, setUnreadCount] = useState<number | null>(null)
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
    return () => clearInterval(interval)
  }, [auth, fetchUnread])

  if (pathname === '/admin/login') return <>{children}</>

  if (auth === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
      </div>
    )
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: '🏠' },
    { href: '/admin/povesti', label: 'Povești', icon: '📝' },
    { href: '/admin/galerie', label: 'Galerie', icon: '📸' },
    { href: '/admin/echipe', label: 'Echipe', icon: '🏉' },
    { href: '/admin/program', label: 'Program', icon: '📅' },
    { href: '/admin/meciuri', label: 'Meciuri', icon: '🏆' },
  ]

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-dinamo-blue text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-heading font-bold">Admin Panel</Link>
            <div className="hidden md:flex gap-1">
              {navItems.map(item => (
                <Link key={item.href} href={item.href}
                  className={`px-3 py-2 rounded text-sm transition-colors ${
                    pathname === item.href ? 'bg-white/20' : 'hover:bg-white/10'
                  }`}>
                  {item.icon} {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href="https://mail.dinamorugby.ro" target="_blank" rel="noopener noreferrer"
              className="relative text-sm text-white/70 hover:text-white flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded hover:bg-white/20 transition-colors"
              title="Deschide Webmail">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="hidden sm:inline">Webmail</span>
              {unreadCount !== null && unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </a>
            <Link href="/" className="text-sm text-white/70 hover:text-white" target="_blank">
              Vezi site-ul →
            </Link>
            <button onClick={handleLogout} className="text-sm bg-white/10 px-3 py-1 rounded hover:bg-white/20 transition-colors">
              Deconectare
            </button>
          </div>
        </div>
        {/* Mobile nav */}
        <div className="md:hidden flex overflow-x-auto px-4 pb-2 gap-1">
          {navItems.map(item => (
            <Link key={item.href} href={item.href}
              className={`px-3 py-1 rounded text-xs whitespace-nowrap transition-colors ${
                pathname === item.href ? 'bg-white/20' : 'hover:bg-white/10'
              }`}>
              {item.icon} {item.label}
            </Link>
          ))}
        </div>
      </nav>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </div>
    </div>
  )
}
