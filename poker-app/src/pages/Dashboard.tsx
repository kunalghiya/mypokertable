import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { useStore } from '../store'
import { Avatar } from '../components/Avatar'
import { Card, SectionLabel } from '../components/Card'
import { rs, fmtDate } from '../lib/utils'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
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
          pnlRef.current.textContent = (total >= 0 ? '+' : '-') + 'Rs.' + Math.round(obj.val).toLocaleString('en-IN')
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
  const maxV = Math.max(1, ...cd.map(d => Math.abs(d.r)))

  const lastR = n ? (done[0].results && done[0].results[mid]) || 0 : 0
  const activeSess = sessions.find(s => s.status === 'active')

  // Tendency stats
  const stats: Record<string, { r: number; f: number; c: number; w: number; t: number }> = {}
  players.forEach(p => { stats[p.id] = { r: 0, f: 0, c: 0, w: 0, t: 0 } })
  hands.forEach(h => {
    ;[h.pre || {}, h.flop || {}, h.turn || {}, h.river || {}].forEach(st => {
      Object.keys(st).forEach(pid => {
        if (!stats[pid]) return
        const a = ((st as any)[pid].action || '').toLowerCase()
        stats[pid].t++
        if (a === 'raise' || a === 'all-in') stats[pid].r++
        else if (a === 'fold') stats[pid].f++
        else if (a === 'call') stats[pid].c++
      })
    })
    if (h.winner && stats[h.winner]) stats[h.winner].w++
  })

  const pills = [
    { label: 'Win Rate', value: n ? Math.round(wins / n * 100) + '%' : '—', color: 'var(--gold)' },
    { label: 'Best',     value: n ? rs(best) : '—',                        color: 'var(--green)' },
    { label: 'Worst',    value: n ? rs(worst) : '—',                       color: 'var(--red)' },
    { label: 'Avg',      value: n ? rs(Math.round(total / n)) : '—',       color: 'var(--t2)' },
    { label: 'Hands',    value: String(hands.length),                      color: 'var(--gold)' },
  ]

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ padding: '14px 14px 0' }}>

      {/* Hero card */}
      <motion.div variants={item}>
        <div style={{
          background: 'linear-gradient(140deg,#1a1040 0%,#0a0718 55%,#160e2a 100%)',
          border: '1px solid rgba(212,168,67,.15)',
          borderRadius: 24, padding: '22px 18px',
          marginBottom: 14, position: 'relative', overflow: 'hidden',
          boxShadow: '0 8px 48px rgba(0,0,0,.5), 0 0 80px rgba(155,93,229,.06), inset 0 1px 0 rgba(212,168,67,.1)',
        }}>
          {/* Ambient violet glow */}
          <div style={{ position: 'absolute', top: -60, right: -40, width: 240, height: 240, background: 'radial-gradient(circle,rgba(155,93,229,.18) 0%,transparent 68%)', pointerEvents: 'none' }} />
          {/* Spade watermark */}
          <div style={{ position: 'absolute', bottom: -24, right: 12, fontSize: 140, color: 'rgba(212,168,67,.035)', pointerEvents: 'none', lineHeight: 1, userSelect: 'none' }}>♠</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, position: 'relative' }}>
            {myP && <Avatar player={myP} size="lg" />}
            <div>
              <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 4, fontWeight: 600 }}>
                {n ? n + ' Sessions' : 'No sessions yet'}
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--t1)' }}>{myP?.name}</div>
            </div>
          </div>
          <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 4, fontWeight: 600 }}>Lifetime P&L</div>
          <div style={{ fontFamily: 'var(--fs)', fontSize: 48, fontWeight: 900, lineHeight: 1, letterSpacing: '-1.5px', fontVariantNumeric: 'tabular-nums', color: total >= 0 ? 'var(--green)' : 'var(--red)' }}>
            <span ref={pnlRef}>{total >= 0 ? '+' : '-'}Rs.{Math.abs(Math.round(total)).toLocaleString('en-IN')}</span>
          </div>
          {lastR !== 0 && n > 0 && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', fontSize: 11, fontWeight: 600,
              padding: '3px 10px', borderRadius: 20, marginTop: 8,
              background: lastR >= 0 ? 'rgba(0,232,122,.14)' : 'rgba(255,51,85,.14)',
              color: lastR >= 0 ? 'var(--green)' : 'var(--red)',
            }}>
              {rs(lastR)} last session
            </div>
          )}
        </div>
      </motion.div>

      {/* Stat pills */}
      <motion.div variants={item}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4, marginBottom: 14 }}>
          {pills.map((p, i) => (
            <motion.div key={i}
              whileHover={{ y: -2, borderColor: 'rgba(212,168,67,.4)' }}
              style={{
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '11px 16px', minWidth: 84,
                textAlign: 'center', flexShrink: 0,
              }}
            >
              <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 4, fontWeight: 600 }}>{p.label}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: p.color, fontVariantNumeric: 'tabular-nums' }}>{p.value}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Active session banner */}
      {activeSess && (
        <motion.div variants={item}>
          <div style={{
            background: 'rgba(212,168,67,.05)', border: '1px solid rgba(212,168,67,.2)',
            borderRadius: 18, padding: 16, marginBottom: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 4 }}>
                <span className="live-dot" style={{ marginRight: 5 }} /> Game In Progress
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>{activeSess.date}</div>
              <div style={{ fontSize: 11, color: 'var(--t3)' }}>Rs.{activeSess.buyinAmt || 500}/buyin · {(activeSess.players || []).length} players</div>
            </div>
            <button onClick={onGoLive} style={{
              background: 'linear-gradient(135deg,#e0b84a,#b8882c)',
              border: 'none', borderRadius: 12, padding: '9px 14px',
              fontSize: 12, fontWeight: 600, color: '#07050f', cursor: 'pointer',
              fontFamily: 'var(--fb)',
            }}>Go Live →</button>
          </div>
        </motion.div>
      )}

      {/* Running P&L chart */}
      {cd.length > 1 && (
        <motion.div variants={item}>
          <Card>
            <SectionLabel gold>Running P&L</SectionLabel>
            <SparklineChart data={cd} maxV={maxV} positive={total >= 0} />
          </Card>
        </motion.div>
      )}

      {/* Recent sessions */}
      <motion.div variants={item}>
        {n > 0 ? (
          <Card>
            <SectionLabel gold>Recent Sessions</SectionLabel>
            {done.slice(0, 4).map((s, i) => {
              const r = (s.results && s.results[mid]) || 0
              const hc = hands.filter(h => h.sessionId === s.id).length
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--t1)', fontWeight: 700 }}>{fmtDate(s.date)}</div>
                    <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>
                      Rs.{s.buyinAmt || 500}/buyin{hc ? ` · ${hc} hands` : ''}
                    </div>
                  </div>
                  <span style={{ color: r >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700, fontSize: 15 }}>{rs(r)}</span>
                </div>
              )
            })}
          </Card>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--t3)' }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>♠</div>
            <div>No sessions yet.<br />Tap + Session to start.</div>
          </div>
        )}
      </motion.div>

      {/* Tendency summary */}
      {hands.length > 4 && (
        <motion.div variants={item}>
          <Card>
            <SectionLabel gold>📈 Tendency Summary</SectionLabel>
            {players.map(p => {
              const st = stats[p.id]
              if (!st || st.t < 3) return null
              const rp = Math.round(st.r / st.t * 100)
              const fp = Math.round(st.f / st.t * 100)
              return (
                <div key={p.id} style={{ background: 'rgba(0,0,0,.2)', borderRadius: 12, padding: '10px 12px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                    <Avatar player={p} size="sm" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{p.name}</span>
                  </div>
                  <StatRow label="Raise frequency" value={`${rp > 40 ? 'High' : 'Medium/Low'} (${rp}%)`} highlight={rp > 40} />
                  <StatRow label="Fold frequency"  value={`${fp > 50 ? 'Folds a lot' : 'Rarely folds'} (${fp}%)`} />
                  <StatRow label="Pots won"        value={`${st.w} of ${hands.length}`} highlight />
                </div>
              )
            })}
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}

function StatRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '3px 0', borderBottom: '1px solid rgba(30,26,53,.8)' }}>
      <span style={{ color: 'var(--t3)' }}>{label}</span>
      <span style={{ color: highlight ? 'var(--gold)' : 'var(--t2)', fontWeight: 600 }}>{value}</span>
    </div>
  )
}

function SparklineChart({ data, maxV }: { data: { date: string; r: number }[]; maxV: number; positive: boolean }) {
  return (
    <div>
      {/* Zero line label */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--t4)', marginBottom: 6 }}>
        <span>Cumulative P&L per session</span>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>last {data.length}</span>
      </div>
      {/* Bars */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 80, position: 'relative' }}>
        {/* Zero line */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', borderTop: '1px dashed rgba(212,168,67,.15)', zIndex: 0 }} />
        {data.map((d, i) => {
          const isPos = d.r >= 0
          const pct = Math.abs(d.r) / maxV
          const barH = Math.max(4, pct * 36)
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
              {/* Positive bar (top half) */}
              <div style={{ height: 36, display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                {isPos && (
                  <div style={{
                    width: '100%', height: barH,
                    background: 'linear-gradient(180deg,var(--green),rgba(0,232,122,.4))',
                    borderRadius: '3px 3px 0 0',
                    boxShadow: '0 0 6px rgba(0,232,122,.3)',
                  }} />
                )}
              </div>
              {/* Divider */}
              <div style={{ height: 1, width: '100%', background: 'rgba(212,168,67,.12)' }} />
              {/* Negative bar (bottom half) */}
              <div style={{ height: 36, display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                {!isPos && (
                  <div style={{
                    width: '100%', height: barH,
                    background: 'linear-gradient(180deg,rgba(255,51,85,.4),var(--red))',
                    borderRadius: '0 0 3px 3px',
                    boxShadow: '0 0 6px rgba(255,51,85,.3)',
                  }} />
                )}
              </div>
            </div>
          )
        })}
      </div>
      {/* Date labels */}
      <div style={{ display: 'flex', gap: 5, marginTop: 5 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: 'var(--t4)', overflow: 'hidden', textOverflow: 'clip', whiteSpace: 'nowrap' }}>
            {fmtDate(d.date || '').slice(0, 5)}
          </div>
        ))}
      </div>
      {/* Value labels for last point */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10 }}>
        <span style={{ color: 'var(--t4)' }}>
          {data[0] && <span style={{ color: data[0].r >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>Start: {data[0].r >= 0 ? '+' : ''}Rs.{data[0].r.toLocaleString('en-IN')}</span>}
        </span>
        <span>
          {data[data.length - 1] && <span style={{ color: data[data.length - 1].r >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>Now: {data[data.length - 1].r >= 0 ? '+' : ''}Rs.{data[data.length - 1].r.toLocaleString('en-IN')}</span>}
        </span>
      </div>
    </div>
  )
}
