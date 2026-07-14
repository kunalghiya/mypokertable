import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Spade, Flame, Sparkles, ArrowRight } from 'lucide-react'
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

      {/* Ambient glow */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <motion.div
          animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', top: '12%', left: '50%', transform: 'translateX(-50%)', width: 480, height: 480, background: 'radial-gradient(circle, oklch(82% 0.16 163 / 6%) 0%, transparent 70%)', borderRadius: '50%' }}
        />
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          /* ── Loading screen ── */
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26 }}
          >
            {/* Dealing cards animation */}
            <div style={{ display: 'flex', gap: 8 }}>
              {SUITS.map((suit, i) => (
                <motion.div
                  key={suit}
                  initial={{ y: 24, opacity: 0, rotate: -8 }}
                  animate={{ y: [24, 0, 0, -6, 0], opacity: 1, rotate: 0 }}
                  transition={{ duration: 1.8, delay: i * 0.15, repeat: Infinity, repeatDelay: 1.2, ease: 'easeOut' }}
                  style={{
                    width: 42, height: 58, borderRadius: 8,
                    background: 'oklch(96% 0.005 90)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22,
                    color: suit === '♥' || suit === '♦' ? 'oklch(52% 0.2 25)' : 'oklch(20% 0.01 260)',
                    boxShadow: '0 4px 16px oklch(0% 0 0 / 45%)',
                  }}
                >
                  {suit}
                </motion.div>
              ))}
            </div>

            <div>
              <motion.div
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em', marginBottom: 8 }}
              >
                Connecting to Firebase…
              </motion.div>
              <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Setting up your table</div>
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
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: 68, height: 68, borderRadius: 22, margin: '0 auto 16px',
                background: 'var(--accent-dim)', border: '1px solid var(--accent-line)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--accent)',
              }}
            >
              <Spade size={30} strokeWidth={2} fill="currentColor" />
            </motion.div>

            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink)', marginBottom: 6, letterSpacing: '-0.035em' }}>
              My Poker Table
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.7, marginBottom: 30 }}>
              Paste your Firebase config once.<br />Saved in this browser forever.
            </div>

            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="panel"
              style={{ padding: 22, marginBottom: 14, textAlign: 'left', boxShadow: '0 8px 40px oklch(0% 0 0 / 35%)' }}
            >
              <div className="label accent" style={{ marginBottom: 10 }}><Flame size={12} strokeWidth={2.4} /> Step 1 · Firebase config</div>
              <p style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.7, marginBottom: 12 }}>
                Go to <strong style={{ color: 'var(--accent)' }}>console.firebase.google.com</strong><br />
                Your project → Project Settings → Web app → Config
              </p>
              <textarea
                value={raw} onChange={e => setRaw(e.target.value)}
                className="mono"
                style={{ height: 140, fontSize: 13, marginBottom: 12, borderRadius: 12 }}
                placeholder={'Paste the full firebaseConfig object:\n\n{\n  "apiKey": "AIza...",\n  "authDomain": "xxx.firebaseapp.com",\n  ...\n}'}
              />
              <Button variant="primary" full onClick={handleConnect}>
                Connect &amp; start <ArrowRight size={15} strokeWidth={2.4} />
              </Button>
              {err && <div style={{ color: 'var(--neg)', fontSize: 12.5, marginTop: 10, lineHeight: 1.5 }}>{err}</div>}
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="panel"
              style={{ padding: 22, textAlign: 'left', boxShadow: '0 8px 40px oklch(0% 0 0 / 35%)' }}
            >
              <div className="label" style={{ color: 'oklch(80% 0.12 300)', marginBottom: 10 }}><Sparkles size={12} strokeWidth={2.4} /> Step 2 · Claude AI key (optional)</div>
              <p style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.6, marginBottom: 10 }}>
                For automatic coaching after each session.<br />
                Get a key at <strong style={{ color: 'oklch(80% 0.12 300)' }}>console.anthropic.com</strong> → API Keys
              </p>
              <input type="password" value={aiKey} onChange={e => setAiKey(e.target.value)} placeholder="sk-ant-…" />
            </motion.div>

            <p style={{ fontSize: 11.5, color: 'var(--ink-4)', lineHeight: 1.6, marginTop: 16 }}>
              Your config is saved only in this browser.<br />On a new device, paste it once again.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
