import fs from 'fs'
import path from 'path'

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

const LOG_DIR = path.join(process.cwd(), 'logs')
const MAX_LOG_SIZE = 10 * 1024 * 1024 // 10MB per file

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true })
  }
}

function getLogFile(level: LogLevel): string {
  return path.join(LOG_DIR, `${level}.log`)
}

function rotateIfNeeded(filePath: string) {
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath)
      if (stats.size > MAX_LOG_SIZE) {
        const rotated = filePath + '.' + new Date().toISOString().slice(0, 10)
        fs.renameSync(filePath, rotated)
      }
    }
  } catch {
    // ignore rotation errors
  }
}

function formatMessage(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
  const timestamp = new Date().toISOString()
  const metaStr = meta ? ' ' + JSON.stringify(meta) : ''
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}\n`
}

function writeLog(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  try {
    ensureLogDir()
    const filePath = getLogFile(level)
    rotateIfNeeded(filePath)
    const formatted = formatMessage(level, message, meta)
    fs.appendFileSync(filePath, formatted)

    // Also write errors to a combined log
    if (level === 'error' || level === 'warn') {
      const combinedPath = path.join(LOG_DIR, 'combined.log')
      rotateIfNeeded(combinedPath)
      fs.appendFileSync(combinedPath, formatted)
    }
  } catch {
    // Fallback to console
    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](message, meta)
  }
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => writeLog('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => writeLog('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => writeLog('error', message, meta),
  debug: (message: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      writeLog('debug', message, meta)
    }
  },
}
