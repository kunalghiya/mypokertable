import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { Trophy, Crown, Table2 } from 'lucide-react'
import { useStore } from '../store'
import { Avatar } from '../components/Avatar'
import { Card, SectionLabel } from '../components/Card'
import { rs, fmtDateShort } from '../lib/utils'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 340, damping: 28 } } }

const METALS = [
  'oklch(85% 0.14 90)',   // gold
  'oklch(80% 0.015 260)', // silver
  'oklch(70% 0.1 55)',    // bronze
]

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
  const podHeights = podOrder.length === 3 ? [72, 108, 54] : podOrder.length === 2 ? [72, 108] : [108]

  const depKey = totals.map(t => t.tot).join(',')

  useEffect(() => {
    podRefs.current.forEach((el, i) => {
      if (!el) return
      gsap.fromTo(el,
        { height: 0, opacity: 0 },
        { height: podHeights[i], opacity: 1, duration: 0.65, delay: 0.1 + i * 0.1, ease: 'power3.out' }
      )
    })
  }, [depKey])

  useEffect(() => {
    barRefs.current.forEach((el, i) => {
      if (!el) return
      const target = el.dataset.w || '0'
      gsap.fromTo(el, { width: 0 }, { width: target + '%', duration: 0.8, delay: 0.3 + i * 0.05, ease: 'power2.out' })
    })
    numRefs.current.forEach((el, i) => {
      if (!el) return
      const val = parseInt(el.dataset.v || '0')
      const obj = { n: 0 }
      gsap.to(obj, {
        n: Math.abs(val), duration: 1, delay: 0.3 + i * 0.05, ease: 'power2.out',
        onUpdate: () => {
          if (el) el.textContent = (val >= 0 ? '+' : '-') + '₹' + Math.round(obj.n).toLocaleString('en-IN')
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
        <Trophy size={48} strokeWidth={1.4} style={{ color: 'var(--ink-4)', marginBottom: 16 }} />
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', marginBottom: 8, letterSpacing: '-0.02em' }}>No rankings yet</div>
        <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Play some sessions to see the leaderboard.</div>
      </motion.div>
    )
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ padding: '14px 14px 0' }}>

      {/* ── Podium ── */}
      <motion.div variants={item}>
        <div className="panel" style={{
          padding: '24px 20px 0',
          marginBottom: 12,
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 12px 40px oklch(0% 0 0 / 35%)',
        }}>
          <div style={{ position: 'absolute', top: -50, left: '50%', transform: 'translateX(-50%)', width: 300, height: 300, background: 'radial-gradient(circle, oklch(85% 0.14 90 / 6%) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div className="label accent" style={{ justifyContent: 'center', marginBottom: 22 }}>
            <Crown size={13} strokeWidth={2.4} /> All-time rankings
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 10 }}>
            {podOrder.map((p, i) => {
              const pl = players.find(x => x.id === p.id)
              const realRank = totals.indexOf(p)
              const metal = METALS[realRank] || 'var(--ink-3)'
              const isFirst = realRank === 0
              return (
                <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, maxWidth: 120 }}>
                  <div style={{ position: 'relative', marginBottom: 8 }}>
                    {pl && <Avatar player={pl} size={isFirst ? 'lg' : 'md'} />}
                    {isFirst && (
                      <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.5, type: 'spring', stiffness: 300, damping: 16 }}
                        style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', color: METALS[0] }}
                      >
                        <Crown size={17} strokeWidth={2.2} fill="currentColor" />
                      </motion.div>
                    )}
                  </div>
                  <div style={{ fontSize: isFirst ? 13.5 : 12, fontWeight: 700, color: 'var(--ink)', textAlign: 'center', marginBottom: 2 }}>{p.name.split(' ')[0]}</div>
                  <div className="mono" style={{ fontSize: isFirst ? 13 : 11.5, fontWeight: 700, color: p.tot >= 0 ? 'var(--pos)' : 'var(--neg)', marginBottom: 8 }}>{rs(p.tot)}</div>

                  <div
                    ref={el => { podRefs.current[i] = el }}
                    style={{
                      width: '100%', height: podHeights[i],
                      borderRadius: '12px 12px 0 0',
                      background: `linear-gradient(180deg, ${metal.replace(')', ' / 14%)').replace('oklch(', 'oklch(')} 0%, transparent 100%)`,
                      border: '1px solid oklch(100% 0 0 / 8%)',
                      borderBottom: 'none',
                      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                      paddingTop: 10,
                    }}
                  >
                    <span className="mono" style={{ fontSize: 20, fontWeight: 800, color: metal, opacity: 0.85 }}>{realRank + 1}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </motion.div>

      {/* ── Full standings ── */}
      <motion.div variants={item}>
        <Card>
          <SectionLabel accent><Trophy size={13} strokeWidth={2.4} /> Full standings</SectionLabel>
          {totals.map((p, i) => {
            const pl = players.find(x => x.id === p.id)
            const barW = Math.round(Math.abs(p.tot) / maxAbs * 100)
            const rankColor = METALS[i] || 'var(--ink-4)'
            const isPos = p.tot >= 0
            return (
              <div key={p.id} style={{ marginBottom: i < totals.length - 1 ? 15 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span className="mono" style={{ fontSize: 13, fontWeight: 800, width: 20, flexShrink: 0, color: rankColor }}>
                    {i + 1}
                  </span>
                  {pl && <Avatar player={pl} size="sm" />}
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{p.name}</span>
                    <span
                      ref={el => { numRefs.current[i] = el }}
                      data-v={String(p.tot)}
                      className="mono"
                      style={{ fontSize: 14, fontWeight: 700, color: isPos ? 'var(--pos)' : 'var(--neg)' }}
                    >
                      {rs(p.tot)}
                    </span>
                  </div>
                </div>
                <div style={{ marginLeft: 30, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 4, background: 'oklch(100% 0 0 / 6%)', borderRadius: 2, overflow: 'hidden' }}>
                    <div
                      ref={el => { barRefs.current[i] = el }}
                      data-w={String(barW)}
                      style={{
                        height: '100%', width: barW + '%', borderRadius: 2,
                        background: isPos ? 'var(--pos)' : 'var(--neg)',
                        opacity: 0.85,
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{p.cnt} games</span>
                    <span className="mono" style={{ fontSize: 10.5, color: p.wr >= 50 ? 'var(--pos)' : 'var(--ink-3)' }}>{p.wr}% WR</span>
                  </div>
                </div>
              </div>
            )
          })}
        </Card>
      </motion.div>

      {/* ── Session table ── */}
      <motion.div variants={item}>
        <Card style={{ overflowX: 'auto' }}>
          <SectionLabel accent><Table2 size={13} strokeWidth={2.4} /> Session history</SectionLabel>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 280 }}>
            <thead>
              <tr>
                <th style={{ color: 'var(--ink-4)', fontWeight: 600, paddingBottom: 10, textAlign: 'left', fontSize: 10, letterSpacing: '0.07em', textTransform: 'uppercase', borderBottom: '1px solid var(--border)', position: 'sticky', left: 0, background: 'var(--surface)', zIndex: 1 }}>
                  Date
                </th>
                {players.map(p => (
                  <th key={p.id} style={{ color: 'var(--ink-4)', fontWeight: 600, paddingBottom: 10, textAlign: 'right', fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase', borderBottom: '1px solid var(--border)', paddingLeft: 6 }}>
                    {p.name.split(' ')[0]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {done.map((s, i) => (
                <tr key={s.id || i}>
                  <td style={{ padding: '9px 8px 9px 3px', color: 'var(--ink-3)', textAlign: 'left', fontSize: 12, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', position: 'sticky', left: 0, background: 'var(--surface)', zIndex: 1 }}>
                    {fmtDateShort(s.date || '')}
                  </td>
                  {players.map(p => {
                    const r = s.results && s.results[p.id]
                    if (r === undefined) {
                      return <td key={p.id} className="mono" style={{ padding: '9px 3px 9px 6px', textAlign: 'right', color: 'var(--ink-4)', fontSize: 12, borderBottom: '1px solid var(--border)' }}>—</td>
                    }
                    const isPos = r >= 0
                    return (
                      <td key={p.id} className="mono" style={{
                        padding: '9px 3px 9px 6px', textAlign: 'right',
                        fontWeight: 600, fontSize: 12,
                        color: isPos ? 'var(--pos)' : 'var(--neg)',
                        borderBottom: '1px solid var(--border)',
                      }}>
                        {r >= 0 ? '+' : ''}{r.toLocaleString('en-IN')}
                      </td>
                    )
                  })}
                </tr>
              ))}
              <tr>
                <td style={{ padding: '11px 3px 4px', color: 'var(--accent)', fontWeight: 700, fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase', position: 'sticky', left: 0, background: 'var(--surface)', zIndex: 1 }}>Total</td>
                {players.map(p => {
                  const t = done.reduce((sum, s) => sum + ((s.results && s.results[p.id]) || 0), 0)
                  const isPos = t >= 0
                  return (
                    <td key={p.id} className="mono" style={{ padding: '11px 3px 4px 6px', textAlign: 'right', fontWeight: 800, fontSize: 12.5, color: isPos ? 'var(--pos)' : 'var(--neg)' }}>
                      {t >= 0 ? '+' : ''}{t.toLocaleString('en-IN')}
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </Card>
      </motion.div>

    </motion.div>
  )
}
