import { useState, useEffect } from 'react'
import { Modal } from './Modal'
import { Avatar } from './Avatar'
import { Button } from './Button'
import { Settlement } from './Settlement'
import { useStore } from '../store'
import { rs } from '../lib/utils'
import { toast } from './Toast'
import { sfx } from '../lib/sounds'

interface CashoutModalProps {
  open: boolean
  onClose: () => void
  forceSessId?: string | null
}

export function CashoutModal({ open, onClose, forceSessId }: CashoutModalProps) {
  const sessions = useStore(s => s.sessions)
  const activeSessId = useStore(s => s.activeSessId)
  const liveBuyins = useStore(s => s.liveBuyins)
  const households = useStore(s => s.households)
  const endSession = useStore(s => s.endSession)

  const sessId = forceSessId || activeSessId
  const sess = sessions.find(s => s.id === sessId)
  const pl = sess?.players || []
  const buyinAmt = sess?.buyinAmt || 500
  const buyins = sessId === activeSessId ? liveBuyins : (sess?.buyins || {})

  const [cashouts, setCashouts] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (open && pl.length) {
      const init: Record<string, string> = {}
      pl.forEach(p => { init[p.id] = '' })
      setCashouts(init)
      setNotes('')
    }
  }, [open, sessId])

  if (!sess) return null

  const totalIn = pl.reduce((s, p) => s + (buyins[p.id] || 1) * buyinAmt, 0)
  const totalOut = pl.reduce((s, p) => s + (Number(cashouts[p.id]) || 0), 0)
  const diff = Math.abs(totalOut - totalIn)
  const balanced = diff < 1

  const results: Record<string, number> = {}
  pl.forEach(p => { results[p.id] = (Number(cashouts[p.id]) || 0) - (buyins[p.id] || 1) * buyinAmt })

  const handleSave = async () => {
    if (!balanced) {
      const sign = totalOut > totalIn ? 'over' : 'under'
      const msg = `⚠️ Cashouts are ${sign} by Rs.${Math.abs(totalOut - totalIn).toFixed(0)}.\n\nTotal buyins: Rs.${totalIn.toLocaleString('en-IN')}\nTotal cashouts: Rs.${totalOut.toLocaleString('en-IN')}\n\nSave anyway?`
      if (!confirm(msg)) return
    }
    await endSession(cashouts, notes)
    sfx.ding()
    toast('Session saved! Great game.', '✓')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="⏹ End Session">
      <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 14 }}>
        {sess.date} · Rs.{buyinAmt}/buyin
      </div>

      <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 10, fontWeight: 600 }}>Cashout Amounts</div>

      {pl.map(p => {
        const cnt = buyins[p.id] || 1
        const inv = cnt * buyinAmt
        const co = cashouts[p.id] || ''
        const pnl = co !== '' ? (Number(co) || 0) - inv : null
        return (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', background: 'rgba(0,0,0,.2)', border: '1px solid var(--border)', borderRadius: 14, marginBottom: 8 }}>
            <Avatar player={p} size="sm" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{p.name}</div>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>{cnt}× · Rs.{inv.toLocaleString('en-IN')}</div>
            </div>
            <input
              type="number" inputMode="decimal" min="0" placeholder="0"
              value={co}
              onChange={e => setCashouts(prev => ({ ...prev, [p.id]: e.target.value }))}
              style={{ width: 90, textAlign: 'center', fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
            />
            <div style={{ fontSize: 13, fontWeight: 700, minWidth: 70, textAlign: 'right', color: pnl === null ? 'var(--t3)' : pnl >= 0 ? 'var(--green)' : 'var(--red)', fontVariantNumeric: 'tabular-nums' }}>
              {pnl !== null ? rs(pnl) : ''}
            </div>
          </div>
        )
      })}

      {/* Balance check */}
      <div style={{
        borderRadius: 12, padding: '11px 14px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: 13, marginBottom: 10,
        background: balanced ? 'rgba(0,232,122,.08)' : 'rgba(255,51,85,.08)',
        border: `1px solid ${balanced ? 'rgba(0,232,122,.25)' : 'rgba(255,51,85,.25)'}`,
      }}>
        <span style={{ color: 'var(--t2)' }}>Balance Check</span>
        <span style={{ color: balanced ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
          {balanced ? '✓ Balanced' : `Off by Rs.${diff.toFixed(0)}`}
        </span>
      </div>

      <Settlement results={results} players={pl} households={households} />

      <div style={{ marginTop: 14 }}>
        <label style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--t3)', display: 'block', marginBottom: 6, fontWeight: 600 }}>Session Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Key observations…" style={{ height: 60 }} />
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        <Button variant="ghost" full onClick={onClose}>Cancel</Button>
        <Button variant="gold" style={{ flex: 2 }} onClick={handleSave}>Save & End Session</Button>
      </div>
    </Modal>
  )
}
