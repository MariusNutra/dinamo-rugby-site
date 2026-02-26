'use client'

import { useState, useEffect } from 'react'
import { getCsrfToken } from '@/lib/csrf-client'

interface Campaign {
  id: string
  title: string
  description: string
  image: string | null
  goalAmount: number
  currentAmount: number
  deadline: string | null
  active: boolean
  showDonors: boolean
  allowAnonymous: boolean
  createdAt: string
  _count?: { donations: number }
  donations?: Donation[]
}

interface Donation {
  id: string
  donorName: string | null
  email: string | null
  amount: number
  anonymous: boolean
  paymentMethod: string
  status: string
  createdAt: string
}

export default function AdminFundraisingPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'campanii' | 'donatii' | 'dashboard'>('campanii')
  const [editing, setEditing] = useState<Campaign | null>(null)
  const [creating, setCreating] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null)
  const [donations, setDonations] = useState<Donation[]>([])
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState('')
  const [goalAmount, setGoalAmount] = useState(0)
  const [deadline, setDeadline] = useState('')
  const [showDonors, setShowDonors] = useState(true)
  const [allowAnonymous, setAllowAnonymous] = useState(true)

  // Donation form
  const [donorName, setDonorName] = useState('')
  const [donorEmail, setDonorEmail] = useState('')
  const [donationAmount, setDonationAmount] = useState(0)
  const [donationAnonymous, setDonationAnonymous] = useState(false)
  const [addingDonation, setAddingDonation] = useState(false)

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const loadCampaigns = () => {
    fetch('/api/admin/fundraising')
      .then(r => r.json())
      .then(data => {
        setCampaigns(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { loadCampaigns() }, [])

  const loadDonations = (campaignId: string) => {
    setSelectedCampaign(campaignId)
    fetch(`/api/admin/fundraising/${campaignId}/donations`)
      .then(r => r.json())
      .then(data => setDonations(Array.isArray(data) ? data : []))
      .catch(() => {})
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setImage('')
    setGoalAmount(0)
    setDeadline('')
    setShowDonors(true)
    setAllowAnonymous(true)
    setEditing(null)
    setCreating(false)
  }

  const startEdit = (c: Campaign) => {
    setTitle(c.title)
    setDescription(c.description)
    setImage(c.image || '')
    setGoalAmount(c.goalAmount)
    setDeadline(c.deadline ? c.deadline.split('T')[0] : '')
    setShowDonors(c.showDonors)
    setAllowAnonymous(c.allowAnonymous)
    setEditing(c)
    setCreating(false)
  }

  const handleSave = async () => {
    if (!title || !description || goalAmount <= 0) {
      showToast('Completeaza titlul, descrierea si obiectivul', 'err')
      return
    }

    const body = {
      title,
      description,
      image: image || null,
      goalAmount,
      deadline: deadline || null,
      showDonors,
      allowAnonymous,
    }

    const url = editing
      ? `/api/admin/fundraising/${editing.id}`
      : '/api/admin/fundraising'

    const res = await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': getCsrfToken(),
      },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      showToast(editing ? 'Campanie actualizata' : 'Campanie creata')
      resetForm()
      loadCampaigns()
    } else {
      showToast('Eroare la salvare', 'err')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Sterge campania? Toate donatiile asociate vor fi sterse.')) return

    const res = await fetch(`/api/admin/fundraising/${id}`, {
      method: 'DELETE',
      headers: { 'x-csrf-token': getCsrfToken() },
    })

    if (res.ok) {
      showToast('Campanie stearsa')
      loadCampaigns()
    } else {
      showToast('Eroare la stergere', 'err')
    }
  }

  const toggleActive = async (c: Campaign) => {
    const res = await fetch(`/api/admin/fundraising/${c.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': getCsrfToken(),
      },
      body: JSON.stringify({ active: !c.active }),
    })
    if (res.ok) {
      showToast(c.active ? 'Campanie dezactivata' : 'Campanie activata')
      loadCampaigns()
    }
  }

  const handleAddDonation = async () => {
    if (!selectedCampaign || donationAmount <= 0) {
      showToast('Suma trebuie sa fie pozitiva', 'err')
      return
    }

    setAddingDonation(true)
    const res = await fetch(`/api/admin/fundraising/${selectedCampaign}/donations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': getCsrfToken(),
      },
      body: JSON.stringify({
        donorName: donorName || null,
        email: donorEmail || null,
        amount: donationAmount,
        anonymous: donationAnonymous,
      }),
    })

    if (res.ok) {
      showToast('Donatie adaugata')
      setDonorName('')
      setDonorEmail('')
      setDonationAmount(0)
      setDonationAnonymous(false)
      loadDonations(selectedCampaign)
      loadCampaigns()
    } else {
      showToast('Eroare la adaugare', 'err')
    }
    setAddingDonation(false)
  }

  // Dashboard stats
  const totalRaised = campaigns.reduce((sum, c) => sum + c.currentAmount, 0)
  const totalDonors = campaigns.reduce((sum, c) => sum + (c._count?.donations || 0), 0)
  const activeCampaigns = campaigns.filter(c => c.active).length

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-dinamo-blue mb-6">Fundraising</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {(['campanii', 'donatii', 'dashboard'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
              tab === t ? 'bg-white shadow text-dinamo-blue' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {tab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="text-3xl font-bold text-dinamo-red">{totalRaised.toLocaleString('ro-RO')} RON</div>
            <div className="text-sm text-gray-500 mt-1">Total strans</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="text-3xl font-bold text-dinamo-blue">{totalDonors}</div>
            <div className="text-sm text-gray-500 mt-1">Total donatii</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="text-3xl font-bold text-green-600">{activeCampaigns}</div>
            <div className="text-sm text-gray-500 mt-1">Campanii active</div>
          </div>
        </div>
      )}

      {/* Campaigns Tab */}
      {tab === 'campanii' && (
        <div>
          {(creating || editing) ? (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="font-heading font-bold text-lg mb-4">
                {editing ? 'Editeaza campanie' : 'Campanie noua'}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titlu</label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Titlul campaniei" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descriere</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={4} placeholder="Descrierea campaniei" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL Imagine (optional)</label>
                  <input type="text" value={image} onChange={e => setImage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="https://..." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Obiectiv (RON)</label>
                    <input type="number" value={goalAmount} onChange={e => setGoalAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg" min={1} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Termen (optional)</label>
                    <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                </div>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={showDonors} onChange={e => setShowDonors(e.target.checked)} className="rounded" />
                    Afiseaza donatorii
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={allowAnonymous} onChange={e => setAllowAnonymous(e.target.checked)} className="rounded" />
                    Permite anonim
                  </label>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={handleSave}
                    className="px-6 py-2 bg-dinamo-red text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
                    {editing ? 'Salveaza' : 'Creaza campanie'}
                  </button>
                  <button onClick={resetForm}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    Anuleaza
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <button onClick={() => setCreating(true)}
                className="mb-4 px-4 py-2 bg-dinamo-red text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm">
                + Campanie noua
              </button>

              {campaigns.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border">
                  <div className="text-4xl mb-3">💰</div>
                  <p className="text-gray-500">Nicio campanie creata</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {campaigns.map(c => {
                    const percent = c.goalAmount > 0 ? Math.min(100, Math.round((c.currentAmount / c.goalAmount) * 100)) : 0
                    return (
                      <div key={c.id} className="bg-white rounded-lg shadow-sm border p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-heading font-bold">{c.title}</h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {c._count?.donations || 0} donatii &middot; {c.active ? 'Activa' : 'Inactiva'}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => toggleActive(c)}
                              className={`px-2 py-1 text-xs rounded ${c.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                              {c.active ? 'Activa' : 'Inactiva'}
                            </button>
                            <button onClick={() => startEdit(c)}
                              className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded">Editeaza</button>
                            <button onClick={() => handleDelete(c.id)}
                              className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded">Sterge</button>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                          <div className="h-full rounded-full bg-dinamo-red" style={{ width: `${percent}%` }} />
                        </div>
                        <div className="flex justify-between text-xs mt-1 text-gray-500">
                          <span>{c.currentAmount.toLocaleString('ro-RO')} / {c.goalAmount.toLocaleString('ro-RO')} RON</span>
                          <span>{percent}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Donations Tab */}
      {tab === 'donatii' && (
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Selecteaza campania</label>
            <select
              value={selectedCampaign || ''}
              onChange={e => { if (e.target.value) loadDonations(e.target.value) }}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">-- Alege --</option>
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          {selectedCampaign && (
            <>
              {/* Add donation form */}
              <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
                <h3 className="font-heading font-bold text-sm mb-3">Adauga donatie manuala</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input type="text" value={donorName} onChange={e => setDonorName(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Nume donator" />
                  <input type="email" value={donorEmail} onChange={e => setDonorEmail(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Email" />
                  <input type="number" value={donationAmount || ''} onChange={e => setDonationAmount(Number(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Suma (RON)" min={1} />
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1 text-sm">
                      <input type="checkbox" checked={donationAnonymous} onChange={e => setDonationAnonymous(e.target.checked)} />
                      Anonim
                    </label>
                    <button onClick={handleAddDonation} disabled={addingDonation}
                      className="px-4 py-2 bg-dinamo-red text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50">
                      {addingDonation ? '...' : 'Adauga'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Donations list */}
              {donations.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-lg border">
                  <p className="text-gray-500 text-sm">Nicio donatie pentru aceasta campanie</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Donator</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-600">Suma</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Metoda</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {donations.map(d => (
                        <tr key={d.id} className="border-t">
                          <td className="px-4 py-3">{d.anonymous ? 'Anonim' : d.donorName || '—'}</td>
                          <td className="px-4 py-3 text-gray-500">{d.email || '—'}</td>
                          <td className="px-4 py-3 text-right font-bold text-dinamo-red">{d.amount.toLocaleString('ro-RO')} RON</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${d.paymentMethod === 'stripe' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                              {d.paymentMethod}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500">{new Date(d.createdAt).toLocaleDateString('ro-RO')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium z-50 ${
          toast.type === 'ok' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
