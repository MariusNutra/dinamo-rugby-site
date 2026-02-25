import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://dinamorugby.ro'

  const staticPages = [
    { url: baseUrl, changeFrequency: 'daily' as const, priority: 1.0 },
    { url: `${baseUrl}/despre`, changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${baseUrl}/contact`, changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: `${baseUrl}/galerie`, changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: `${baseUrl}/meciuri`, changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${baseUrl}/rezultate`, changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${baseUrl}/program`, changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: `${baseUrl}/antrenori`, changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: `${baseUrl}/povesti`, changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: `${baseUrl}/politica-confidentialitate`, changeFrequency: 'yearly' as const, priority: 0.2 },
    { url: `${baseUrl}/politica-cookies-gdpr`, changeFrequency: 'yearly' as const, priority: 0.2 },
    { url: `${baseUrl}/termeni-si-conditii`, changeFrequency: 'yearly' as const, priority: 0.2 },
  ]

  // Team pages
  const teamPages = ['U10', 'U12', 'U14', 'U16', 'U18'].map(grupa => ({
    url: `${baseUrl}/echipe/${grupa}`,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Story pages from DB
  let storyPages: MetadataRoute.Sitemap = []
  try {
    const stories = await prisma.story.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    })
    storyPages = stories.map(story => ({
      url: `${baseUrl}/povesti/${story.slug}`,
      lastModified: story.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))
  } catch {
    // DB unavailable — skip stories
  }

  return [...staticPages, ...teamPages, ...storyPages]
}
