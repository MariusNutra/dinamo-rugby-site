'use client'

import { useState, useEffect } from 'react'
import { getCsrfToken } from '@/lib/csrf-client'

interface Team {
  id: number
  grupa: string
  active: boolean
}

interface Notification {
  id: string
  title: string
  body: string
  type: string
  recipientGroup: string
  recipientCount: number
  sentAt: string
  sentBy: string | null
}

type NotificationType = 'anulare_antrenament' | 'schimbare_program' | 'meci_nou' | 'general'

interface Template {
  type: NotificationType
  label: string
  title: string
  body: string
}

const TEMPLATES: Template[] = [
  {
    type: 'anulare_antrenament',
    label: 'Anulare antrenament',
    title: 'Antrenament anulat',
    body: 'Va informam ca antrenamentul de [ZI, DATA] a fost anulat.\n\nMotivul: [motiv]\n\nUrmatorul antrenament va avea loc conform programului obisnuit.\n\nVa multumim pentru intelegere!',
  },
  {
    type: 'schimbare_program',
    label: 'Schimbare program',
    title: 'Modificare program antrenamente',
    body: 'Va informam ca programul de antrenamente a fost modificat.\n\nNoua programare:\n- [ZI]: [ORA], [LOCATIE]\n\nModificarea intra in vigoare de la [DATA].\n\nVa multumim!',
  },
  {
    type: 'meci_nou',
    label: 'Meci nou',
    title: 'Meci programat',
    body: 'Va anuntam ca a fost programat un meci nou:\n\nData: [DATA]\nOra: [ORA]\nLocatia: [LOCATIE]\nAdversar: [ECHIPA]\n\nVa rugam sa confirmati prezenta copilului.\n\nHai Dinamo!',
  },
  {
    type: 'general',
    label: 'Anunt general',
    title: '',
    body: '',
  },
]

const TYPE_LABELS: Record<string, string> = {
  anulare_antrenament: 'Anulare',
  schimbare_program: 'Program',
  meci_nou: 'Meci',
  general: 'General',
}

const TYPE_COLORS: Record<string, string> = {
  anulare_antrenament: 'bg-red-100 text-red-700',
  schimbare_program: 'bg-yellow-100 text-yellow-700',
  meci_nou: 'bg-green-100 text-green-700',
  general: 'bg-blue-100 text-blue-700',
}

export default function NotificariPage() {
  const [activeTab, setActiveTab] = useState<'compune' | 'istoric'>('compune')
  const [teams, setTeams] = useState<Team[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  // Form state
  const [type, setType] = useState<NotificationType>('general')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [recipientGroup, setRecipientGroup] = useState<'all' | 'team'>('all')
  const [teamId, setTeamId] = useState<string>('')

  const showToast = (msg: string, toastType: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type: toastType })
    setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => {
    fetch('/api/teams?active=1')
      .then(r => r.json())
      .then(setTeams)
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (activeTab === 'istoric') {
      setLoadingHistory(true)
      fetch('/api/admin/notificari')
        .then(r => r.json())
        .then(data => {
          setNotifications(data)
          setLoadingHistory(false)
        })
        .catch(() => setLoadingHistory(false))
    }
  }, [activeTab])

  const applyTemplate = (template: Template) => {
    setType(template.type)
    setTitle(template.title)
    setBody(template.body)
  }

  const resetForm = () => {
    setType('general')
    setTitle('')
    setBody('')
    setRecipientGroup('all')
    setTeamId('')
  }

  const handleSend = async () => {
    setShowConfirm(false)
    setSending(true)

    try {
      const payload: Record<string, string> = {
        title,
        body,
        type,
        recipientGroup: recipientGroup === 'team' ? 'team' : 'all',
      }
      if (recipientGroup === 'team' && teamId) {
        payload.teamId = teamId
      }

      const res = await fetch('/api/admin/notificari', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': getCsrfToken(),
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        showToast(data.error || 'Eroare la trimitere', 'err')
      } else {
        showToast(`Notificare trimisa cu succes catre ${data.sent} destinatari`)
        resetForm()
      }
    } catch {
      showToast('Eroare la trimitere', 'err')
    } finally {
      setSending(false)
    }
  }

  const recipientLabel = recipientGroup === 'all'
    ? 'Toti parintii'
    : teams.find(t => t.id === Number(teamId))?.grupa || 'Echipa selectata'

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-dinamo-blue">Notificari Email</h1>
          <p className="text-gray-500 text-sm mt-1">Trimite notificari prin email catre parinti</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('compune')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'compune'
              ? 'border-dinamo-red text-dinamo-red'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Compune
        </button>
        <button
          onClick={() => setActiveTab('istoric')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'istoric'
              ? 'border-dinamo-red text-dinamo-red'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Istoric
        </button>
      </div>

      {/* Compune Tab */}
      {activeTab === 'compune' && (
        <div className="space-y-6">
          {/* Template buttons */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-heading font-bold text-sm text-dinamo-blue mb-3">Sabloane rapide</h2>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map(template => (
                <button
                  key={template.type}
                  onClick={() => applyTemplate(template)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    type === template.type
                      ? 'bg-dinamo-red text-white border-dinamo-red'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-dinamo-red hover:text-dinamo-red'
                  }`}
                >
                  {template.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recipient selector */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-heading font-bold text-sm text-dinamo-blue mb-3">Destinatari</h2>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="recipientGroup"
                  value="all"
                  checked={recipientGroup === 'all'}
                  onChange={() => setRecipientGroup('all')}
                  className="accent-dinamo-red"
                />
                <span className="text-sm text-gray-700">Toti parintii</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="recipientGroup"
                  value="team"
                  checked={recipientGroup === 'team'}
                  onChange={() => setRecipientGroup('team')}
                  className="accent-dinamo-red"
                />
                <span className="text-sm text-gray-700">Per echipa</span>
              </label>
              {recipientGroup === 'team' && (
                <select
                  value={teamId}
                  onChange={e => setTeamId(e.target.value)}
                  className="ml-6 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-dinamo-red/50 max-w-xs"
                >
                  <option value="">-- Selecteaza echipa --</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.grupa}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Title and body */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-heading font-bold text-sm text-dinamo-blue mb-1">Continut mesaj</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subiect</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Subiectul emailului..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-dinamo-red/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mesaj</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={8}
                placeholder="Continutul notificarii..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-dinamo-red/50 resize-y"
              />
            </div>
          </div>

          {/* Preview */}
          {(title || body) && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-heading font-bold text-sm text-dinamo-blue mb-3">Previzualizare</h2>
              <div className="border border-gray-200 rounded-lg overflow-hidden max-w-lg">
                <div className="bg-[#1e3a5f] text-white px-4 py-3 text-center">
                  <span className="font-bold text-sm">Dinamo Rugby Juniori</span>
                </div>
                <div className="p-5 bg-gray-50">
                  {title && <h3 className="text-[#1e3a5f] font-bold text-base mb-2">{title}</h3>}
                  {body && (
                    <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {body}
                    </div>
                  )}
                </div>
                <div className="px-4 py-2 text-center text-xs text-gray-400">
                  Dinamo Rugby Juniori - Sectia Juniori
                </div>
              </div>
            </div>
          )}

          {/* Send button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowConfirm(true)}
              disabled={!title || !body || sending || (recipientGroup === 'team' && !teamId)}
              className="bg-dinamo-red text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? 'Se trimite...' : 'Trimite notificarea'}
            </button>
          </div>
        </div>
      )}

      {/* Istoric Tab */}
      {activeTab === 'istoric' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loadingHistory ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16 text-gray-500 text-sm">
              Nu exista notificari trimise
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Subiect</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Tip</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Destinatari</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Data trimiterii</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map(notif => (
                    <tr key={notif.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate">
                        {notif.title}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${TYPE_COLORS[notif.type] || 'bg-gray-100 text-gray-700'}`}>
                          {TYPE_LABELS[notif.type] || notif.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {notif.recipientCount} {notif.recipientGroup === 'all' ? '(toti)' : notif.recipientGroup === 'team' ? '(echipa)' : ''}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(notif.sentAt).toLocaleDateString('ro-RO', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Confirmation dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="font-heading font-bold text-lg text-dinamo-blue mb-2">
              Confirma trimiterea
            </h3>
            <p className="text-sm text-gray-600 mb-1">
              Esti sigur ca vrei sa trimiti aceasta notificare?
            </p>
            <div className="text-sm text-gray-500 mb-4">
              <p><strong>Subiect:</strong> {title}</p>
              <p><strong>Destinatari:</strong> {recipientLabel}</p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Anuleaza
              </button>
              <button
                onClick={handleSend}
                className="px-4 py-2 text-sm font-bold text-white bg-dinamo-red rounded-lg hover:bg-red-700 transition-colors"
              >
                Trimite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium z-50 transition-all ${
          toast.type === 'ok' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
