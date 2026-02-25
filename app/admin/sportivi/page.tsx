'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Team {
  id: number
  grupa: string
}

interface ChildRow {
  id: string
  name: string
  birthYear: number
  teamId: number | null
  teamName: string | null
  parentName: string
}

export default function SportiviListPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [children, setChildren] = useState<ChildRow[]>([])
  const [filterTeam, setFilterTeam] = useState<number | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/teams').then(r => r.json()).then(data => {
      setTeams(data.filter((t: Team & { active?: boolean }) => t.active !== false))
    })
    fetch('/api/admin/parinti').then(r => r.json()).then(data => {
      if (!Array.isArray(data)) return
      const all: ChildRow[] = []
      data.forEach((p: { name: string; children?: { id: string; name: string; birthYear: number; teamId: number | null; teamName?: string }[] }) => {
        p.children?.forEach(c => {
          all.push({
            id: c.id,
            name: c.name,
            birthYear: c.birthYear,
            teamId: c.teamId,
            teamName: c.teamName || null,
            parentName: p.name,
          })
        })
      })
      all.sort((a, b) => a.name.localeCompare(b.name))
      setChildren(all)
    })
  }, [])

  const filtered = children.filter(c => {
    if (filterTeam && c.teamId !== filterTeam) return false
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div>
      <h1 className="font-heading font-bold text-2xl mb-6">Sportivi</h1>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setFilterTeam(null)}
          className={`px-3 py-1.5 rounded-full text-sm ${!filterTeam ? 'bg-dinamo-red text-white' : 'bg-gray-100'}`}
        >
          Toti ({children.length})
        </button>
        {teams.map(t => {
          const count = children.filter(c => c.teamId === t.id).length
          return (
            <button
              key={t.id}
              onClick={() => setFilterTeam(t.id)}
              className={`px-3 py-1.5 rounded-full text-sm ${filterTeam === t.id ? 'bg-dinamo-red text-white' : 'bg-gray-100'}`}
            >
              {t.grupa} ({count})
            </button>
          )
        })}
      </div>

      <input
        type="text"
        placeholder="Cauta sportiv..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 text-sm mb-4"
      />

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 font-medium">Nume</th>
              <th className="text-left p-3 font-medium hidden md:table-cell">An nastere</th>
              <th className="text-left p-3 font-medium">Echipa</th>
              <th className="text-left p-3 font-medium hidden md:table-cell">Parinte</th>
              <th className="text-right p-3 font-medium">Profil</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="border-t hover:bg-gray-50">
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3 text-gray-600 hidden md:table-cell">{c.birthYear}</td>
                <td className="p-3">
                  {c.teamName ? (
                    <span className="text-xs bg-dinamo-blue text-white px-2 py-0.5 rounded-full">{c.teamName}</span>
                  ) : (
                    <span className="text-gray-400 text-xs">-</span>
                  )}
                </td>
                <td className="p-3 text-gray-600 hidden md:table-cell">{c.parentName}</td>
                <td className="p-3 text-right">
                  <Link href={`/admin/sportivi/${c.id}`} className="text-dinamo-blue hover:underline text-xs font-medium">
                    Vezi profil &rarr;
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-8">Nu exista sportivi.</p>
        )}
      </div>
    </div>
  )
}
