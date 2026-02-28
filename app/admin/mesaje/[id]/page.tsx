'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Message {
  id: string
  content: string
  senderName: string
  senderType: string
  isMe: boolean
  createdAt: string
}

interface ConvInfo {
  id: string
  subject: string | null
  participants: { name: string; type: string }[]
}

export default function AdminConversationPage() {
  const { id } = useParams<{ id: string }>()
  const [conversation, setConversation] = useState<ConvInfo | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const fetchMessages = useCallback(() => {
    fetch(`/api/messages/conversations/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.conversation) setConversation(data.conversation)
        if (data.messages) setMessages(data.messages)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 15000)
    return () => clearInterval(interval)
  }, [fetchMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!newMessage.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/messages/conversations/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage }),
      })
      if (res.ok) {
        const msg = await res.json()
        setMessages(prev => [...prev, msg])
        setNewMessage('')
      }
    } catch {
      // ignore
    }
    setSending(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full" />
      </div>
    )
  }

  const otherParticipants = conversation?.participants.filter(p => p.type === 'parent').map(p => p.name).join(', ')

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link href="/admin/mesaje" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="font-heading font-bold text-lg">
            {conversation?.subject || otherParticipants || 'Conversație'}
          </h1>
          {conversation?.subject && otherParticipants && (
            <p className="text-xs text-gray-500">{otherParticipants}</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 rounded-xl p-4 space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
              msg.isMe
                ? 'bg-dinamo-blue text-white rounded-br-md'
                : 'bg-white text-gray-900 shadow-sm rounded-bl-md'
            }`}>
              {!msg.isMe && (
                <p className="text-xs font-medium text-dinamo-red mb-1">{msg.senderName}</p>
              )}
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              <p className={`text-[10px] mt-1 ${msg.isMe ? 'text-white/60' : 'text-gray-400'}`}>
                {new Date(msg.createdAt).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Scrie un mesaj..."
          className="flex-1 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-dinamo-red"
        />
        <button
          onClick={handleSend}
          disabled={!newMessage.trim() || sending}
          className="px-5 py-3 bg-dinamo-red text-white rounded-xl font-medium text-sm disabled:opacity-50 hover:bg-red-700 transition-colors"
        >
          {sending ? '...' : 'Trimite'}
        </button>
      </div>
    </div>
  )
}
