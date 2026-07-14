import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { ArrowRight, TrendingUp, History, LineChart } from 'lucide-react'
import { useStore } from '../store'
import { Avatar } from '../components/Avatar'
import { Card, SectionLabel } from '../components/Card'
import { rs, inr, fmtDate, fmtDateShort } from '../lib/utils'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 340, damping: 28 } } }

export function Dashboard({ onGoLive }: { onGoLive: () => void }) {
  const players = useStore(s => s.players)
  const sessions = useStore(s => s.sessions)
  const hands = useStore(s => s.hands)
  const pnlRef = useRef<HTMLSpanElement>(null)
  const prevTotal = useRef<number | null>(null)

  const myP = players.find(p => p.name === 'Kunal') || players[0]
  const mid = myP?.id || ''
  const done = sessions.filter(s => s.status !== 'active')

  let total = 0, wins = 0, best = 0, worst = 0
  done.forEach(s => {
    const r = (s.results && s.results[mid]) || 0
    total += r; if (r > 0) wins++
    if (r > best) best = r; if (r < worst) worst = r
  })
  const n = done.length

  // Count-up animation with GSAP
  useEffect(() => {
    if (!pnlRef.current) return
    const prev = prevTotal.current ?? 0
    prevTotal.current = total
    if (prev === total) return
    const obj = { val: prev }
    gsap.to(obj, {
      val: Math.abs(total), duration: 1.2, ease: 'power2.out',
      onUpdate: () => {
        if (pnlRef.current) {
          pnlRef.current.textContent = (total >= 0 ? '+' : '-') + '₹' + Math.round(obj.val).toLocaleString('en-IN')
        }
      },
    })
  }, [total])

  // Running P&L chart data
  const cd: { date: string; r: number }[] = []
  let run = 0
  done.slice().reverse().slice(-14).forEach(s => {
    run += (s.results && s.results[mid]) || 0
    cd.push({ date: s.date, r: run })
  })

  const lastR = n ? (done[0].results && done[0].results[mid]) || 0 : 0
  const activeSess = sessions.find(s => s.status === 'active')

  // Current streak: consecutive sessions with the same result sign as the latest
  let streak = 0
  let streakWin = false
  for (const s of done) {
    const r = (s.results && s.results[mid]) || 0
    if (r === 0) continue // break-even sessions don't affect the streak
    if (streak === 0) streakWin = r > 0
    if ((r > 0) === streakWin) streak++
    else break
  }

  const pills = [
    { label: 'Win rate', value: n ? Math.round(wins / n * 100) + '%' : '—', color: 'var(--ink)' },
    { label: 'Streak',   value: streak ? (streakWin ? 'W' : 'L') + streak : '—', color: streak ? (streakWin ? 'var(--pos)' : 'var(--neg)') : 'var(--ink-2)' },
    { label: 'Hands',    value: String(hands.length),                      color: 'var(--ink)' },
    { label: 'Best',     value: n ? rs(best) : '—',                        color: 'var(--pos)' },
    { label: 'Worst',    value: n ? rs(worst) : '—',                       color: 'var(--neg)' },
    { label: 'Avg',      value: n ? rs(Math.round(total / n)) : '—',       color: 'var(--ink-2)' },
  ]

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ padding: '14px 14px 0' }}>

      {/* Hero */}
      <motion.div variants={item}>
        <div className="panel" style={{
          padding: '22px 20px',
          marginBottom: 12, position: 'relative', overflow: 'hidden',
          boxShadow: '0 12px 40px oklch(0% 0 0 / 35%)',
        }}>
          {/* Soft accent wash */}
          <div style={{
            position: 'absolute', top: -80, right: -60, width: 260, height: 260,
            background: 'radial-gradient(circle, oklch(82% 0.16 163 / 7%) 0%, transparent 68%)',
            pointerEvents: 'none',
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, position: 'relative' }}>
            {myP && <Avatar player={myP} size="md" />}
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>{myP?.name}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 1 }}>
                {n ? `${n} sessions · ${hands.length} hands logged` : 'No sessions yet'}
              </div>
            </div>
          </div>

          <div className="label" style={{ marginBottom: 6 }}>Lifetime P&amp;L</div>
          <div className="mono" style={{
            fontSize: 42, fontWeight: 700, lineHeight: 1,
            color: total >= 0 ? 'var(--pos)' : 'var(--neg)',
          }}>
            <span ref={pnlRef}>{total >= 0 ? '+' : '-'}₹{Math.abs(Math.round(total)).toLocaleString('en-IN')}</span>
          </div>

          {lastR !== 0 && n > 0 && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 12, fontWeight: 600,
              padding: '4px 11px', borderRadius: 20, marginTop: 12,
              background: lastR >= 0 ? 'var(--accent-dim)' : 'var(--neg-dim)',
              color: lastR >= 0 ? 'var(--pos)' : 'var(--neg)',
            }}>
              <TrendingUp size={13} strokeWidth={2.4} style={{ transform: lastR >= 0 ? 'none' : 'scaleY(-1)' }} />
              <span className="mono" style={{ fontSize: 12 }}>{rs(lastR)}</span> last session
            </div>
          )}
        </div>
      </motion.div>

      {/* Stat grid */}
      <motion.div variants={item}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
          {pills.map((p, i) => (
            <div key={i} className="panel" style={{ borderRadius: 14, padding: '11px 6px', textAlign: 'center', minWidth: 0 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 5, fontWeight: 600 }}>{p.label}</div>
              <div className="mono" style={{ fontSize: 13.5, fontWeight: 700, color: p.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.value}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Active session banner */}
      {activeSess && (
        <motion.div variants={item}>
          <div style={{
            background: 'var(--live-dim)', border: '1px solid var(--live-line)',
            borderRadius: 'var(--r-lg)', padding: 16, marginBottom: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--live)', marginBottom: 5, fontWeight: 700 }}>
                <span className="live-dot" /> Game in progress
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{fmtDate(activeSess.date)}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
                {inr(activeSess.buyinAmt || 500)}/buyin · {(activeSess.players || []).length} players
              </div>
            </div>
            <motion.button
              onClick={onGoLive}
              whileTap={{ scale: 0.95 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0,
                background: 'var(--accent-strong)', color: 'var(--accent-ink)',
                border: 'none', borderRadius: 12, padding: '10px 15px',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--fb)',
              }}
            >
              Go live <ArrowRight size={14} strokeWidth={2.6} />
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Running P&L chart */}
      {cd.length > 1 && (
        <motion.div variants={item}>
          <Card>
            <SectionLabel accent><LineChart size={13} strokeWidth={2.4} /> Running P&amp;L</SectionLabel>
            <AreaChart data={cd} />
          </Card>
        </motion.div>
      )}

      {/* Recent sessions */}
      <motion.div variants={item}>
        {n > 0 ? (
          <Card>
            <SectionLabel accent><History size={13} strokeWidth={2.4} /> Recent sessions</SectionLabel>
            {done.slice(0, 4).map((s, i) => {
              const r = (s.results && s.results[mid]) || 0
              const hc = hands.filter(h => h.sessionId === s.id).length
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                  <div>
                    <div style={{ fontSize: 13.5, color: 'var(--ink)', fontWeight: 600 }}>{fmtDate(s.date)}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>
                      {inr(s.buyinAmt || 500)}/buyin{hc ? ` · ${hc} hands` : ''}
                    </div>
                  </div>
                  <span className="mono" style={{ color: r >= 0 ? 'var(--pos)' : 'var(--neg)', fontWeight: 700, fontSize: 14 }}>{rs(r)}</span>
                </div>
              )
            })}
          </Card>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--ink-3)' }}>
            <div style={{ fontSize: 44, marginBottom: 14, opacity: 0.35 }}>♠</div>
            <div style={{ fontSize: 14, lineHeight: 1.6 }}>No sessions yet.<br />Tap <strong style={{ color: 'var(--accent)' }}>+ Session</strong> to start.</div>
          </div>
        )}
      </motion.div>

      {/* Tendency summary */}
      {hands.length > 4 && (
        <motion.div variants={item}>
          <TendencyCard players={players} hands={hands} />
        </motion.div>
      )}
    </motion.div>
  )
}

/* ── Tendency summary ── */

function TendencyCard({ players, hands }: { players: any[]; hands: any[] }) {
  const stats: Record<string, { r: number; f: number; c: number; w: number; t: number }> = {}
  players.forEach(p => { stats[p.id] = { r: 0, f: 0, c: 0, w: 0, t: 0 } })
  hands.forEach(h => {
    ;[h.pre || {}, h.flop || {}, h.turn || {}, h.river || {}].forEach((st: any) => {
      Object.keys(st).forEach(pid => {
        if (!stats[pid]) return
        const a = (st[pid].action || '').toLowerCase()
        stats[pid].t++
        if (a === 'raise' || a === 'all-in') stats[pid].r++
        else if (a === 'fold') stats[pid].f++
        else if (a === 'call') stats[pid].c++
      })
    })
    if (h.winner && stats[h.winner]) stats[h.winner].w++
  })

  return (
    <Card>
      <SectionLabel accent><TrendingUp size={13} strokeWidth={2.4} /> Table tendencies</SectionLabel>
      {players.map(p => {
        const st = stats[p.id]
        if (!st || st.t < 3) return null
        const rp = Math.round(st.r / st.t * 100)
        const fp = Math.round(st.f / st.t * 100)
        return (
          <div key={p.id} className="row" style={{ padding: '11px 13px', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
              <Avatar player={p} size="sm" />
              <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{p.name}</span>
              <span className="mono" style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink-3)' }}>{st.w} pots won</span>
            </div>
            <TendencyBar label="Raises" pct={rp} tone={rp > 40 ? 'hot' : 'calm'} />
            <TendencyBar label="Folds" pct={fp} tone="neutral" />
          </div>
        )
      })}
    </Card>
  )
}

function TendencyBar({ label, pct, tone }: { label: string; pct: number; tone: 'hot' | 'calm' | 'neutral' }) {
  const color = tone === 'hot' ? 'var(--live)' : tone === 'calm' ? 'var(--accent)' : 'var(--ink-3)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
      <span style={{ fontSize: 11, color: 'var(--ink-3)', width: 46, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 4, background: 'oklch(100% 0 0 / 6%)', borderRadius: 2, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.25, 0.8, 0.3, 1] }}
          style={{ height: '100%', background: color, borderRadius: 2 }}
        />
      </div>
      <span className="mono" style={{ fontSize: 11, color, width: 36, textAlign: 'right', flexShrink: 0 }}>{pct}%</span>
    </div>
  )
}

/* ── Smooth animated area chart ── */

function AreaChart({ data }: { data: { date: string; r: number }[] }) {
  const W = 340, H = 120, PAD = 6
  const vals = data.map(d => d.r)
  const lo = Math.min(0, ...vals)
  const hi = Math.max(0, ...vals)
  const span = Math.max(1, hi - lo)

  const x = (i: number) => PAD + (i / (data.length - 1)) * (W - PAD * 2)
  const y = (v: number) => PAD + (1 - (v - lo) / span) * (H - PAD * 2)

  // Catmull-Rom → cubic bezier smooth path
  const pts = data.map((d, i) => [x(i), y(d.r)] as [number, number])
  let path = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)]
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6
    path += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`
  }
  const areaPath = `${path} L ${pts[pts.length - 1][0]} ${H - PAD} L ${pts[0][0]} ${H - PAD} Z`

  const zeroY = y(0)
  const last = data[data.length - 1]
  const first = data[0]
  const up = last.r >= 0

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        <defs>
          <linearGradient id="pnl-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={up ? 'oklch(82% 0.16 163 / 26%)' : 'oklch(72% 0.16 22 / 26%)'} />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
        {/* Zero line */}
        <line x1={PAD} x2={W - PAD} y1={zeroY} y2={zeroY} stroke="oklch(100% 0 0 / 10%)" strokeDasharray="3 4" strokeWidth="1" />
        <motion.path
          d={areaPath}
          fill="url(#pnl-fill)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        />
        <motion.path
          d={path}
          fill="none"
          stroke={up ? 'var(--pos)' : 'var(--neg)'}
          strokeWidth="2.2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.1, ease: [0.25, 0.8, 0.3, 1] }}
        />
        {/* End dot */}
        <motion.circle
          cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3.5"
          fill={up ? 'var(--pos)' : 'var(--neg)'}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1, type: 'spring', stiffness: 400, damping: 20 }}
        />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--ink-3)' }}>
        <span>{fmtDateShort(first.date)} · <span className="mono" style={{ color: first.r >= 0 ? 'var(--pos)' : 'var(--neg)' }}>{rs(first.r)}</span></span>
        <span>{fmtDateShort(last.date)} · <span className="mono" style={{ color: up ? 'var(--pos)' : 'var(--neg)', fontWeight: 700 }}>{rs(last.r)}</span></span>
      </div>
    </div>
  )
}
