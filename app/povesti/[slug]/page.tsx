import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import PhotoGrid from '@/components/PhotoGrid'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/)
  return match ? match[1] : null
}

export default async function StoryPage({ params }: { params: { slug: string } }) {
  const story = await prisma.story.findUnique({
    where: { slug: params.slug },
    include: { photos: true },
  })

  if (!story || !story.published) notFound()

  const youtubeId = story.videoUrl ? getYouTubeId(story.videoUrl) : null

  return (
    <>
      <section className="bg-dinamo-blue text-white py-12">
        <div className="max-w-4xl mx-auto px-4 fade-in">
          <Link href="/povesti" className="text-white/70 hover:text-white text-sm mb-4 inline-block">&larr; Înapoi la povești</Link>
          <h1 className="font-heading font-extrabold text-3xl md:text-4xl mb-3">{story.title}</h1>
          <div className="flex items-center gap-4 text-sm text-white/70">
            <time>{new Date(story.createdAt).toLocaleDateString('ro-RO', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
            {story.grupa && <span className="bg-white/20 px-3 py-1 rounded-full">{story.grupa}</span>}
          </div>
        </div>
      </section>

      <article className="max-w-4xl mx-auto px-4 py-12">
        {story.coverImage && (
          <img src={story.coverImage} alt={story.title} className="w-full rounded-xl mb-8 shadow-lg" />
        )}

        {youtubeId && (
          <div className="aspect-video mb-8 rounded-xl overflow-hidden shadow-lg">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}`}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        )}

        <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: story.content }} />

        {story.photos.length > 0 && (
          <div className="mt-12">
            <h2 className="font-heading font-bold text-2xl mb-6 text-gray-900">Galerie foto</h2>
            <PhotoGrid photos={story.photos} />
          </div>
        )}
      </article>
    </>
  )
}
