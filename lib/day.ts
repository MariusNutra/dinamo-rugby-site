/**
 * Normalizarea zilei, folosita oriunde o inregistrare e legata de o zi
 * calendaristica, nu de un moment: prezenta, anuntul de participare.
 *
 * Serverul ruleaza pe UTC, iar antrenamentele sunt intre 09:00 si 21:00 ora
 * Romaniei, deci ziua UTC si ziua locala coincid. Important e ca TOATE locurile
 * care compara zile sa treaca prin aceeasi functie: daca unul normalizeaza si
 * altul nu, randurile exista dar nu se gasesc intre ele.
 */
export function startOfDay(input?: string | Date | null): Date {
  const d = input ? new Date(input) : new Date()
  if (Number.isNaN(d.getTime())) {
    throw new Error('Data invalida')
  }
  d.setHours(0, 0, 0, 0)
  return d
}

export function nextDay(day: Date): Date {
  const d = new Date(day)
  d.setDate(d.getDate() + 1)
  return d
}

const RO_WEEKDAYS = [
  'duminica', 'luni', 'marti', 'miercuri', 'joi', 'vineri', 'sambata',
]

/**
 * Numele zilei fara diacritice, ca sa se poata compara cu ce a scris omul in
 * panou: „Marți" si „Marti" trebuie sa insemne acelasi lucru.
 */
export function normalizeWeekday(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[șş]/g, 's')
    .replace(/[țţ]/g, 't')
    .trim()
}

/** Ziua saptamanii pentru o data, in forma normalizata („marti", „joi"). */
export function weekdayOf(day: Date): string {
  return RO_WEEKDAYS[day.getDay()]
}
