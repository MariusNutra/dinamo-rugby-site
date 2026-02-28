import crypto from 'crypto'

/**
 * Generate a unique QR token for an attendance session
 */
export function generateQRToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Generate QR code data URL using a simple SVG-based approach
 * Uses Google Charts API for QR code generation (no extra dependencies)
 */
export function getQRCodeUrl(data: string, size = 300): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`
}

/**
 * Validate that a QR token hasn't expired
 */
export function isTokenValid(expiresAt: Date): boolean {
  return new Date() < new Date(expiresAt)
}
