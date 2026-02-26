import { prisma } from './prisma'

export interface ModuleDefinition {
  key: string
  label: string
  description: string
  icon: string
  isNew: boolean
  canDisable: boolean
  publicRoutes: string[]
  adminRoutes: string[]
  headerLink?: { href: string; label: string }
}

export const MODULE_DEFINITIONS: ModuleDefinition[] = [
  {
    key: 'moduleHomepage',
    label: 'Pagina principala',
    description: 'Pagina de start a site-ului',
    icon: '🏠',
    isNew: false,
    canDisable: false,
    publicRoutes: ['/'],
    adminRoutes: ['/admin'],
    headerLink: { href: '/', label: 'Acasa' },
  },
  {
    key: 'moduleEchipe',
    label: 'Echipe',
    description: 'Paginile echipelor si antrenorilor',
    icon: '🏉',
    isNew: false,
    canDisable: true,
    publicRoutes: ['/echipe', '/antrenori'],
    adminRoutes: ['/admin/echipe'],
    headerLink: { href: '/echipe', label: 'Echipe' },
  },
  {
    key: 'moduleProgram',
    label: 'Program',
    description: 'Programul de antrenamente',
    icon: '📅',
    isNew: false,
    canDisable: true,
    publicRoutes: ['/program'],
    adminRoutes: ['/admin/program'],
    headerLink: { href: '/program', label: 'Program' },
  },
  {
    key: 'moduleMeciuri',
    label: 'Meciuri',
    description: 'Programul meciurilor si rezultate',
    icon: '🏆',
    isNew: false,
    canDisable: true,
    publicRoutes: ['/meciuri', '/rezultate'],
    adminRoutes: ['/admin/meciuri'],
    headerLink: { href: '/meciuri', label: 'Meciuri' },
  },
  {
    key: 'moduleGalerie',
    label: 'Galerie',
    description: 'Galeria foto a clubului',
    icon: '📸',
    isNew: false,
    canDisable: true,
    publicRoutes: ['/galerie'],
    adminRoutes: ['/admin/galerie'],
    headerLink: { href: '/galerie', label: 'Galerie' },
  },
  {
    key: 'modulePovesti',
    label: 'Povesti',
    description: 'Articole si povesti ale clubului',
    icon: '📝',
    isNew: false,
    canDisable: true,
    publicRoutes: ['/povesti'],
    adminRoutes: ['/admin/povesti'],
    headerLink: { href: '/povesti', label: 'Povesti' },
  },
  {
    key: 'moduleContact',
    label: 'Contact',
    description: 'Pagina de contact',
    icon: '✉️',
    isNew: false,
    canDisable: true,
    publicRoutes: ['/contact'],
    adminRoutes: [],
    headerLink: { href: '/contact', label: 'Contact' },
  },
  {
    key: 'moduleDespre',
    label: 'Despre noi',
    description: 'Pagina despre club',
    icon: 'ℹ️',
    isNew: false,
    canDisable: true,
    publicRoutes: ['/despre'],
    adminRoutes: [],
    headerLink: { href: '/despre', label: 'Despre noi' },
  },
  {
    key: 'modulePortalParinti',
    label: 'Portal Parinti',
    description: 'Portalul dedicat parintilor',
    icon: '👨‍👩‍👧',
    isNew: false,
    canDisable: true,
    publicRoutes: ['/parinti'],
    adminRoutes: ['/admin/parinti', '/admin/cereri-acces', '/admin/acorduri'],
  },
  {
    key: 'moduleFundraising',
    label: 'Fundraising',
    description: 'Campanii de strangere de fonduri si donatii',
    icon: '💰',
    isNew: true,
    canDisable: true,
    publicRoutes: ['/fundraising'],
    adminRoutes: ['/admin/fundraising'],
    headerLink: { href: '/fundraising', label: 'Donatii' },
  },
  {
    key: 'modulePlati',
    label: 'Plati / Cotizatii',
    description: 'Sistem de plati si cotizatii cu Stripe',
    icon: '💳',
    isNew: true,
    canDisable: true,
    publicRoutes: [],
    adminRoutes: ['/admin/plati'],
  },
  {
    key: 'moduleInscrieri',
    label: 'Inscrieri',
    description: 'Formular de inscriere online',
    icon: '📋',
    isNew: true,
    canDisable: true,
    publicRoutes: ['/inscrieri'],
    adminRoutes: [],
    headerLink: { href: '/inscrieri', label: 'Inscrieri' },
  },
  {
    key: 'moduleCalendar',
    label: 'Calendar',
    description: 'Calendar cu evenimente si meciuri',
    icon: '🗓️',
    isNew: true,
    canDisable: true,
    publicRoutes: ['/calendar'],
    adminRoutes: [],
    headerLink: { href: '/calendar', label: 'Calendar' },
  },
  {
    key: 'moduleNotificari',
    label: 'Notificari',
    description: 'Sistem de notificari pentru parinti',
    icon: '🔔',
    isNew: true,
    canDisable: true,
    publicRoutes: [],
    adminRoutes: [],
  },
  {
    key: 'moduleStatistici',
    label: 'Statistici',
    description: 'Statistici publice echipe si jucatori',
    icon: '📊',
    isNew: true,
    canDisable: true,
    publicRoutes: ['/statistici'],
    adminRoutes: [],
    headerLink: { href: '/statistici', label: 'Statistici' },
  },
  {
    key: 'moduleMagazin',
    label: 'Magazin',
    description: 'Magazin online cu produse ale clubului',
    icon: '🛒',
    isNew: true,
    canDisable: true,
    publicRoutes: ['/magazin'],
    adminRoutes: [],
    headerLink: { href: '/magazin', label: 'Magazin' },
  },
  {
    key: 'moduleVideoHighlights',
    label: 'Video Highlights',
    description: 'Clipuri video cu cele mai bune momente',
    icon: '🎬',
    isNew: true,
    canDisable: true,
    publicRoutes: ['/video-highlights'],
    adminRoutes: [],
    headerLink: { href: '/video-highlights', label: 'Video' },
  },
  {
    key: 'moduleSponsori',
    label: 'Sponsori',
    description: 'Pagina cu sponsorii clubului',
    icon: '🤝',
    isNew: true,
    canDisable: true,
    publicRoutes: ['/sponsori'],
    adminRoutes: [],
    headerLink: { href: '/sponsori', label: 'Sponsori' },
  },
]

export type ModuleSettings = Record<string, boolean>

export async function getModuleSettings(): Promise<ModuleSettings> {
  const settings = await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  })

  const result: ModuleSettings = {}
  for (const mod of MODULE_DEFINITIONS) {
    result[mod.key] = (settings as Record<string, unknown>)[mod.key] as boolean ?? false
  }
  return result
}

export function isModuleActive(settings: ModuleSettings, moduleKey: string): boolean {
  return settings[moduleKey] ?? false
}

export function getDisabledPublicRoutes(settings: ModuleSettings): string[] {
  const disabled: string[] = []
  for (const mod of MODULE_DEFINITIONS) {
    if (!settings[mod.key]) {
      disabled.push(...mod.publicRoutes)
    }
  }
  return disabled
}

export function getActiveHeaderLinks(settings: ModuleSettings): { href: string; label: string }[] {
  return MODULE_DEFINITIONS
    .filter(mod => settings[mod.key] && mod.headerLink)
    .map(mod => mod.headerLink!)
}

export function getActiveAdminRoutes(settings: ModuleSettings): string[] {
  return MODULE_DEFINITIONS
    .filter(mod => settings[mod.key])
    .flatMap(mod => mod.adminRoutes)
}
