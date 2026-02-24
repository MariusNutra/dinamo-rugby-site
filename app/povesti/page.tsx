import { prisma } from '@/lib/prisma'
import StoryCard from '@/components/StoryCard'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Povești & Noutăți — Dinamo Rugby Juniori',
  description: 'Ultimele noutăți și povești din activitatea secției de juniori rugby Dinamo București.',
}

export default async function StoriesPage() {
  const stories = await prisma.story.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <>
      <section className="bg-dinamo-blue text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center fade-in">
          <h1 className="font-heading font-extrabold text-4xl md:text-5xl mb-2">Povești &amp; Noutăți</h1>
          <p className="text-lg opacity-80">Din viața secției de juniori Dinamo Rugby</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {stories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <div className="text-center py-20 text-gray-400">
            <p className="text-xl">Încă nu sunt povești publicate.</p>
            <p className="mt-2">Revino în curând!</p>
          </div>
        )}
      </div>
    </>
  )
}
