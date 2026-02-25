import * as fs from 'fs'
import * as path from 'path'
import type { ScrapedData, MatchResult } from '@/types/results'

const DATA_PATH = path.join(process.cwd(), 'data', 'rugby-results.json')

let cachedData: ScrapedData | null = null
let cacheTime = 0
const CACHE_TTL = 60 * 1000 // 1 minute

export function getResultsData(): ScrapedData | null {
  const now = Date.now()
  if (cachedData && now - cacheTime < CACHE_TTL) {
    return cachedData
  }

  try {
    if (!fs.existsSync(DATA_PATH)) return null
    const raw = fs.readFileSync(DATA_PATH, 'utf-8')
    cachedData = JSON.parse(raw) as ScrapedData
    cacheTime = now
    return cachedData
  } catch {
    return null
  }
}

function parseDate(dateStr: string): Date | null {
  // Format: "DD.MM.YYYY" or "DD.MM.YYYY ora HH:MM"
  const match = dateStr.match(/(\d{2})\.(\d{2})\.(\d{4})/)
  if (!match) return null
  const [, day, month, year] = match
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
}

interface DinamoMatchInfo {
  category: string
  region: string
  etapa: string
  match: MatchResult
}

function getAllDinamoMatches(data: ScrapedData): DinamoMatchInfo[] {
  const matches: DinamoMatchInfo[] = []

  for (const [category, catData] of Object.entries(data.categories)) {
    for (const [region, regionData] of Object.entries(catData.regions)) {
      for (const etapa of regionData.results) {
        for (const match of etapa.matches) {
          if (match.isDinamo) {
            matches.push({ category, region, etapa: etapa.name, match })
          }
        }
      }
    }
  }

  return matches
}

export function getNextDinamoMatch(): DinamoMatchInfo | null {
  const data = getResultsData()
  if (!data) return null

  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const allDinamo = getAllDinamoMatches(data)
  const upcoming = allDinamo
    .filter((m) => !m.match.played)
    .map((m) => ({ ...m, parsedDate: parseDate(m.match.date) }))
    .filter((m) => m.parsedDate && m.parsedDate >= now)
    .sort((a, b) => (a.parsedDate!.getTime() - b.parsedDate!.getTime()))

  return upcoming.length > 0 ? upcoming[0] : null
}

export function getLatestDinamoResults(n: number = 5): DinamoMatchInfo[] {
  const data = getResultsData()
  if (!data) return []

  const allDinamo = getAllDinamoMatches(data)
  const played = allDinamo
    .filter((m) => m.match.played)
    .map((m) => ({ ...m, parsedDate: parseDate(m.match.date) }))
    .filter((m) => m.parsedDate !== null)
    .sort((a, b) => b.parsedDate!.getTime() - a.parsedDate!.getTime())

  return played.slice(0, n)
}

export function isDataStale(): boolean {
  const data = getResultsData()
  if (!data) return true

  const updated = new Date(data.lastUpdated)
  const now = new Date()
  const diffDays = (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays > 3
}
