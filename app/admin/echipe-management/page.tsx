'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getColorConfig } from '@/lib/team-colors'
import type { Team, ChildRow, TransferInfo, Toast, PendingTransfer } from './_types'
import { formatDate } from './_utils'
import TransferHistory from './_components/TransferHistory'
import TransferConfirmModal from './_components/TransferConfirmModal'
import ToastStack from './_components/ToastStack'

export default function EchipeManagementPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [children, setChildren] = useState<ChildRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [toasts, setToasts] = useState<Toast[]>([])
  const [recentlyMoved, setRecentlyMoved] = useState<Set<string>>(new Set())

  // Transfer history
  const [activeTab, setActiveTab] = useState<'board' | 'history'>('board')
  const [transfers, setTransfers] = useState<TransferInfo[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Recent transfers (last 30 days) — loaded once for indicators
  const [recentTransfers, setRecentTransfers] = useState<Map<string, TransferInfo>>(new Map())

  // Confirmation modal
  const [pendingTransfer, setPendingTransfer] = useState<PendingTransfer | null>(null)
  const [transferReason, setTransferReason] = useState('')
  const [transferring, setTransferring] = useState(false)

  // Drag state
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverTeamId, setDragOverTeamId] = useState<number | null>(null)

  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkTarget, setBulkTarget] = useState<number | ''>('')
  const [bulkMoving, setBulkMoving] = useState(false)

  const toastIdRef = useRef(0)

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = ++toastIdRef.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  const markRecentlyMoved = useCallback((childId: string) => {
    setRecentlyMoved(prev => {
      const next = new Set(prev)
      next.add(childId)
      return next
    })
    setTimeout(() => {
      setRecentlyMoved(prev => {
        const next = new Set(prev)
        next.delete(childId)
        return next
      })
    }, 4000)
  }, [])

  const loadData = useCallback(async () => {
    const [teamsRes, parentsRes, transfersRes] = await Promise.all([
      fetch('/api/teams'),
      fetch('/api/admin/parinti'),
      fetch('/api/admin/transfers'),
    ])
    const teamsData: Team[] = await teamsRes.json()
    const parentsData = await parentsRes.json()

    setTeams(teamsData.filter(t => t.active !== false).sort((a, b) => a.sortOrder - b.sortOrder))

    const all: ChildRow[] = []
    if (Array.isArray(parentsData)) {
      parentsData.forEach((p: { name: string; email?: string; children?: { id: string; name: string; birthYear: number; teamId: number | null; teamName?: string | null }[] }) => {
        p.children?.forEach(c => {
          all.push({
            id: c.id,
            name: c.name,
            birthYear: c.birthYear,
            teamId: c.teamId,
            teamName: c.teamName || null,
            parentName: p.name,
            parentEmail: p.email,
          })
        })
      })
    }
    all.sort((a, b) => a.name.localeCompare(b.name))
    setChildren(all)

    // Parse recent transfers (last 30 days) for indicators
    if (transfersRes.ok) {
      const transfersData = await transfersRes.json()
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const recent = new Map<string, TransferInfo>()

      if (Array.isArray(transfersData)) {
        transfersData.forEach((t: { id: string; childId: string; child: { name: string; birthYear: number }; fromTeam: { grupa: string }; toTeam: { grupa: string }; reason: string | null; movedBy: string; createdAt: string }) => {
          const parsed: TransferInfo = {
            id: t.id,
            childId: t.childId,
            fromTeamGrupa: t.fromTeam.grupa,
            toTeamGrupa: t.toTeam.grupa,
            reason: t.reason,
            movedBy: t.movedBy,
            createdAt: t.createdAt,
            childName: t.child.name,
            childBirthYear: t.child.birthYear,
          }
          // Only keep the most recent transfer per child within 30 days
          if (new Date(t.createdAt) >= thirtyDaysAgo && !recent.has(t.childId)) {
            recent.set(t.childId, parsed)
          }
        })
      }
      setRecentTransfers(recent)
    }

    setLoading(false)
  }, [])

  const loadTransferHistory = useCallback(async () => {
    setLoadingHistory(true)
    try {
      const res = await fetch('/api/admin/transfers')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          setTransfers(data.map((t: { id: string; childId: string; child: { name: string; birthYear: number }; fromTeam: { grupa: string }; toTeam: { grupa: string }; reason: string | null; movedBy: string; createdAt: string }) => ({
            id: t.id,
            childId: t.childId,
            fromTeamGrupa: t.fromTeam.grupa,
            toTeamGrupa: t.toTeam.grupa,
            reason: t.reason,
            movedBy: t.movedBy,
            createdAt: t.createdAt,
            childName: t.child.name,
            childBirthYear: t.child.birthYear,
          })))
        }
      }
    } catch {
      console.error('Error loading transfer history')
    }
    setLoadingHistory(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    if (activeTab === 'history') {
      loadTransferHistory()
    }
  }, [activeTab, loadTransferHistory])

  // Filter children by search
  const filterChild = (c: ChildRow) => {
    if (!search) return true
    const q = search.toLowerCase()
    return c.name.toLowerCase().includes(q) || c.parentName.toLowerCase().includes(q)
  }

  // Get children for a specific team (or unassigned)
  const getTeamChildren = (teamId: number | null) => {
    return children.filter(c => c.teamId === teamId).filter(filterChild)
  }

  // Show confirmation modal before transferring
  const requestTransfer = (childId: string, toTeamId: number | null) => {
    const child = children.find(c => c.id === childId)
    if (!child || child.teamId === toTeamId) return

    const fromTeamName = child.teamName || 'Neasignati'
    const toTeam = teams.find(t => t.id === toTeamId)
    const toTeamName = toTeam?.grupa || 'Neasignati'

    setPendingTransfer({
      childId,
      childName: child.name,
      fromTeamName,
      toTeamId,
      toTeamName,
    })
    setTransferReason('')
  }

  // Execute the confirmed transfer
  const executeTransfer = async () => {
    if (!pendingTransfer) return
    setTransferring(true)

    const { childId, childName, fromTeamName, toTeamId, toTeamName } = pendingTransfer

    // Optimistic update
    setChildren(prev => prev.map(c =>
      c.id === childId ? { ...c, teamId: toTeamId, teamName: toTeamName } : c
    ))

    try {
      const res = await fetch(`/api/admin/sportivi/${childId}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toTeamId, reason: transferReason || undefined }),
      })

      if (!res.ok) throw new Error('API error')

      const data = await res.json()

      markRecentlyMoved(childId)

      // Update recent transfers map
      if (data.transferLog) {
        setRecentTransfers(prev => {
          const next = new Map(prev)
          next.set(childId, {
            id: data.transferLog.id,
            childId,
            fromTeamGrupa: data.transferLog.fromTeam.grupa,
            toTeamGrupa: data.transferLog.toTeam.grupa,
            reason: transferReason || null,
            movedBy: 'admin',
            createdAt: new Date().toISOString(),
            childName,
            childBirthYear: 0,
          })
          return next
        })
      }

      const emailInfo = data.emailSent ? ' (email trimis parintelui)' : ''
      showToast(`${childName} mutat de la ${fromTeamName} la ${toTeamName}${emailInfo}`, 'success')
    } catch {
      // Revert optimistic update
      const child = children.find(c => c.id === childId)
      if (child) {
        setChildren(prev => prev.map(c =>
          c.id === childId ? child : c
        ))
      }
      showToast(`Eroare la mutarea lui ${childName}`, 'error')
    }

    setPendingTransfer(null)
    setTransferReason('')
    setTransferring(false)
  }

  // Bulk move
  const handleBulkMove = async () => {
    if (!bulkTarget || selected.size === 0) return
    setBulkMoving(true)
    const targetId = Number(bulkTarget)
    const targetTeam = teams.find(t => t.id === targetId)
    let movedCount = 0

    for (const childId of Array.from(selected)) {
      const child = children.find(c => c.id === childId)
      if (child && child.teamId !== targetId) {
        // For bulk moves, skip confirmation modal — just transfer directly
        const fromTeamName = child.teamName || 'Neasignati'

        setChildren(prev => prev.map(c =>
          c.id === childId ? { ...c, teamId: targetId, teamName: targetTeam?.grupa || null } : c
        ))

        try {
          const res = await fetch(`/api/admin/sportivi/${childId}/transfer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ toTeamId: targetId, reason: `Mutare in masa la ${targetTeam?.grupa || '?'}` }),
          })
          if (res.ok) {
            markRecentlyMoved(childId)
            movedCount++
          }
        } catch {
          setChildren(prev => prev.map(c =>
            c.id === childId ? { ...c, teamId: child.teamId, teamName: fromTeamName } : c
          ))
        }
      }
    }

    if (movedCount > 0) {
      showToast(`${movedCount} sportivi mutati la ${targetTeam?.grupa || '?'}`, 'success')
    }
    setSelected(new Set())
    setBulkTarget('')
    setBulkMoving(false)
  }

  // Toggle selection
  const toggleSelect = (childId: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(childId)) next.delete(childId)
      else next.add(childId)
      return next
    })
  }

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, childId: string) => {
    setDragId(childId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', childId)
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5'
    }
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setDragId(null)
    setDragOverTeamId(null)
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1'
    }
  }

  const handleColumnDragOver = (e: React.DragEvent, teamId: number | null) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverTeamId !== teamId) {
      setDragOverTeamId(teamId)
    }
  }

  const handleColumnDragLeave = (e: React.DragEvent) => {
    const related = e.relatedTarget as HTMLElement | null
    if (!related || !e.currentTarget.contains(related)) {
      setDragOverTeamId(null)
    }
  }

  const handleColumnDrop = (e: React.DragEvent, teamId: number | null) => {
    e.preventDefault()
    setDragOverTeamId(null)
    const childId = e.dataTransfer.getData('text/plain')
    if (childId) {
      requestTransfer(childId, teamId)
    }
  }

  const unassigned = getTeamChildren(null)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="font-heading font-bold text-2xl">Echipe Board</h1>
          <p className="text-sm text-gray-400">{children.length} sportivi in {teams.length} echipe</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('board')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'board' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Board
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Istoric Transferuri
            </button>
          </div>

          {/* Search — only on board tab */}
          {activeTab === 'board' && (
            <div className="relative w-full sm:w-72">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Cauta sportiv sau parinte..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* BOARD TAB */}
      {activeTab === 'board' && (
        <>
          {/* Bulk move bar */}
          {selected.size > 0 && (
            <div className="bg-dinamo-blue text-white rounded-xl px-5 py-3 mb-5 flex flex-wrap items-center gap-3 shadow-lg">
              <span className="font-bold text-sm">{selected.size} selectati</span>
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-white/70 text-sm">Muta la:</span>
                <select
                  value={bulkTarget}
                  onChange={e => setBulkTarget(e.target.value ? Number(e.target.value) : '')}
                  className="bg-white/20 text-white border border-white/30 rounded-lg px-3 py-1.5 text-sm outline-none"
                >
                  <option value="" className="text-gray-900">Selecteaza echipa...</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id} className="text-gray-900">{t.grupa}</option>
                  ))}
                </select>
                <button
                  onClick={handleBulkMove}
                  disabled={!bulkTarget || bulkMoving}
                  className="bg-white text-dinamo-blue px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-white/90 transition-colors disabled:opacity-50"
                >
                  {bulkMoving ? 'Se muta...' : 'Muta'}
                </button>
                <button
                  onClick={() => setSelected(new Set())}
                  className="text-white/70 hover:text-white px-2 py-1.5 text-sm"
                >
                  Anuleaza
                </button>
              </div>
            </div>
          )}

          {/* Kanban columns */}
          <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 280px)' }}>
            {teams.map(team => {
              const colorConfig = getColorConfig(team.color)
              const teamChildren = getTeamChildren(team.id)
              const isDragTarget = dragOverTeamId === team.id && dragId !== null
              const draggedChild = dragId ? children.find(c => c.id === dragId) : null
              const isDragOrigin = draggedChild?.teamId === team.id

              return (
                <div
                  key={team.id}
                  className={`flex flex-col rounded-xl bg-white shadow-md min-w-[280px] w-[280px] lg:flex-1 lg:min-w-0 shrink-0 transition-all duration-200 ${
                    isDragTarget && !isDragOrigin ? 'ring-2 ring-offset-2 ring-dinamo-red scale-[1.01]' : ''
                  }`}
                  onDragOver={e => handleColumnDragOver(e, team.id)}
                  onDragLeave={handleColumnDragLeave}
                  onDrop={e => handleColumnDrop(e, team.id)}
                >
                  {/* Column header */}
                  <div className={`bg-gradient-to-r ${colorConfig.gradient} rounded-t-xl px-4 py-3 flex items-center justify-between`}>
                    <h2 className="text-white font-bold text-lg">{team.grupa}</h2>
                    <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                      {teamChildren.length}
                    </span>
                  </div>

                  {/* Column body */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ maxHeight: 'calc(100vh - 340px)' }}>
                    {isDragTarget && !isDragOrigin && (
                      <div className="border-2 border-dashed border-dinamo-red/30 rounded-lg p-3 text-center text-dinamo-red/50 text-xs font-medium bg-red-50/50">
                        Elibereaza aici
                      </div>
                    )}

                    {teamChildren.length === 0 && !isDragTarget && (
                      <p className="text-gray-300 text-xs text-center py-6">
                        {search ? 'Niciun rezultat' : 'Niciun sportiv'}
                      </p>
                    )}

                    {teamChildren.map(child => {
                      const recentTransfer = recentTransfers.get(child.id)
                      return (
                        <div
                          key={child.id}
                          draggable
                          onDragStart={e => handleDragStart(e, child.id)}
                          onDragEnd={handleDragEnd}
                          className={`group relative rounded-lg border p-3 cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-md ${
                            dragId === child.id ? 'opacity-50 scale-95' : ''
                          } ${
                            recentlyMoved.has(child.id)
                              ? 'border-green-300 bg-green-50/50'
                              : selected.has(child.id)
                                ? 'border-dinamo-red bg-red-50/30'
                                : recentTransfer
                                  ? 'border-amber-200 bg-amber-50/30'
                                  : 'border-gray-100 bg-white hover:border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {/* Checkbox */}
                            <input
                              type="checkbox"
                              checked={selected.has(child.id)}
                              onChange={() => toggleSelect(child.id)}
                              onClick={e => e.stopPropagation()}
                              className="w-3.5 h-3.5 rounded border-gray-300 text-dinamo-red focus:ring-dinamo-red shrink-0"
                            />

                            {/* Initials avatar */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${colorConfig.border}`}>
                              <span className={colorConfig.text}>
                                {child.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                              </span>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 text-sm truncate leading-tight">{child.name}</p>
                              <p className="text-[11px] text-gray-400 truncate">{child.birthYear} &middot; {child.parentName}</p>
                            </div>

                            {/* Recently moved badge */}
                            {recentlyMoved.has(child.id) && (
                              <span className="shrink-0 px-1.5 py-0.5 bg-green-500 text-white text-[9px] font-bold rounded-full animate-pulse">
                                NOU
                              </span>
                            )}

                            {/* Recent transfer indicator (last 30 days) */}
                            {recentTransfer && !recentlyMoved.has(child.id) && (
                              <span
                                className="shrink-0 cursor-help"
                                title={`Mutat de la ${recentTransfer.fromTeamGrupa} pe ${formatDate(recentTransfer.createdAt)}${recentTransfer.reason ? ` — ${recentTransfer.reason}` : ''}`}
                              >
                                <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                                </svg>
                              </span>
                            )}

                            {/* Drag handle */}
                            <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                              <circle cx="9" cy="5" r="1.5" /><circle cx="15" cy="5" r="1.5" />
                              <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
                              <circle cx="9" cy="19" r="1.5" /><circle cx="15" cy="19" r="1.5" />
                            </svg>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {/* Unassigned column */}
            {(unassigned.length > 0 || (dragId && children.find(c => c.id === dragId)?.teamId !== null)) && (
              <div
                className={`flex flex-col rounded-xl bg-white shadow-md min-w-[280px] w-[280px] lg:flex-1 lg:min-w-0 shrink-0 transition-all duration-200 ${
                  dragOverTeamId === -1 && dragId !== null ? 'ring-2 ring-offset-2 ring-gray-400 scale-[1.01]' : ''
                }`}
                onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverTeamId(-1) }}
                onDragLeave={handleColumnDragLeave}
                onDrop={e => handleColumnDrop(e, null)}
              >
                <div className="bg-gradient-to-r from-gray-400 to-gray-600 rounded-t-xl px-4 py-3 flex items-center justify-between">
                  <h2 className="text-white font-bold text-lg">Neasignati</h2>
                  <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    {unassigned.length}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ maxHeight: 'calc(100vh - 340px)' }}>
                  {unassigned.map(child => (
                    <div
                      key={child.id}
                      draggable
                      onDragStart={e => handleDragStart(e, child.id)}
                      onDragEnd={handleDragEnd}
                      className={`group relative rounded-lg border p-3 cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-md ${
                        dragId === child.id ? 'opacity-50 scale-95' : ''
                      } ${
                        recentlyMoved.has(child.id)
                          ? 'border-green-300 bg-green-50/50'
                          : selected.has(child.id)
                            ? 'border-dinamo-red bg-red-50/30'
                            : 'border-gray-100 bg-white hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={selected.has(child.id)}
                          onChange={() => toggleSelect(child.id)}
                          onClick={e => e.stopPropagation()}
                          className="w-3.5 h-3.5 rounded border-gray-300 text-dinamo-red focus:ring-dinamo-red shrink-0"
                        />
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 border-gray-300 bg-gray-50">
                          <span className="text-gray-500">
                            {child.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate leading-tight">{child.name}</p>
                          <p className="text-[11px] text-gray-400 truncate">{child.birthYear} &middot; {child.parentName}</p>
                        </div>
                        {recentlyMoved.has(child.id) && (
                          <span className="shrink-0 px-1.5 py-0.5 bg-green-500 text-white text-[9px] font-bold rounded-full animate-pulse">
                            NOU
                          </span>
                        )}
                        <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="9" cy="5" r="1.5" /><circle cx="15" cy="5" r="1.5" />
                          <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
                          <circle cx="9" cy="19" r="1.5" /><circle cx="15" cy="19" r="1.5" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* HISTORY TAB */}
      {activeTab === 'history' && (
        <TransferHistory loadingHistory={loadingHistory} transfers={transfers} />
      )}

      {/* Confirmation Modal */}
      {pendingTransfer && (
        <TransferConfirmModal
          pendingTransfer={pendingTransfer}
          transferReason={transferReason}
          transferring={transferring}
          onReasonChange={setTransferReason}
          onBackdropClose={() => !transferring && setPendingTransfer(null)}
          onCancel={() => { setPendingTransfer(null); setTransferReason('') }}
          onConfirm={executeTransfer}
        />
      )}

      {/* Toast notifications */}
      <ToastStack toasts={toasts} />

      {/* Inline animation keyframes */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
