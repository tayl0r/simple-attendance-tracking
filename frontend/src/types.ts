export interface Roster {
  id: string
  name: string
  created_at: string
  player_count?: number
}

export interface RosterWithPlayers extends Roster {
  players: Player[]
}

export interface Player {
  id: string
  roster_id?: string
  first_name: string
  last_name: string
}

export interface Schedule {
  id: string
  name: string
  created_at: string
  event_count?: number
}

export interface ScheduleWithRosters extends Schedule {
  rosters: Roster[]
}

export interface GameEvent {
  id: string
  schedule_id: string
  type: 'game' | 'training'
  date: string    // 'YYYY-MM-DD'
  time: string    // 'HH:MM:SS'
  location: string
  week?: number | null
  home_team?: string | null
  away_team?: string | null
  team?: string | null
}

export interface AttendanceRow {
  player_id: string
  first_name: string
  last_name: string
  status: 'yes' | 'no' | 'maybe' | null
  notes: string | null
  updated_at: string | null
}
