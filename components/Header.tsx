'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

const navLinks = [
  { href: '/', label: 'Acasă' },
  { href: '/echipe/U10', label: 'Echipe', dropdown: [
    { href: '/echipe/U10', label: 'U10' },
    { href: '/echipe/U12', label: 'U12' },
    { href: '/echipe/U14', label: 'U14' },
    { href: '/echipe/U16', label: 'U16' },
    { href: '/echipe/U18', label: 'U18' },
  ]},
  { href: '/antrenori', label: 'Antrenori' },
  { href: '/program', label: 'Program' },
  { href: '/meciuri', label: 'Meciuri' },
  { href: '/povesti', label: 'Povești' },
  { href: '/galerie', label: 'Galerie' },
  { href: '/rezultate', label: 'Rezultate' },
  { href: '/despre', label: 'Despre noi' },
  { href: '/contact', label: 'Contact' },
]

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

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
            link.dropdown ? (
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
            ) : (
              <Link key={link.href} href={link.href}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-dinamo-red transition-colors rounded-md hover:bg-gray-50">
                {link.label}
              </Link>
            )
          ))}
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
            link.dropdown ? (
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
            ) : (
              <Link key={link.href} href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-dinamo-red hover:text-white border-b border-gray-100">
                {link.label}
              </Link>
            )
          ))}
        </div>
      )}
    </header>
  )
}
