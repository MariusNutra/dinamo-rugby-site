import { prisma } from '@/lib/prisma'

export interface Branding {
  logo: string | null
  primaryColor: string
  secondaryColor: string
  accentColor: string
  fontFamily: string
  heroTitle: string | null
  heroSubtitle: string | null
  clubName: string
  clubAddress: string | null
  clubPhone: string | null
  clubEmail: string | null
  favicon: string | null
  ogImage: string | null
}

const DEFAULTS: Branding = {
  logo: null,
  primaryColor: '#dc2626',
  secondaryColor: '#1e3a5f',
  accentColor: '#f59e0b',
  fontFamily: 'Montserrat',
  heroTitle: null,
  heroSubtitle: null,
  clubName: 'CS Dinamo București Rugby',
  clubAddress: null,
  clubPhone: null,
  clubEmail: null,
  favicon: null,
  ogImage: null,
}

export async function getBranding(): Promise<Branding> {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 1 },
      select: {
        logo: true,
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
        fontFamily: true,
        heroTitle: true,
        heroSubtitle: true,
        clubName: true,
        clubAddress: true,
        clubPhone: true,
        clubEmail: true,
        favicon: true,
        ogImage: true,
      },
    })

    if (!settings) return DEFAULTS

    return {
      logo: settings.logo,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      accentColor: settings.accentColor,
      fontFamily: settings.fontFamily,
      heroTitle: settings.heroTitle,
      heroSubtitle: settings.heroSubtitle,
      clubName: settings.clubName,
      clubAddress: settings.clubAddress,
      clubPhone: settings.clubPhone,
      clubEmail: settings.clubEmail,
      favicon: settings.favicon,
      ogImage: settings.ogImage,
    }
  } catch {
    return DEFAULTS
  }
}
