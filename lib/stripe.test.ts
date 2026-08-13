import { describe, test, expect, afterEach } from 'vitest'
import { platileSuntConfigurate, raspunsPlatiIndisponibile, MESAJ_PLATI_INDISPONIBILE } from './stripe'

const cheieInitiala = process.env.STRIPE_SECRET_KEY

afterEach(() => {
  if (cheieInitiala === undefined) delete process.env.STRIPE_SECRET_KEY
  else process.env.STRIPE_SECRET_KEY = cheieInitiala
})

describe('platileSuntConfigurate', () => {
  test('returns false when the payment key is missing', () => {
    delete process.env.STRIPE_SECRET_KEY
    expect(platileSuntConfigurate()).toBe(false)
  })

  test('returns false when the payment key is an empty string', () => {
    process.env.STRIPE_SECRET_KEY = ''
    expect(platileSuntConfigurate()).toBe(false)
  })

  test('returns true when a payment key is present', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_oarecare'
    expect(platileSuntConfigurate()).toBe(true)
  })
})

describe('raspunsPlatiIndisponibile', () => {
  test('answers 503, not 500 — the service is absent, the request is not wrong', () => {
    expect(raspunsPlatiIndisponibile().status).toBe(503)
  })

  test('carries a readable body instead of the empty 500 it replaces', async () => {
    // Arrange
    const raspuns = raspunsPlatiIndisponibile()

    // Act
    const corp = await raspuns.json()

    // Assert
    expect(corp.error).toBe(MESAJ_PLATI_INDISPONIBILE)
    expect(corp.code).toBe('payments_not_configured')
  })

  test('the message tells the person how to pay anyway', () => {
    expect(MESAJ_PLATI_INDISPONIBILE).toContain('contact@dinamorugby.ro')
  })
})
