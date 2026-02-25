export interface PageConfig {
  category: string
  type: 'results' | 'standings'
  url: string
  wpPageId: number
  hasRegions: boolean
}

export const PAGES: PageConfig[] = [
  // U16
  {
    category: 'U16',
    type: 'results',
    url: 'https://rugbyromania.ro/juniori/u16-campionat-national-program-si-rezultate/',
    wpPageId: 77469,
    hasRegions: true,
  },
  {
    category: 'U16',
    type: 'standings',
    url: 'https://rugbyromania.ro/juniori/u16-campionat-national-clasament/',
    wpPageId: 77477,
    hasRegions: true,
  },
  // U18
  {
    category: 'U18',
    type: 'results',
    url: 'https://rugbyromania.ro/juniori/u18-program-si-rezultate/',
    wpPageId: 69203,
    hasRegions: true,
  },
  {
    category: 'U18',
    type: 'standings',
    url: 'https://rugbyromania.ro/juniori/u18-clasament/',
    wpPageId: 69213,
    hasRegions: true,
  },
  // U20
  {
    category: 'U20',
    type: 'results',
    url: 'https://rugbyromania.ro/juniori/u20-program-si-rezultate/',
    wpPageId: 69219,
    hasRegions: false,
  },
  {
    category: 'U20',
    type: 'standings',
    url: 'https://rugbyromania.ro/juniori/u20-clasament/',
    wpPageId: 69226,
    hasRegions: false,
  },
]

export const DINAMO_PATTERN = /dinamo/i

export const REGION_NAMES = ['Moldova', 'Muntenia', 'Transilvania'] as const

export const NATIONAL_REGION = 'National'

export const DATA_OUTPUT_PATH = 'data/rugby-results.json'
