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
  const cols   = ['#5eead4', '#a78bfa', '#7dd3fc', '#86efac']
  const bgs    = ['#122822', '#1b1430', '#0f2030', '#12290f']
  const suit   = suits[s % 4]
  const col    = cols[s % 4]
  const bg     = bgs[s % 4]
  const ini    = (player.name || '?').slice(0, 2).toUpperCase()
  const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
<rect width="100" height="100" rx="30" fill="${bg}"/>
<text x="50" y="55" text-anchor="middle" font-size="34" fill="${col}" opacity="0.18" font-family="serif">${suit}</text>
<text x="50" y="62" text-anchor="middle" font-size="28" fill="${col}" font-weight="700" font-family="system-ui,sans-serif">${ini}</text>
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
        borderRadius: '30%',
        overflow: 'hidden',
        border: selected ? '2px solid var(--accent)' : '2px solid oklch(100% 0 0 / 7%)',
        boxShadow: selected
          ? '0 0 0 3px var(--accent-dim), 0 2px 8px oklch(0% 0 0 / 50%)'
          : '0 2px 8px oklch(0% 0 0 / 40%)',
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
