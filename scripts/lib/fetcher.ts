import { logger } from './logger'

const MAX_RETRIES = 3
const INITIAL_DELAY = 1000

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DinamoRugbyScraper/1.0)',
          'Accept': 'text/html,application/json',
        },
        signal: AbortSignal.timeout(15000),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.text()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.warn(`Attempt ${attempt}/${retries} failed for ${url}: ${msg}`)

      if (attempt < retries) {
        const delay = INITIAL_DELAY * Math.pow(2, attempt - 1)
        await sleep(delay)
      } else {
        throw new Error(`All ${retries} attempts failed for ${url}: ${msg}`)
      }
    }
  }
  throw new Error('Unreachable')
}

export async function fetchPageContent(wpPageId: number, fallbackUrl: string): Promise<string> {
  // Try WP REST API first
  const apiUrl = `https://rugbyromania.ro/wp-json/wp/v2/pages/${wpPageId}`
  try {
    logger.info(`Trying WP REST API: ${apiUrl}`)
    const json = await fetchWithRetry(apiUrl)
    const data = JSON.parse(json)
    if (data.content?.rendered) {
      logger.info(`WP REST API success for page ${wpPageId}`)
      return data.content.rendered
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.warn(`WP REST API failed for page ${wpPageId}: ${msg}`)
  }

  // Fallback to direct URL fetch
  logger.info(`Falling back to direct URL: ${fallbackUrl}`)
  return fetchWithRetry(fallbackUrl)
}
