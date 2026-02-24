'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ stories: 0, photos: 0, teams: 0, matches: 0 })

  useEffect(() => {
    Promise.all([
      fetch('/api/stories').then(r => r.json()),
      fetch('/api/photos').then(r => r.json()),
      fetch('/api/teams').then(r => r.json()),
      fetch('/api/matches').then(r => r.json()),
    ]).then(([stories, photos, teams, matches]) => {
      setStats({
        stories: stories.length,
        photos: photos.length,
        teams: teams.length,
        matches: matches.length,
      })
    })
  }, [])

  const cards = [
    { label: 'Povești', count: stats.stories, href: '/admin/povesti', icon: '📝', color: 'bg-blue-500' },
    { label: 'Poze', count: stats.photos, href: '/admin/galerie', icon: '📸', color: 'bg-green-500' },
    { label: 'Echipe', count: stats.teams, href: '/admin/echipe', icon: '🏉', color: 'bg-dinamo-red' },
    { label: 'Meciuri', count: stats.matches, href: '/admin/meciuri', icon: '🏆', color: 'bg-purple-500' },
  ]

  return (
    <div>
      <h1 className="font-heading font-bold text-2xl mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map(c => (
          <Link key={c.label} href={c.href} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{c.icon}</span>
              <span className={`${c.color} text-white text-xs px-2 py-1 rounded-full font-bold`}>{c.count}</span>
            </div>
            <h3 className="font-heading font-bold text-gray-900">{c.label}</h3>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="font-heading font-bold text-lg mb-4">Acțiuni rapide</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link href="/admin/povesti" className="bg-blue-50 text-blue-700 p-4 rounded-lg hover:bg-blue-100 transition-colors text-center font-medium">
            + Adaugă poveste nouă
          </Link>
          <Link href="/admin/galerie" className="bg-green-50 text-green-700 p-4 rounded-lg hover:bg-green-100 transition-colors text-center font-medium">
            + Încarcă poze
          </Link>
          <Link href="/admin/meciuri" className="bg-red-50 text-red-700 p-4 rounded-lg hover:bg-red-100 transition-colors text-center font-medium">
            + Adaugă meci
          </Link>
        </div>
      </div>
    </div>
  )
}
