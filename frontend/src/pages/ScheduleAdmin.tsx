import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'
import { formatDate, formatTime } from '../utils'
import type { ScheduleWithRosters, GameEvent, Roster } from '../types'

export default function ScheduleAdmin() {
  const { id } = useParams<{ id: string }>()
  const [schedule, setSchedule] = useState<ScheduleWithRosters | null>(null)
  const [events, setEvents] = useState<GameEvent[]>([])
  const [allRosters, setAllRosters] = useState<Roster[]>([])
  const [name, setName] = useState('')
  const [importText, setImportText] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [addRosterId, setAddRosterId] = useState('')
  // Training form
  const [tTeam, setTTeam] = useState('')
  const [tDate, setTDate] = useState('')
  const [tTime, setTTime] = useState('')
  const [tLocation, setTLocation] = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function load() {
    if (!id) return
    try {
      const [s, ev, r] = await Promise.all([
        api.schedules.get(id),
        api.schedules.getEvents(id),
        api.rosters.list(),
      ])
      setSchedule(s)
      setName(s.name)
      setEvents(ev)
      setAllRosters(r)
    } catch {
      setLoadError(true)
      showToast('Failed to load schedule — try refreshing')
    }
  }

  useEffect(() => { load() }, [id])

  async function saveName() {
    if (!id || !name.trim()) return
    try {
      await api.schedules.update(id, name.trim())
      showToast('Saved')
    } catch {
      showToast('Failed to save name')
    }
  }

  async function importGames() {
    if (!id || !importText.trim()) return
    try {
      const { added } = await api.schedules.import(id, importText)
      setImportText('')
      showToast(`Added ${added} game${added !== 1 ? 's' : ''}`)
      load()
    } catch {
      showToast('Failed to import games')
    }
  }

  async function addTraining() {
    if (!id || !tTeam || !tDate || !tTime || !tLocation) return
    try {
      await api.schedules.createEvent(id, {
        type: 'training',
        date: tDate,
        time: tTime,
        location: tLocation,
        team: tTeam,
      })
      setTTeam(''); setTDate(''); setTTime(''); setTLocation('')
      load()
    } catch {
      showToast('Failed to add training')
    }
  }

  async function deleteEvent(eventId: string) {
    if (!id) return
    try {
      await api.schedules.deleteEvent(id, eventId)
      load()
    } catch {
      showToast('Failed to delete event')
    }
  }

  async function attachRoster() {
    if (!id || !addRosterId) return
    try {
      await api.schedules.addRoster(id, addRosterId)
      setAddRosterId('')
      load()
    } catch {
      showToast('Failed to attach roster')
    }
  }

  async function detachRoster(rosterId: string) {
    if (!id) return
    try {
      await api.schedules.removeRoster(id, rosterId)
      load()
    } catch {
      showToast('Failed to remove roster')
    }
  }

  async function deleteSchedule() {
    if (!id || !confirm('Delete this schedule and all its events?')) return
    try {
      await api.schedules.delete(id)
      window.location.href = '/'
    } catch {
      showToast('Failed to delete schedule')
    }
  }

  const shareUrl = `${window.location.origin}/s/${id}`

  const attachableRosters = allRosters.filter(
    r => !schedule?.rosters.some(sr => sr.id === r.id)
  )

  if (loadError) return <div className="page">Failed to load — try refreshing.</div>
  if (!schedule) return <div className="page">Loading…</div>

  return (
    <div className="page">
      <Link to="/">← Home</Link>
      <h1 style={{ marginTop: 8 }}>Schedule Admin</h1>

      {/* Name */}
      <div className="card">
        <label>Name</label>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <input value={name} onChange={e => setName(e.target.value)}
            style={{ flex: 1, padding: '6px 10px', border: '1px solid #ccc', borderRadius: 4 }} />
          <button className="btn btn-primary btn-sm" onClick={saveName}>Save</button>
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#555' }}>Share link:</span>
          <code style={{ fontSize: 13 }}>{shareUrl}</code>
          <button className="btn btn-sm" onClick={() => { navigator.clipboard.writeText(shareUrl); showToast('Copied!') }}>Copy</button>
        </div>
      </div>

      {/* Events table */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Events ({events.length})</h3>
        {events.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                <th style={{ padding: '4px 8px' }}>Type</th>
                <th style={{ padding: '4px 8px' }}>Week</th>
                <th style={{ padding: '4px 8px' }}>Date</th>
                <th style={{ padding: '4px 8px' }}>Time</th>
                <th style={{ padding: '4px 8px' }}>Teams / Team</th>
                <th style={{ padding: '4px 8px' }}>Location</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {events.map(e => (
                <tr key={e.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '4px 8px' }}>
                    <span className={`badge badge-${e.type}`}>{e.type}</span>
                  </td>
                  <td style={{ padding: '4px 8px' }}>{e.week ?? '—'}</td>
                  <td style={{ padding: '4px 8px' }}>{formatDate(e.date)}</td>
                  <td style={{ padding: '4px 8px' }}>{formatTime(e.time)}</td>
                  <td style={{ padding: '4px 8px' }}>
                    {e.type === 'game'
                      ? `${e.home_team} vs ${e.away_team}`
                      : e.team}
                  </td>
                  <td style={{ padding: '4px 8px' }}>{e.location}</td>
                  <td style={{ padding: '4px 8px' }}>
                    <button className="btn btn-sm btn-danger" onClick={() => deleteEvent(e.id)}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Import games */}
        <div style={{ marginTop: 16 }}>
          <h4 style={{ margin: '0 0 8px' }}>Import games from schedule paste</h4>
          <textarea
            value={importText}
            onChange={e => setImportText(e.target.value)}
            placeholder="Paste schedule text here…"
            rows={5}
            style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4, resize: 'vertical' }}
          />
          <button className="btn btn-primary" style={{ marginTop: 6 }} onClick={importGames}>
            Import Games
          </button>
        </div>

        {/* Add training */}
        <div style={{ marginTop: 16 }}>
          <h4 style={{ margin: '0 0 8px' }}>Add training</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input placeholder="Team name" value={tTeam} onChange={e => setTTeam(e.target.value)}
              style={{ padding: '6px 10px', border: '1px solid #ccc', borderRadius: 4 }} />
            <input placeholder="Location" value={tLocation} onChange={e => setTLocation(e.target.value)}
              style={{ padding: '6px 10px', border: '1px solid #ccc', borderRadius: 4 }} />
            <input type="date" value={tDate} onChange={e => setTDate(e.target.value)}
              style={{ padding: '6px 10px', border: '1px solid #ccc', borderRadius: 4 }} />
            <input type="time" value={tTime} onChange={e => setTTime(e.target.value)}
              style={{ padding: '6px 10px', border: '1px solid #ccc', borderRadius: 4 }} />
          </div>
          <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={addTraining}>
            Add Training
          </button>
        </div>
      </div>

      {/* Rosters section */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Rosters</h3>
        {schedule.rosters.map(r => (
          <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f0f0f0' }}>
            <Link to={`/rosters/${r.id}`}>{r.name}</Link>
            <button className="btn btn-sm btn-danger" onClick={() => detachRoster(r.id)}>Remove</button>
          </div>
        ))}
        {attachableRosters.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <select value={addRosterId} onChange={e => setAddRosterId(e.target.value)}
              style={{ flex: 1, padding: '6px 10px', border: '1px solid #ccc', borderRadius: 4 }}>
              <option value="">Select roster to attach…</option>
              {attachableRosters.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <button className="btn btn-primary btn-sm" onClick={attachRoster}>Attach</button>
          </div>
        )}
        {schedule.rosters.length === 0 && attachableRosters.length === 0 && (
          <p style={{ color: '#666', fontSize: 14 }}>No rosters available. Create one first.</p>
        )}
      </div>

      <div style={{ marginTop: 24 }}>
        <button className="btn btn-danger btn-sm" onClick={deleteSchedule}>Delete Schedule</button>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
