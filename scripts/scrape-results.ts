import * as fs from 'fs'
import * as path from 'path'
import { PAGES, DATA_OUTPUT_PATH } from './lib/config'
import { fetchPageContent } from './lib/fetcher'
import { parseResults } from './lib/parser-results'
import { parseStandings } from './lib/parser-standings'
import { logger } from './lib/logger'
import type { ScrapedData, CategoryData } from '../types/results'

async function main() {
  logger.info('=== Starting rugby results scraper ===')

  const categories: Record<string, CategoryData> = {}

  for (const page of PAGES) {
    try {
      logger.info(`Fetching ${page.category} ${page.type} from ${page.url}`)
      const html = await fetchPageContent(page.wpPageId, page.url)

      if (!html || html.length < 100) {
        logger.warn(`Empty or too short response for ${page.category} ${page.type}`)
        continue
      }

      // Initialize category if needed
      if (!categories[page.category]) {
        categories[page.category] = { regions: {} }
      }

      if (page.type === 'results') {
        const parsed = parseResults(html, page.hasRegions)
        for (const [region, etape] of Object.entries(parsed)) {
          if (!categories[page.category].regions[region]) {
            categories[page.category].regions[region] = { results: [], standings: [] }
          }
          categories[page.category].regions[region].results = etape
          const matchCount = etape.reduce((sum, e) => sum + e.matches.length, 0)
          logger.info(`  ${page.category}/${region}: ${etape.length} etape, ${matchCount} matches`)
        }
      } else {
        const parsed = parseStandings(html, page.hasRegions)
        for (const [region, standings] of Object.entries(parsed)) {
          if (!categories[page.category].regions[region]) {
            categories[page.category].regions[region] = { results: [], standings: [] }
          }
          categories[page.category].regions[region].standings = standings
          logger.info(`  ${page.category}/${region}: ${standings.length} teams in standings`)
        }
      }

      // Small delay between requests to be polite
      await new Promise((resolve) => setTimeout(resolve, 500))
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.error(`Failed to process ${page.category} ${page.type}: ${msg}`)
    }
  }

  // Safety check: don't overwrite with empty data
  const totalMatches = Object.values(categories).reduce((sum, cat) => {
    return sum + Object.values(cat.regions).reduce((s, r) => {
      return s + r.results.reduce((m, e) => m + e.matches.length, 0)
    }, 0)
  }, 0)

  const outputPath = path.join(process.cwd(), DATA_OUTPUT_PATH)

  if (totalMatches === 0) {
    logger.warn('No matches found in any category. Keeping existing data.')
    if (fs.existsSync(outputPath)) {
      logger.info('Existing data file preserved.')
    } else {
      logger.warn('No existing data file found either.')
    }
    return
  }

  const data: ScrapedData = {
    lastUpdated: new Date().toISOString(),
    categories,
  }

  // Ensure data directory exists
  const dataDir = path.dirname(outputPath)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8')
  logger.info(`Data saved to ${outputPath}`)
  logger.info(`Total: ${Object.keys(categories).length} categories, ${totalMatches} matches`)
  logger.info('=== Scraper finished ===')
}

main().catch((err) => {
  logger.error(`Scraper crashed: ${err instanceof Error ? err.message : String(err)}`)
  process.exit(1)
})
