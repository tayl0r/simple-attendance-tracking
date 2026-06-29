import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import type { Roster, Schedule } from '../types'

export default function Home() {
  const [rosters, setRosters] = useState<Roster[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const navigate = useNavigate()

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    api.rosters.list().then(setRosters).catch(() => showToast('Failed to load rosters'))
    api.schedules.list().then(setSchedules).catch(() => showToast('Failed to load schedules'))
  }, [])

  async function createRoster() {
    const name = prompt('Roster name:')
    if (!name?.trim()) return
    try {
      const r = await api.rosters.create(name.trim())
      navigate(`/rosters/${r.id}`)
    } catch {
      showToast('Failed to create roster')
    }
  }

  async function createSchedule() {
    const name = prompt('Schedule name:')
    if (!name?.trim()) return
    try {
      const s = await api.schedules.create(name.trim())
      navigate(`/schedules/${s.id}`)
    } catch {
      showToast('Failed to create schedule')
    }
  }

  return (
    <div className="page">
      <h1>Attendance Tracker</h1>

      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Schedules</h2>
          <button className="btn btn-primary btn-sm" onClick={createSchedule}>+ New Schedule</button>
        </div>
        {schedules.map(s => (
          <div key={s.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>{s.name}</strong>
              <div style={{ fontSize: 13, color: '#666' }}>{s.event_count ?? 0} events</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to={`/schedules/${s.id}`} className="btn btn-sm">Admin</Link>
              <Link to={`/s/${s.id}`} className="btn btn-primary btn-sm">Share ↗</Link>
            </div>
          </div>
        ))}
        {schedules.length === 0 && <p style={{ color: '#666' }}>No schedules yet.</p>}
      </section>

      <section style={{ marginTop: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Rosters</h2>
          <button className="btn btn-primary btn-sm" onClick={createRoster}>+ New Roster</button>
        </div>
        {rosters.map(r => (
          <div key={r.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>{r.name}</strong>
              <div style={{ fontSize: 13, color: '#666' }}>{r.player_count ?? 0} players</div>
            </div>
            <Link to={`/rosters/${r.id}`} className="btn btn-sm">Manage</Link>
          </div>
        ))}
        {rosters.length === 0 && <p style={{ color: '#666' }}>No rosters yet.</p>}
      </section>
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
