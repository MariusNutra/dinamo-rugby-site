import { describe, it, expect } from 'vitest'
import { normalizeazaNume } from './athlete-username'

describe('normalizeazaNume', () => {
  it('leaga prenumele si numele cu punct', () => {
    expect(normalizeazaNume('Adam Niculae')).toBe('adam.niculae')
  })

  it('scoate diacriticele romanesti', () => {
    expect(normalizeazaNume('Creiță Tudor')).toBe('creita.tudor')
    expect(normalizeazaNume('Ștefan Ionuț')).toBe('stefan.ionut')
    expect(normalizeazaNume('Adrian Câmpeanu')).toBe('adrian.campeanu')
  })

  it('duce numele compuse tot in puncte', () => {
    expect(normalizeazaNume('Ivascu Mario Fabian')).toBe('ivascu.mario.fabian')
  })

  it('strange spatiile in plus', () => {
    expect(normalizeazaNume('  Adam   Niculae  ')).toBe('adam.niculae')
  })

  it('scoate semnele care nu se pot scrie usor', () => {
    expect(normalizeazaNume("Anne-Marie O'Brien")).toBe('annemarie.obrien')
  })

  it('intoarce text gol cand nu ramane nimic folositor', () => {
    expect(normalizeazaNume('!!!')).toBe('')
    expect(normalizeazaNume('')).toBe('')
  })

  it('nu lasa majuscule', () => {
    expect(normalizeazaNume('ADAM NICULAE')).toBe('adam.niculae')
  })
})
