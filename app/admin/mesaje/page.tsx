'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Conversation {
  id: string
  type: string
  subject: string | null
  teamName: string | null
  participants: { name: string; type: string }[]
  lastMessage: { content: string; createdAt: string } | null
  unread: boolean
  updatedAt: string
}

interface Parent {
  id: string
  name: string
  email: string
}

export default function AdminMesajePage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [parents, setParents] = useState<Parent[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [newSubject, setNewSubject] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [selectedParentId, setSelectedParentId] = useState('')
  const [sending, setSending] = useState(false)

  const fetchConversations = useCallback(() => {
    fetch('/api/messages/conversations?all=1')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setConversations(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchConversations()
    // Poll every 30 seconds
    const interval = setInterval(fetchConversations, 30000)
    return () => clearInterval(interval)
  }, [fetchConversations])

  useEffect(() => {
    fetch('/api/admin/parinti')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setParents(data.map((p: { id: string; name: string; email: string }) => ({
            id: p.id, name: p.name, email: p.email,
          })))
        }
      })
  }, [])

  const handleNewConversation = async () => {
    if (!selectedParentId || !newMessage.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: newSubject || null,
          participantParentIds: [selectedParentId],
          message: newMessage,
        }),
      })
      if (res.ok) {
        setShowNew(false)
        setNewSubject('')
        setNewMessage('')
        setSelectedParentId('')
        fetchConversations()
      }
    } catch {
      // ignore
    }
    setSending(false)
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'Acum'
    if (minutes < 60) return `${minutes}min`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    return `${days}z`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading font-bold text-2xl">Mesaje</h1>
          <p className="text-sm text-gray-400">Comunicare internă cu părinții</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="px-4 py-2 bg-dinamo-red text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
        >
          + Mesaj nou
        </button>
      </div>

      {/* New conversation modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <h2 className="font-heading font-bold text-lg mb-4">Conversație nouă</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destinatar</label>
                <select
                  value={selectedParentId}
                  onChange={e => setSelectedParentId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-dinamo-red"
                >
                  <option value="">Selectează un părinte</option>
                  {parents.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subiect (opțional)</label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-dinamo-red"
                  placeholder="Subiect..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mesaj</label>
                <textarea
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  rows={4}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-dinamo-red"
                  placeholder="Scrie mesajul..."
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => setShowNew(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                Anulează
              </button>
              <button
                onClick={handleNewConversation}
                disabled={!selectedParentId || !newMessage.trim() || sending}
                className="px-4 py-2 bg-dinamo-red text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {sending ? 'Se trimite...' : 'Trimite'}
              </button>
            </div>
          </div>
        </div>
      )}

      {conversations.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-md">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">💬</span>
          </div>
          <h3 className="font-heading font-bold text-lg text-gray-600 mb-1">Niciun mesaj</h3>
          <p className="text-gray-400 text-sm">Începe o conversație cu un părinte.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden divide-y">
          {conversations.map(conv => (
            <Link
              key={conv.id}
              href={`/admin/mesaje/${conv.id}`}
              className={`block px-5 py-4 hover:bg-gray-50 transition-colors ${conv.unread ? 'bg-blue-50' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {conv.unread && <span className="w-2 h-2 bg-dinamo-red rounded-full flex-shrink-0" />}
                    <span className={`text-sm ${conv.unread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                      {conv.subject || conv.participants.filter(p => p.type === 'parent').map(p => p.name).join(', ') || 'Conversație'}
                    </span>
                  </div>
                  {conv.lastMessage && (
                    <p className="text-xs text-gray-500 mt-1 truncate">{conv.lastMessage.content}</p>
                  )}
                </div>
                <span className="text-xs text-gray-400 ml-3 flex-shrink-0">
                  {conv.lastMessage ? timeAgo(conv.lastMessage.createdAt) : ''}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
