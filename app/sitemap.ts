import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { getActiveGrupe } from '@/lib/active-teams'

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
    { url: `${baseUrl}/inscrieri`, changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${baseUrl}/calendar`, changeFrequency: 'weekly' as const, priority: 0.6 },
    { url: `${baseUrl}/competitii`, changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: `${baseUrl}/sportivi`, changeFrequency: 'weekly' as const, priority: 0.5 },
    { url: `${baseUrl}/fundraising`, changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${baseUrl}/sponsori`, changeFrequency: 'monthly' as const, priority: 0.4 },
    { url: `${baseUrl}/magazin`, changeFrequency: 'weekly' as const, priority: 0.5 },
    { url: `${baseUrl}/video-highlights`, changeFrequency: 'weekly' as const, priority: 0.5 },
    { url: `${baseUrl}/statistici`, changeFrequency: 'weekly' as const, priority: 0.5 },
  ]

  // Team pages. Grupele vin din baza de date, nu dintr-o lista scrisa de mana:
  // `/echipe/[grupa]` raspunde 404 pentru o grupa dezactivata, iar un sitemap
  // care trimite motoarele de cautare in 404 isi pierde increderea. La 13.08.2026
  // lista fixa anunta U14 si U18, amandoua inactive — amandoua 404.
  let teamPages: MetadataRoute.Sitemap = []
  try {
    const grupe = await getActiveGrupe()
    teamPages = grupe.map(grupa => ({
      url: `${baseUrl}/echipe/${grupa}`,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  } catch {
    // DB unavailable — skip teams
  }

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

  // Competition pages
  let competitionPages: MetadataRoute.Sitemap = []
  try {
    const competitions = await prisma.competition.findMany({
      where: { active: true },
      select: { id: true, updatedAt: true },
    })
    competitionPages = competitions.map(c => ({
      url: `${baseUrl}/competitii/${c.id}`,
      lastModified: c.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch {}

  // Public athlete profiles
  let athletePages: MetadataRoute.Sitemap = []
  try {
    const athletes = await prisma.child.findMany({
      where: { publicProfile: true },
      select: { id: true, updatedAt: true },
    })
    athletePages = athletes.map(a => ({
      url: `${baseUrl}/sportivi/${a.id}`,
      lastModified: a.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }))
  } catch {}

  return [...staticPages, ...teamPages, ...storyPages, ...competitionPages, ...athletePages]
}
