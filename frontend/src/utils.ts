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

// A viewer's choice for a schedule: either track specific players (and record
// their attendance), or just browse the schedule read-only.
export type Selection =
  | { mode: 'tracking'; playerIds: string[] }
  | { mode: 'browsing' }

function storageKey(scheduleId: string): string {
  return `attendance:${scheduleId}:players`
}

export function loadSelection(scheduleId: string): Selection | null {
  try {
    const raw = localStorage.getItem(storageKey(scheduleId))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed === 'browsing') return { mode: 'browsing' }
    // Legacy + current format: a non-empty array of player IDs = tracking.
    if (Array.isArray(parsed) && parsed.length > 0) {
      return { mode: 'tracking', playerIds: parsed as string[] }
    }
    return null
  } catch {
    return null
  }
}

export function saveSelection(scheduleId: string, selection: Selection): void {
  try {
    const value = selection.mode === 'browsing' ? 'browsing' : selection.playerIds
    localStorage.setItem(storageKey(scheduleId), JSON.stringify(value))
  } catch {
    // Fail silently if localStorage unavailable
  }
}
