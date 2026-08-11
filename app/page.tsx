import { prisma } from '@/lib/prisma'
import { getActiveTeams } from '@/lib/active-teams'
import TeamCard from '@/components/TeamCard'
import StoryCard from '@/components/StoryCard'
import UpcomingMatch from '@/components/UpcomingMatch'
import LatestResults from '@/components/LatestResults'
import VideoCard from '@/components/VideoCard'
import Link from 'next/link'
import DownloadSection from '@/components/DownloadSection'
import HeroVideo from '@/components/HeroVideo'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const activeTeams = await getActiveTeams()

  const stories = await prisma.story.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    take: 3,
  })

  const featuredVideos = await prisma.video.findMany({
    where: { featured: true },
    orderBy: { createdAt: 'desc' },
    take: 2,
  })

  const photos = await prisma.photo.findMany({
    orderBy: { createdAt: 'desc' },
    take: 8,
  })

  return (
    <>
      {/* Hero cinematic. Fundalul e carbon aproape negru, ca fundalul propriu
          al filmului — asa nu mai exista muchie intre video si pagina. Rosul
          clubului ramane accent (butonul), nu fundal. */}
      <section className="relative flex h-[70vh] min-h-[460px] items-end overflow-hidden bg-[#0a0a0c] text-white">
        <HeroVideo>
          {/* Eticheta de deasupra titlului: linia rosie o ancoreaza si aduce
              culoarea clubului fara sa inunde ecranul. */}
          <p className="mb-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.28em] text-white/60">
            <span aria-hidden="true" className="inline-block h-px w-10 bg-dinamo-red" />
            CS Dinamo București · din 1948
          </p>

          <h1 className="font-heading text-5xl font-extrabold leading-[0.95] tracking-tight md:text-7xl">
            Secția de Juniori
          </h1>

          <p className="mt-5 max-w-md text-base leading-relaxed text-white/70 md:text-lg">
            Formăm viitorii campioni ai rugby-ului românesc.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-6">
            <Link
              href="/contact"
              className="rounded-full bg-dinamo-red px-9 py-4 font-heading font-bold text-white shadow-lg shadow-dinamo-red/25 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-dinamo-red/35"
            >
              Înscrie-te acum
            </Link>
            {/* A doua actiune ramane link, nu buton: doua butoane egale nu spun
                nimanui ce se asteapta de la el. */}
            <Link
              href="/despre"
              className="border-b border-white/30 pb-0.5 font-heading font-semibold text-white/80 transition hover:border-white hover:text-white"
            >
              Află mai multe
            </Link>
          </div>
        </HeroVideo>
      </section>

      {/* Grupe de vârstă */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="font-heading font-bold text-3xl text-center mb-2 text-gray-900">Grupele noastre</h2>
        <p className="text-center text-gray-500 mb-10">Alege grupa de vârstă potrivită</p>
        <div className="flex flex-wrap justify-center gap-4">
          {activeTeams.map((t) => (
            <TeamCard key={t.grupa} grupa={t.grupa} color={t.color} ageRange={t.ageRange} />
          ))}
        </div>
      </section>

      {/* Video Highlights */}
      {featuredVideos.length > 0 && (
        <section className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="font-heading font-bold text-3xl text-center mb-2 text-gray-900">Video Highlights</h2>
            <p className="text-center text-gray-500 mb-10">Cele mai recente momente de pe teren</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredVideos.map((v) => {
                const match = v.youtubeUrl.match(/(?:youtube\.com\/watch\?.*v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/)
                const youtubeId = match ? match[1] : (/^[a-zA-Z0-9_-]{11}$/.test(v.youtubeUrl) ? v.youtubeUrl : null)
                if (!youtubeId) return null
                return (
                  <VideoCard
                    key={v.id}
                    title={v.title}
                    youtubeId={youtubeId}
                    description={v.description}
                  />
                )
              })}
            </div>
            <div className="text-center mt-8">
              <Link href="/video-highlights" className="text-dinamo-red font-bold hover:underline">
                Vezi toate videoclipurile →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Meciuri și Rezultate Dinamo */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UpcomingMatch />
            <LatestResults />
          </div>
        </div>
      </section>

      {/* Ultimele povești */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="font-heading font-bold text-3xl text-gray-900">Ultimele povești</h2>
              <p className="text-gray-500 mt-1">Noutăți din activitatea secției</p>
            </div>
            <Link href="/povesti" className="text-dinamo-red font-bold hover:underline">
              Vezi toate →
            </Link>
          </div>
          {stories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stories.map((story) => (
                <StoryCard
                  key={story.id}
                  title={story.title}
                  slug={story.slug}
                  excerpt={story.excerpt}
                  coverImage={story.coverImage}
                  createdAt={story.createdAt.toISOString()}
                  grupa={story.grupa}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg">Încă nu sunt povești publicate.</p>
              <p className="text-sm mt-1">Adaugă prima poveste din panoul admin.</p>
            </div>
          )}
        </div>
      </section>

      {/* Galerie foto */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="font-heading font-bold text-3xl text-gray-900">Galerie foto</h2>
            <p className="text-gray-500 mt-1">Momente din viața echipei</p>
          </div>
          <Link href="/galerie" className="text-dinamo-red font-bold hover:underline">
            Vezi galeria →
          </Link>
        </div>
        {photos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {photos.map((photo) => (
              <div key={photo.id} className="aspect-square rounded-lg overflow-hidden group">
                <img src={photo.path} alt={photo.caption || 'Foto'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg">Încă nu sunt poze adăugate.</p>
            <p className="text-sm mt-1">Adaugă poze din panoul admin.</p>
          </div>
        )}
      </section>

      {/* Parent Portal CTA */}
      <section className="bg-dinamo-blue text-white py-12">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="font-heading font-bold text-2xl mb-3">Portal Parinti</h2>
          <p className="text-lg opacity-90 mb-6">
            Accesează portalul dedicat părinților pentru acorduri foto, documente și informații despre echipă.
          </p>
          <Link href="/parinti" className="inline-block bg-white text-dinamo-blue px-8 py-3 rounded-full font-heading font-bold hover:bg-gray-100 transition-colors shadow-lg">
            Acceseaza Portalul
          </Link>
        </div>
      </section>

      {/* Download App Section */}
      <DownloadSection />

      {/* CTA */}
      <section className="bg-dinamo-red text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="font-heading font-bold text-3xl mb-4">Vrei să faci parte din echipă?</h2>
          <p className="text-lg opacity-90 mb-8">
            Înscrierile sunt deschise pentru toate grupele de vârstă. Vino la un antrenament de probă!
          </p>
          <Link href="/inscrieri" className="inline-block bg-white text-dinamo-red px-8 py-3 rounded-full font-heading font-bold hover:bg-gray-100 transition-colors shadow-lg">
            Înscrie-te acum
          </Link>
        </div>
      </section>
    </>
  )
}
