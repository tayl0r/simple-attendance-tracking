import { useState } from 'react'
import type { Player } from '../types'

interface Props {
  players: Player[]
  initialSelected: string[]
  onSave: (ids: string[]) => void
}

export default function PlayerPickerModal({ players, initialSelected, onSave }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected))

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}>
      <div style={{ background: 'white', padding: 24, borderRadius: 12, minWidth: 300, maxWidth: 400, width: '90%' }}>
        <h2 style={{ marginTop: 0 }}>Who are you tracking?</h2>
        <p style={{ color: '#555', fontSize: 14 }}>Select all players you want to record attendance for.</p>
        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
          {players.map(p => (
            <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={selected.has(p.id)}
                onChange={() => toggle(p.id)}
                style={{ width: 18, height: 18 }}
              />
              <span>{p.first_name} {p.last_name}</span>
            </label>
          ))}
        </div>
        {players.length === 0 && (
          <p style={{ color: '#888', fontSize: 14 }}>No players found. Ask the admin to attach a roster to this schedule.</p>
        )}
        <button
          className="btn btn-primary"
          style={{ width: '100%', marginTop: 16 }}
          disabled={selected.size === 0}
          onClick={() => onSave([...selected])}
        >
          Done
        </button>
      </div>
    </div>
  )
}
