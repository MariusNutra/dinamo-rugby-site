import * as cheerio from 'cheerio'
import { DINAMO_PATTERN, REGION_NAMES, NATIONAL_REGION } from './config'
import type { StandingRow } from '../../types/results'
import { logger } from './logger'
import { extrageTaburi } from './tabs'

function parseStandingsTable($: cheerio.CheerioAPI, table: cheerio.Cheerio<cheerio.Element>): StandingRow[] {
  const rows: StandingRow[] = []

  table.find('tr').each((_, row) => {
    const $row = $(row)
    // Skip header rows
    if ($row.find('th').length > 0) return

    const tds = $row.find('td')
    if (tds.length < 5) return

    const texts: string[] = []
    tds.each((_, td) => {
      texts.push($(td).text().trim())
    })

    // Try to parse position - first column should be a number
    const position = parseInt(texts[0], 10)
    if (isNaN(position)) return

    const team = texts[1] || ''
    if (!team) return

    // Parse numeric columns with fallback to 0
    const parseNum = (val: string) => {
      const n = parseInt(val, 10)
      return isNaN(n) ? 0 : n
    }

    // Columns: Loc | Echipa | M | V | E | I | M-P | Dif. | Puncte | Bonus | Total
    // Some tables may have slightly different layouts
    let played = 0, wins = 0, draws = 0, losses = 0
    let pointsFor = 0, pointsAgainst = 0, diff = 0
    let points = 0, bonus = 0, total = 0

    if (texts.length >= 11) {
      // Full format: Loc, Echipa, M, V, E, I, M-P, Dif, Puncte, Bonus, Total
      played = parseNum(texts[2])
      wins = parseNum(texts[3])
      draws = parseNum(texts[4])
      losses = parseNum(texts[5])

      // M-P column might be "123-45" format
      const mpMatch = texts[6].match(/(\d+)\s*[-–]\s*(\d+)/)
      if (mpMatch) {
        pointsFor = parseInt(mpMatch[1], 10)
        pointsAgainst = parseInt(mpMatch[2], 10)
      }

      diff = parseNum(texts[7])
      points = parseNum(texts[8])
      bonus = parseNum(texts[9])
      total = parseNum(texts[10])
    } else if (texts.length >= 8) {
      // Shorter format
      played = parseNum(texts[2])
      wins = parseNum(texts[3])
      draws = parseNum(texts[4])
      losses = parseNum(texts[5])
      points = parseNum(texts[6])
      total = parseNum(texts[7])
    }

    rows.push({
      position,
      team,
      played,
      wins,
      draws,
      losses,
      pointsFor,
      pointsAgainst,
      diff,
      points,
      bonus,
      total,
      isDinamo: DINAMO_PATTERN.test(team),
    })
  })

  return rows
}

export function parseStandings(html: string, hasRegions: boolean): Record<string, StandingRow[]> {
  const $ = cheerio.load(html)
  const regions: Record<string, StandingRow[]> = {}

  if (hasRegions) {
    for (const { nume, $panel } of extrageTaburi($)) {
      const tables = $panel.find('table')
      if (tables.length > 0) {
        regions[nume] = parseStandingsTable($, tables.first())
      }
    }

    // Ca la rezultate: fara taburi, nu ghicim regiunea dupa pozitia tabelului.
    if (Object.keys(regions).length === 0) {
      logger.warn(
        'Niciun tab Elementor gasit la clasamente — structura paginii s-a ' +
        'schimbat. Nu etichetam tabelele dupa pozitie; datele anterioare raman.'
      )
    }
  } else {
    const tables = $('table')
    if (tables.length > 0) {
      regions[NATIONAL_REGION] = parseStandingsTable($, tables.first())
    }
  }

  return regions
}
