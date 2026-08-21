import { describe, it, expect } from 'vitest'
import { minutesOf } from './training-occurrences'

describe('minutesOf', () => {
  it('citeste ora scrisa normal', () => {
    expect(minutesOf('19:00')).toBe(19 * 60)
    expect(minutesOf('09:30')).toBe(9 * 60 + 30)
    expect(minutesOf('9:05')).toBe(9 * 60 + 5)
  })

  it('trece peste spatii', () => {
    expect(minutesOf(' 20:15 ')).toBe(20 * 60 + 15)
  })

  it('ce nu se poate citi devine 00:00, nu NaN', () => {
    // Un NaN aici ar da o data invalida, iar antrenamentul ar disparea tacut.
    expect(minutesOf(null)).toBe(0)
    expect(minutesOf(undefined)).toBe(0)
    expect(minutesOf('')).toBe(0)
    expect(minutesOf('seara')).toBe(0)
    expect(minutesOf('19.00')).toBe(0)
  })

  it('nu lasa ora sa iasa din zi', () => {
    expect(minutesOf('99:99')).toBe(23 * 60 + 59)
  })
})
