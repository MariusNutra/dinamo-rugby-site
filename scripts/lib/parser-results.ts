import * as cheerio from 'cheerio'
import type { AnyNode } from 'domhandler'
import { DINAMO_PATTERN, REGION_NAMES, NATIONAL_REGION } from './config'
import type { EtapaGroup, MatchResult } from '../../types/results'
import { logger } from './logger'
import { extrageTaburi } from './tabs'

function parseMatchesFromTable($: cheerio.CheerioAPI, table: cheerio.Cheerio<AnyNode>): EtapaGroup[] {
  const groups: EtapaGroup[] = []
  let currentGroup: EtapaGroup | null = null

  table.find('tr').each((_, row) => {
    const $row = $(row)

    // Check if this is an etapa header row
    if ($row.hasClass('etapa') || ($row.find('td[colspan]').length > 0 && $row.find('td').text().includes('ETAPA'))) {
      const etapaText = $row.text().trim().replace(/^#+\s*/, '')
      currentGroup = { name: etapaText, matches: [] }
      groups.push(currentGroup)
      return
    }

    // Skip header rows (th elements)
    if ($row.find('th').length > 0) return

    // Parse match rows
    const tds = $row.find('td')
    if (tds.length < 4) return

    // Determine td indices based on column count
    // Full format: Data | Nr.raport | Stadion | Meci | Scor | Televizat (6 cols)
    // Some tables may have fewer columns
    const colCount = tds.length
    let dateIdx = 0
    let stadionIdx: number
    let matchIdx: number
    let scoreIdx: number

    if (colCount >= 6) {
      stadionIdx = 2
      matchIdx = 3
      scoreIdx = 4
    } else if (colCount === 5) {
      stadionIdx = 1
      matchIdx = 2
      scoreIdx = 3
    } else {
      stadionIdx = 1
      matchIdx = 2
      scoreIdx = 3
    }

    const dateText = $(tds[dateIdx]).text().trim()
    const stadium = $(tds[stadionIdx]).text().trim()
    const matchText = $(tds[matchIdx]).text().trim()
    const scoreText = $(tds[scoreIdx]).text().trim()

    // Skip empty rows or header-like rows
    if (!matchText || matchText === 'Meci') return

    // Parse teams - split on em-dash or regular dash
    const teamParts = matchText.split(/\s*[\u2013\u2014–-]\s*/)
    if (teamParts.length < 2) return

    const homeTeam = teamParts[0].trim()
    const awayTeam = teamParts.slice(1).join(' - ').trim()

    if (!homeTeam || !awayTeam) return

    // Parse score
    let scoreHome: number | null = null
    let scoreAway: number | null = null
    let played = false

    const scoreMatch = scoreText.match(/(\d+)\s*[-–]\s*(\d+)/)
    if (scoreMatch) {
      scoreHome = parseInt(scoreMatch[1], 10)
      scoreAway = parseInt(scoreMatch[2], 10)
      played = true
    }

    const isDinamo = DINAMO_PATTERN.test(homeTeam) || DINAMO_PATTERN.test(awayTeam)

    // Get match URL if available
    const matchUrl = $row.attr('data-href') || undefined

    const match: MatchResult = {
      date: dateText,
      stadium,
      homeTeam,
      awayTeam,
      scoreHome,
      scoreAway,
      played,
      isDinamo,
      matchUrl,
    }

    if (currentGroup) {
      currentGroup.matches.push(match)
    } else {
      // Create a default group if matches appear before any etapa header
      currentGroup = { name: 'Meciuri', matches: [match] }
      groups.push(currentGroup)
    }
  })

  return groups
}

export function parseResults(html: string, hasRegions: boolean): Record<string, EtapaGroup[]> {
  const $ = cheerio.load(html)
  const regions: Record<string, EtapaGroup[]> = {}

  if (hasRegions) {
    // Titlul si panoul se leaga prin `data-tab`, in interiorul aceluiasi
    // widget. Vezi tabs.ts pentru ce mergea prost cand se lipeau dupa pozitie.
    for (const { nume, $panel } of extrageTaburi($)) {
      const tables = $panel.find('table.frr, table')
      if (tables.length > 0) {
        regions[nume] = parseMatchesFromTable($, tables.first())
      }
    }

    // Daca structura paginii s-a schimbat atat de mult incat nu mai gasim
    // niciun tab, NU ghicim. Varianta veche presupunea ca tabelele vin in
    // ordinea Moldova, Muntenia, Transilvania si le eticheta dupa pozitie —
    // exact felul de presupunere care a produs luni de date puse pe regiunea
    // gresita, fara ca nimic sa para stricat. Mai bine lipsa vizibila decat
    // eticheta care minte: scraperul pastreaza fisierul anterior cand nu are ce
    // scrie, iar avertismentul de aici spune de ce.
    if (Object.keys(regions).length === 0) {
      logger.warn(
        'Niciun tab Elementor gasit — structura paginii s-a schimbat. ' +
        'Nu etichetam tabelele dupa pozitie; datele anterioare raman.'
      )
    }
  } else {
    // U20 - single national table
    const tables = $('table.frr, table')
    if (tables.length > 0) {
      regions[NATIONAL_REGION] = parseMatchesFromTable($, tables.first())
    }
  }

  return regions
}
