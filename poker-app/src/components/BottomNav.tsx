import { motion } from 'framer-motion'
import { House, Spade, Trophy, Users, SlidersHorizontal } from 'lucide-react'
import { useStore } from '../store'
import type { Tab } from '../lib/types'

const TABS: { id: Tab; label: string; Icon: typeof House }[] = [
  { id: 'dashboard',   label: 'Home',     Icon: House },
  { id: 'live',        label: 'Sessions', Icon: Spade },
  { id: 'leaderboard', label: 'Leaders',  Icon: Trophy },
  { id: 'players',     label: 'Players',  Icon: Users },
  { id: 'settings',    label: 'More',     Icon: SlidersHorizontal },
]

export function BottomNav() {
  const tab    = useStore(s => s.tab)
  const setTab = useStore(s => s.setTab)
  const hasActive = useStore(s => !!s.activeSessId)

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'oklch(15% 0.012 170 / 90%)',
      backdropFilter: 'blur(28px) saturate(180%)',
      WebkitBackdropFilter: 'blur(28px) saturate(180%)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      zIndex: 'var(--z-nav)' as any,
      maxWidth: 430, margin: '0 auto',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {TABS.map(({ id, label, Icon }) => {
        const active = tab === id
        return (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', padding: '9px 2px 10px',
              border: 'none', background: 'none',
              color: active ? 'var(--accent)' : 'var(--ink-3)',
              cursor: 'pointer', fontFamily: 'var(--fb)',
              fontSize: 10, letterSpacing: '0.01em',
              gap: 4, position: 'relative', fontWeight: active ? 600 : 500,
              transition: 'color .18s',
            }}
          >
            {active && (
              <motion.div
                layoutId="nav-pill"
                style={{
                  position: 'absolute', top: 5, left: 8, right: 8, bottom: 6,
                  background: 'var(--accent-dim)',
                  borderRadius: 13, zIndex: -1,
                }}
                transition={{ type: 'spring', stiffness: 450, damping: 38 }}
              />
            )}
            {/* Live indicator on Sessions tab */}
            {id === 'live' && hasActive && (
              <span className="live-dot" style={{
                position: 'absolute', top: 8, right: 'calc(50% - 17px)',
                width: 6, height: 6,
              }} />
            )}
            <motion.div
              animate={{ scale: active ? 1.08 : 1, y: active ? -1 : 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              style={{ display: 'flex' }}
            >
              <Icon
                size={21}
                strokeWidth={active ? 2.3 : 1.9}
                fill={active && (id === 'live' || id === 'dashboard') ? 'var(--accent-dim)' : 'none'}
              />
            </motion.div>
            <span style={{ lineHeight: 1 }}>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
