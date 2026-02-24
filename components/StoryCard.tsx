import Link from 'next/link'

interface StoryCardProps {
  title: string
  slug: string
  excerpt?: string | null
  coverImage?: string | null
  createdAt: string
  grupa?: string | null
}

export default function StoryCard({ title, slug, excerpt, coverImage, createdAt, grupa }: StoryCardProps) {
  return (
    <Link href={`/povesti/${slug}`} className="group block bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow">
      <div className="aspect-video bg-gray-200 relative overflow-hidden">
        {coverImage ? (
          <img src={coverImage} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-dinamo-red to-dinamo-dark">
            <span className="text-white/80 text-sm">Dinamo Rugby</span>
          </div>
        )}
        {grupa && (
          <span className="absolute top-2 right-2 bg-dinamo-red text-white text-xs px-2 py-1 rounded-full font-bold">
            {grupa}
          </span>
        )}
      </div>
      <div className="p-4">
        <time className="text-xs text-gray-500">{new Date(createdAt).toLocaleDateString('ro-RO', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
        <h3 className="font-heading font-bold text-lg mt-1 text-gray-900 group-hover:text-dinamo-red transition-colors line-clamp-2">
          {title}
        </h3>
        {excerpt && (
          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{excerpt}</p>
        )}
      </div>
    </Link>
  )
}
