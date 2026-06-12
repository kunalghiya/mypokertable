import { motion } from 'framer-motion'
import { useStore } from '../store'
import type { Tab } from '../lib/types'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'dashboard',   label: 'Home',    icon: '♠' },
  { id: 'live',        label: 'Live',    icon: '🎯' },
  { id: 'sessions',    label: 'Sessions',icon: '♦' },
  { id: 'leaderboard', label: 'Leaders', icon: '🏆' },
  { id: 'players',     label: 'Players', icon: '👤' },
  { id: 'settings',    label: 'Settings',icon: '⚙' },
]

export function BottomNav() {
  const tab = useStore(s => s.tab)
  const setTab = useStore(s => s.setTab)
  const hasActive = useStore(s => !!s.activeSessId)

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'rgba(7,5,15,.94)',
      backdropFilter: 'blur(24px) saturate(180%)',
      WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      borderTop: '1px solid rgba(212,168,67,.07)',
      display: 'flex', zIndex: 40,
      maxWidth: 430, margin: '0 auto',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {TABS.map(t => {
        const active = tab === t.id
        return (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', padding: '9px 4px 12px',
              border: 'none', background: 'none',
              color: active ? 'var(--gold)' : 'var(--t3)',
              cursor: 'pointer', fontFamily: 'var(--fb)',
              fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase',
              gap: 4, position: 'relative', fontWeight: 500,
              transition: 'color .18s',
            }}
          >
            {active && (
              <motion.div
                layoutId="nav-bg"
                style={{
                  position: 'absolute', top: 6, left: 6, right: 6, bottom: 10,
                  background: 'rgba(212,168,67,.08)',
                  borderRadius: 10, zIndex: -1,
                  boxShadow: 'inset 0 0 0 1px rgba(212,168,67,.12)',
                }}
                transition={{ type: 'spring', stiffness: 380, damping: 34 }}
              />
            )}
            {t.id === 'live' && hasActive && (
              <span style={{
                position: 'absolute', top: 6, right: 'calc(50% - 14px)',
                width: 7, height: 7, background: 'var(--red)',
                borderRadius: '50%',
                boxShadow: '0 0 6px var(--red)',
                animation: 'neonPulse 1.1s ease-in-out infinite',
              }} />
            )}
            <motion.span
              style={{ fontSize: 17, lineHeight: 1 }}
              animate={{ scale: active ? 1.12 : 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              {t.icon}
            </motion.span>
            {t.label}
          </button>
        )
      })}
    </nav>
  )
}
