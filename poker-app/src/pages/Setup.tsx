import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { parseConfig } from '../lib/firebase'
import { Button } from '../components/Button'

interface SetupProps {
  onConnect: (config: Record<string, string>, apiKey: string) => void
}

const SUITS = ['♠', '♥', '♦', '♣']

export function Setup({ onConnect }: SetupProps) {
  const [raw, setRaw] = useState('')
  const [aiKey, setAiKey] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const handleConnect = () => {
    setErr('')
    if (!raw.trim()) { setErr('Please paste your Firebase config first.'); return }
    try {
      const config = parseConfig(raw)
      if (!config.apiKey || !config.projectId) throw new Error('Config is missing apiKey or projectId.')
      setLoading(true)
      onConnect(config, aiKey.trim().startsWith('sk-ant') ? aiKey.trim() : '')
    } catch (e: any) {
      setErr('Could not read config: ' + e.message)
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center', background: 'var(--bg)', overflow: 'hidden' }}>

      {/* Ambient orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 500, background: 'radial-gradient(circle,rgba(155,93,229,.1) 0%,transparent 70%)', borderRadius: '50%' }}
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          style={{ position: 'absolute', bottom: '5%', right: '5%', width: 340, height: 340, background: 'radial-gradient(circle,rgba(212,168,67,.08) 0%,transparent 70%)', borderRadius: '50%' }}
        />
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          /* ── Loading screen ── */
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}
          >
            {/* Spinning card suits */}
            <div style={{ position: 'relative', width: 120, height: 120 }}>
              {SUITS.map((suit, i) => (
                <motion.div
                  key={suit}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: 'linear' }}
                  style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 32 + i * 4,
                    color: i % 2 === 0 ? 'var(--gold)' : 'var(--violet)',
                    opacity: 0.3 + i * 0.18,
                    filter: `blur(${i * 0.5}px)`,
                  }}
                >
                  {suit}
                </motion.div>
              ))}
              {/* Center spade */}
              <motion.div
                animate={{ scale: [0.9, 1.1, 0.9] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52, color: 'var(--gold)' }}
              >
                ♠
              </motion.div>
            </div>

            <div>
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                style={{ fontFamily: 'var(--fs)', fontSize: 20, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.3px', marginBottom: 8 }}
              >
                Connecting to Firebase…
              </motion.div>
              <div style={{ fontSize: 12, color: 'var(--t3)' }}>Setting up your table</div>
            </div>

            {/* Animated progress dots */}
            <div style={{ display: 'flex', gap: 8 }}>
              {[0, 1, 2, 3].map(i => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -10, 0], opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 }}
                  style={{ width: 8, height: 8, borderRadius: '50%', background: i % 2 === 0 ? 'var(--gold)' : 'var(--violet)' }}
                />
              ))}
            </div>
          </motion.div>
        ) : (
          /* ── Setup form ── */
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            style={{ width: '100%', maxWidth: 400, position: 'relative' }}
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              style={{ fontSize: 64, marginBottom: 12, color: 'var(--gold)', display: 'block' }}
            >
              ♠
            </motion.div>

            <div style={{ fontFamily: 'var(--fs)', fontSize: 30, fontWeight: 900, color: 'var(--t1)', marginBottom: 6, letterSpacing: '-0.5px' }}>
              MyPokerTable
            </div>
            <div style={{ fontSize: 13, color: 'var(--t3)', lineHeight: 1.7, marginBottom: 32 }}>
              Paste your Firebase config once.<br />Saved in this browser forever.
            </div>

            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 22, marginBottom: 14, textAlign: 'left', boxShadow: '0 8px 40px rgba(0,0,0,.4)' }}
            >
              <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 10, fontWeight: 600 }}>Step 1 — Firebase Config</div>
              <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.7, marginBottom: 12 }}>
                Go to <strong style={{ color: 'var(--gold)' }}>console.firebase.google.com</strong><br />
                Your project → Project Settings → Web app → Config
              </p>
              <textarea
                value={raw} onChange={e => setRaw(e.target.value)}
                style={{ height: 140, fontSize: 14, fontFamily: 'var(--fm)', marginBottom: 12, borderRadius: 12 }}
                placeholder={'Paste the full firebaseConfig object:\n\n{\n  "apiKey": "AIza...",\n  "authDomain": "xxx.firebaseapp.com",\n  ...\n}'}
              />
              <Button variant="gold" full onClick={handleConnect}>
                Connect & Start →
              </Button>
              {err && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 10, lineHeight: 1.5 }}>{err}</div>}
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 22, textAlign: 'left', boxShadow: '0 8px 40px rgba(0,0,0,.4)' }}
            >
              <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--violet)', marginBottom: 10, fontWeight: 600 }}>Step 2 — Claude AI Key (Optional)</div>
              <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.6, marginBottom: 10 }}>
                For automatic coaching after each session.<br />
                Get a key at <strong style={{ color: 'var(--violet)' }}>console.anthropic.com</strong> → API Keys
              </p>
              <input type="password" value={aiKey} onChange={e => setAiKey(e.target.value)} placeholder="sk-ant-…" />
            </motion.div>

            <p style={{ fontSize: 11, color: 'var(--t4)', lineHeight: 1.6, marginTop: 16 }}>
              Your config is saved only in this browser.<br />On a new device, paste it once again.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
