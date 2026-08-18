/**
 * Single source of truth for password rules across the platform.
 *
 * Before this existed, `set-password` and `reset-password` each hardcoded
 * "minim 6 caractere" with their own message. Parents can now set a password
 * from three different places (web portal, reset link, mobile app), so the rule
 * lives in one place — otherwise a password accepted by one screen gets
 * rejected by another.
 */

export const MIN_PASSWORD_LENGTH = 8
export const MAX_PASSWORD_LENGTH = 200

export interface PasswordCheck {
  ok: boolean
  error?: string
}

export function validatePassword(password: unknown): PasswordCheck {
  if (!password || typeof password !== 'string') {
    return { ok: false, error: 'Parola este obligatorie.' }
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: `Parola trebuie sa aiba minim ${MIN_PASSWORD_LENGTH} caractere.` }
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return { ok: false, error: 'Parola este prea lunga.' }
  }
  // Reject whitespace-only padding used to reach the minimum length.
  if (password.trim().length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: `Parola trebuie sa aiba minim ${MIN_PASSWORD_LENGTH} caractere.` }
  }
  return { ok: true }
}
