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

export default function ParintiMesajePage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  const fetchConversations = useCallback(() => {
    fetch('/api/messages/conversations')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setConversations(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchConversations()
    const interval = setInterval(fetchConversations, 30000)
    return () => clearInterval(interval)
  }, [fetchConversations])

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'Acum'
    if (minutes < 60) return `acum ${minutes}min`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `acum ${hours}h`
    const days = Math.floor(hours / 24)
    return `acum ${days}z`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/parinti/dashboard" className="text-sm text-gray-500 hover:text-dinamo-red mb-2 inline-block">
          &larr; Înapoi la dashboard
        </Link>
        <h1 className="font-heading font-bold text-2xl">Mesaje</h1>
        <p className="text-sm text-gray-400">Comunicare cu antrenorii și administrația clubului</p>
      </div>

      {conversations.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">💬</span>
          </div>
          <h3 className="font-heading font-bold text-lg text-gray-600 mb-1">Niciun mesaj</h3>
          <p className="text-gray-400 text-sm">Vei primi mesaje de la antrenori și administrație aici.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden divide-y">
          {conversations.map(conv => (
            <Link
              key={conv.id}
              href={`/parinti/mesaje/${conv.id}`}
              className={`block px-5 py-4 hover:bg-gray-50 transition-colors ${conv.unread ? 'bg-blue-50' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {conv.unread && <span className="w-2 h-2 bg-dinamo-red rounded-full flex-shrink-0" />}
                    <span className={`text-sm ${conv.unread ? 'font-bold' : 'font-medium'} text-gray-900`}>
                      {conv.subject || conv.participants.filter(p => p.type === 'admin').map(p => p.name).join(', ') || 'Conversație'}
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
