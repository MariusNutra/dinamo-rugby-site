/**
 * Federation (FRR) Export Formatters
 * Generates CSV and XML exports for Federația Română de Rugby
 */

// BOM for Excel to properly detect UTF-8
const UTF8_BOM = '\uFEFF'

/**
 * Generate a proper CSV string with BOM for Excel compatibility (Romanian chars)
 */
export function generateCSV(headers: string[], rows: string[][]): string {
  const escapeField = (field: string): string => {
    const str = String(field ?? '')
    // Wrap in quotes if contains comma, quote, or newline
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return '"' + str.replace(/"/g, '""') + '"'
    }
    return str
  }

  const headerLine = headers.map(escapeField).join(',')
  const dataLines = rows.map(row => row.map(escapeField).join(','))

  return UTF8_BOM + [headerLine, ...dataLines].join('\r\n') + '\r\n'
}

interface AthleteData {
  name: string
  birthYear: number
  teamGrupa?: string | null
  medicalCert: boolean
  photoConsent: boolean
}

/**
 * Export athletes as CSV for federation submission
 * Format: Nume, Prenume, An Naștere, Grupa, Certificat Medical, Consimțământ Foto
 */
export function exportAthletesCSV(athletes: AthleteData[]): string {
  const headers = [
    'Nume',
    'Prenume',
    'An Naștere',
    'Grupa',
    'Certificat Medical',
    'Consimțământ Foto',
  ]

  const rows = athletes.map(a => {
    const { lastName, firstName } = splitName(a.name)
    return [
      lastName,
      firstName,
      String(a.birthYear),
      a.teamGrupa || 'Fără echipă',
      a.medicalCert ? 'Da' : 'Nu',
      a.photoConsent ? 'Da' : 'Nu',
    ]
  })

  return generateCSV(headers, rows)
}

interface CompetitionData {
  name: string
  type: string
  season?: string | null
  category?: string | null
}

interface CompetitionTeamData {
  teamName: string
  points: number
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
}

interface MatchData {
  homeTeam: string
  awayTeam: string
  homeScore: number | null
  awayScore: number | null
  date: string | Date
  round?: string | null
  location?: string | null
}

/**
 * Export competition results as CSV
 * Includes competition info, standings table, and match results
 */
export function exportCompetitionResultsCSV(
  competition: CompetitionData,
  teams: CompetitionTeamData[],
  matches: MatchData[]
): string {
  const headers = ['Secțiune', 'Coloana 1', 'Coloana 2', 'Coloana 3', 'Coloana 4', 'Coloana 5', 'Coloana 6', 'Coloana 7', 'Coloana 8', 'Coloana 9']

  const rows: string[][] = []

  // Competition info
  rows.push(['Competiție', competition.name, '', '', '', '', '', '', '', ''])
  rows.push(['Tip', competition.type, '', '', '', '', '', '', '', ''])
  if (competition.season) rows.push(['Sezon', competition.season, '', '', '', '', '', '', '', ''])
  if (competition.category) rows.push(['Categorie', competition.category, '', '', '', '', '', '', '', ''])
  rows.push(['', '', '', '', '', '', '', '', '', ''])

  // Standings
  rows.push(['CLASAMENT', 'Echipă', 'MJ', 'V', 'E', 'Î', 'GM', 'GP', 'GD', 'Puncte'])

  const sortedTeams = [...teams].sort((a, b) => b.points - a.points)
  sortedTeams.forEach((t, idx) => {
    rows.push([
      String(idx + 1),
      t.teamName,
      String(t.played),
      String(t.won),
      String(t.drawn),
      String(t.lost),
      String(t.goalsFor),
      String(t.goalsAgainst),
      String(t.goalsFor - t.goalsAgainst),
      String(t.points),
    ])
  })

  rows.push(['', '', '', '', '', '', '', '', '', ''])

  // Matches
  rows.push(['REZULTATE', 'Data', 'Runda', 'Gazda', 'Scor', 'Oaspete', 'Locație', '', '', ''])

  const sortedMatches = [...matches].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )
  sortedMatches.forEach(m => {
    const dateStr = new Date(m.date).toLocaleDateString('ro-RO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    const score = m.homeScore !== null && m.awayScore !== null
      ? `${m.homeScore} - ${m.awayScore}`
      : 'Neprogramat'

    rows.push([
      '',
      dateStr,
      m.round || '',
      m.homeTeam,
      score,
      m.awayTeam,
      m.location || '',
      '',
      '',
      '',
    ])
  })

  return generateCSV(headers, rows)
}

interface AttendanceData {
  childName: string
  date: string | Date
  present: boolean
  type: string
}

/**
 * Export attendance records as CSV
 * Format: Sportiv, Data, Prezent, Tip
 */
export function exportAttendanceCSV(attendances: AttendanceData[]): string {
  const headers = ['Sportiv', 'Data', 'Prezent', 'Tip']

  const rows = attendances.map(a => {
    const dateStr = new Date(a.date).toLocaleDateString('ro-RO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    return [
      a.childName,
      dateStr,
      a.present ? 'Da' : 'Nu',
      a.type,
    ]
  })

  return generateCSV(headers, rows)
}

/**
 * Export athletes as XML for federation submission
 */
export function exportAthletesXML(athletes: AthleteData[]): string {
  const escapeXml = (str: string): string => {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<FederatieExport>\n'
  xml += '  <Club>CS Dinamo București Rugby</Club>\n'
  xml += `  <DataExport>${new Date().toISOString().split('T')[0]}</DataExport>\n`
  xml += `  <TotalSportivi>${athletes.length}</TotalSportivi>\n`
  xml += '  <Sportivi>\n'

  athletes.forEach(a => {
    const { lastName, firstName } = splitName(a.name)
    xml += '    <Sportiv>\n'
    xml += `      <Nume>${escapeXml(lastName)}</Nume>\n`
    xml += `      <Prenume>${escapeXml(firstName)}</Prenume>\n`
    xml += `      <AnNastere>${a.birthYear}</AnNastere>\n`
    xml += `      <Grupa>${escapeXml(a.teamGrupa || 'Fără echipă')}</Grupa>\n`
    xml += `      <CertificatMedical>${a.medicalCert ? 'Da' : 'Nu'}</CertificatMedical>\n`
    xml += `      <ConsimtamantFoto>${a.photoConsent ? 'Da' : 'Nu'}</ConsimtamantFoto>\n`
    xml += '    </Sportiv>\n'
  })

  xml += '  </Sportivi>\n'
  xml += '</FederatieExport>\n'

  return xml
}

/**
 * Split a full name into last name and first name
 * Romanian convention: first word(s) = last name, rest = first name
 * If only one word, use it as both
 */
function splitName(fullName: string): { lastName: string; firstName: string } {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length <= 1) {
    return { lastName: parts[0] || '', firstName: '' }
  }
  return {
    lastName: parts[0],
    firstName: parts.slice(1).join(' '),
  }
}
