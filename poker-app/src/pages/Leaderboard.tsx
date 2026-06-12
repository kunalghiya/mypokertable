import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { useStore } from '../store'
import { Avatar } from '../components/Avatar'
import { rs, fmtDate } from '../lib/utils'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 340, damping: 28 } } }

export function Leaderboard() {
  const players = useStore(s => s.players)
  const sessions = useStore(s => s.sessions)
  const podRefs = useRef<(HTMLDivElement | null)[]>([])
  const barRefs = useRef<(HTMLDivElement | null)[]>([])
  const numRefs = useRef<(HTMLSpanElement | null)[]>([])

  const done = sessions.filter(s => s.status !== 'active')

  const totals = players.map(p => {
    let tot = 0, cnt = 0, wins = 0, best = 0
    done.forEach(s => {
      if (s.results && s.results[p.id] !== undefined) {
        cnt++
        const r = s.results[p.id] || 0
        tot += r
        if (r > 0) wins++
        if (r > best) best = r
      }
    })
    return { id: p.id, name: p.name, tot, cnt, wins, best, wr: cnt ? Math.round(wins / cnt * 100) : 0 }
  }).sort((a, b) => b.tot - a.tot)

  const maxAbs = Math.max(1, ...totals.map(t => Math.abs(t.tot)))

  // Podium order: [2nd, 1st, 3rd]
  const top3 = totals.slice(0, 3)
  const podOrder = [top3[1], top3[0], top3[2]].filter(Boolean) as typeof totals[0][]
  const podHeights = [80, 120, 60]
  const podMeta = [
    { medal: '🥈', color: '#b8bec7', glow: 'rgba(184,190,199,.15)', border: 'rgba(184,190,199,.3)' },
    { medal: '🥇', color: '#d4a843', glow: 'rgba(212,168,67,.25)', border: 'rgba(212,168,67,.5)' },
    { medal: '🥉', color: '#cd7f32', glow: 'rgba(205,127,50,.15)', border: 'rgba(205,127,50,.3)' },
  ]

  const depKey = totals.map(t => t.tot).join(',')

  useEffect(() => {
    podRefs.current.forEach((el, i) => {
      if (!el) return
      gsap.fromTo(el,
        { height: 0, opacity: 0 },
        { height: podHeights[i], opacity: 1, duration: 0.7, delay: 0.1 + i * 0.12, ease: 'back.out(1.4)' }
      )
    })
  }, [depKey])

  useEffect(() => {
    barRefs.current.forEach((el, i) => {
      if (!el) return
      const target = el.dataset.w || '0'
      gsap.fromTo(el, { width: 0 }, { width: target + '%', duration: 0.8, delay: 0.35 + i * 0.05, ease: 'power2.out' })
    })
    numRefs.current.forEach((el, i) => {
      if (!el) return
      const val = parseInt(el.dataset.v || '0')
      const obj = { n: 0 }
      gsap.to(obj, {
        n: Math.abs(val), duration: 1, delay: 0.35 + i * 0.05, ease: 'power2.out',
        onUpdate: () => {
          if (el) el.textContent = (val >= 0 ? '+' : '-') + 'Rs.' + Math.round(obj.n).toLocaleString('en-IN')
        }
      })
    })
  }, [depKey])

  if (!done.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 28px', textAlign: 'center' }}
      >
        <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.4 }}>🏆</div>
        <div style={{ fontFamily: 'var(--fs)', fontSize: 20, fontWeight: 700, color: 'var(--t1)', marginBottom: 8 }}>No rankings yet</div>
        <div style={{ fontSize: 13, color: 'var(--t3)' }}>Play some sessions to see the leaderboard.</div>
      </motion.div>
    )
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ padding: '14px 14px 0' }}>

      {/* ── Podium ── */}
      <motion.div variants={item}>
        <div style={{
          background: 'linear-gradient(160deg,#130c2a 0%,#0a0718 60%,#14082a 100%)',
          border: '1px solid rgba(212,168,67,.12)',
          borderRadius: 24, padding: '28px 20px 20px',
          marginBottom: 14,
          boxShadow: '0 8px 48px rgba(0,0,0,.5), inset 0 1px 0 rgba(212,168,67,.08)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Glow bg */}
          <div style={{ position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)', width: 300, height: 300, background: 'radial-gradient(circle,rgba(212,168,67,.07) 0%,transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700, marginBottom: 24, textAlign: 'center' }}>
            ♣ All-Time Rankings
          </div>

          {/* Podium columns */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 10 }}>
            {podOrder.map((p, i) => {
              const pl = players.find(x => x.id === p.id)
              const realRank = totals.indexOf(p)
              const m = podMeta[i]
              return (
                <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, maxWidth: 120 }}>
                  {/* Avatar + medal */}
                  <div style={{ position: 'relative', marginBottom: 8 }}>
                    {pl && <Avatar player={pl} size={i === 1 ? 'lg' : 'md'} />}
                    <div style={{ position: 'absolute', bottom: -4, right: -4, fontSize: 16, lineHeight: 1 }}>{m.medal}</div>
                  </div>
                  <div style={{ fontSize: i === 1 ? 13 : 11, fontWeight: 700, color: 'var(--t1)', textAlign: 'center', marginBottom: 2 }}>{p.name.split(' ')[0]}</div>
                  <div style={{ fontSize: i === 1 ? 13 : 11, fontWeight: 800, color: p.tot >= 0 ? 'var(--green)' : 'var(--red)', fontVariantNumeric: 'tabular-nums', marginBottom: 6 }}>{rs(p.tot)}</div>

                  {/* Podium bar */}
                  <div
                    ref={el => { podRefs.current[i] = el }}
                    style={{
                      width: '100%', height: podHeights[i],
                      borderRadius: '10px 10px 0 0',
                      background: `linear-gradient(180deg,${m.glow.replace('.', '0.')},${m.glow})`.replace('rgba','rgba'),
                      backgroundColor: `rgba(${i === 1 ? '212,168,67' : i === 0 ? '184,190,199' : '205,127,50'},.08)`,
                      border: `1px solid ${m.border}`,
                      borderBottom: 'none',
                      boxShadow: i === 1 ? `0 -8px 30px ${m.glow}` : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <span style={{ fontSize: 22, fontWeight: 900, color: m.color, opacity: 0.6 }}>{realRank + 1}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Podium floor line */}
          <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,rgba(212,168,67,.25),transparent)', borderRadius: 2 }} />
        </div>
      </motion.div>

      {/* ── Full rank list ── */}
      <motion.div variants={item}>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: '18px 16px', marginBottom: 14, boxShadow: '0 4px 24px rgba(0,0,0,.3)' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700, marginBottom: 16 }}>♠ Full Standings</div>
          {totals.map((p, i) => {
            const pl = players.find(x => x.id === p.id)
            const barW = Math.round(Math.abs(p.tot) / maxAbs * 100)
            const rankColors = ['#d4a843', '#b8bec7', '#cd7f32']
            const rankColor = rankColors[i] || 'rgba(255,255,255,.2)'
            const isPos = p.tot >= 0
            return (
              <div key={p.id} style={{ marginBottom: i < totals.length - 1 ? 14 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 900, width: 22, flexShrink: 0, color: rankColor, fontVariantNumeric: 'tabular-nums' }}>
                    {i + 1}
                  </span>
                  {pl && <Avatar player={pl} size="sm" />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{p.name}</span>
                      <span
                        ref={el => { numRefs.current[i] = el }}
                        data-v={String(p.tot)}
                        style={{ fontSize: 14, fontWeight: 800, color: isPos ? 'var(--green)' : 'var(--red)', fontVariantNumeric: 'tabular-nums' }}
                      >
                        {rs(p.tot)}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Bar */}
                <div style={{ marginLeft: 32, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,.05)', borderRadius: 3, overflow: 'hidden' }}>
                    <div
                      ref={el => { barRefs.current[i] = el }}
                      data-w={String(barW)}
                      style={{
                        height: '100%', width: barW + '%', borderRadius: 3,
                        background: isPos
                          ? 'linear-gradient(90deg,rgba(0,232,122,.5),var(--green))'
                          : 'linear-gradient(90deg,rgba(255,51,85,.5),var(--red))',
                        boxShadow: isPos ? '0 0 8px rgba(0,232,122,.4)' : '0 0 8px rgba(255,51,85,.4)',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 10, color: 'var(--t3)' }}>{p.cnt} games</span>
                    <span style={{ fontSize: 10, color: p.wr >= 50 ? 'var(--green)' : 'var(--t3)' }}>{p.wr}% WR</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* ── Session table ── */}
      <motion.div variants={item}>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: '18px 16px', marginBottom: 14, boxShadow: '0 4px 24px rgba(0,0,0,.3)', overflowX: 'auto' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700, marginBottom: 16 }}>♦ Session History</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 280 }}>
            <thead>
              <tr>
                <th style={{ color: 'var(--t4)', fontWeight: 600, paddingBottom: 10, textAlign: 'left', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>
                  Date
                </th>
                {players.map(p => (
                  <th key={p.id} style={{ color: 'var(--t4)', fontWeight: 600, paddingBottom: 10, textAlign: 'right', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid var(--border)', paddingLeft: 6 }}>
                    {p.name.split(' ')[0]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {done.map((s, i) => (
                <tr key={s.id || i}>
                  <td style={{ padding: '9px 3px', color: 'var(--t3)', textAlign: 'left', fontSize: 12, borderBottom: '1px solid rgba(255,255,255,.04)', whiteSpace: 'nowrap' }}>
                    {fmtDate(s.date || '').slice(0, 5)}
                  </td>
                  {players.map(p => {
                    const r = s.results && s.results[p.id]
                    if (r === undefined) {
                      return <td key={p.id} style={{ padding: '9px 3px 9px 6px', textAlign: 'right', color: 'rgba(255,255,255,.1)', fontSize: 12, borderBottom: '1px solid rgba(255,255,255,.04)', fontWeight: 600 }}>—</td>
                    }
                    const isPos = r >= 0
                    return (
                      <td key={p.id} style={{
                        padding: '9px 3px 9px 6px', textAlign: 'right',
                        fontWeight: 700, fontSize: 12,
                        color: isPos ? 'var(--green)' : 'var(--red)',
                        fontVariantNumeric: 'tabular-nums',
                        borderBottom: '1px solid rgba(255,255,255,.04)',
                      }}>
                        <span style={{
                          background: isPos ? 'rgba(0,232,122,.08)' : 'rgba(255,51,85,.08)',
                          padding: '2px 6px', borderRadius: 6,
                          display: 'inline-block',
                        }}>
                          {r >= 0 ? '+' : ''}{r.toLocaleString('en-IN')}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              ))}
              {/* Totals row */}
              <tr>
                <td style={{ padding: '10px 3px 4px', color: 'var(--gold)', fontWeight: 700, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Total</td>
                {players.map(p => {
                  const t = done.reduce((sum, s) => sum + ((s.results && s.results[p.id]) || 0), 0)
                  const isPos = t >= 0
                  return (
                    <td key={p.id} style={{ padding: '10px 3px 4px 6px', textAlign: 'right', fontWeight: 800, fontSize: 13, color: isPos ? 'var(--green)' : 'var(--red)', fontVariantNumeric: 'tabular-nums' }}>
                      {t >= 0 ? '+' : ''}{t.toLocaleString('en-IN')}
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>

    </motion.div>
  )
}
