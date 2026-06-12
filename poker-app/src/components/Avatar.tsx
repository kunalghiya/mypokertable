import type { Player } from '../lib/types'

interface AvatarProps {
  player: Pick<Player, 'id' | 'name'>
  size?: 'sm' | 'md' | 'lg'
  selected?: boolean
  className?: string
}

const DIMS = { sm: 34, md: 44, lg: 58 }

// Players with real PNG avatars in /public/avatars/
const PNG_PLAYERS = new Set(['Kunal', 'Preetish', 'Pranav', 'Sakshi', 'Japneet', 'Golu', 'Lokesh', 'Navin', 'Tushar'])

function getAvatarSrc(player: Pick<Player, 'id' | 'name'>): string {
  const firstName = (player.name || '').trim().split(/\s+/)[0]
  if (PNG_PLAYERS.has(firstName)) {
    return `/avatars/${firstName}.png`
  }
  // Fallback: inline SVG initials for guests / unknown players
  let s = 0
  for (let i = 0; i < (player.id || '').length; i++) s += player.id.charCodeAt(i)
  const suits  = ['♠', '♥', '♦', '♣']
  const cols   = ['#d4a843', '#9b5de5', '#60a5fa', '#4ade80']
  const bgs    = ['#1a0f3a', '#1f0a1a', '#0a1020', '#0a1a0a']
  const suit   = suits[s % 4]
  const col    = cols[s % 4]
  const bg     = bgs[s % 4]
  const ini    = (player.name || '?').slice(0, 2).toUpperCase()
  const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
<rect width="100" height="100" rx="22" fill="${bg}"/>
<text x="50" y="55" text-anchor="middle" font-size="32" fill="${col}" opacity="0.2" font-family="serif">${suit}</text>
<text x="50" y="62" text-anchor="middle" font-size="28" fill="${col}" font-weight="700" font-family="system-ui,sans-serif">${ini}</text>
<rect width="100" height="100" rx="22" fill="none" stroke="${col}" stroke-width="1.2" opacity="0.18"/>
</svg>`
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.trim())
}

export function Avatar({ player, size = 'md', selected, className = '' }: AvatarProps) {
  const dim = DIMS[size]
  return (
    <div
      style={{
        width: dim,
        height: dim,
        flexShrink: 0,
        borderRadius: '22%',
        overflow: 'hidden',
        border: selected ? '2px solid var(--gold)' : '2px solid rgba(255,255,255,0.06)',
        boxShadow: selected
          ? '0 0 12px rgba(212,168,67,.55), 0 2px 8px rgba(0,0,0,.6)'
          : '0 2px 8px rgba(0,0,0,.5)',
        transition: 'border-color .18s, box-shadow .18s',
      }}
      className={className}
    >
      <img
        src={getAvatarSrc(player)}
        width={dim}
        height={dim}
        alt={player.name}
        style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
      />
    </div>
  )
}
