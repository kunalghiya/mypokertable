import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Spade, X, UserPlus, ArrowRight, Play } from 'lucide-react'
import { Modal } from './Modal'
import { Avatar } from './Avatar'
import { Button } from './Button'
import { useStore } from '../store'
import { fmtDate } from '../lib/utils'
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

  // Re-seed defaults each time the sheet opens (players load async)
  useEffect(() => {
    if (open) {
      setSelectedIds(players.map(p => p.id))
      setDate(new Date().toISOString().split('T')[0])
    }
  }, [open])

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
      <Modal open={open} onClose={onClose} title="Active session" icon={<Spade size={18} strokeWidth={2.2} fill="currentColor" />}>
        <p style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.6, marginBottom: 20 }}>
          A session from {fmtDate(existing?.date || '')} is already in progress.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="ghost" full onClick={onClose}>Cancel</Button>
          <Button variant="primary" full onClick={() => { setTab('live'); onClose() }}>Go to live <ArrowRight size={15} strokeWidth={2.4} /></Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal open={open} onClose={onClose} title="Start session" icon={<Spade size={18} strokeWidth={2.2} fill="currentColor" />}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <div>
          <label className="label" style={{ marginBottom: 7 }}>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div>
          <label className="label" style={{ marginBottom: 7 }}>Buyin ₹</label>
          <input type="number" inputMode="numeric" value={buyinAmt} onChange={e => setBuyinAmt(Number(e.target.value) || 500)} className="mono" />
        </div>
      </div>

      <div className="label accent" style={{ marginBottom: 10 }}>Who is playing today?</div>

      {players.map(p => {
        const on = selectedIds.includes(p.id)
        return (
          <motion.div
            key={p.id}
            onClick={() => toggle(p.id)}
            whileTap={{ scale: 0.97 }}
            className="row"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 13px', marginBottom: 8, cursor: 'pointer',
              borderColor: on ? 'var(--accent-line)' : 'var(--border)',
              background: on ? 'var(--accent-dim)' : 'oklch(0% 0 0 / 18%)',
              transition: 'background .18s, border-color .18s, opacity .18s',
              opacity: on ? 1 : 0.55,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar player={p} size="sm" />
              <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{p.name}</span>
            </div>
            <div className={`toggle ${on ? 'on' : ''}`} />
          </motion.div>
        )
      })}

      {guests.map((g, i) => (
        <div key={i} className="row" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, padding: '9px 13px', borderColor: 'oklch(75% 0.14 300 / 25%)', background: 'oklch(75% 0.14 300 / 7%)' }}>
          <span style={{ fontSize: 13, color: 'var(--ink)', flex: 1, fontWeight: 500 }}>{g} <span style={{ color: 'var(--ink-3)', fontWeight: 400 }}>(guest)</span></span>
          <button onClick={() => setGuests(prev => prev.filter((_, idx) => idx !== i))} aria-label={`Remove ${g}`}
            style={{ background: 'none', border: 'none', color: 'var(--ink-3)', cursor: 'pointer', display: 'flex' }}><X size={15} strokeWidth={2.2} /></button>
        </div>
      ))}

      <div style={{ marginTop: 8, marginBottom: 8 }}>
        {showGuestInput ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="text" value={guestInput} onChange={e => setGuestInput(e.target.value)} placeholder="Guest name…" autoFocus onKeyDown={e => e.key === 'Enter' && addGuest()} style={{ flex: 1 }} />
            <Button variant="primary" onClick={addGuest} style={{ whiteSpace: 'nowrap' }}>Add</Button>
            <Button variant="ghost" onClick={() => setShowGuestInput(false)} aria-label="Cancel guest"><X size={15} strokeWidth={2.2} /></Button>
          </div>
        ) : (
          <Button variant="dashed" onClick={() => setShowGuestInput(true)} style={{ borderRadius: 12 }}>
            <UserPlus size={15} strokeWidth={2.2} /> Add guest player
          </Button>
        )}
      </div>

      {/* Sticky footer — always visible regardless of scroll position */}
      <div style={{
        position: 'sticky', bottom: 0,
        background: 'var(--sheet)',
        paddingTop: 12, paddingBottom: 4,
        marginTop: 10,
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</Button>
          <Button variant="primary" style={{ flex: 2 }} onClick={handleStart}><Play size={15} strokeWidth={2.4} /> Start session</Button>
        </div>
      </div>
    </Modal>
  )
}
