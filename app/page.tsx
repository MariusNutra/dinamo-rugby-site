import { prisma } from '@/lib/prisma'
import TeamCard from '@/components/TeamCard'
import StoryCard from '@/components/StoryCard'
import Image from 'next/image'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const grupe = ['U10', 'U12', 'U14', 'U16', 'U18']

export default async function HomePage() {
  const stories = await prisma.story.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    take: 3,
  })

  const photos = await prisma.photo.findMany({
    orderBy: { createdAt: 'desc' },
    take: 8,
  })

  return (
    <>
      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-dinamo-red via-dinamo-dark to-dinamo-blue min-h-[70vh] flex items-center justify-center text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative text-center px-4 fade-in">
          <div className="w-36 h-36 mx-auto mb-6 drop-shadow-2xl">
            <Image src="/images/dinamo-rugby-bulldog.png" alt="Dinamo Rugby București" width={144} height={144} className="w-full h-full object-contain" priority />
          </div>
          <h1 className="font-heading font-extrabold text-4xl md:text-6xl lg:text-7xl mb-4">
            Dinamo Rugby
          </h1>
          <p className="text-xl md:text-2xl font-light opacity-90 mb-2">
            Secția de Juniori
          </p>
          <p className="text-lg opacity-75 max-w-2xl mx-auto mt-4">
            Formăm viitorii campioni ai rugby-ului românesc din 1949
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/contact" className="bg-white text-dinamo-red px-8 py-3 rounded-full font-heading font-bold hover:bg-gray-100 transition-colors shadow-lg">
              Înscrie-te acum
            </Link>
            <Link href="/despre" className="border-2 border-white text-white px-8 py-3 rounded-full font-heading font-bold hover:bg-white/10 transition-colors">
              Află mai multe
            </Link>
          </div>
        </div>
      </section>

      {/* Grupe de vârstă */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="font-heading font-bold text-3xl text-center mb-2 text-gray-900">Grupele noastre</h2>
        <p className="text-center text-gray-500 mb-10">Alege grupa de vârstă potrivită</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {grupe.map((g) => (
            <TeamCard key={g} grupa={g} />
          ))}
        </div>
      </section>

      {/* Ultimele povești */}
      <section className="bg-gray-50 py-16">
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

      {/* CTA */}
      <section className="bg-dinamo-red text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="font-heading font-bold text-3xl mb-4">Vrei să faci parte din echipă?</h2>
          <p className="text-lg opacity-90 mb-8">
            Înscrierile sunt deschise pentru toate grupele de vârstă. Vino la un antrenament de probă!
          </p>
          <Link href="/contact" className="inline-block bg-white text-dinamo-red px-8 py-3 rounded-full font-heading font-bold hover:bg-gray-100 transition-colors shadow-lg">
            Contactează-ne
          </Link>
        </div>
      </section>
    </>
  )
}
