import type { Player, Session, Hand, Settlement } from './types'

export function uid(): string {
  return 'p' + Math.random().toString(36).slice(2, 8)
}

// yyyy-mm-dd → dd-mm-yyyy
export function fmtDate(d: string): string {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return day && m && y ? `${day}-${m}-${y}` : d
}

export function rs(n: number): string {
  n = Math.round(Number(n) || 0)
  return (n >= 0 ? '+' : '-') + 'Rs.' + Math.abs(n).toLocaleString('en-IN')
}

export function ini(name: string): string {
  const p = (name || '').trim().split(/\s+/)
  return p.length >= 2
    ? (p[0][0] + p[1][0]).toUpperCase()
    : (name || '?').slice(0, 2).toUpperCase()
}

const BG_COLORS = ['1b4035','4a1e12','18264a','40142c','1e3e12','3e3810','12284a','40220e']

export function avatarUrl(player: Pick<Player, 'id' | 'name'>, size: number = 44): string {
  const seed = encodeURIComponent((player.name || player.id || 'x').trim())
  let s = 0
  for (let i = 0; i < (player.id || '').length; i++) s += (player.id || '').charCodeAt(i)
  const bg = BG_COLORS[s % BG_COLORS.length]
  return `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${seed}&backgroundColor=${bg}&size=${size}`
}

export function sortByTs<T>(arr: T[]): T[] {
  return arr.slice().sort((a, b) => {
    const ca = (a as any).createdAt
    const cb = (b as any).createdAt
    const ta = ca ? (ca.toMillis?.() ?? (ca.seconds != null ? ca.seconds * 1000 : 0)) : 0
    const tb = cb ? (cb.toMillis?.() ?? (cb.seconds != null ? cb.seconds * 1000 : 0)) : 0
    return tb - ta
  })
}

export function calcSettle(
  results: Record<string, number>,
  _players: Player[],
  households: [string, string][]
): Settlement {
  const net: Record<string, number> = {}
  Object.keys(results || {}).forEach(id => {
    const a = Math.round(Number(results[id]) || 0)
    if (Math.abs(a) > 0) net[id] = a
  })

  const householdResults: Settlement['households'] = []
  ;(households || []).forEach(([a, b]) => {
    if (net[a] === undefined && net[b] === undefined) return
    const aN = net[a] || 0, bN = net[b] || 0
    const combined = aN + bN
    let internal: Settlement['households'][0]['internal'] = null
    if (aN > 0 && bN < 0) internal = { from: b, to: a, amount: Math.min(aN, Math.abs(bN)) }
    else if (bN > 0 && aN < 0) internal = { from: a, to: b, amount: Math.min(bN, Math.abs(aN)) }
    householdResults.push({ a, b, aN, bN, combined, internal })
    if (combined === 0) { delete net[a]; delete net[b] }
    else if (Math.abs(aN) >= Math.abs(bN)) { net[a] = combined; delete net[b] }
    else { net[b] = combined; delete net[a] }
  })

  const bal = Object.keys(net).map(id => ({ id, amt: net[id] }))
  const cr = bal.filter(x => x.amt > 0).sort((a, b) => b.amt - a.amt)
  const db = bal.filter(x => x.amt < 0).sort((a, b) => a.amt - b.amt)
  const totalCr = cr.reduce((s, x) => s + x.amt, 0)
  const totalDb = Math.abs(db.reduce((s, x) => s + x.amt, 0))
  const imbalance = totalCr - totalDb

  const txns: Settlement['txns'] = []
  let i = 0, j = 0
  const crCopy = cr.map(x => ({ ...x }))
  const dbCopy = db.map(x => ({ ...x }))
  while (i < crCopy.length && j < dbCopy.length) {
    const a = Math.min(crCopy[i].amt, Math.abs(dbCopy[j].amt))
    if (a > 0) txns.push({ from: dbCopy[j].id, to: crCopy[i].id, amount: a })
    crCopy[i].amt -= a
    dbCopy[j].amt += a
    if (Math.abs(crCopy[i].amt) < 1) i++
    if (Math.abs(dbCopy[j].amt) < 1) j++
  }

  const unpaid = [
    ...crCopy.slice(i).filter(x => x.amt > 0),
    ...dbCopy.slice(j).filter(x => x.amt < 0)
  ]

  return { txns, households: householdResults, imbalance, unpaid }
}

export function playerName(id: string, players: Player[]): string {
  return players.find(p => p.id === id)?.name || id
}

export function buildSessPrompt(
  s: Session,
  sHands: Hand[],
  allPlayers: Player[],
  allSessions: Session[],
  aiProfiles: Record<string, string>
): string {
  const pl = s.players || allPlayers
  const lines = pl.map(p => {
    const r = (s.results && s.results[p.id]) || 0
    const note = s.sessionNotes && s.sessionNotes[p.id]
    return `${p.name}: ${(s.buyins && s.buyins[p.id]) || 0} buyins, P&L=${rs(r)}${note ? ' | ' + note : ''}`
  })

  let handSummary = ''
  if (sHands && sHands.length) {
    const stats: Record<string, { r: number; f: number; c: number; w: number; t: number }> = {}
    allPlayers.forEach(p => { stats[p.id] = { r: 0, f: 0, c: 0, w: 0, t: 0 } })
    sHands.forEach(h => {
      ;[h.pre || {}, h.flop || {}, h.turn || {}, h.river || {}].forEach(st => {
        Object.keys(st).forEach(pid => {
          if (!stats[pid]) stats[pid] = { r: 0, f: 0, c: 0, w: 0, t: 0 }
          const a = ((st as any)[pid].action || '').toLowerCase()
          stats[pid].t++
          if (a === 'raise' || a === 'all-in') stats[pid].r++
          else if (a === 'fold') stats[pid].f++
          else if (a === 'call') stats[pid].c++
        })
      })
      if (h.winner && stats[h.winner]) stats[h.winner].w++
    })
    handSummary = `HAND DATA (${sHands.length} hands):\n`
    allPlayers.forEach(p => {
      const st = stats[p.id]
      if (!st || !st.t) return
      handSummary += `${p.name}: ${st.t} actions, ${st.r} raises, ${st.f} folds, ${st.w} pots won\n`
    })
  }

  const hist = allSessions
    .filter(x => x.status !== 'active' && x.id !== s.id)
    .slice(0, 4)
    .map(h => {
      const pl2 = h.players || allPlayers
      return (h.date || '') + ': ' + pl2.map(p => `${p.name}=${rs((h.results && h.results[p.id]) || 0)}`).join(', ')
    }).join('\n')

  const profStr = allPlayers
    .map(p => aiProfiles[p.id] ? `${p.name}: ${aiProfiles[p.id]}` : '')
    .filter(Boolean).join('\n')

  const myName = (s.players || allPlayers)[0]?.name || 'Hero'

  return `You are an elite poker coach.\n\nDATE: ${s.date}\nBUYIN: Rs.${s.buyinAmt || 500}\n\nRESULTS:\n${lines.join('\n')}\n\n${handSummary}${s.notes ? 'NOTES: ' + s.notes + '\n\n' : ''}${hist ? 'HISTORY:\n' + hist + '\n\n' : ''}${profStr ? 'PROFILES:\n' + profStr + '\n\n' : ''}Provide:\n1. ${myName.toUpperCase()} COACHING (4-5 lines): patterns from hand data and P&L. One concrete adjustment.\n2. PLAYER UPDATES (one line each "Name: note"): tendencies revealed today.\n3. TABLE READS (3-4 lines): exact exploits for next session.\nBe specific and reference actual numbers.`
}

export function buildProfilePrompt(
  player: Player,
  sessions: Session[],
  hands: Hand[],
  notes: Record<string, string>
): string | null {
  const sess = sessions.filter(s => s.status !== 'active' && s.results && s.results[player.id] !== undefined)
  if (!sess.length) return null
  const hs = { r: 0, f: 0, c: 0, w: 0, t: 0 }
  hands.forEach(h => {
    ;[h.pre || {}, h.flop || {}, h.turn || {}, h.river || {}].forEach(st => {
      if ((st as any)[player.id]) {
        const a = ((st as any)[player.id].action || '').toLowerCase()
        hs.t++
        if (a === 'raise' || a === 'all-in') hs.r++
        else if (a === 'fold') hs.f++
        else if (a === 'call') hs.c++
      }
    })
    if (h.winner === player.id) hs.w++
  })
  return `You are an elite poker coach. PLAYER: ${player.name}\nNOTES: ${notes[player.id] || 'None'}\nSTATS: ${hs.t} actions, ${hs.r} raises (${hs.t ? Math.round(hs.r / hs.t * 100) : 0}%), ${hs.f} folds, ${hs.c} calls, ${hs.w} pots won\n\nSESSIONS:\n${sess.map(s => `${s.date || ''}: ${(s.buyins && s.buyins[player.id]) || 0}x, P&L=${rs((s.results && s.results[player.id]) || 0)}`).join('\n')}\n\nWrite a 5-6 line STAR profile: showdown tendencies, raise frequency meaning, fold patterns, key exploit, warning. Under 120 words.`
}
