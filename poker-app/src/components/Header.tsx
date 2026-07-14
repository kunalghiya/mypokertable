import { Plus, Spade } from 'lucide-react'
import { motion } from 'framer-motion'
import { useStore } from '../store'

interface HeaderProps {
  onNewSession: () => void
}

export function Header({ onNewSession }: HeaderProps) {
  const syncState = useStore(s => s.syncState)
  const syncMsg = useStore(s => s.syncMsg)

  const dotColor = syncState === 'ok' ? 'var(--accent)' : syncState === 'saving' ? 'var(--live)' : 'var(--neg)'

  return (
    <header style={{
      background: 'oklch(15% 0.012 170 / 88%)',
      backdropFilter: 'blur(20px) saturate(160%)',
      WebkitBackdropFilter: 'blur(20px) saturate(160%)',
      borderBottom: '1px solid var(--border)',
      padding: 'calc(env(safe-area-inset-top) + 12px) 16px 12px',
      position: 'sticky', top: 0,
      zIndex: 'var(--z-header)' as any,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 9,
          background: 'var(--accent-dim)',
          border: '1px solid var(--accent-line)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--accent)',
        }}>
          <Spade size={15} strokeWidth={2.2} fill="currentColor" />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            My Poker Table
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%', flexShrink: 0, background: dotColor,
              animation: syncState === 'saving' ? 'saveBlink .8s infinite' : 'none',
            }} />
            <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
              {syncMsg}
            </span>
          </div>
        </div>
      </div>

      <motion.button
        onClick={onNewSession}
        whileTap={{ scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: 'var(--accent-strong)', color: 'var(--accent-ink)',
          border: 'none', borderRadius: 12, padding: '9px 14px',
          fontSize: 13, fontWeight: 700, cursor: 'pointer',
          fontFamily: 'var(--fb)', letterSpacing: '-0.01em',
          boxShadow: '0 2px 14px oklch(74% 0.155 163 / 22%)',
        }}
      >
        <Plus size={15} strokeWidth={2.6} /> Session
      </motion.button>
    </header>
  )
}
