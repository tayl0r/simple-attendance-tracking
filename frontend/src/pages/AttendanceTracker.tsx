import { useEffect, useState, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import {
  isEventLocked, getDefaultEvent, formatDate, formatTime,
  loadSelectedPlayerIds, saveSelectedPlayerIds,
} from '../utils'
import PlayerPickerModal from '../components/PlayerPickerModal'
import type { GameEvent, Player, AttendanceRow } from '../types'

interface PlayerState {
  status: string | null
  notes: string
}

export default function AttendanceTracker() {
  const { id: scheduleId } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  const [events, setEvents] = useState<GameEvent[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null)
  const [attendance, setAttendance] = useState<Record<string, PlayerState>>({})
  const [allAttendance, setAllAttendance] = useState<AttendanceRow[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // Initial load: events + players, resolve selected IDs
  useEffect(() => {
    if (!scheduleId) return

    Promise.all([
      api.schedules.getEvents(scheduleId),
      api.schedules.getPlayers(scheduleId),
    ]).then(([evs, pls]) => {
      setEvents(evs)
      setPlayers(pls)

      const stored = loadSelectedPlayerIds(scheduleId)
      const valid = stored.filter(id => pls.some(p => p.id === id))
      if (valid.length > 0) {
        saveSelectedPlayerIds(scheduleId, valid)
        setSelectedIds(valid)
        setShowPicker(false)
      } else {
        setShowPicker(true)
      }

      // Resolve which event to show
      const paramEventId = searchParams.get('event')
      const target = paramEventId ? evs.find(e => e.id === paramEventId) : null
      const chosen = target ?? getDefaultEvent(evs)
      if (chosen) setCurrentEvent(chosen)

      setLoaded(true)
    }).catch(() => {
      setLoadError(true)
      setLoaded(true)
      showToast('Failed to load schedule — try refreshing')
    })
  }, [scheduleId])

  // Load attendance whenever the current event changes
  useEffect(() => {
    if (!currentEvent) return
    api.events.getAttendance(currentEvent.id).then(rows => {
      setAllAttendance(rows)
      // Seed local state for selected players
      const state: Record<string, PlayerState> = {}
      for (const row of rows) {
        state[row.player_id] = { status: row.status, notes: row.notes ?? '' }
      }
      setAttendance(state)
    }).catch(() => {
      showToast('Failed to load attendance')
    })
  }, [currentEvent?.id])

  // Update URL when event changes
  useEffect(() => {
    if (!currentEvent) return
    setSearchParams({ event: currentEvent.id }, { replace: true })
  }, [currentEvent?.id])

  function savePicker(ids: string[]) {
    if (!scheduleId) return
    saveSelectedPlayerIds(scheduleId, ids)
    setSelectedIds(ids)
    setShowPicker(false)
  }

  function navigate(dir: 'prev' | 'next') {
    if (!currentEvent) return
    const idx = events.findIndex(e => e.id === currentEvent.id)
    const next = dir === 'prev' ? events[idx - 1] : events[idx + 1]
    if (next) setCurrentEvent(next)
  }

  function refetchAttendance() {
    if (!currentEvent) return
    api.events.getAttendance(currentEvent.id).then(rows => {
      setAllAttendance(rows)
      const state: Record<string, PlayerState> = {}
      for (const row of rows) {
        state[row.player_id] = { status: row.status, notes: row.notes ?? '' }
      }
      setAttendance(state)
    })
  }

  async function saveAttendance(playerId: string, state: PlayerState) {
    if (!currentEvent) return
    await api.events.putAttendance(currentEvent.id, playerId, {
      status: state.status,
      notes: state.notes || null,
    })
    // Refresh full attendance list
    api.events.getAttendance(currentEvent.id).then(setAllAttendance)
  }

  async function handleStatusTap(playerId: string, status: string) {
    clearTimeout(debounceTimers.current[playerId])
    const current = attendance[playerId] ?? { status: null, notes: '' }
    const next = { ...current, status }
    setAttendance(prev => ({ ...prev, [playerId]: next }))
    try {
      await saveAttendance(playerId, next)
    } catch {
      showToast('Failed to save attendance — try again')
      refetchAttendance()
    }
  }

  function handleNotesChange(playerId: string, notes: string) {
    const current = attendance[playerId] ?? { status: null, notes: '' }
    const next = { ...current, notes }
    setAttendance(prev => ({ ...prev, [playerId]: next }))

    clearTimeout(debounceTimers.current[playerId])
    debounceTimers.current[playerId] = setTimeout(async () => {
      try {
        await saveAttendance(playerId, next)
      } catch {
        showToast('Failed to save attendance — try again')
        refetchAttendance()
      }
    }, 500)
  }

  if (!loaded) return <div className="page">Loading…</div>
  if (loadError) return <div className="page">Failed to load — try refreshing.</div>

  const locked = currentEvent ? isEventLocked(currentEvent) : false
  const eventIdx = currentEvent ? events.findIndex(e => e.id === currentEvent.id) : -1
  const selectedPlayers = players
    .filter(p => selectedIds.includes(p.id))
    .sort((a, b) => a.first_name.localeCompare(b.first_name))

  return (
    <div className="page">
      {showPicker && (
        <PlayerPickerModal
          players={players}
          initialSelected={selectedIds}
          onSave={savePicker}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>Attendance</h1>
        <button className="btn btn-sm" onClick={() => setShowPicker(true)}>Change Players</button>
      </div>

      {events.length === 0 && <p>No events in this schedule yet.</p>}

      {currentEvent && (
        <>
          {/* Event header */}
          <div className="card" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <button className="btn btn-sm" onClick={() => navigate('prev')} disabled={eventIdx <= 0}>← Prev</button>
              <span style={{ fontSize: 13, color: '#666' }}>{eventIdx + 1} / {events.length}</span>
              <button className="btn btn-sm" onClick={() => navigate('next')} disabled={eventIdx >= events.length - 1}>Next →</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className={`badge badge-${currentEvent.type}`}>{currentEvent.type}</span>
              {locked && <span style={{ fontSize: 12, color: '#888' }}>locked</span>}
            </div>
            <div style={{ fontWeight: 600 }}>
              {currentEvent.week != null ? `Week ${currentEvent.week} · ` : ''}{formatDate(currentEvent.date)} · {formatTime(currentEvent.time)} · {currentEvent.location}
            </div>
            <div style={{ color: '#555', marginTop: 4 }}>
              {currentEvent.type === 'game'
                ? `${currentEvent.home_team} vs ${currentEvent.away_team}`
                : currentEvent.team}
            </div>
          </div>

          {/* Your players */}
          <h3>Your Players</h3>
          {selectedPlayers.length === 0 && <p style={{ color: '#888' }}>No players selected.</p>}
          {selectedPlayers.map(player => {
            const state = attendance[player.id] ?? { status: null, notes: '' }
            return (
              <div key={player.id} className="card" style={{ marginBottom: 8 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>{player.first_name} {player.last_name}</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  {(['yes', 'no', 'maybe'] as const).map(s => (
                    <button
                      key={s}
                      className="btn btn-sm"
                      disabled={locked}
                      style={{
                        background: state.status === s ? (s === 'yes' ? '#16a34a' : s === 'no' ? '#dc2626' : '#d97706') : undefined,
                        color: state.status === s ? 'white' : undefined,
                        borderColor: state.status === s ? 'transparent' : undefined,
                        textTransform: 'capitalize',
                      }}
                      onClick={() => handleStatusTap(player.id, s)}
                    >
                      {s === 'yes' ? 'Yes ✓' : s === 'no' ? 'No ✗' : 'Maybe ?'}
                    </button>
                  ))}
                </div>
                <textarea
                  disabled={locked}
                  placeholder="Notes (optional)"
                  value={state.notes}
                  onChange={e => handleNotesChange(player.id, e.target.value)}
                  rows={2}
                  style={{ width: '100%', padding: '6px 8px', border: '1px solid #ccc', borderRadius: 4, resize: 'vertical', fontSize: 14 }}
                />
              </div>
            )
          })}

          {/* Attendance stats */}
          {allAttendance.length > 0 && (() => {
            const yes = allAttendance.filter(r => r.status === 'yes').length
            const no = allAttendance.filter(r => r.status === 'no').length
            const maybe = allAttendance.filter(r => r.status === 'maybe').length
            return (
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <div style={{ flex: 1, textAlign: 'center', padding: '10px 0', background: '#f0fdf4', borderRadius: 8 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#16a34a' }}>{yes}</div>
                  <div style={{ fontSize: 12, color: '#555' }}>Yes</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center', padding: '10px 0', background: '#fef2f2', borderRadius: 8 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#dc2626' }}>{no}</div>
                  <div style={{ fontSize: 12, color: '#555' }}>No</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center', padding: '10px 0', background: '#fffbeb', borderRadius: 8 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#d97706' }}>{maybe}</div>
                  <div style={{ fontSize: 12, color: '#555' }}>Maybe</div>
                </div>
              </div>
            )
          })()}

          {/* Full attendance list */}
          <details style={{ marginTop: 24 }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
              Full Attendance ({allAttendance.length} players)
            </summary>
            <div style={{ marginTop: 8 }}>
              {[...allAttendance].sort((a, b) => a.first_name.localeCompare(b.first_name)).map(row => (
                <div key={row.player_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <span>{row.first_name} {row.last_name}</span>
                  <span>
                    {row.status
                      ? <span className={`status-${row.status}`}>{row.status}</span>
                      : <span style={{ color: '#aaa' }}>—</span>}
                    {row.notes && <span style={{ fontSize: 12, color: '#666', marginLeft: 8 }}>{row.notes}</span>}
                  </span>
                </div>
              ))}
            </div>
          </details>
        </>
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
