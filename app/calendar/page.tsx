'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface CalendarEvent {
  id: number
  title: string
  date: string
  time: string
  location: string
  team: string
  teamId: number
  type: 'match' | 'training' | 'special'
}

interface Team {
  id: number
  name: string
}

const DAYS_OF_WEEK = ['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sam', 'Dum']

const MONTHS_RO = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie',
]

function getEventColorClasses(type: CalendarEvent['type']) {
  switch (type) {
    case 'match':
      return 'bg-red-500 text-white hover:bg-red-600'
    case 'training':
      return 'bg-blue-500 text-white hover:bg-blue-600'
    case 'special':
      return 'bg-green-500 text-white hover:bg-green-600'
    default:
      return 'bg-gray-400 text-white'
  }
}

function getEventTypeBadge(type: CalendarEvent['type']) {
  switch (type) {
    case 'match':
      return 'Meci'
    case 'training':
      return 'Antrenament'
    case 'special':
      return 'Eveniment Special'
    default:
      return type
  }
}

function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(month: number, year: number): number {
  const day = new Date(year, month, 1).getDay()
  // Convert from Sunday=0 to Monday=0
  return day === 0 ? 6 : day - 1
}

export default function CalendarPage() {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [loading, setLoading] = useState(false)

  // Fetch teams on mount
  useEffect(() => {
    async function fetchTeams() {
      try {
        const res = await fetch('/api/teams?active=1')
        if (res.ok) {
          const data = await res.json()
          setTeams(data)
        }
      } catch (err) {
        console.error('Eroare la incarcarea echipelor:', err)
      }
    }
    fetchTeams()
  }, [])

  // Fetch events when month, year, or team filter changes
  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      let url = `/api/calendar?month=${currentMonth + 1}&year=${currentYear}`
      if (selectedTeam !== null) {
        url += `&teamId=${selectedTeam}`
      }
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setEvents(data)
      }
    } catch (err) {
      console.error('Eroare la incarcarea evenimentelor:', err)
    } finally {
      setLoading(false)
    }
  }, [currentMonth, currentYear, selectedTeam])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  function goToPrevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
  }

  function goToNextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
  }

  function getEventsForDay(day: number): CalendarEvent[] {
    return events.filter((event) => {
      const eventDate = new Date(event.date)
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === currentMonth &&
        eventDate.getFullYear() === currentYear
      )
    })
  }

  const daysInMonth = getDaysInMonth(currentMonth, currentYear)
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear)

  // Build calendar grid cells
  const calendarCells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push(null)
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d)
  }
  // Fill remaining cells to complete the last row
  while (calendarCells.length % 7 !== 0) {
    calendarCells.push(null)
  }

  const isToday = (day: number) =>
    day === today.getDate() &&
    currentMonth === today.getMonth() &&
    currentYear === today.getFullYear()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-heading text-3xl font-bold text-dinamo-blue">
                Calendar Evenimente
              </h1>
              <p className="text-gray-500 mt-1">
                Programul meciurilor, antrenamentelor si evenimentelor speciale
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-dinamo-red text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
            >
              Inapoi acasa
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
            <span className="text-sm text-gray-600">Meciuri</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
            <span className="text-sm text-gray-600">Antrenamente</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
            <span className="text-sm text-gray-600">Evenimente Speciale</span>
          </div>
        </div>

        {/* Controls: navigation + filter */}
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Month navigation */}
            <div className="flex items-center gap-4">
              <button
                onClick={goToPrevMonth}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-dinamo-blue"
                aria-label="Luna precedenta"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <h2 className="font-heading text-xl font-bold text-dinamo-blue min-w-[200px] text-center">
                {MONTHS_RO[currentMonth]} {currentYear}
              </h2>
              <button
                onClick={goToNextMonth}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-dinamo-blue"
                aria-label="Luna urmatoare"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            {/* Team filter */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="team-filter"
                className="text-sm font-medium text-gray-600 whitespace-nowrap"
              >
                Filtreaza dupa echipa:
              </label>
              <select
                id="team-filter"
                value={selectedTeam ?? ''}
                onChange={(e) =>
                  setSelectedTeam(
                    e.target.value === '' ? null : Number(e.target.value)
                  )
                }
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Toate echipele</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {/* Days of week header */}
          <div className="grid grid-cols-7 border-b bg-gray-50">
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day}
                className="py-3 text-center text-sm font-semibold text-dinamo-blue font-heading"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dinamo-blue" />
              <span className="ml-3 text-gray-500">Se incarca...</span>
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {calendarCells.map((day, idx) => {
                const dayEvents = day ? getEventsForDay(day) : []
                return (
                  <div
                    key={idx}
                    className={`min-h-[80px] sm:min-h-[120px] border-b border-r p-1 sm:p-2 ${
                      day === null ? 'bg-gray-50' : 'bg-white'
                    } ${isToday(day ?? 0) ? 'ring-2 ring-inset ring-dinamo-red' : ''}`}
                  >
                    {day !== null && (
                      <>
                        <span
                          className={`text-xs sm:text-sm font-medium ${
                            isToday(day)
                              ? 'bg-dinamo-red text-white rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center'
                              : 'text-gray-700'
                          }`}
                        >
                          {day}
                        </span>
                        <div className="mt-1 space-y-1">
                          {dayEvents.slice(0, 3).map((event) => (
                            <button
                              key={event.id}
                              onClick={() => setSelectedEvent(event)}
                              className={`block w-full text-left text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded truncate cursor-pointer transition-colors ${getEventColorClasses(event.type)}`}
                              title={event.title}
                            >
                              {event.title}
                            </button>
                          ))}
                          {dayEvents.length > 3 && (
                            <span className="text-[10px] text-gray-500 px-1">
                              +{dayEvents.length - 3} mai mult
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Upcoming events list (mobile-friendly) */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border p-4 sm:p-6 lg:hidden">
          <h3 className="font-heading text-lg font-bold text-dinamo-blue mb-4">
            Evenimente in {MONTHS_RO[currentMonth]}
          </h3>
          {events.length === 0 ? (
            <p className="text-gray-500 text-sm">
              Nu exista evenimente in aceasta luna.
            </p>
          ) : (
            <div className="space-y-3">
              {events
                .sort(
                  (a, b) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime()
                )
                .map((event) => {
                  const eventDate = new Date(event.date)
                  return (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="w-full text-left flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border"
                    >
                      <div
                        className={`flex-shrink-0 w-12 h-12 rounded-lg flex flex-col items-center justify-center text-white ${
                          event.type === 'match'
                            ? 'bg-red-500'
                            : event.type === 'training'
                            ? 'bg-blue-500'
                            : 'bg-green-500'
                        }`}
                      >
                        <span className="text-xs font-medium leading-none">
                          {eventDate.getDate()}
                        </span>
                        <span className="text-[10px] leading-none mt-0.5">
                          {MONTHS_RO[eventDate.getMonth()].slice(0, 3)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">
                          {event.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {event.time} &middot; {event.location}
                        </p>
                        <span
                          className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full text-white ${
                            event.type === 'match'
                              ? 'bg-red-500'
                              : event.type === 'training'
                              ? 'bg-blue-500'
                              : 'bg-green-500'
                          }`}
                        >
                          {getEventTypeBadge(event.type)}
                        </span>
                      </div>
                    </button>
                  )
                })}
            </div>
          )}
        </div>
      </div>

      {/* Event details popup / modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header with color bar */}
            <div
              className={`px-6 py-4 ${
                selectedEvent.type === 'match'
                  ? 'bg-red-500'
                  : selectedEvent.type === 'training'
                  ? 'bg-blue-500'
                  : 'bg-green-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-white text-sm font-medium px-3 py-1 rounded-full bg-white/20">
                  {getEventTypeBadge(selectedEvent.type)}
                </span>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-white/80 hover:text-white transition-colors"
                  aria-label="Inchide"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <h3 className="font-heading text-xl font-bold text-white mt-3">
                {selectedEvent.title}
              </h3>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Data si Ora
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(selectedEvent.date).toLocaleDateString('ro-RO', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                    {' la '}
                    {selectedEvent.time}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900">Locatie</p>
                  <p className="text-sm text-gray-600">
                    {selectedEvent.location}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900">Echipa</p>
                  <p className="text-sm text-gray-600">{selectedEvent.team}</p>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t bg-gray-50">
              <button
                onClick={() => setSelectedEvent(null)}
                className="w-full px-4 py-2 bg-dinamo-red text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
              >
                Inchide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
