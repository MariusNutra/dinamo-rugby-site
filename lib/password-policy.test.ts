import { describe, it, expect } from 'vitest'
import { validatePassword, MIN_PASSWORD_LENGTH } from './password-policy'

describe('validatePassword', () => {
  it('accepta o parola de lungime minima', () => {
    const result = validatePassword('a'.repeat(MIN_PASSWORD_LENGTH))
    expect(result.ok).toBe(true)
  })

  it('respinge o parola mai scurta decat minimul', () => {
    const result = validatePassword('a'.repeat(MIN_PASSWORD_LENGTH - 1))
    expect(result.ok).toBe(false)
    expect(result.error).toContain(String(MIN_PASSWORD_LENGTH))
  })

  it('respinge parola lipsa', () => {
    expect(validatePassword(undefined).ok).toBe(false)
    expect(validatePassword('').ok).toBe(false)
    expect(validatePassword(null).ok).toBe(false)
  })

  it('respinge valori care nu sunt text', () => {
    expect(validatePassword(12345678).ok).toBe(false)
    expect(validatePassword({ password: 'parolabuna' }).ok).toBe(false)
  })

  it('respinge spatiile folosite ca umplutura pana la minim', () => {
    const result = validatePassword('ab      ')
    expect(result.ok).toBe(false)
  })

  it('accepta o parola cu spatii care are destule caractere reale', () => {
    expect(validatePassword('parola mea buna').ok).toBe(true)
  })

  it('respinge o parola absurd de lunga', () => {
    expect(validatePassword('a'.repeat(500)).ok).toBe(false)
  })

  it('nu returneaza mesaj de eroare cand parola e valida', () => {
    expect(validatePassword('parolabuna123').error).toBeUndefined()
  })
})
