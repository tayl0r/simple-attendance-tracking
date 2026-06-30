import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'
import type { RosterWithPlayers, Player } from '../types'

export default function RosterDetail() {
  const { id } = useParams<{ id: string }>()
  const [roster, setRoster] = useState<RosterWithPlayers | null>(null)
  const [name, setName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [importText, setImportText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFirst, setEditFirst] = useState('')
  const [editLast, setEditLast] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [loadError, setLoadError] = useState(false)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function load() {
    if (!id) return
    try {
      const r = await api.rosters.get(id)
      setRoster(r)
      setName(r.name)
    } catch {
      setLoadError(true)
      showToast('Failed to load roster — try refreshing')
    }
  }

  useEffect(() => { load() }, [id])

  async function saveName() {
    if (!id || !name.trim()) return
    try {
      await api.rosters.update(id, name.trim())
      showToast('Saved')
    } catch {
      showToast('Failed to save name')
    }
  }

  async function addPlayer() {
    if (!id || !firstName.trim() || !lastName.trim()) return
    try {
      await api.rosters.addPlayer(id, firstName.trim(), lastName.trim())
      setFirstName('')
      setLastName('')
      load()
    } catch {
      showToast('Failed to add player')
    }
  }

  function startEdit(p: Player) {
    setEditingId(p.id)
    setEditFirst(p.first_name)
    setEditLast(p.last_name)
  }

  async function saveEdit(playerId: string) {
    if (!id || !editFirst.trim() || !editLast.trim()) return
    try {
      await api.rosters.updatePlayer(id, playerId, editFirst.trim(), editLast.trim())
      setEditingId(null)
      load()
    } catch {
      showToast('Failed to save player')
    }
  }

  async function deletePlayer(playerId: string) {
    if (!id) return
    try {
      await api.rosters.deletePlayer(id, playerId)
      load()
    } catch {
      showToast('Failed to delete player')
    }
  }

  async function importPlayers() {
    if (!id || !importText.trim()) return
    try {
      const { added } = await api.rosters.import(id, importText)
      if (added === 0) {
        showToast('No players recognized — check the pasted format')
        return
      }
      setImportText('')
      showToast(`Added ${added} player${added !== 1 ? 's' : ''}`)
      load()
    } catch {
      showToast('Failed to import players')
    }
  }

  async function deleteRoster() {
    if (!id || !confirm('Delete this roster?')) return
    try {
      await api.rosters.delete(id)
      window.location.href = '/'
    } catch (err: any) {
      if (err.status === 409) {
        alert('Cannot delete: roster is attached to a schedule')
      } else {
        showToast('Failed to delete roster')
      }
    }
  }

  if (loadError) return <div className="page">Failed to load — try refreshing.</div>
  if (!roster) return <div className="page">Loading…</div>

  return (
    <div className="page">
      <Link to="/">← Home</Link>
      <h1 style={{ marginTop: 8 }}>Roster</h1>

      <div className="card">
        <label>Name</label>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <input value={name} onChange={e => setName(e.target.value)}
            style={{ flex: 1, padding: '6px 10px', border: '1px solid #ccc', borderRadius: 4 }} />
          <button className="btn btn-primary btn-sm" onClick={saveName}>Save</button>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Players ({roster.players.length})</h3>
        {[...roster.players].sort((a, b) => a.first_name.localeCompare(b.first_name)).map((p: Player) => (
          <div key={p.id} style={{ padding: '4px 0', borderBottom: '1px solid #f0f0f0' }}>
            {editingId === p.id ? (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input value={editFirst} onChange={e => setEditFirst(e.target.value)}
                  style={{ flex: 1, padding: '4px 8px', border: '1px solid #ccc', borderRadius: 4 }} />
                <input value={editLast} onChange={e => setEditLast(e.target.value)}
                  style={{ flex: 1, padding: '4px 8px', border: '1px solid #ccc', borderRadius: 4 }} />
                <button className="btn btn-primary btn-sm" onClick={() => saveEdit(p.id)}>Save</button>
                <button className="btn btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{p.first_name} {p.last_name}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-sm" onClick={() => startEdit(p)}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => deletePlayer(p.id)}>✕</button>
                </div>
              </div>
            )}
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <input placeholder="First name" value={firstName} onChange={e => setFirstName(e.target.value)}
            style={{ flex: 1, padding: '6px 10px', border: '1px solid #ccc', borderRadius: 4 }} />
          <input placeholder="Last name" value={lastName} onChange={e => setLastName(e.target.value)}
            style={{ flex: 1, padding: '6px 10px', border: '1px solid #ccc', borderRadius: 4 }} />
          <button className="btn btn-primary btn-sm" onClick={addPlayer}>Add</button>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Import from league export</h3>
        <textarea
          value={importText}
          onChange={e => setImportText(e.target.value)}
          placeholder="Paste league export here…"
          rows={6}
          style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4, resize: 'vertical' }}
        />
        <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={importPlayers}>
          Import Players
        </button>
      </div>

      <div style={{ marginTop: 24 }}>
        <button className="btn btn-danger btn-sm" onClick={deleteRoster}>Delete Roster</button>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
