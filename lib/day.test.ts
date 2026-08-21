import { describe, it, expect } from 'vitest'
import { startOfDay, nextDay, normalizeWeekday, weekdayOf } from './day'

describe('startOfDay', () => {
  it('taie ora, ca doua inregistrari din aceeasi zi sa se gaseasca', () => {
    const a = startOfDay('2026-08-25T19:30:00.000Z')
    const b = startOfDay('2026-08-25T06:05:00.000Z')
    expect(a.getTime()).toBe(b.getTime())
    expect(a.getHours()).toBe(0)
  })

  it('respinge o data invalida in loc sa produca NaN', () => {
    expect(() => startOfDay('maine')).toThrow()
  })
})

describe('nextDay', () => {
  it('nu modifica ziua primita', () => {
    const day = startOfDay('2026-08-25')
    const after = nextDay(day)
    expect(after.getDate()).toBe(26)
    expect(day.getDate()).toBe(25)
  })
})

describe('normalizeWeekday', () => {
  it('trece peste diacritice: „Marți" si „Marti" sunt aceeasi zi', () => {
    expect(normalizeWeekday('Marți')).toBe('marti')
    expect(normalizeWeekday('Marti')).toBe('marti')
    expect(normalizeWeekday('  JOI ')).toBe('joi')
    expect(normalizeWeekday('Sâmbătă')).toBe('sambata')
  })
})

describe('weekdayOf', () => {
  it('da numele romanesc, normalizat', () => {
    // 25 august 2026 e marti, 27 e joi.
    expect(weekdayOf(startOfDay('2026-08-25'))).toBe('marti')
    expect(weekdayOf(startOfDay('2026-08-27'))).toBe('joi')
    expect(weekdayOf(startOfDay('2026-08-23'))).toBe('duminica')
  })

  it('se potriveste cu ce scrie antrenorul in panou', () => {
    expect(normalizeWeekday('Marți')).toBe(weekdayOf(startOfDay('2026-08-25')))
  })
})
