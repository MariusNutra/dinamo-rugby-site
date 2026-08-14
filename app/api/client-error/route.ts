import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

/**
 * Primeste erorile care au picat in browser si le scrie pe stderr, de unde
 * PM2 le duce in logul de eroare, iar `log-error-watch.sh` le trimite pe Telegram.
 * Fara asta, un ecran alb la un parinte nu se vede nicaieri.
 */

const MAX_FIELD_LENGTH = 1000

// Taie campurile lungi si scoate caracterele de control, ca o singura eroare
// sa nu poata inunda logul sau sa injecteze linii false in el.
function clean(value: unknown, maxLength = MAX_FIELD_LENGTH): string {
  if (typeof value !== 'string') return ''
  return value
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, maxLength)
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)

  const limit = await checkRateLimit(ip, {
    action: 'client_error',
    maxAttempts: 10,
    windowMs: 60 * 60 * 1000, // o ora
  })

  if (!limit.allowed) {
    // Raspuns tacut: raportarea de erori nu trebuie sa produca alte erori in pagina.
    return NextResponse.json({ ok: true }, { status: 202 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON invalid' }, { status: 400 })
  }

  const payload = (body ?? {}) as Record<string, unknown>
  const message = clean(payload.message, 300)

  if (!message) {
    return NextResponse.json({ error: 'Lipseste mesajul' }, { status: 400 })
  }

  const details = [
    `mesaj=${message}`,
    `pagina=${clean(payload.url, 200) || '?'}`,
    `digest=${clean(payload.digest, 60) || '-'}`,
    `browser=${clean(req.headers.get('user-agent'), 160) || '?'}`,
    `stack=${clean(payload.stack, 700) || '-'}`,
  ].join(' | ')

  console.error(`[client-error] ${details}`)

  return NextResponse.json({ ok: true })
}
