import { ImageResponse } from 'next/og'
import { readFile } from 'fs/promises'
import { join } from 'path'

export const runtime = 'nodejs'
export const alt = 'Înscrieri Rugby Juniori Dinamo București'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  const logoData = await readFile(join(process.cwd(), 'public/images/dinamo-rugby-logo.png'))
  const logoSrc = `data:image/png;base64,${logoData.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2440 100%)',
          position: 'relative',
        }}
      >
        {/* Red accent bar top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            background: '#dc2626',
            display: 'flex',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
          }}
        >
          {/* Logo */}
          <img
            src={logoSrc}
            width={140}
            height={160}
            style={{ objectFit: 'contain' }}
          />

          {/* Title */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div
              style={{
                fontSize: 52,
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '-1px',
                display: 'flex',
              }}
            >
              Înscrieri Rugby Juniori
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 400,
                color: '#94a3b8',
                display: 'flex',
              }}
            >
              CS Dinamo București
            </div>
          </div>

          {/* CTA badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginTop: 12,
              background: '#dc2626',
              borderRadius: 50,
              padding: '14px 40px',
            }}
          >
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: '#ffffff',
                display: 'flex',
              }}
            >
              Completează formularul online
            </div>
          </div>
        </div>

        {/* Red accent bar bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 8,
            background: '#dc2626',
            display: 'flex',
          }}
        />

        {/* URL */}
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            right: 40,
            fontSize: 18,
            color: '#64748b',
            display: 'flex',
          }}
        >
          dinamorugby.ro/inscrieri
        </div>
      </div>
    ),
    { ...size }
  )
}
