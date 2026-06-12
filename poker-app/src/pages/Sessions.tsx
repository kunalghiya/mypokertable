import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { Avatar } from '../components/Avatar'
import { Button } from '../components/Button'
import { Settlement } from '../components/Settlement'
import { callClaude } from '../lib/claude'
import { buildSessPrompt, rs, fmtDate } from '../lib/utils'
import type { Session } from '../lib/types'

export function Sessions({ onGoLive, onEndSession }: { onGoLive: () => void; onEndSession: (sessId: string) => void }) {
  const sessions = useStore(s => s.sessions)
  const hands = useStore(s => s.hands)
  const players = useStore(s => s.players)
  const households = useStore(s => s.households)
  const apiKey = useStore(s => s.apiKey)
  const aiProfiles = useStore(s => s.aiProfiles)
  const deleteSession = useStore(s => s.deleteSession)
  const saveAiAnalysis = useStore(s => s.saveAiAnalysis)
  const [open, setOpen] = useState<string | null>(null)
  const [aiTexts, setAiTexts] = useState<Record<string, string>>({})
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({})

  if (!sessions.length) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--t3)' }}>
        <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>♦</div>
        <div>No sessions yet.</div>
      </div>
    )
  }

  const runAI = (s: Session) => {
    if (!apiKey || !s.id) return
    const sHands = hands.filter(h => h.sessionId === s.id)
    const prompt = buildSessPrompt(s, sHands, players, sessions, aiProfiles)
    setAiLoading(prev => ({ ...prev, [s.id!]: true }))
    let text = ''
    callClaude(prompt, apiKey,
      chunk => {
        text += chunk
        setAiTexts(prev => ({ ...prev, [s.id!]: text }))
      },
      async () => {
        setAiLoading(prev => ({ ...prev, [s.id!]: false }))
        await saveAiAnalysis(s.id!, text)
      },
      err => {
        setAiLoading(prev => ({ ...prev, [s.id!]: false }))
        setAiTexts(prev => ({ ...prev, [s.id!]: 'Error: ' + err }))
      }
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '14px 14px 0' }}>
      {sessions.map((s, i) => {
        const pl = s.players || players
        const myP = pl.find(p => p.name === 'Kunal') || pl[0]
        const mid = myP?.id || ''
        const r = (s.results && s.results[mid]) || 0
        const isActive = s.status === 'active'
        const sessHands = hands.filter(h => h.sessionId === s.id)
        const isOpen = open === s.id
        const aiText = s.aiAnalysis || aiTexts[s.id || ''] || ''
        const isAiLoading = aiLoading[s.id || '']

        return (
          <div key={s.id || i} style={{
            background: 'var(--card)', border: `1px solid ${isActive ? 'rgba(212,168,67,.35)' : 'var(--border)'}`,
            borderRadius: 18, marginBottom: 10, overflow: 'hidden',
            boxShadow: isActive ? '0 0 0 1px rgba(212,168,67,.1), 0 8px 24px rgba(0,0,0,.3)' : '0 2px 12px rgba(0,0,0,.3)',
          }}>
            {/* Header row */}
            <div
              onClick={() => setOpen(isOpen ? null : (s.id || null))}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {myP && <Avatar player={myP} size="sm" />}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>
                    {fmtDate(s.date || '')}
                    {isActive && <span style={{ fontSize: 9, color: 'var(--gold)', background: 'rgba(212,168,67,.15)', padding: '2px 7px', borderRadius: 10, marginLeft: 6 }}>LIVE</span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--t3)' }}>Rs.{s.buyinAmt || 500}/buyin · {pl.length} players{sessHands.length ? ` · ${sessHands.length} hands` : ''}</div>
                </div>
                {aiText && <span style={{ fontSize: 9, color: 'var(--violet)', background: 'rgba(155,93,229,.15)', padding: '2px 7px', borderRadius: 10 }}>AI</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: isActive ? 'var(--gold)' : r >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700, fontSize: 15 }}>
                  {isActive ? '🎯' : rs(r)}
                </span>
                <span style={{ color: 'var(--t3)', fontSize: 12 }}>{isOpen ? '▲' : '▼'}</span>
                <button onClick={e => { e.stopPropagation(); if (confirm('Delete this session?')) deleteSession(s.id!) }}
                  style={{ background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', fontSize: 14, padding: '4px 6px' }}>✕</button>
              </div>
            </div>

            {/* Body */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: 'easeInOut' }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)' }}>
                    {isActive ? (
                      <>
                        <div style={{ background: 'rgba(212,168,67,.07)', border: '1px solid rgba(212,168,67,.2)', borderRadius: 10, padding: 12, marginBottom: 10 }}>
                          <div style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700, marginBottom: 6 }}>
                            <span className="live-dot" style={{ marginRight: 5 }} />Game in progress
                          </div>
                          {pl.map(p => (
                            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(212,168,67,.08)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Avatar player={p} size="sm" />
                                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{p.name}</span>
                              </div>
                              <span style={{ fontSize: 12, color: 'var(--t3)' }}>{(s.buyins && s.buyins[p.id]) || 1}× buyin</span>
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Button variant="gold" full onClick={onGoLive}>Go Live →</Button>
                          <Button variant="danger" onClick={() => onEndSession(s.id!)}>End Session</Button>
                        </div>
                      </>
                    ) : (
                      <>
                        {pl.map(p => {
                          const pr = (s.results && s.results[p.id]) || 0
                          const note = s.sessionNotes?.[p.id]
                          return (
                            <div key={p.id} style={{ background: 'rgba(0,0,0,.2)', borderRadius: 12, padding: '10px 12px', marginBottom: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Avatar player={p} size="sm" />
                                <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{p.name}{p.isGuest ? ' 👤' : ''}</span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 11, color: 'var(--t3)' }}>{(s.buyins && s.buyins[p.id]) || 1}×</span>
                                    <span style={{ color: pr >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700, fontSize: 14 }}>{rs(pr)}</span>
                                  </div>
                                </div>
                              </div>
                              {note && <div style={{ fontSize: 11, color: 'var(--t3)', fontStyle: 'italic', marginTop: 7, paddingTop: 7, borderTop: '1px solid var(--border)' }}>📝 {note}</div>}
                            </div>
                          )
                        })}
                        <Settlement results={s.results || {}} players={pl} households={households} />
                        {s.notes && <div style={{ background: 'rgba(0,0,0,.2)', borderRadius: 12, padding: '10px 12px', fontSize: 11, fontStyle: 'italic', color: 'var(--t3)', marginTop: 8 }}>📋 {s.notes}</div>}

                        {/* AI Analysis */}
                        {aiText ? (
                          <div style={{ background: 'linear-gradient(135deg,rgba(40,20,120,.12),rgba(100,30,10,.08))', border: '1px solid rgba(155,93,229,.2)', borderRadius: 14, padding: 14, marginTop: 10 }}>
                            <div style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--violet)', marginBottom: 8, fontWeight: 600 }}>⚡ AI Coaching</div>
                            <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{aiText}</div>
                          </div>
                        ) : apiKey && (
                          <Button variant="ai" full onClick={() => runAI(s)} style={{ marginTop: 10 }}>
                            {isAiLoading ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--violet)', fontSize: 12, fontStyle: 'italic' }}>
                                <span className="dot-loader"><span/><span/><span/></span> Analysing…
                              </span>
                            ) : '⚡ Generate AI Coaching'}
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </motion.div>
  )
}
