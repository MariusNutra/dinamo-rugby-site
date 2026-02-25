import * as cheerio from 'cheerio'
import type { AnyNode } from 'domhandler'
import { DINAMO_PATTERN, REGION_NAMES, NATIONAL_REGION } from './config'
import type { EtapaGroup, MatchResult } from '../../types/results'
import { logger } from './logger'

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
    // Find Elementor tab content panels
    const tabTitles: string[] = []

    // Collect tab titles from Elementor tab widget
    $('[data-tab]').each((_, el) => {
      const $el = $(el)
      // Only get tab title elements (not content panels)
      if ($el.hasClass('elementor-tab-title') || $el.hasClass('elementor-tab-desktop-title')) {
        const title = $el.text().trim()
        if (title && REGION_NAMES.some(r => title.includes(r))) {
          tabTitles.push(title)
        }
      }
    })

    // Find tab content panels
    const tabContents = $('[role="tabpanel"], .elementor-tab-content')

    if (tabTitles.length > 0 && tabContents.length > 0) {
      tabContents.each((index, panel) => {
        const regionName = tabTitles[index] || REGION_NAMES[index] || `Region ${index + 1}`
        // Normalize to just the region name
        const normalizedRegion = REGION_NAMES.find(r => regionName.includes(r)) || regionName
        const $panel = $(panel)
        const tables = $panel.find('table.frr, table')

        if (tables.length > 0) {
          regions[normalizedRegion] = parseMatchesFromTable($, tables.first())
        }
      })
    }

    // Fallback: if no tabs found, try to find tables and match them to regions by context
    if (Object.keys(regions).length === 0) {
      logger.warn('No Elementor tabs found, trying fallback parsing')
      const tables = $('table.frr, table')

      if (tables.length >= 3) {
        // Assume tables are in order: Moldova, Muntenia, Transilvania
        tables.each((index, table) => {
          if (index < 3) {
            const regionName = REGION_NAMES[index] || `Region ${index + 1}`
            regions[regionName] = parseMatchesFromTable($, $(table))
          }
        })
      } else if (tables.length > 0) {
        // Single table, put everything under first region
        tables.each((index, table) => {
          const regionName = REGION_NAMES[index] || `Region ${index + 1}`
          regions[regionName] = parseMatchesFromTable($, $(table))
        })
      }
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
