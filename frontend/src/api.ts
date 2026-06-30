import type {
  Roster, RosterWithPlayers, Player, Schedule, ScheduleWithRosters,
  GameEvent, AttendanceRow
} from './types'

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    const err = new Error(text || `HTTP ${res.status}`) as Error & { status: number }
    err.status = res.status
    throw err
  }
  if (res.status === 204) return undefined as unknown as T
  return res.json()
}

export const api = {
  rosters: {
    list: () => req<Roster[]>('GET', '/rosters'),
    get: (id: string) => req<RosterWithPlayers>('GET', `/rosters/${id}`),
    create: (name: string) => req<Roster>('POST', '/rosters', { name }),
    update: (id: string, name: string) => req<Roster>('PUT', `/rosters/${id}`, { name }),
    delete: (id: string) => req<void>('DELETE', `/rosters/${id}`),
    addPlayer: (id: string, firstName: string, lastName: string) =>
      req<Player>('POST', `/rosters/${id}/players`, { first_name: firstName, last_name: lastName }),
    updatePlayer: (id: string, playerId: string, firstName: string, lastName: string) =>
      req<Player>('PUT', `/rosters/${id}/players/${playerId}`, { first_name: firstName, last_name: lastName }),
    deletePlayer: (id: string, playerId: string) =>
      req<void>('DELETE', `/rosters/${id}/players/${playerId}`),
    import: (id: string, text: string) =>
      req<{ added: number }>('POST', `/rosters/${id}/import`, { text }),
  },
  schedules: {
    list: () => req<Schedule[]>('GET', '/schedules'),
    get: (id: string) => req<ScheduleWithRosters>('GET', `/schedules/${id}`),
    create: (name: string) => req<Schedule>('POST', '/schedules', { name }),
    update: (id: string, name: string) => req<Schedule>('PUT', `/schedules/${id}`, { name }),
    delete: (id: string) => req<void>('DELETE', `/schedules/${id}`),
    getEvents: (id: string) => req<GameEvent[]>('GET', `/schedules/${id}/events`),
    createEvent: (id: string, body: Omit<GameEvent, 'id' | 'schedule_id'>) =>
      req<GameEvent>('POST', `/schedules/${id}/events`, body),
    deleteEvent: (scheduleId: string, eventId: string) =>
      req<void>('DELETE', `/schedules/${scheduleId}/events/${eventId}`),
    import: (id: string, text: string) =>
      req<{ added: number }>('POST', `/schedules/${id}/import`, { text }),
    addRoster: (id: string, rosterId: string) =>
      req<void>('POST', `/schedules/${id}/rosters`, { roster_id: rosterId }),
    removeRoster: (id: string, rosterId: string) =>
      req<void>('DELETE', `/schedules/${id}/rosters/${rosterId}`),
    getPlayers: (id: string) => req<Player[]>('GET', `/schedules/${id}/players`),
  },
  events: {
    update: (id: string, body: Omit<GameEvent, 'id' | 'schedule_id' | 'type'>) =>
      req<GameEvent>('PUT', `/events/${id}`, body),
    getAttendance: (id: string) => req<AttendanceRow[]>('GET', `/events/${id}/attendance`),
    putAttendance: (
      eventId: string,
      playerId: string,
      body: { status: string | null; notes: string | null }
    ) => req<void>('PUT', `/events/${eventId}/attendance/${playerId}`, body),
  },
}
