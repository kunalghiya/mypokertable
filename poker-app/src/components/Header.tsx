import { useStore } from '../store'
import { Button } from './Button'

interface HeaderProps {
  onNewSession: () => void
}

export function Header({ onNewSession }: HeaderProps) {
  const syncState = useStore(s => s.syncState)
  const syncMsg = useStore(s => s.syncMsg)

  const dotColor = syncState === 'ok' ? 'var(--green)' : syncState === 'saving' ? 'var(--gold)' : 'var(--red)'

  return (
    <header style={{
      background: 'rgba(12,9,23,.96)',
      backdropFilter: 'blur(20px) saturate(160%)',
      WebkitBackdropFilter: 'blur(20px) saturate(160%)',
      borderBottom: '1px solid rgba(212,168,67,.07)',
      padding: 'calc(env(safe-area-inset-top) + 14px) 16px 0',
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontFamily: 'var(--fs)', fontSize: 20, fontWeight: 900, color: 'var(--t1)', letterSpacing: '-0.5px' }}>
          My<span style={{ color: 'var(--gold)' }}>Poker</span>Table
        </div>
        <Button variant="gold" size="sm" onClick={onNewSession}>
          + Session
        </Button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--t3)', paddingBottom: 8, fontWeight: 500 }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: dotColor,
          animation: syncState === 'saving' ? 'saveBlink .8s infinite' : 'none',
          boxShadow: syncState === 'ok' ? '0 0 6px var(--green)' : 'none',
        }} />
        <span>{syncMsg}</span>
      </div>
    </header>
  )
}
