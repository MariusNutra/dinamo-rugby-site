/**
 * Generate iCal (.ics) format for calendar events
 */

interface ICalEvent {
  uid: string
  summary: string
  description?: string
  location?: string
  dtstart: Date
  dtend?: Date
  allDay?: boolean
}

function formatDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function formatDateOnly(date: Date): string {
  return date.toISOString().split('T')[0].replace(/-/g, '')
}

function escapeText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

export function generateICalEvent(event: ICalEvent): string {
  const lines: string[] = [
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${formatDate(new Date())}`,
    `SUMMARY:${escapeText(event.summary)}`,
  ]

  if (event.allDay) {
    lines.push(`DTSTART;VALUE=DATE:${formatDateOnly(event.dtstart)}`)
    if (event.dtend) {
      lines.push(`DTEND;VALUE=DATE:${formatDateOnly(event.dtend)}`)
    }
  } else {
    lines.push(`DTSTART:${formatDate(event.dtstart)}`)
    if (event.dtend) {
      lines.push(`DTEND:${formatDate(event.dtend)}`)
    }
  }

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeText(event.description)}`)
  }
  if (event.location) {
    lines.push(`LOCATION:${escapeText(event.location)}`)
  }

  lines.push('END:VEVENT')
  return lines.join('\r\n')
}

export function generateICalendar(events: ICalEvent[], calendarName = 'CS Dinamo Rugby Calendar'): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CS Dinamo Rugby//Calendar//RO',
    `X-WR-CALNAME:${escapeText(calendarName)}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]

  for (const event of events) {
    lines.push(generateICalEvent(event))
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}
