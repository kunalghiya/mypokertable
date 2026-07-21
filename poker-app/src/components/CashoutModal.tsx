import { useState, useEffect } from 'react'
import { Square, Check } from 'lucide-react'
import { Modal } from './Modal'
import { Avatar } from './Avatar'
import { Button } from './Button'
import { Settlement } from './Settlement'
import { useStore } from '../store'
import { rs, inr, fmtDate } from '../lib/utils'
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
      const msg = `Cashouts are ${sign} by ₹${Math.abs(totalOut - totalIn).toFixed(0)}.\n\nTotal buyins: ${inr(totalIn)}\nTotal cashouts: ${inr(totalOut)}\n\nSave anyway?`
      if (!confirm(msg)) return
    }
    await endSession(cashouts, notes, buyins)
    sfx.ding()
    toast('Session saved. Great game.')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="End session"
      icon={<Square size={17} strokeWidth={2.4} />}
      footer={
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="ghost" full onClick={onClose}>Cancel</Button>
          <Button variant="primary" style={{ flex: 2 }} onClick={handleSave}>Save &amp; end session</Button>
        </div>
      }
    >
      <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginBottom: 14 }}>
        {fmtDate(sess.date)} · {inr(buyinAmt)}/buyin
      </div>

      {/* Total on table */}
      <div className="panel" style={{
        borderColor: 'var(--accent-line)',
        padding: '13px 16px', marginBottom: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div className="label">Total on table</div>
        <div className="mono" style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)' }}>
          {inr(totalIn)}
        </div>
      </div>

      <div className="label accent" style={{ marginBottom: 10 }}>Cashout amounts</div>

      {pl.map(p => {
        const cnt = buyins[p.id] || 1
        const inv = cnt * buyinAmt
        const co = cashouts[p.id] || ''
        const pnl = co !== '' ? (Number(co) || 0) - inv : null
        return (
          <div key={p.id} className="row" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', marginBottom: 8 }}>
            <Avatar player={p} size="sm" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{p.name}</div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{cnt}× · {inr(inv)}</div>
            </div>
            <input
              type="number" inputMode="decimal" min="0" placeholder="0"
              value={co}
              onChange={e => setCashouts(prev => ({ ...prev, [p.id]: e.target.value }))}
              className="mono"
              style={{ width: 88, textAlign: 'center', fontSize: 14, fontWeight: 700 }}
            />
            <div className="mono" style={{ fontSize: 13, fontWeight: 700, minWidth: 68, textAlign: 'right', color: pnl === null ? 'var(--ink-3)' : pnl >= 0 ? 'var(--pos)' : 'var(--neg)' }}>
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
        background: balanced ? 'var(--accent-dim)' : 'var(--neg-dim)',
        border: `1px solid ${balanced ? 'var(--accent-line)' : 'var(--neg-line)'}`,
      }}>
        <span style={{ color: 'var(--ink-2)', fontWeight: 500 }}>Balance check</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: balanced ? 'var(--pos)' : 'var(--neg)', fontWeight: 700 }}>
          {balanced ? (<><Check size={14} strokeWidth={2.6} /> Balanced</>) : `Off by ₹${diff.toFixed(0)}`}
        </span>
      </div>

      <Settlement results={results} players={pl} households={households} />

      <div style={{ marginTop: 16 }}>
        <label className="label" style={{ marginBottom: 7 }}>Session notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Key observations…" style={{ height: 60 }} />
      </div>
    </Modal>
  )
}
