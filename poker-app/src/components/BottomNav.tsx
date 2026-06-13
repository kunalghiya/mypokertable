import { motion } from 'framer-motion'
import { useStore } from '../store'
import type { Tab } from '../lib/types'

// ── Premium monoline SVG icons — 28×28 viewport, 1.6px stroke ─────────────

function IconHome({ active }: { active: boolean }) {
  const c = active ? '#d4a843' : '#6b6480'
  return (
    <svg width="24" height="24" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Card outline */}
      <rect x="4" y="3" width="20" height="22" rx="3" stroke={c} strokeWidth="1.55" fill={active ? 'rgba(212,168,67,0.08)' : 'none'} />
      {/* Filled spade in center */}
      <path
        d="M14 7.5 C14 7.5 9 11.5 9 14.5 C9 16.2 10.3 17 11.7 16.4 C11.1 17.7 10.2 18.3 9.5 18.5 L18.5 18.5 C17.8 18.3 16.9 17.7 16.3 16.4 C17.7 17 19 16.2 19 14.5 C19 11.5 14 7.5 14 7.5Z"
        fill={c}
      />
      {/* Corner A top-left */}
      <text x="5.5" y="10" fontSize="4.5" fill={c} fontFamily="Georgia,serif" fontWeight="700">A</text>
      {/* Corner A bottom-right (rotated) */}
      <text x="22.5" y="21" fontSize="4.5" fill={c} fontFamily="Georgia,serif" fontWeight="700" textAnchor="middle" transform="rotate(180 21 19.5)">A</text>
    </svg>
  )
}


function IconSessions({ active }: { active: boolean }) {
  const c = active ? '#d4a843' : '#6b6480'
  return (
    <svg width="24" height="24" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Back card */}
      <rect x="10" y="5" width="14" height="19" rx="2.5"
        stroke={c} strokeWidth="1.5" opacity="0.45"
        fill={active ? 'rgba(212,168,67,0.06)' : 'none'}
        transform="rotate(8 17 14.5)"
      />
      {/* Front card */}
      <rect x="4" y="6" width="14" height="19" rx="2.5"
        stroke={c} strokeWidth="1.55"
        fill={active ? 'rgba(212,168,67,0.1)' : 'rgba(7,5,15,0.8)'}
      />
      {/* Spade on front card */}
      <path
        d="M11 13.5 C11 13.5 7.8 16 7.8 18 C7.8 19.1 8.7 19.7 9.7 19.3 C9.3 20.2 8.7 20.6 8.1 20.8 L13.9 20.8 C13.3 20.6 12.7 20.2 12.3 19.3 C13.3 19.7 14.2 19.1 14.2 18 C14.2 16 11 13.5 11 13.5Z"
        fill={c} opacity="0.9"
      />
      {/* Corner A */}
      <text x="5.5" y="12.5" fontSize="5.5" fill={c} fontFamily="Georgia,serif" fontWeight="700" opacity="0.9">A</text>
    </svg>
  )
}

function IconPlayers({ active }: { active: boolean }) {
  const c = active ? '#d4a843' : '#6b6480'
  return (
    <svg width="24" height="24" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Left player — slightly behind */}
      <circle cx="10.5" cy="10" r="3.5" stroke={c} strokeWidth="1.45" opacity="0.6"/>
      <path d="M3.5 23 C3.5 19 6.5 16.5 10.5 16.5" stroke={c} strokeWidth="1.45" strokeLinecap="round" opacity="0.6"/>
      {/* Right player — slightly behind */}
      <circle cx="17.5" cy="10" r="3.5" stroke={c} strokeWidth="1.45" opacity="0.6"/>
      <path d="M24.5 23 C24.5 19 21.5 16.5 17.5 16.5" stroke={c} strokeWidth="1.45" strokeLinecap="round" opacity="0.6"/>
      {/* Center player — foreground */}
      <circle cx="14" cy="9" r="4" stroke={c} strokeWidth="1.6" fill={active ? 'rgba(212,168,67,0.1)' : 'rgba(7,5,15,0.9)'}/>
      <path d="M6 24 C6 19.5 9.5 16.5 14 16.5 C18.5 16.5 22 19.5 22 24" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
      {/* Table arc — subtle curved line suggesting a poker table edge */}
      <path d="M4 26 Q14 24.5 24 26" stroke={c} strokeWidth="1" strokeLinecap="round" opacity="0.35"/>
    </svg>
  )
}

function IconLeaders({ active }: { active: boolean }) {
  const c = active ? '#d4a843' : '#6b6480'
  return (
    <svg width="24" height="24" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Trophy cup body */}
      <path
        d="M9 5 L19 5 L18 14 C18 17 16.2 18.5 14 18.5 C11.8 18.5 10 17 10 14 Z"
        stroke={c} strokeWidth="1.55" strokeLinejoin="round"
        fill={active ? 'rgba(212,168,67,0.1)' : 'none'}
      />
      {/* Trophy handles */}
      <path d="M9 7.5 C9 7.5 6 8 6 11 C6 13 7.5 13.5 9 13" stroke={c} strokeWidth="1.45" strokeLinecap="round" fill="none"/>
      <path d="M19 7.5 C19 7.5 22 8 22 11 C22 13 20.5 13.5 19 13" stroke={c} strokeWidth="1.45" strokeLinecap="round" fill="none"/>
      {/* Stem */}
      <path d="M14 18.5 L14 21.5" stroke={c} strokeWidth="1.55" strokeLinecap="round"/>
      {/* Base platform */}
      <path d="M10 21.5 L18 21.5" stroke={c} strokeWidth="1.55" strokeLinecap="round"/>
      <path d="M8.5 23.5 L19.5 23.5" stroke={c} strokeWidth="1.55" strokeLinecap="round"/>
      {/* Star on cup */}
      <path d="M14 8.5 L14.6 10.3 L16.5 10.3 L15 11.4 L15.6 13.2 L14 12.1 L12.4 13.2 L13 11.4 L11.5 10.3 L13.4 10.3Z"
        fill={c} opacity={active ? 0.9 : 0.5}
      />
    </svg>
  )
}

function IconSettings({ active }: { active: boolean }) {
  const c = active ? '#d4a843' : '#6b6480'
  return (
    <svg width="24" height="24" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Three elegant horizontal dots */}
      <circle cx="8"  cy="14" r="2" fill={c}/>
      <circle cx="14" cy="14" r="2" fill={c}/>
      <circle cx="20" cy="14" r="2" fill={c}/>
    </svg>
  )
}

// ── Tab config ──────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; Icon: React.FC<{ active: boolean }> }[] = [
  { id: 'dashboard',   label: 'Home',     Icon: IconHome },
  { id: 'live',        label: 'Sessions', Icon: IconSessions },
  { id: 'leaderboard', label: 'Leaders',  Icon: IconLeaders },
  { id: 'players',     label: 'Players',  Icon: IconPlayers },
  { id: 'settings',    label: 'More',     Icon: IconSettings },
]

export function BottomNav() {
  const tab    = useStore(s => s.tab)
  const setTab = useStore(s => s.setTab)
  const hasActive = useStore(s => !!s.activeSessId)

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'rgba(7,5,15,.96)',
      backdropFilter: 'blur(28px) saturate(200%)',
      WebkitBackdropFilter: 'blur(28px) saturate(200%)',
      borderTop: '1px solid rgba(212,168,67,.07)',
      display: 'flex', zIndex: 40,
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
              justifyContent: 'center', padding: '8px 2px 11px',
              border: 'none', background: 'none',
              color: active ? 'var(--gold)' : 'var(--t3)',
              cursor: 'pointer', fontFamily: 'var(--fb)',
              fontSize: 9, letterSpacing: '0.07em', textTransform: 'uppercase',
              gap: 3, position: 'relative', fontWeight: active ? 600 : 400,
              transition: 'color .18s',
            }}
          >
            {/* Active glow pill */}
            {active && (
              <motion.div
                layoutId="nav-bg"
                style={{
                  position: 'absolute', top: 5, left: 4, right: 4, bottom: 8,
                  background: 'rgba(212,168,67,.07)',
                  borderRadius: 12, zIndex: -1,
                  boxShadow: 'inset 0 0 0 1px rgba(212,168,67,.1)',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 36 }}
              />
            )}
            {/* Live session red dot — shown on Sessions tab when a game is running */}
            {id === 'live' && hasActive && (
              <span style={{
                position: 'absolute', top: 5, right: 'calc(50% - 16px)',
                width: 6, height: 6, background: '#ff3355',
                borderRadius: '50%', boxShadow: '0 0 6px #ff3355',
                animation: 'neonPulse 1.1s ease-in-out infinite',
              }} />
            )}
            {/* Icon */}
            <motion.div
              animate={{ scale: active ? 1.1 : 1, y: active ? -1 : 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            >
              <Icon active={active} />
            </motion.div>
            {/* Label */}
            <span style={{ lineHeight: 1 }}>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
