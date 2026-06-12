import { useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { deleteAllFinishedSessions } from '../lib/firebase'
import { toast } from '../components/Toast'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 340, damping: 28 } } }

export function Settings() {
  const players = useStore(s => s.players)
  const households = useStore(s => s.households)
  const apiKey = useStore(s => s.apiKey)
  const setHouseholds = useStore(s => s.setHouseholds)
  const setApiKey = useStore(s => s.setApiKey)
  const resetConfig = useStore(s => s.resetConfig)
  const setSync = useStore(s => s.setSync)

  const [hhA, setHhA] = useState('')
  const [hhB, setHhB] = useState('')
  const [newKey, setNewKey] = useState(apiKey)

  const addHousehold = () => {
    if (!hhA || !hhB) { alert('Pick two players.'); return }
    if (hhA === hhB) { alert('Pick two different players.'); return }
    const already = households.some(p => p[0] === hhA || p[1] === hhA || p[0] === hhB || p[1] === hhB)
    if (already) { alert('One of those players is already in a pair. Remove them first.'); return }
    setHouseholds([...households, [hhA, hhB]])
    setHhA(''); setHhB('')
  }

  const saveKey = () => {
    if (newKey.trim().startsWith('sk-ant')) {
      setApiKey(newKey.trim())
      toast('AI key saved! Coaching is now active.', '⚡')
    } else {
      alert('Key must start with sk-ant-')
    }
  }

  const pOpts = <><option value="">Select player…</option>{players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</>

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ padding: '14px 14px 0' }}>

      {/* Household Pairs */}
      <motion.div variants={item}>
        <Card>
          <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 12, fontWeight: 600 }}>🏠 Household Pairs</div>
          <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6, marginBottom: 12 }}>
            Couples who don't actually exchange cash. Their P&L is netted internally, then only the household's combined position enters wider settlement.
          </p>
          {households.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--t3)', fontStyle: 'italic', marginBottom: 10 }}>No pairs yet</div>
          )}
          {households.map((pair, i) => {
            const a = players.find(p => p.id === pair[0])
            const b = players.find(p => p.id === pair[1])
            if (!a || !b) return null
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, background: 'rgba(212,168,67,.07)', border: '1px solid rgba(212,168,67,.22)', borderRadius: 10, padding: '10px 12px' }}>
                <span style={{ flex: 1, fontSize: 14, color: 'var(--t1)', fontWeight: 600 }}>🏠 {a.name} & {b.name}</span>
                <Button variant="ghost" size="sm" onClick={() => setHouseholds(households.filter((_, idx) => idx !== i))}>Remove</Button>
              </div>
            )
          })}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            <select value={hhA} onChange={e => setHhA(e.target.value)} style={{ fontSize: 14 }}>{pOpts}</select>
            <select value={hhB} onChange={e => setHhB(e.target.value)} style={{ fontSize: 14 }}>{pOpts}</select>
            <Button variant="gold" full onClick={addHousehold}>+ Add Pair</Button>
          </div>
        </Card>
      </motion.div>

      {/* AI Key */}
      <motion.div variants={item}>
        <Card>
          <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 12, fontWeight: 600 }}>⚡ Claude AI Key</div>
          <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6, marginBottom: 12 }}>
            For automatic player profiling and session coaching after every game.
            Get a free key at <strong style={{ color: 'var(--gold)' }}>console.anthropic.com</strong> → API Keys → Create Key.
          </p>
          {apiKey
            ? <div style={{ fontSize: 12, color: 'var(--green)', marginBottom: 10 }}>✓ AI key connected</div>
            : <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 10 }}>✕ No key — add below</div>
          }
          <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <input type="password" value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="sk-ant-…" style={{ flex: 1 }} />
            <Button variant="gold" onClick={saveKey} style={{ whiteSpace: 'nowrap' }}>Save</Button>
          </div>
        </Card>
      </motion.div>

      {/* Firebase */}
      <motion.div variants={item}>
        <Card>
          <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 12, fontWeight: 600 }}>🔥 Firebase</div>
          <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6, marginBottom: 12 }}>
            To connect a different Firebase project, reset and paste a new config.
          </p>
          <Button variant="ghost" full onClick={() => { if (confirm('Clear Firebase config? Your data in Firebase is safe.')) resetConfig() }}>
            Reset Firebase Config
          </Button>
        </Card>
      </motion.div>

      {/* Danger Zone */}
      <motion.div variants={item}>
        <Card>
          <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: 12, fontWeight: 600 }}>Danger Zone</div>
          <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6, marginBottom: 12 }}>
            Delete all finished sessions from Firebase. Cannot be undone.
          </p>
          <Button variant="danger" full onClick={async () => {
            if (!confirm('Delete all finished sessions? Cannot be undone.')) return
            setSync('saving', 'Deleting…')
            await deleteAllFinishedSessions()
            setSync('ok')
            toast('All sessions cleared.', '🗑')
          }}>
            Clear All Finished Sessions
          </Button>
        </Card>
      </motion.div>

    </motion.div>
  )
}
