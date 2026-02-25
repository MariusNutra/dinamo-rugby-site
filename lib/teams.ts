export const CATEGORIES = ['U10', 'U12', 'U14'] as const
export type Category = (typeof CATEGORIES)[number]

export const DINAMO_PATTERN = /dinamo/i

export const TEAMS: Record<Category, string[]> = {
  U10: [
    'CNAV-CS Dinamo',
    'ACS Șoimii București I',
    'ACS Șoimii București II',
    'CSA-CSS Steaua',
    'CS Olimpia-Sporting',
    'RC Grivița',
    'ACS Rugby Academy I',
    'ACS Rugby Academy II',
    'ACSOV Pantelimon',
    'CSM București',
    'CS Aurora Băicoi',
    'CSS Ilfov',
    'CS Medgidia',
    'CSO Ovidiu',
    'RC Cristian',
    'ACS Florin Popovici Baia Mare',
    'ACS Warriors Timișoara',
    'CSS Bega & ACS Warriors Timișoara',
    'ACS Leii Câmpia Turzii',
    'CSA ASS Vetrișoaia',
    'ACS Zimbrii Rarăului',
    'ACS Dragonii & CS Medgidia',
    'CS Rugby Săcele',
    'ACS Rugby Club Junior',
  ],
  U12: [
    'CNAV-CS Dinamo',
    'ACS Șoimii București I',
    'ACS Șoimii București II',
    'CSA-CSS Steaua',
    'CS Olimpia-Sporting',
    'CS Olimpia & Flamingo',
    'RC Grivița',
    'ACS Rugby Academy',
    'ACSOV Pantelimon',
    'CSM București',
    'CS Aurora Băicoi',
    'RC Cristian',
    'RC Brașov',
    'CS Medgidia',
    'CSO Ovidiu',
    'CS Victoria Cumpăna',
    'CS Chitila',
    'CSS Ilfov',
    'ACS Florin Popovici Baia Mare',
    'ACS Warriors Timișoara',
    'ACS Leii Câmpia Turzii',
    'CS Rugby Săcele',
    'ACS Rugby Club Junior',
    'ACS Dragonii & CS Medgidia',
  ],
  U14: [
    'CNAV-CS Dinamo',
    'CSA-CSS Steaua',
    'ACS Șoimii București',
    'CSM București',
    'RC Grivița',
    'ACSOV Pantelimon-Rugby Academy',
    'CS Tomitanii Constanța',
    'SCM Gloria Buzău',
    'RC Brașov',
    'CS Metrorex',
    'LPS Constanța',
    'CS Aurora Băicoi',
    'CNAV-CS Dinamo-CS Olimpia',
    'CSA-CSS Steaua I',
    'CSA-CSS Steaua II',
  ],
}

export const STADIUMS = [
  'Stadionul Național de Rugby Arcul de Triumf',
  'Stadionul Olimpia',
  'Stadionul Parcul Copilului (Grivița)',
  'Stadionul Steaua',
  'Stadionul Florea Dumitrache (CNAV)',
  'U.M. Pantelimon',
  'Stadionul Municipal Buzău',
  'Stadionul Tineretului Brașov',
]

export const MATCH_TYPES = [
  { value: 'turneu', label: 'Turneu' },
  { value: 'meci', label: 'Meci' },
] as const

export function getDefaultHomeTeam(category: Category): string {
  if (category === 'U14') return 'CNAV-CS Dinamo-CS Olimpia'
  return 'CNAV-CS Dinamo'
}

export function isDinamoTeam(team: string): boolean {
  return DINAMO_PATTERN.test(team)
}
