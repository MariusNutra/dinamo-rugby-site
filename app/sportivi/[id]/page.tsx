import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const child = await prisma.child.findUnique({
    where: { id },
    select: { name: true, publicProfile: true },
  })
  if (!child || !child.publicProfile) return { title: 'Sportiv negăsit' }
  return {
    title: `${child.name} | CS Dinamo București Rugby`,
    description: `Profilul sportivului ${child.name} de la CS Dinamo București Rugby.`,
  }
}

export default async function AthleteProfilePage({ params }: Props) {
  const { id } = await params

  const child = await prisma.child.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      birthYear: true,
      publicProfile: true,
      publicBio: true,
      photoConsent: true,
      team: { select: { grupa: true } },
      childPhotos: {
        select: { url: true, caption: true, date: true },
        orderBy: { createdAt: 'desc' },
        take: 6,
      },
      evaluations: {
        select: {
          period: true,
          physical: true,
          technical: true,
          tactical: true,
          mental: true,
          social: true,
          date: true,
        },
        orderBy: { date: 'desc' },
        take: 4,
      },
      _count: {
        select: {
          attendances: { where: { present: true } },
          evaluations: true,
          medicalRecords: true,
        },
      },
    },
  })

  if (!child || !child.publicProfile || !child.photoConsent) {
    notFound()
  }

  const initials = child.name.split(' ').map(n => n[0]).join('').slice(0, 2)
  const latestEval = child.evaluations[0]

  // Calculate attendance rate (last 3 months)
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  const totalAttendances = await prisma.attendance.count({
    where: { childId: id, date: { gte: threeMonthsAgo } },
  })
  const presentAttendances = await prisma.attendance.count({
    where: { childId: id, date: { gte: threeMonthsAgo }, present: true },
  })
  const attendanceRate = totalAttendances > 0 ? Math.round((presentAttendances / totalAttendances) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-dinamo-blue to-blue-800 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/sportivi" className="inline-flex items-center text-white/70 hover:text-white text-sm mb-6">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Toți sportivii
          </Link>

          <div className="flex items-center gap-6">
            {child.childPhotos[0]?.url ? (
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white/20 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={child.childPhotos[0].url} alt={child.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold flex-shrink-0">
                {initials}
              </div>
            )}
            <div>
              <h1 className="font-heading text-3xl md:text-4xl font-bold">{child.name}</h1>
              {child.team && (
                <p className="text-white/80 text-lg mt-1">{child.team.grupa}</p>
              )}
              <p className="text-white/60 text-sm mt-1">Născut în {child.birthYear}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Bio */}
        {child.publicBio && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="font-heading font-bold text-lg mb-3">Despre</h2>
            <p className="text-gray-600 leading-relaxed">{child.publicBio}</p>
          </div>
        )}

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-5 text-center">
            <p className="text-2xl font-heading font-bold text-dinamo-red">{child._count.attendances}</p>
            <p className="text-xs text-gray-500 mt-1">Prezențe totale</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 text-center">
            <p className="text-2xl font-heading font-bold text-green-600">{attendanceRate}%</p>
            <p className="text-xs text-gray-500 mt-1">Rata prezență (3 luni)</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 text-center">
            <p className="text-2xl font-heading font-bold text-blue-600">{child._count.evaluations}</p>
            <p className="text-xs text-gray-500 mt-1">Evaluări</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 text-center">
            <p className="text-2xl font-heading font-bold text-amber-600">
              {latestEval ? Math.round((latestEval.physical + latestEval.technical + latestEval.tactical + latestEval.mental + latestEval.social) / 5) : '—'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Medie evaluare</p>
          </div>
        </div>

        {/* Latest evaluations */}
        {child.evaluations.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="font-heading font-bold text-lg mb-4">Evoluție evaluări</h2>
            <div className="space-y-4">
              {child.evaluations.map((ev, i) => {
                const avg = Math.round((ev.physical + ev.technical + ev.tactical + ev.mental + ev.social) / 5)
                return (
                  <div key={i} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-sm text-gray-900">{ev.period}</span>
                      <span className="text-xs text-gray-500">{new Date(ev.date).toLocaleDateString('ro-RO')}</span>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {[
                        { label: 'Fizic', value: ev.physical, color: 'bg-red-500' },
                        { label: 'Tehnic', value: ev.technical, color: 'bg-blue-500' },
                        { label: 'Tactic', value: ev.tactical, color: 'bg-green-500' },
                        { label: 'Mental', value: ev.mental, color: 'bg-purple-500' },
                        { label: 'Social', value: ev.social, color: 'bg-amber-500' },
                      ].map(s => (
                        <div key={s.label} className="text-center">
                          <div className="text-xs text-gray-500 mb-1">{s.label}</div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full ${s.color} rounded-full`} style={{ width: `${s.value * 10}%` }} />
                          </div>
                          <div className="text-xs font-bold mt-1">{s.value}/10</div>
                        </div>
                      ))}
                    </div>
                    <div className="text-right mt-2">
                      <span className="text-sm font-bold text-dinamo-blue">Media: {avg}/10</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Photos */}
        {child.childPhotos.length > 1 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-heading font-bold text-lg mb-4">Galerie</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {child.childPhotos.map((photo, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt={photo.caption || child.name} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
