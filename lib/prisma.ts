import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
  prismaPragmasSet?: boolean
}

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// SQLite concurrency hardening. These are per-connection PRAGMAs, so they only
// stick reliably because DATABASE_URL pins connection_limit=1 (a single reused
// connection). Setting them once at module load applies to every later query:
//  - busy_timeout: concurrent writers wait up to 5s instead of failing
//    immediately with SQLITE_BUSY / "database is locked".
//  - synchronous=NORMAL: safe and faster under WAL (FULL is overkill there).
if (!globalForPrisma.prismaPragmasSet) {
  globalForPrisma.prismaPragmasSet = true
  void prisma.$executeRawUnsafe('PRAGMA busy_timeout = 5000').catch(() => {})
  void prisma.$executeRawUnsafe('PRAGMA synchronous = NORMAL').catch(() => {})
}
