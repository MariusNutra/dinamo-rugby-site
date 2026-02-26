'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import DonationForm from '@/components/DonationForm'

interface DonationPublic {
  id: string
  donorName: string | null
  amount: number
  anonymous: boolean
  createdAt: string
}

interface CampaignPublic {
  id: string
  title: string
  description: string
  image: string | null
  goalAmount: number
  currentAmount: number
  deadline: string | null
  showDonors: boolean
  allowAnonymous: boolean
  donations: DonationPublic[]
}

export default function FundraisingPage() {
  const [campaigns, setCampaigns] = useState<CampaignPublic[]>([])
  const [loading, setLoading] = useState(true)
  const [donatingCampaign, setDonatingCampaign] = useState<CampaignPublic | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const loadCampaigns = () => {
    fetch('/api/fundraising')
      .then(r => r.json())
      .then(data => {
        setCampaigns(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { loadCampaigns() }, [])

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 flex justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-dinamo-blue mb-3">
          Sustine Dinamo Rugby Juniori
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Fiecare donatie conteaza! Ajuta-ne sa oferim juniorilor nostri cele mai bune conditii de antrenament si competitie.
        </p>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border">
          <div className="text-5xl mb-4">💰</div>
          <h2 className="font-heading text-xl font-bold text-gray-700 mb-2">Nicio campanie activa</h2>
          <p className="text-gray-500">Momentan nu exista campanii de fundraising active.</p>
          <Link href="/" className="inline-block mt-6 px-6 py-2 bg-dinamo-red text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
            Inapoi la pagina principala
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {campaigns.map(campaign => {
            const percent = campaign.goalAmount > 0
              ? Math.min(100, Math.round((campaign.currentAmount / campaign.goalAmount) * 100))
              : 0

            return (
              <div key={campaign.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                {campaign.image && (
                  <div className="h-48 md:h-64 bg-gray-100 overflow-hidden">
                    <img src={campaign.image} alt={campaign.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-6 md:p-8">
                  <h2 className="font-heading text-2xl font-bold text-dinamo-blue mb-2">{campaign.title}</h2>
                  <div className="text-gray-600 mb-6 campaign-description [&_h3]:text-dinamo-blue [&_h3]:font-heading [&_h3]:font-bold [&_h3]:text-lg [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_li]:mb-1.5 [&_strong]:text-gray-800"
                    dangerouslySetInnerHTML={{ __html: campaign.description }} />

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-bold text-dinamo-red">
                        {campaign.currentAmount.toLocaleString('ro-RO')} RON
                      </span>
                      <span className="text-gray-500">
                        din {campaign.goalAmount.toLocaleString('ro-RO')} RON
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-dinamo-red to-red-500 transition-all duration-500"
                        style={{ width: `${percent}%` }} />
                    </div>
                    <div className="flex justify-between text-xs mt-1.5">
                      <span className="font-bold text-dinamo-red">{percent}% completat</span>
                      {campaign.deadline && (
                        <span className="text-gray-500">
                          Termen: {new Date(campaign.deadline).toLocaleDateString('ro-RO')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-6">
                    <button onClick={() => setDonatingCampaign(campaign)}
                      className="px-8 py-3 bg-dinamo-red text-white rounded-lg hover:bg-red-700 transition-colors font-bold text-lg shadow-md hover:shadow-lg">
                      Doneaza acum
                    </button>
                  </div>

                  {campaign.showDonors && campaign.donations.length > 0 && (
                    <div className="mt-8 border-t pt-6">
                      <h3 className="font-heading font-bold text-sm text-gray-700 mb-3">
                        Ultimele donatii ({campaign.donations.length})
                      </h3>
                      <div className="space-y-2">
                        {campaign.donations.slice(0, 10).map(donation => (
                          <div key={donation.id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50">
                            <span className="text-gray-600">
                              {donation.anonymous ? 'Anonim' : donation.donorName || 'Anonim'}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-dinamo-red">
                                {donation.amount.toLocaleString('ro-RO')} RON
                              </span>
                              <span className="text-xs text-gray-400">
                                {new Date(donation.createdAt).toLocaleDateString('ro-RO')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Donation modal */}
      {donatingCampaign && (
        <DonationForm
          campaignId={donatingCampaign.id}
          campaignTitle={donatingCampaign.title}
          onClose={() => setDonatingCampaign(null)}
          onSuccess={() => {
            setDonatingCampaign(null)
            setShowSuccess(true)
            loadCampaigns()
            setTimeout(() => setShowSuccess(false), 5000)
          }}
        />
      )}

      {/* Success toast */}
      {showSuccess && (
        <div className="fixed bottom-6 right-6 px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium z-50 bg-green-600">
          Multumim pentru donatie! Veti primi un email de confirmare.
        </div>
      )}
    </div>
  )
}
