import * as fs from 'fs'
import * as path from 'path'

const LOG_FILE = path.join(process.cwd(), 'data', 'scraper.log')

function timestamp(): string {
  return new Date().toISOString()
}

function writeLog(level: string, message: string) {
  const line = `[${timestamp()}] [${level}] ${message}\n`
  process.stdout.write(line)
  try {
    fs.appendFileSync(LOG_FILE, line)
  } catch {
    // ignore file write errors
  }
}

export const logger = {
  info: (msg: string) => writeLog('INFO', msg),
  warn: (msg: string) => writeLog('WARN', msg),
  error: (msg: string) => writeLog('ERROR', msg),
}
