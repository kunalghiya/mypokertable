import { useState } from 'react'
import { motion } from 'framer-motion'
import { Modal } from './Modal'
import { Avatar } from './Avatar'
import { Button } from './Button'
import { useStore } from '../store'
import { sfx } from '../lib/sounds'

interface StartSessionModalProps {
  open: boolean
  onClose: () => void
}

export function StartSessionModal({ open, onClose }: StartSessionModalProps) {
  const players = useStore(s => s.players)
  const activeSessId = useStore(s => s.activeSessId)
  const sessions = useStore(s => s.sessions)
  const startSession = useStore(s => s.startSession)
  const setTab = useStore(s => s.setTab)

  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [buyinAmt, setBuyinAmt] = useState(500)
  const [selectedIds, setSelectedIds] = useState<string[]>(players.map(p => p.id))
  const [guests, setGuests] = useState<string[]>([])
  const [guestInput, setGuestInput] = useState('')
  const [showGuestInput, setShowGuestInput] = useState(false)

  const toggle = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    sfx.rebuy()
  }

  const addGuest = () => {
    const n = guestInput.trim()
    if (n) { setGuests(prev => [...prev, n]); setGuestInput(''); setShowGuestInput(false) }
  }

  const handleStart = async () => {
    if (!selectedIds.length && !guests.length) { alert('Select at least one player.'); return }
    onClose()
    await startSession({ date, buyinAmt, playerIds: selectedIds, guests })
    sfx.shuffle()
    setTab('live')
  }

  if (activeSessId) {
    const existing = sessions.find(s => s.id === activeSessId)
    return (
      <Modal open={open} onClose={onClose} title="♠ Active Session">
        <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6, marginBottom: 20 }}>
          A session from {existing?.date} is already in progress.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="ghost" full onClick={onClose}>Cancel</Button>
          <Button variant="gold" full onClick={() => { setTab('live'); onClose() }}>Go to Live →</Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal open={open} onClose={onClose} title="♠ Start Session">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <div>
          <label style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--t3)', display: 'block', marginBottom: 6, fontWeight: 600 }}>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--t3)', display: 'block', marginBottom: 6, fontWeight: 600 }}>Buyin Rs.</label>
          <input type="number" value={buyinAmt} onChange={e => setBuyinAmt(Number(e.target.value) || 500)} />
        </div>
      </div>

      <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 10, fontWeight: 600 }}>Who is playing today?</div>

      {players.map(p => {
        const on = selectedIds.includes(p.id)
        return (
          <motion.div
            key={p.id}
            onClick={() => toggle(p.id)}
            whileTap={{ scale: 0.97 }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '11px 14px', border: `1px solid ${on ? 'rgba(212,168,67,.35)' : 'var(--border)'}`,
              borderRadius: 12, marginBottom: 8, cursor: 'pointer',
              background: on ? 'rgba(212,168,67,.07)' : 'rgba(0,0,0,.2)',
              transition: 'background .18s, border-color .18s',
              opacity: on ? 1 : 0.55,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar player={p} size="sm" />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{p.name}</span>
            </div>
            <div className={`toggle ${on ? 'on' : ''}`} />
          </motion.div>
        )
      })}

      {guests.map((g, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, background: 'rgba(155,93,229,.07)', border: '1px solid rgba(155,93,229,.2)', borderRadius: 10, padding: '8px 12px' }}>
          <span style={{ fontSize: 13, color: 'var(--t1)', flex: 1 }}>{g}</span>
          <button onClick={() => setGuests(prev => prev.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', fontSize: 14 }}>✕</button>
        </div>
      ))}

      <div style={{ marginTop: 8, marginBottom: 14 }}>
        {showGuestInput ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="text" value={guestInput} onChange={e => setGuestInput(e.target.value)} placeholder="Guest name…" autoFocus onKeyDown={e => e.key === 'Enter' && addGuest()} style={{ flex: 1 }} />
            <Button variant="gold" onClick={addGuest} style={{ whiteSpace: 'nowrap' }}>Add</Button>
            <Button variant="ghost" onClick={() => setShowGuestInput(false)}>✕</Button>
          </div>
        ) : (
          <button onClick={() => setShowGuestInput(true)} style={{ background: 'none', border: '1.5px dashed var(--border)', color: 'var(--t3)', width: '100%', padding: 11, fontSize: 13, borderRadius: 12, fontFamily: 'var(--fb)', cursor: 'pointer', transition: '.18s' }}>
            + Add Guest Player
          </button>
        )}
      </div>

      <div style={{ background: 'rgba(212,168,67,.07)', border: '1px solid rgba(212,168,67,.18)', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 12, color: 'var(--t2)', lineHeight: 1.6 }}>
        ℹ After starting go to <strong style={{ color: 'var(--gold)' }}>Live tab</strong> to log hands & rebuys.
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <Button variant="ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</Button>
        <Button variant="gold" style={{ flex: 2 }} onClick={handleStart}>🎯 Start Session</Button>
      </div>
    </Modal>
  )
}
