import type { Player } from '../lib/types'

interface AvatarProps {
  player: Pick<Player, 'id' | 'name'>
  size?: 'sm' | 'md' | 'lg'
  selected?: boolean
  className?: string
}

const DIMS = { sm: 34, md: 44, lg: 58 }

// ── Player character definitions ─────────────────────────────────────────
// Illustrated style: dark casino background, clean face anatomy, character prop

// Kunal — The Gambit. Dark hoodie, holding Ace of Spades, sharp eyes.
function svgKunal() {
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
<defs>
  <radialGradient id="k-sky" cx="50%" cy="30%" r="70%">
    <stop offset="0%" stop-color="#1c1035"/>
    <stop offset="100%" stop-color="#06040e"/>
  </radialGradient>
  <radialGradient id="k-skin" cx="50%" cy="35%" r="60%">
    <stop offset="0%" stop-color="#d4956a"/>
    <stop offset="100%" stop-color="#a96a3a"/>
  </radialGradient>
</defs>
<!-- BG -->
<rect width="100" height="100" rx="22" fill="url(#k-sky)"/>
<!-- Ambient light from below (casino table glow) -->
<ellipse cx="50" cy="105" rx="55" ry="30" fill="#3a0090" opacity="0.25"/>
<!-- Hoodie body -->
<path d="M5 100 Q12 62 30 56 Q40 52 50 53 Q60 52 70 56 Q88 62 95 100Z" fill="#18104a"/>
<!-- Hoodie shadow detail -->
<path d="M40 60 Q50 57 60 60 L58 75 Q50 78 42 75Z" fill="#120c36"/>
<!-- Hood frame around face -->
<path d="M22 52 Q28 30 50 26 Q72 30 78 52 Q68 42 50 40 Q32 42 22 52Z" fill="#18104a"/>
<!-- Neck -->
<rect x="43" y="66" width="14" height="12" rx="5" fill="url(#k-skin)"/>
<!-- Face -->
<ellipse cx="50" cy="50" rx="18" ry="21" fill="url(#k-skin)"/>
<!-- Hair — dark, swept back -->
<path d="M32 42 Q35 22 50 20 Q65 22 68 42 Q60 34 50 33 Q40 34 32 42Z" fill="#0f0a04"/>
<path d="M32 42 Q30 36 33 30 Q35 27 38 29 Q34 35 32 42Z" fill="#1a1005"/>
<!-- Jaw shadow -->
<ellipse cx="50" cy="63" rx="12" ry="4" fill="#935028" opacity="0.4"/>
<!-- Eyes — sharp, determined anime style -->
<path d="M34 47 Q38 43 42 46 Q38 49 34 47Z" fill="#0d0820"/>
<path d="M58 47 Q62 43 66 46 Q62 49 58 47Z" fill="#0d0820"/>
<!-- Eye shine -->
<circle cx="37" cy="46" r="1.2" fill="white" opacity="0.7"/>
<circle cx="61" cy="46" r="1.2" fill="white" opacity="0.7"/>
<!-- Subtle iris — amber -->
<circle cx="38" cy="46.5" r="2" fill="#c87820" opacity="0.6"/>
<circle cx="62" cy="46.5" r="2" fill="#c87820" opacity="0.6"/>
<!-- Eyebrows — sharp, angled in -->
<path d="M33 43 Q38 41 42 43" stroke="#1a0f04" stroke-width="1.8" fill="none" stroke-linecap="round"/>
<path d="M58 43 Q62 41 67 43" stroke="#1a0f04" stroke-width="1.8" fill="none" stroke-linecap="round"/>
<!-- Nose — minimal -->
<path d="M48 53 Q50 55 52 53" stroke="#935028" stroke-width="1.1" fill="none" opacity="0.6"/>
<!-- Mouth — confident smirk, right side higher -->
<path d="M43 58 Q48 61 55 57" stroke="#7a3d1e" stroke-width="1.4" fill="none" stroke-linecap="round"/>
<!-- Ace card in hand (lower right) -->
<g transform="rotate(-18,78,80)">
  <rect x="64" y="70" width="22" height="30" rx="3" fill="#f5f0e8" stroke="#d4a843" stroke-width="1.2"/>
  <text x="66" y="81" font-size="7" fill="#0d0820" font-family="Georgia,serif" font-weight="bold">A</text>
  <text x="74" y="95" font-size="10" fill="#0d0820" font-family="Georgia,serif">♠</text>
  <text x="66" y="81" font-size="7" fill="#0d0820" font-family="Georgia,serif" font-weight="bold">A</text>
</g>
<!-- Gold rim glow -->
<rect width="100" height="100" rx="22" fill="none" stroke="#d4a843" stroke-width="1" opacity="0.15"/>
</svg>`
}

// Preetish — The Nit. Sharp suit, dark glasses, unreadable.
function svgPreetish() {
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
<defs>
  <radialGradient id="p-sky" cx="50%" cy="30%" r="70%">
    <stop offset="0%" stop-color="#0a1520"/>
    <stop offset="100%" stop-color="#06040e"/>
  </radialGradient>
  <radialGradient id="p-skin" cx="50%" cy="35%" r="60%">
    <stop offset="0%" stop-color="#c89060"/>
    <stop offset="100%" stop-color="#9a6030"/>
  </radialGradient>
</defs>
<rect width="100" height="100" rx="22" fill="url(#p-sky)"/>
<ellipse cx="50" cy="108" rx="55" ry="28" fill="#0060a0" opacity="0.12"/>
<!-- Suit jacket -->
<path d="M2 100 Q10 60 30 55 Q40 51 50 52 Q60 51 70 55 Q90 60 98 100Z" fill="#0f1e30"/>
<!-- Lapels -->
<path d="M35 58 L50 70 L50 100" fill="#182840"/>
<path d="M65 58 L50 70 L50 100" fill="#0f1e30"/>
<!-- White shirt between lapels -->
<path d="M43 60 L50 68 L57 60 L53 54 L47 54Z" fill="#dde6f0"/>
<!-- Tie -->
<path d="M48 57 L50 68 L52 57 L50 53Z" fill="#8b0020"/>
<!-- Neck -->
<rect x="44" y="65" width="12" height="10" rx="4" fill="url(#p-skin)"/>
<!-- Face -->
<ellipse cx="50" cy="49" rx="17" ry="20" fill="url(#p-skin)"/>
<!-- Hair — slicked back, dark -->
<path d="M33 42 Q36 22 50 20 Q64 22 67 42 Q60 34 50 32 Q40 34 33 42Z" fill="#080504"/>
<path d="M33 42 Q31 32 35 24 Q38 21 38 27 Q35 34 33 42Z" fill="#100a05"/>
<!-- Jaw shadow -->
<ellipse cx="50" cy="62" rx="11" ry="3.5" fill="#7a4018" opacity="0.35"/>
<!-- Sunglasses — rectangular, dark -->
<rect x="30" y="42" width="16" height="10" rx="4" fill="#080c12" stroke="#2a3a4a" stroke-width="0.8"/>
<rect x="54" y="42" width="16" height="10" rx="4" fill="#080c12" stroke="#2a3a4a" stroke-width="0.8"/>
<line x1="46" y1="47" x2="54" y2="47" stroke="#2a3a4a" stroke-width="1.2"/>
<line x1="30" y1="47" x2="26" y2="46" stroke="#2a3a4a" stroke-width="1"/>
<line x1="70" y1="47" x2="74" y2="46" stroke="#2a3a4a" stroke-width="1"/>
<!-- Slight lens reflection -->
<path d="M32 44 Q35 43 38 44" stroke="white" stroke-width="0.6" fill="none" opacity="0.3"/>
<path d="M56 44 Q59 43 62 44" stroke="white" stroke-width="0.6" fill="none" opacity="0.3"/>
<!-- Brows above glasses -->
<path d="M31 40 Q38 38 45 40" stroke="#100a05" stroke-width="1.6" fill="none" stroke-linecap="round"/>
<path d="M55 40 Q62 38 69 40" stroke="#100a05" stroke-width="1.6" fill="none" stroke-linecap="round"/>
<!-- Nose -->
<path d="M48 53 Q50 56 52 53" stroke="#7a4018" stroke-width="1" fill="none" opacity="0.5"/>
<!-- Flat, unreadable line for mouth -->
<line x1="43" y1="59" x2="57" y2="59" stroke="#7a4018" stroke-width="1.3" stroke-linecap="round"/>
<rect width="100" height="100" rx="22" fill="none" stroke="#60a5fa" stroke-width="1" opacity="0.1"/>
</svg>`
}

// Pranav — The Aggro. Wild hair, leaning forward, intense.
function svgPranav() {
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
<defs>
  <radialGradient id="pv-sky" cx="50%" cy="30%" r="70%">
    <stop offset="0%" stop-color="#1f0808"/>
    <stop offset="100%" stop-color="#06040e"/>
  </radialGradient>
  <radialGradient id="pv-skin" cx="50%" cy="35%" r="60%">
    <stop offset="0%" stop-color="#d4956a"/>
    <stop offset="100%" stop-color="#a06030"/>
  </radialGradient>
</defs>
<rect width="100" height="100" rx="22" fill="url(#pv-sky)"/>
<ellipse cx="50" cy="108" rx="55" ry="28" fill="#cc0000" opacity="0.15"/>
<!-- Casual open shirt -->
<path d="M2 100 Q8 60 28 54 Q40 50 50 51 Q60 50 72 54 Q92 60 98 100Z" fill="#5a1010"/>
<!-- Open collar -->
<path d="M38 60 L50 72 L50 100" fill="#7a1818"/>
<path d="M62 60 L50 72" fill="#5a1010"/>
<!-- Neck -->
<rect x="43" y="65" width="14" height="11" rx="5" fill="url(#pv-skin)"/>
<!-- Face -->
<ellipse cx="50" cy="50" rx="18" ry="21" fill="url(#pv-skin)"/>
<!-- Wild hair — messy, voluminous -->
<path d="M28 44 Q25 20 38 14 Q44 11 50 12 Q56 11 62 14 Q75 20 72 44 Q65 32 50 30 Q35 32 28 44Z" fill="#1a0a00"/>
<path d="M28 44 Q22 32 26 18 Q23 28 22 38Z" fill="#250e00"/>
<path d="M72 44 Q78 32 74 18 Q77 28 78 38Z" fill="#250e00"/>
<!-- Stray hair strand left -->
<path d="M28 35 Q20 25 24 15" stroke="#1a0a00" stroke-width="3" fill="none" stroke-linecap="round"/>
<!-- Jaw shadow -->
<ellipse cx="50" cy="64" rx="12" ry="4" fill="#8a4820" opacity="0.4"/>
<!-- Left eyebrow — cocked up (aggro read) -->
<path d="M32 42 Q37 38 42 41" stroke="#1a0a00" stroke-width="2" fill="none" stroke-linecap="round"/>
<!-- Right eyebrow — straighter -->
<path d="M58 42 Q63 40 68 42" stroke="#1a0a00" stroke-width="1.8" fill="none" stroke-linecap="round"/>
<!-- Eyes — intense, slightly narrowed -->
<path d="M32 47 Q37 43 42 47 Q37 50 32 47Z" fill="#100508"/>
<path d="M58 47 Q63 43 68 47 Q63 50 58 47Z" fill="#100508"/>
<!-- Eye glow — red tint (aggro) -->
<circle cx="37.5" cy="46.5" r="2.2" fill="#cc2200" opacity="0.45"/>
<circle cx="62.5" cy="46.5" r="2.2" fill="#cc2200" opacity="0.45"/>
<circle cx="36.5" cy="46" r="1" fill="white" opacity="0.5"/>
<circle cx="61.5" cy="46" r="1" fill="white" opacity="0.5"/>
<!-- Nose -->
<path d="M47 54 Q50 57 53 54" stroke="#8a4820" stroke-width="1.2" fill="none" opacity="0.6"/>
<!-- Wide challenging grin -->
<path d="M39 60 Q44 65 50 62 Q56 65 61 60" stroke="#7a2810" stroke-width="1.5" fill="none" stroke-linecap="round"/>
<!-- Gold spinning chip, held up -->
<circle cx="78" cy="36" r="9" fill="#d4a843" stroke="#b8882c" stroke-width="1.5"/>
<circle cx="78" cy="36" r="6.5" fill="none" stroke="#07050f" stroke-width="0.8" stroke-dasharray="3,2"/>
<text x="73.5" y="39.5" font-size="6" fill="#07050f" font-weight="bold" font-family="sans-serif">25</text>
<rect width="100" height="100" rx="22" fill="none" stroke="#f87171" stroke-width="1" opacity="0.12"/>
</svg>`
}

// Sakshi — The Queen. Elegant, tiara, composed.
function svgSakshi() {
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
<defs>
  <radialGradient id="sk-sky" cx="50%" cy="30%" r="70%">
    <stop offset="0%" stop-color="#1c0a1c"/>
    <stop offset="100%" stop-color="#06040e"/>
  </radialGradient>
  <radialGradient id="sk-skin" cx="50%" cy="35%" r="60%">
    <stop offset="0%" stop-color="#e0a878"/>
    <stop offset="100%" stop-color="#c08050"/>
  </radialGradient>
</defs>
<rect width="100" height="100" rx="22" fill="url(#sk-sky)"/>
<ellipse cx="50" cy="108" rx="55" ry="28" fill="#8b0040" opacity="0.2"/>
<!-- Elegant dress / shoulders -->
<path d="M2 100 Q8 62 26 56 Q38 50 50 51 Q62 50 74 56 Q92 62 98 100Z" fill="#4a0030"/>
<!-- Gold necklace hint -->
<path d="M35 65 Q50 70 65 65" stroke="#d4a843" stroke-width="1.2" fill="none" opacity="0.7"/>
<!-- Neck -->
<rect x="43" y="64" width="14" height="12" rx="5" fill="url(#sk-skin)"/>
<!-- Face -->
<ellipse cx="50" cy="50" rx="17" ry="20" fill="url(#sk-skin)"/>
<!-- Hair — long, flowing dark -->
<path d="M33 42 Q34 20 50 18 Q66 20 67 42 Q60 32 50 30 Q40 32 33 42Z" fill="#0f0510"/>
<!-- Left hair flow -->
<path d="M33 42 Q26 55 28 80 Q32 68 36 58 Q34 50 33 42Z" fill="#180820"/>
<!-- Right hair flow -->
<path d="M67 42 Q74 55 72 80 Q68 68 64 58 Q66 50 67 42Z" fill="#180820"/>
<!-- Crown / Tiara -->
<path d="M33 30 L38 21 L43 28 L50 18 L57 28 L62 21 L67 30" stroke="#d4a843" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<!-- Tiara gems -->
<circle cx="50" cy="18" r="3" fill="#d4a843"/>
<circle cx="38" cy="21" r="2" fill="#d4a843"/>
<circle cx="62" cy="21" r="2" fill="#d4a843"/>
<circle cx="50" cy="18" r="1.5" fill="#fff9e0"/>
<!-- Jaw -->
<ellipse cx="50" cy="63" rx="11" ry="3.5" fill="#a06038" opacity="0.3"/>
<!-- Eyebrows — elegant arched -->
<path d="M34 40 Q38 37 44 39" stroke="#0f0510" stroke-width="1.7" fill="none" stroke-linecap="round"/>
<path d="M56 39 Q62 37 66 40" stroke="#0f0510" stroke-width="1.7" fill="none" stroke-linecap="round"/>
<!-- Upper lashes — drawn on -->
<path d="M33 43 Q38 41 43 43" stroke="#0f0510" stroke-width="1" fill="none"/>
<path d="M57 43 Q62 41 67 43" stroke="#0f0510" stroke-width="1" fill="none"/>
<!-- Eyes — almond shaped, elegant -->
<path d="M33 46 Q38 42 43 46 Q38 50 33 46Z" fill="#0d0515"/>
<path d="M57 46 Q62 42 67 46 Q62 50 57 46Z" fill="#0d0515"/>
<!-- Eye shine -->
<circle cx="37" cy="45.5" r="1.3" fill="white" opacity="0.65"/>
<circle cx="61" cy="45.5" r="1.3" fill="white" opacity="0.65"/>
<!-- Iris — violet -->
<circle cx="38" cy="46" r="2.2" fill="#8040a0" opacity="0.55"/>
<circle cx="62" cy="46" r="2.2" fill="#8040a0" opacity="0.55"/>
<!-- Nose -->
<path d="M48 53 Q50 56 52 53" stroke="#a06038" stroke-width="1" fill="none" opacity="0.5"/>
<!-- Lips — defined, confident -->
<path d="M43 59 Q47 57 50 58 Q53 57 57 59" stroke="#c05070" stroke-width="1" fill="none"/>
<path d="M43 59 Q50 63 57 59 Q50 66 43 59Z" fill="#c05070" opacity="0.7"/>
<rect width="100" height="100" rx="22" fill="none" stroke="#d4a843" stroke-width="1" opacity="0.2"/>
</svg>`
}

// Japneet — The Caller. Calm, confident, chip stack beside her.
function svgJapneet() {
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
<defs>
  <radialGradient id="jp-sky" cx="50%" cy="30%" r="70%">
    <stop offset="0%" stop-color="#0a160a"/>
    <stop offset="100%" stop-color="#06040e"/>
  </radialGradient>
  <radialGradient id="jp-skin" cx="50%" cy="35%" r="60%">
    <stop offset="0%" stop-color="#dfa070"/>
    <stop offset="100%" stop-color="#b07040"/>
  </radialGradient>
</defs>
<rect width="100" height="100" rx="22" fill="url(#jp-sky)"/>
<ellipse cx="50" cy="108" rx="55" ry="28" fill="#005020" opacity="0.18"/>
<!-- Top / blouse -->
<path d="M2 100 Q8 60 28 54 Q40 50 50 51 Q60 50 72 54 Q92 60 98 100Z" fill="#003a20"/>
<!-- Neck -->
<rect x="43" y="65" width="14" height="11" rx="5" fill="url(#jp-skin)"/>
<!-- Face -->
<ellipse cx="50" cy="50" rx="17" ry="21" fill="url(#jp-skin)"/>
<!-- Hair — straight, long, dark, side part -->
<path d="M32 42 Q34 18 50 17 Q66 18 68 42 Q60 30 50 29 Q40 30 32 42Z" fill="#0d0608"/>
<!-- Left hair flow -->
<path d="M32 42 Q25 55 27 85 Q31 70 35 60 Q33 51 32 42Z" fill="#160810"/>
<!-- Hair part detail -->
<path d="M45 20 Q47 25 46 35" stroke="#1e0c14" stroke-width="1" fill="none"/>
<!-- Jaw -->
<ellipse cx="50" cy="64" rx="11" ry="3.5" fill="#906030" opacity="0.3"/>
<!-- Eyebrows — natural, even -->
<path d="M34 41 Q38 39 43 40" stroke="#0d0608" stroke-width="1.6" fill="none" stroke-linecap="round"/>
<path d="M57 40 Q62 39 66 41" stroke="#0d0608" stroke-width="1.6" fill="none" stroke-linecap="round"/>
<!-- Eyes — soft, calm, knowing -->
<path d="M33 46 Q38 42 43 46 Q38 50 33 46Z" fill="#0d0510"/>
<path d="M57 46 Q62 42 67 46 Q62 50 57 46Z" fill="#0d0510"/>
<circle cx="37" cy="45.5" r="1.2" fill="white" opacity="0.55"/>
<circle cx="61" cy="45.5" r="1.2" fill="white" opacity="0.55"/>
<!-- Iris — warm brown -->
<circle cx="38" cy="46.5" r="2" fill="#804020" opacity="0.5"/>
<circle cx="62" cy="46.5" r="2" fill="#804020" opacity="0.5"/>
<!-- Nose -->
<path d="M48 54 Q50 57 52 54" stroke="#906030" stroke-width="1" fill="none" opacity="0.5"/>
<!-- Slight knowing smile -->
<path d="M42 60 Q46 64 50 62 Q54 64 58 60" stroke="#8a4030" stroke-width="1.3" fill="none" stroke-linecap="round"/>
<path d="M44 60 Q50 65 56 60 Q50 67 44 60Z" fill="#b06050" opacity="0.55"/>
<!-- Chip stack (she's always calling) — right side -->
<g transform="translate(72,48)">
  <!-- Stack of 3 chips -->
  <ellipse cx="0" cy="22" rx="10" ry="4" fill="#9b5de5" stroke="#7a3dc5" stroke-width="1"/>
  <rect x="-10" y="10" width="20" height="12" rx="0" fill="#9b5de5"/>
  <ellipse cx="0" cy="10" rx="10" ry="4" fill="#b070ff" stroke="#7a3dc5" stroke-width="1"/>

  <ellipse cx="0" cy="10" rx="10" ry="4" fill="#60a5fa" stroke="#3a85da" stroke-width="1"/>
  <rect x="-10" y="-2" width="20" height="12" rx="0" fill="#60a5fa"/>
  <ellipse cx="0" cy="-2" rx="10" ry="4" fill="#80c0ff" stroke="#3a85da" stroke-width="1"/>

  <ellipse cx="0" cy="-2" rx="10" ry="4" fill="#d4a843" stroke="#b8882c" stroke-width="1"/>
  <rect x="-10" y="-14" width="20" height="12" rx="0" fill="#d4a843"/>
  <ellipse cx="0" cy="-14" rx="10" ry="4" fill="#e8c050" stroke="#b8882c" stroke-width="1"/>
</g>
<rect width="100" height="100" rx="22" fill="none" stroke="#4ade80" stroke-width="1" opacity="0.1"/>
</svg>`
}

// Fallback for guests / unknown players
function svgGuest(name: string, id: string): string {
  let s = 0
  for (let i = 0; i < id.length; i++) s += id.charCodeAt(i)
  const suits = ['♠', '♥', '♦', '♣']
  const cols = ['#d4a843', '#9b5de5', '#60a5fa', '#4ade80']
  const bgs = ['#1a0f3a', '#1f0a1a', '#0a1020', '#0a1a0a']
  const suit = suits[s % 4]
  const col = cols[s % 4]
  const bg = bgs[s % 4]
  const ini = name.slice(0, 2).toUpperCase()
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
<rect width="100" height="100" rx="22" fill="${bg}"/>
<text x="50" y="55" text-anchor="middle" font-size="32" fill="${col}" opacity="0.2" font-family="serif">${suit}</text>
<text x="50" y="62" text-anchor="middle" font-size="28" fill="${col}" font-weight="700" font-family="system-ui,sans-serif">${ini}</text>
<rect width="100" height="100" rx="22" fill="none" stroke="${col}" stroke-width="1.2" opacity="0.18"/>
</svg>`
}

// ── Map player ID to SVG generator ───────────────────────────────────────
const GENERATORS: Record<string, () => string> = {
  p1: svgKunal,
  p2: svgPreetish,
  p3: svgPranav,
  p4: svgSakshi,
  p5: svgJapneet,
}

function svgToDataUri(svg: string): string {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.trim())
}

// Cache SVG data URIs (generated once per session)
const _cache: Record<string, string> = {}

function getAvatarSrc(player: Pick<Player, 'id' | 'name'>): string {
  if (_cache[player.id]) return _cache[player.id]
  const gen = GENERATORS[player.id]
  const svg = gen ? gen() : svgGuest(player.name, player.id)
  _cache[player.id] = svgToDataUri(svg)
  return _cache[player.id]
}

// ── Avatar component ──────────────────────────────────────────────────────

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
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  )
}
