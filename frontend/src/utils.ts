import type { GameEvent } from './types'

export function isEventLocked(event: GameEvent): boolean {
  // Assumes browser local time = Pacific — all users of this tool are Pacific, matching the server timezone.
  // Parse as local time (no 'Z') — ECMAScript treats this as local time
  const eventDt = new Date(`${event.date}T${event.time}`)
  const lockAt = new Date(eventDt.getTime() + 30 * 60 * 1000)
  return lockAt < new Date()
}

export function getDefaultEvent(events: GameEvent[]): GameEvent | null {
  if (events.length === 0) return null
  return events.find(e => !isEventLocked(e)) ?? events[events.length - 1]
}

export function formatTime(time: string): string {
  // Input: 'HH:MM:SS' from postgres, Output: '7:30 PM'
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

export function formatDate(date: string): string {
  // Input: 'YYYY-MM-DD', Output: 'Mon, July 6'
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
  })
}

function storageKey(scheduleId: string): string {
  return `attendance:${scheduleId}:players`
}

export function loadSelectedPlayerIds(scheduleId: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey(scheduleId))
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function saveSelectedPlayerIds(scheduleId: string, ids: string[]): void {
  try {
    localStorage.setItem(storageKey(scheduleId), JSON.stringify(ids))
  } catch {
    // Fail silently if localStorage unavailable
  }
}
