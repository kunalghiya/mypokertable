import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { Avatar } from '../components/Avatar'
import { Card, SectionLabel } from '../components/Card'
import { Button } from '../components/Button'
import { Settlement } from '../components/Settlement'
import { callClaude } from '../lib/claude'
import { buildSessPrompt, rs, fmtDate } from '../lib/utils'
import { sfx } from '../lib/sounds'
import type { CardObj, Player, Session, StreetData } from '../lib/types'

const ACTS_PRE  = ['Fold', 'Call', 'Raise', 'All-In']
const ACTS_POST = ['Check', 'Fold', 'Call', 'Bet', 'Raise', 'All-In']
const STEPS = ['dealer', 'preflop', 'flop', 'turn', 'river', 'showdown'] as const

const ACT_CLS: Record<string, string> = {
  Fold: 'fold', Call: 'call', Check: 'check', Raise: 'raise', Bet: 'bet', 'All-In': 'allin',
}

// Safe street-data key
function streetKey(street: string) {
  return street === 'preflop' ? 'pre' : street
}

function useDuration(startedAt?: string): string {
  const [elapsed, setElapsed] = useState(0)
  const ref = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    if (!startedAt) { setElapsed(0); return }
    const tick = () => setElapsed(Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000))
    tick()
    ref.current = setInterval(tick, 1000)
    return () => { if (ref.current) clearInterval(ref.current) }
  }, [startedAt])
  const h = Math.floor(elapsed / 3600)
  const m = Math.floor((elapsed % 3600) / 60)
  const s = elapsed % 60
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`
  return `${m}m ${s.toString().padStart(2, '0')}s`
}

function fmtDuration(startedAt?: string, endedAt?: string): string | null {
  if (!startedAt) return null
  const end = endedAt ? new Date(endedAt).getTime() : Date.now()
  const secs = Math.floor((end - new Date(startedAt).getTime()) / 1000)
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function Live({
  onEndSession,
  onCardPick,
}: {
  onEndSession: () => void
  onCardPick: (target: string) => void
}) {
  const lh          = useStore(s => s.lh)
  const sessions    = useStore(s => s.sessions)
  const activeSessId = useStore(s => s.activeSessId)
  const liveBuyins  = useStore(s => s.liveBuyins)
  const hands       = useStore(s => s.hands)
  const households  = useStore(s => s.households)
  const apiKey      = useStore(s => s.apiKey)
  const aiProfiles  = useStore(s => s.aiProfiles)
  const saveAiAnalysis = useStore(s => s.saveAiAnalysis)
  const deleteSession  = useStore(s => s.deleteSession)

  const [aiTexts, setAiTexts]   = useState<Record<string, string>>({})
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({})
  const [openSess, setOpenSess] = useState<string | null>(null)

  const sess = sessions.find(s => s.id === activeSessId)
  const liveDuration = useDuration(sess?.startedAt)

  const setLhStep   = useStore(s => s.setLhStep)
  const setLhDealer = useStore(s => s.setLhDealer)
  const setLhAction = useStore(s => s.setLhAction)
  const setLhAmount = useStore(s => s.setLhAmount)
  const setLhWinner = useStore(s => s.setLhWinner)
  const setLhHcard  = useStore(s => s.setLhHcard)
  const skipHand    = useStore(s => s.skipHand)
  const logHand     = useStore(s => s.logHand)
  const setLiveBuyin         = useStore(s => s.setLiveBuyin)
  const updateLiveBuyins     = useStore(s => s.updateLiveBuyins)
  const removePlayerFromLive = useStore(s => s.removePlayerFromLive)
  const addPlayerToLive      = useStore(s => s.addPlayerToLive)
  const allPlayers           = useStore(s => s.players)

  const [showAddPlayer, setShowAddPlayer] = useState(false)
  const [guestInput, setGuestInput] = useState('')

  const pastSessions = sessions.filter(s => s.status !== 'active')

  const runAI = (s: Session) => {
    if (!apiKey || !s.id) return
    const sHands = hands.filter(h => h.sessionId === s.id)
    const prompt = buildSessPrompt(s, sHands, sessions.flatMap(x => x.players || []).filter((p, i, a) => a.findIndex(q => q.id === p.id) === i), sessions, aiProfiles)
    setAiLoading(prev => ({ ...prev, [s.id!]: true }))
    let text = ''
    callClaude(prompt, apiKey,
      chunk => { text += chunk; setAiTexts(prev => ({ ...prev, [s.id!]: text })) },
      async () => { setAiLoading(prev => ({ ...prev, [s.id!]: false })); await saveAiAnalysis(s.id!, text) },
      err => { setAiLoading(prev => ({ ...prev, [s.id!]: false })); setAiTexts(prev => ({ ...prev, [s.id!]: 'Error: ' + err })) }
    )
  }

  // ── No active session — show empty state + past sessions ───────
  if (!activeSessId || !sess) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '14px 14px 0' }}>
        {/* Empty state when no game running */}
        {!activeSessId && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 28px 28px', textAlign: 'center' }}>
            <motion.div
              animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.08, 1] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ fontSize: 56, marginBottom: 14, color: 'var(--gold)', opacity: 0.7, lineHeight: 1 }}
            >♠</motion.div>
            <div style={{ fontFamily: 'var(--fs)', fontSize: 20, fontWeight: 800, color: 'var(--t1)', marginBottom: 8 }}>No active game</div>
            <div style={{ fontSize: 13, color: 'var(--t3)', lineHeight: 1.7 }}>
              Tap <strong style={{ color: 'var(--gold)' }}>+</strong> in the header to start a session
            </div>
          </div>
        )}
        {/* Past sessions */}
        <PastSessions
          sessions={pastSessions}
          hands={hands}
          households={households}
          apiKey={apiKey}
          aiTexts={aiTexts}
          aiLoading={aiLoading}
          openSess={openSess}
          setOpenSess={setOpenSess}
          onDelete={deleteSession}
          onRunAI={runAI}
        />
      </motion.div>
    )
  }

  const pl = (sess.players || []) as Player[]
  const sessHands = hands.filter(h => h.sessionId === activeSessId)
  const stepIdx = STEPS.indexOf(lh.step as typeof STEPS[number])

  // Safe lh field accessors
  const lhPre   = lh.pre   || {} as StreetData
  const lhFlop  = lh.flop  || {} as StreetData
  const lhTurn  = lh.turn  || {} as StreetData
  const lhRiver = lh.river || {} as StreetData

  const handleRebuy = (id: string, delta: 1 | -1) => {
    const cur = liveBuyins[id] || 1
    setLiveBuyin(id, Math.max(1, cur + delta))
    updateLiveBuyins()
    sfx.rebuy()
  }

  const handleAction = (street: string, pid: string, action: string) => {
    setLhAction(street, pid, action)
    sfx.chip()
    const key = streetKey(street)
    const pre = lh.pre || {}
    const activePl = street === 'preflop'
      ? pl
      : pl.filter(p => !pre[p.id] || pre[p.id].action !== 'Fold')
    const curData = (lh as any)[key] || {}
    const updatedData = { ...curData, [pid]: { action } }
    const allActed = activePl.every(p => updatedData[p.id]?.action)
    if (allActed) {
      const nextStep: Record<string, string> = {
        preflop: 'flop', flop: 'turn', turn: 'river', river: 'showdown',
      }
      const next = nextStep[street]
      if (next) setTimeout(() => { setLhStep(next as any); sfx.card() }, 180)
    }
  }

  const handleWinner = async (id: string) => {
    setLhWinner(id)
    sfx.ding()
    setTimeout(async () => { await logHand(); sfx.shuffle() }, 400)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={{ padding: '14px 14px 0' }}
    >
      {/* ── Session header ── */}
      <div style={{
        background: 'linear-gradient(135deg,rgba(26,16,64,.9),rgba(10,7,24,.9))',
        border: '1px solid rgba(212,168,67,.18)', borderRadius: 18,
        padding: 16, marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 2 }}>
              <span className="live-dot" style={{ marginRight: 5 }} />
              LIVE · {sess.date}
            </div>
            <div style={{ fontSize: 13, color: 'var(--t2)' }}>
              Rs.{sess.buyinAmt || 500}/buyin · {pl.length} players
            </div>
            {sess.startedAt && (
              <div style={{ fontSize: 12, color: 'var(--gold)', marginTop: 4, fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                ⏱ {liveDuration}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--fs)', fontSize: 28, fontWeight: 900, color: 'var(--gold)', lineHeight: 1 }}>
              Rs.{Object.values(liveBuyins).reduce((sum, cnt) => sum + cnt * (sess.buyinAmt || 500), 0).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: 10, color: 'var(--t3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>On Table</div>
            <div style={{ fontFamily: 'var(--fs)', fontSize: 18, fontWeight: 700, color: 'var(--t2)', marginTop: 6, lineHeight: 1 }}>
              #{(lh.count ?? 0) + 1}
            </div>
            <div style={{ fontSize: 10, color: 'var(--t3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 1 }}>Hand</div>
          </div>
        </div>
      </div>

      {/* ── Rebuy Tracker ── */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <SectionLabel gold>♻ Rebuy Tracker</SectionLabel>
        </div>
        {pl.map(p => {
          const cnt = liveBuyins[p.id] || 1
          const inv = cnt * (sess.buyinAmt || 500)
          return (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px',
              background: 'rgba(0,0,0,.2)', border: '1px solid var(--border)',
              borderRadius: 14, marginBottom: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                <Avatar player={p} size="sm" />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>
                    {cnt}× · Rs.{inv.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Stepper value={cnt} onDec={() => handleRebuy(p.id, -1)} onInc={() => handleRebuy(p.id, 1)} />
                <button
                  onClick={() => removePlayerFromLive(p.id)}
                  style={{ width: 28, height: 34, borderRadius: 8, background: 'transparent', border: 'none', color: 'var(--t4)', cursor: 'pointer', fontSize: 14 }}
                >✕</button>
              </div>
            </div>
          )
        })}

        {/* Add late player */}
        {!showAddPlayer ? (
          <button onClick={() => setShowAddPlayer(true)} style={{
            width: '100%', marginTop: 6, padding: '10px 0', borderRadius: 12,
            background: 'none', border: '1.5px dashed var(--border)',
            color: 'var(--t3)', fontSize: 13, fontFamily: 'var(--fb)',
            cursor: 'pointer', transition: '.15s',
          }}>
            + Add Player
          </button>
        ) : (
          <div style={{ marginTop: 8, background: 'rgba(0,0,0,.2)', border: '1px solid var(--border)', borderRadius: 14, padding: 12 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 600, marginBottom: 10 }}>Add to Session</div>
            {/* Existing players not yet in session */}
            {allPlayers.filter(p => !pl.find(sp => sp.id === p.id)).map(p => (
              <button key={p.id} onClick={async () => { await addPlayerToLive(p.id, null); sfx.chip(); setShowAddPlayer(false) }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '7px 4px', borderRadius: 10 }}>
                <Avatar player={p} size="sm" />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{p.name}</span>
              </button>
            ))}
            {/* Guest player input */}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input
                value={guestInput}
                onChange={e => setGuestInput(e.target.value)}
                placeholder="Guest name…"
                onKeyDown={async e => { if (e.key === 'Enter' && guestInput.trim()) { await addPlayerToLive(null, guestInput.trim()); sfx.chip(); setGuestInput(''); setShowAddPlayer(false) }}}
                style={{ flex: 1 }}
              />
              <Button variant="gold" size="sm" onClick={async () => { if (guestInput.trim()) { await addPlayerToLive(null, guestInput.trim()); sfx.chip(); setGuestInput(''); setShowAddPlayer(false) }}}>Add</Button>
            </div>
            <button onClick={() => { setShowAddPlayer(false); setGuestInput('') }} style={{ width: '100%', marginTop: 8, background: 'none', border: 'none', color: 'var(--t3)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--fb)' }}>Cancel</button>
          </div>
        )}
      </Card>

      {/* ── Hand Logger ── */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <SectionLabel gold>Hand Logger</SectionLabel>
          <Button variant="ghost" size="sm" onClick={() => { skipHand(); sfx.shuffle() }}>Skip Hand</Button>
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
          {STEPS.map((s, i) => (
            <div key={s} className={`street-segment ${i < stepIdx ? 'done' : i === stepIdx ? 'active' : ''}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={lh.step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15 }}
          >
            {lh.step === 'dealer' && (
              <StepDealer pl={pl} dealer={lh.dealer}
                onSelect={id => { setLhDealer(id); sfx.card() }}
                onNext={() => { setLhStep('preflop'); sfx.card() }}
              />
            )}
            {lh.step === 'preflop' && (
              <StepActions street="preflop" label="Preflop" acts={ACTS_PRE}
                data={lhPre} pl={pl} preFolds={{}}
                onAction={handleAction} onAmount={setLhAmount}
                onBack={() => setLhStep('dealer')}
                onNext={() => { setLhStep('flop'); sfx.card() }}
              />
            )}
            {lh.step === 'flop' && (
              <StepFlop pl={pl} fc={lh.fc || [null, null, null]} flopData={lhFlop} preFolds={lhPre}
                onAction={handleAction} onAmount={setLhAmount} onCardPick={onCardPick}
                onBack={() => setLhStep('preflop')}
                onNext={() => { setLhStep('turn'); sfx.card() }}
              />
            )}
            {lh.step === 'turn' && (
              <StepStreet street="turn" label="Turn" card={lh.tc}
                streetData={lhTurn} preFolds={lhPre} pl={pl}
                onAction={handleAction} onAmount={setLhAmount} onCardPick={onCardPick}
                onBack={() => setLhStep('flop')}
                onNext={() => { setLhStep('river'); sfx.card() }}
              />
            )}
            {lh.step === 'river' && (
              <StepStreet street="river" label="River" card={lh.rc}
                streetData={lhRiver} preFolds={lhPre} pl={pl}
                onAction={handleAction} onAmount={setLhAmount} onCardPick={onCardPick}
                onBack={() => setLhStep('turn')}
                onNext={() => setLhStep('showdown')}
              />
            )}
            {lh.step === 'showdown' && (
              <StepShowdown pl={pl} preFolds={lhPre} winner={lh.winner}
                hcards={lh.hcards || {}}
                onWinner={handleWinner} onHcard={setLhHcard}
                onBack={() => setLhStep('river')}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </Card>

      {/* ── End session ── */}
      <Button variant="danger" full onClick={onEndSession} style={{ marginBottom: 12 }}>
        ⏹ End Session &amp; Enter Cashouts
      </Button>

      {/* ── Logged hands ── */}
      {sessHands.length > 0 && (
        <Card>
          <SectionLabel gold>📝 Logged Hands ({sessHands.length})</SectionLabel>
          {sessHands.slice(0, 8).map((hand, idx) => (
            <HandLog key={hand.id || idx} hand={hand} idx={idx} pl={pl} />
          ))}
          {sessHands.length > 8 && (
            <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center', padding: 6 }}>
              + {sessHands.length - 8} more
            </div>
          )}
        </Card>
      )}

      {/* ── Past sessions ── */}
      {pastSessions.length > 0 && (
        <div style={{ marginTop: 4 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--t3)', fontWeight: 600, padding: '8px 2px 6px' }}>Past Sessions</div>
          <PastSessions
            sessions={pastSessions}
            hands={hands}
            households={households}
            apiKey={apiKey}
            aiTexts={aiTexts}
            aiLoading={aiLoading}
            openSess={openSess}
            setOpenSess={setOpenSess}
            onDelete={deleteSession}
            onRunAI={runAI}
          />
        </div>
      )}
    </motion.div>
  )
}

/* ── Past Sessions list ─────────────────────────────────────── */

function PastSessions({
  sessions, hands, households, apiKey, aiTexts, aiLoading, openSess, setOpenSess, onDelete, onRunAI,
}: {
  sessions: Session[]
  hands: any[]
  households: [string, string][]
  apiKey: string
  aiTexts: Record<string, string>
  aiLoading: Record<string, boolean>
  openSess: string | null
  setOpenSess: (id: string | null) => void
  onDelete: (id: string) => void
  onRunAI: (s: Session) => void
}) {
  if (!sessions.length) return null
  return (
    <div>
      {sessions.map((s, i) => {
        const pl = s.players || []
        const myP = pl.find(p => p.name === 'Kunal') || pl[0]
        const mid = myP?.id || ''
        const r = (s.results && s.results[mid]) || 0
        const sessHands = hands.filter(h => h.sessionId === s.id)
        const isOpen = openSess === s.id
        const aiText = s.aiAnalysis || aiTexts[s.id || ''] || ''
        const isAiLoading = aiLoading[s.id || '']
        const duration = fmtDuration(s.startedAt, s.endedAt)

        return (
          <div key={s.id || i} style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 18, marginBottom: 10, overflow: 'hidden',
            boxShadow: '0 2px 12px rgba(0,0,0,.3)',
          }}>
            <div
              onClick={() => setOpenSess(isOpen ? null : (s.id || null))}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {myP && <Avatar player={myP} size="sm" />}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{fmtDate(s.date || '')}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)' }}>
                    Rs.{s.buyinAmt || 500}/buyin · {pl.length} players
                    {sessHands.length ? ` · ${sessHands.length} hands` : ''}
                    {duration ? ` · ${duration}` : ''}
                  </div>
                </div>
                {aiText && <span style={{ fontSize: 9, color: 'var(--violet)', background: 'rgba(155,93,229,.15)', padding: '2px 7px', borderRadius: 10 }}>AI</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: r >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700, fontSize: 15 }}>{rs(r)}</span>
                <span style={{ color: 'var(--t3)', fontSize: 12 }}>{isOpen ? '▲' : '▼'}</span>
                <button onClick={e => { e.stopPropagation(); if (confirm('Delete this session?')) onDelete(s.id!) }}
                  style={{ background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', fontSize: 14, padding: '4px 6px' }}>✕</button>
              </div>
            </div>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: 'easeInOut' }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)' }}>
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
                    {aiText ? (
                      <div style={{ background: 'linear-gradient(135deg,rgba(40,20,120,.12),rgba(100,30,10,.08))', border: '1px solid rgba(155,93,229,.2)', borderRadius: 14, padding: 14, marginTop: 10 }}>
                        <div style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--violet)', marginBottom: 8, fontWeight: 600 }}>⚡ AI Coaching</div>
                        <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{aiText}</div>
                      </div>
                    ) : apiKey && (
                      <Button variant="ai" full onClick={() => onRunAI(s)} style={{ marginTop: 10 }}>
                        {isAiLoading ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--violet)', fontSize: 12, fontStyle: 'italic' }}>
                            <span className="dot-loader"><span/><span/><span/></span> Analysing…
                          </span>
                        ) : '⚡ Generate AI Coaching'}
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

/* ── Sub-steps — all receive plain props, no useStore calls ── */

function StepDealer({ pl, dealer, onSelect, onNext }: {
  pl: Player[]; dealer: string | null
  onSelect: (id: string) => void; onNext: () => void
}) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--fs)', fontSize: 17, fontWeight: 700, color: 'var(--t1)', marginBottom: 14, fontStyle: 'italic' }}>
        ♠ Who is dealing?
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6, marginBottom: 14 }}>
        {pl.map(p => (
          <button key={p.id} onClick={() => onSelect(p.id)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 2px', borderRadius: 12 }}>
            <Avatar player={p} size="md" selected={dealer === p.id} />
            <span style={{ fontSize: 10, color: dealer === p.id ? 'var(--gold)' : 'var(--t3)', textAlign: 'center', lineHeight: 1.2, fontWeight: dealer === p.id ? 700 : 400 }}>
              {p.name.split(' ')[0]}
            </span>
            {dealer === p.id && <span style={{ fontSize: 9, color: 'var(--gold)' }}>●</span>}
          </button>
        ))}
      </div>
      <Button variant="gold" full onClick={onNext}>Preflop →</Button>
    </div>
  )
}

const BET_CHIPS = [10, 20, 50, 100]

function AmountPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const num = Number(value) || 0
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {BET_CHIPS.map(chip => (
          <button key={chip} onClick={() => onChange(String(num + chip))}
            style={{
              fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 8,
              cursor: 'pointer', fontFamily: 'var(--fb)', transition: '.12s',
              background: 'rgba(212,168,67,.1)',
              border: '1px solid rgba(212,168,67,.3)',
              color: 'var(--gold)',
            }}>
            +{chip}
          </button>
        ))}
        {num > 0 && (
          <button onClick={() => onChange('0')}
            style={{
              fontSize: 11, fontWeight: 700, padding: '5px 8px', borderRadius: 8,
              cursor: 'pointer', fontFamily: 'var(--fb)',
              background: 'rgba(255,51,85,.08)', border: '1px solid rgba(255,51,85,.2)',
              color: 'var(--red)',
            }}>
            ✕
          </button>
        )}
      </div>
      {num > 0 && (
        <div style={{ textAlign: 'right', marginTop: 4, fontSize: 13, fontWeight: 800, color: 'var(--gold)', fontVariantNumeric: 'tabular-nums' }}>
          Rs.{num}
        </div>
      )}
    </div>
  )
}

function StepActions({ street, label, acts, data, pl, preFolds, onAction, onAmount, onBack, onNext }: {
  street: string; label: string; acts: string[]
  data: StreetData; pl: Player[]; preFolds: StreetData
  onAction: (s: string, p: string, a: string) => void
  onAmount: (s: string, p: string, v: string) => void
  onBack: () => void; onNext: () => void
}) {
  const isPre = street === 'preflop'
  const activePl = isPre ? pl : pl.filter(p => !preFolds[p.id] || preFolds[p.id].action !== 'Fold')

  return (
    <div>
      <div style={{ fontFamily: 'var(--fs)', fontSize: 17, fontWeight: 700, color: 'var(--t1)', marginBottom: 14, fontStyle: 'italic' }}>
        {label}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {activePl.map(p => {
          const cur = data[p.id] || { action: isPre ? 'Call' : 'Check' }
          const showAmt = cur.action === 'Raise' || cur.action === 'Bet' || cur.action === 'All-In'
          return (
            <div key={p.id} style={{ background: 'rgba(0,0,0,.2)', border: '1px solid var(--border)', borderRadius: 14, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: showAmt ? 4 : 0 }}>
                <Avatar player={p} size="sm" />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.name.split(' ')[0]}
                </span>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {acts.map(a => {
                    const active = cur.action === a
                    const cls = ACT_CLS[a] || 'check'
                    return (
                      <button key={a} onClick={() => onAction(street, p.id, a)}
                        className={active ? `chip-${cls}` : ''}
                        style={{
                          fontSize: 11, fontWeight: 600, padding: '6px 9px', borderRadius: 8,
                          cursor: 'pointer', fontFamily: 'var(--fb)', transition: '.15s',
                          background: active ? undefined : 'rgba(0,0,0,.3)',
                          border: active ? undefined : '1px solid var(--border)',
                          color: active ? undefined : 'var(--t3)',
                        }}>
                        {a}
                      </button>
                    )
                  })}
                </div>
              </div>
              {showAmt && (
                <AmountPicker
                  value={cur.amount || '0'}
                  onChange={v => onAmount(street, p.id, v)}
                />
              )}
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant="ghost" style={{ flex: 1 }} onClick={onBack}>← Back</Button>
        <Button variant="gold"  style={{ flex: 2 }} onClick={onNext}>
          {street === 'river' ? 'Showdown' : 'Next'} →
        </Button>
      </div>
    </div>
  )
}

function StepFlop({ pl, fc, flopData, preFolds, onAction, onAmount, onCardPick, onBack, onNext }: {
  pl: Player[]; fc: (CardObj | null)[]
  flopData: StreetData; preFolds: StreetData
  onAction: (s: string, p: string, a: string) => void
  onAmount: (s: string, p: string, v: string) => void
  onCardPick: (t: string) => void
  onBack: () => void; onNext: () => void
}) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--fs)', fontSize: 17, fontWeight: 700, color: 'var(--t1)', marginBottom: 14, fontStyle: 'italic' }}>Flop Cards</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[0, 1, 2].map(i => (
          <PlayingCard key={i} card={fc[i] ?? null} onClick={() => { onCardPick('flop-' + i); sfx.card() }} />
        ))}
      </div>
      <StepActions street="flop" label="Flop Actions" acts={ACTS_POST}
        data={flopData} pl={pl} preFolds={preFolds}
        onAction={onAction} onAmount={onAmount} onBack={onBack} onNext={onNext}
      />
    </div>
  )
}

function StepStreet({ street, label, card, streetData, preFolds, pl, onAction, onAmount, onCardPick, onBack, onNext }: {
  street: string; label: string; card: CardObj | null
  streetData: StreetData; preFolds: StreetData; pl: Player[]
  onAction: (s: string, p: string, a: string) => void
  onAmount: (s: string, p: string, v: string) => void
  onCardPick: (t: string) => void
  onBack: () => void; onNext: () => void
}) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--fs)', fontSize: 17, fontWeight: 700, color: 'var(--t1)', marginBottom: 14, fontStyle: 'italic' }}>{label} Card</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        <PlayingCard card={card} onClick={() => { onCardPick(street); sfx.card() }} />
      </div>
      <StepActions street={street} label={`${label} Actions`} acts={ACTS_POST}
        data={streetData} pl={pl} preFolds={preFolds}
        onAction={onAction} onAmount={onAmount} onBack={onBack} onNext={onNext}
      />
    </div>
  )
}

function StepShowdown({ pl, preFolds, winner, hcards, onWinner, onHcard, onBack }: {
  pl: Player[]; preFolds: StreetData; winner: string | null
  hcards: Record<string, string>
  onWinner: (id: string) => void
  onHcard: (pid: string, val: string) => void
  onBack: () => void
}) {
  const activePl = pl.filter(p => !preFolds[p.id] || preFolds[p.id].action !== 'Fold')
  return (
    <div>
      <div style={{ fontFamily: 'var(--fs)', fontSize: 17, fontWeight: 700, color: 'var(--t1)', marginBottom: 14, fontStyle: 'italic' }}>🏆 Who won?</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6, marginBottom: 14 }}>
        {activePl.map(p => (
          <motion.button key={p.id} onClick={() => onWinner(p.id)} whileTap={{ scale: 0.93 }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              background: winner === p.id ? 'rgba(212,168,67,.12)' : 'rgba(0,0,0,.2)',
              border: winner === p.id ? '1px solid var(--gold)' : '1px solid var(--border)',
              borderRadius: 12, padding: '8px 4px', cursor: 'pointer',
              boxShadow: winner === p.id ? '0 0 14px rgba(212,168,67,.25)' : 'none',
              transition: 'all .18s',
            }}>
            <Avatar player={p} size="sm" selected={winner === p.id} />
            <span style={{ fontSize: 10, color: winner === p.id ? 'var(--gold)' : 'var(--t3)', textAlign: 'center' }}>
              {p.name.split(' ')[0]}
            </span>
            {winner === p.id && <span style={{ fontSize: 10 }}>🏆</span>}
          </motion.button>
        ))}
      </div>
      <div style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8, fontWeight: 600 }}>
        Hole cards (optional)
      </div>
      {pl.map(p => (
        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, padding: '8px 10px', background: 'rgba(0,0,0,.2)', border: '1px solid var(--border)', borderRadius: 12 }}>
          <Avatar player={p} size="sm" />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)', flex: 1 }}>{p.name.split(' ')[0]}</span>
          <input style={{ width: 110, fontSize: 12, padding: '6px 8px' }}
            placeholder="A♠ K♥" defaultValue={hcards[p.id] || ''}
            onChange={e => onHcard(p.id, e.target.value)} />
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <Button variant="ghost" style={{ flex: 1 }} onClick={onBack}>←</Button>
      </div>
      <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center', marginTop: 10, fontStyle: 'italic' }}>
        Tap a player above to log winner &amp; auto-save
      </div>
    </div>
  )
}

function PlayingCard({ card, onClick }: { card: CardObj | null; onClick: () => void }) {
  return (
    <div
      className={`playing-card ${card ? 'filled ' + (card.r ? 'red-suit' : 'black-suit') : 'empty'}`}
      onClick={onClick}
    >
      {card ? (
        <>
          <div style={{ fontSize: 14, fontWeight: 900, lineHeight: 1 }}>{card.v}</div>
          <div style={{ fontSize: 11, lineHeight: 1 }}>{card.s}</div>
        </>
      ) : '+'}
    </div>
  )
}

function Stepper({ value, onDec, onInc }: { value: number; onDec: () => void; onInc: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(0,0,0,.3)', border: '1px solid var(--border)', borderRadius: 10, padding: 3 }}>
      <button onClick={onDec} style={{ width: 32, height: 32, borderRadius: 7, background: 'rgba(212,168,67,.12)', border: 'none', color: 'var(--gold)', fontSize: 20, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
      <span style={{ width: 26, textAlign: 'center', fontSize: 15, fontWeight: 700, color: 'var(--t1)', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      <button onClick={onInc} style={{ width: 32, height: 32, borderRadius: 7, background: 'rgba(212,168,67,.12)', border: 'none', color: 'var(--gold)', fontSize: 20, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
    </div>
  )
}

function HandLog({ hand, idx, pl }: { hand: any; idx: number; pl: Player[] }) {
  const name = (id: string) => pl.find(p => p.id === id)?.name || id
  const allCards = [...(hand.fc || []).filter(Boolean), hand.tc, hand.rc].filter(Boolean) as CardObj[]
  const streets: [string, string][] = [['pre', 'PREFLOP'], ['flop', 'FLOP'], ['turn', 'TURN'], ['river', 'RIVER']]
  const actCls: Record<string, string> = { fold: 'chip-fold', call: 'chip-call', check: 'chip-check', raise: 'chip-raise', bet: 'chip-bet', allin: 'chip-allin' }

  return (
    <div style={{ background: 'rgba(0,0,0,.15)', borderRadius: 12, padding: '10px 12px', marginBottom: 6, fontSize: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 11, color: 'var(--t3)' }}>
        <span>Hand #{hand.handNumber || idx + 1}</span>
        {hand.dealer && <span>{name(hand.dealer)} deals</span>}
      </div>
      {allCards.length > 0 && (
        <div style={{ display: 'flex', gap: 3, margin: '3px 0' }}>
          {allCards.map((c, i) => (
            <span key={i} style={{ padding: '2px 5px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: '#f5f0e8', color: c.r ? '#d42020' : '#0d0c18', display: 'inline-block' }}>
              {c.v}{c.s}
            </span>
          ))}
        </div>
      )}
      {streets.map(([k, lbl]) => {
        const sd = (hand as any)[k]
        if (!sd || !Object.keys(sd).length) return null
        return (
          <div key={k}>
            <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', margin: '5px 0 2px', fontWeight: 600 }}>{lbl}</div>
            {Object.keys(sd).map(pid => {
              const act = sd[pid]
              if (!act?.action) return null
              const a = act.action.toLowerCase().replace(/-/g, '')
              return (
                <span key={pid} className={actCls[a] || 'chip-check'}
                  style={{ display: 'inline-flex', alignItems: 'center', fontSize: 10, padding: '2px 7px', borderRadius: 8, margin: '2px 2px 0 0', fontWeight: 500 }}>
                  {name(pid).split(' ')[0]} {act.action}{act.amount ? ' Rs.' + act.amount : ''}
                </span>
              )
            })}
          </div>
        )
      })}
      {hand.winner && (
        <div style={{ background: 'rgba(212,168,67,.16)', color: 'var(--gold)', fontSize: 10, padding: '3px 8px', borderRadius: 8, fontWeight: 600, display: 'inline-block', marginTop: 4 }}>
          🏆 {name(hand.winner)} won{hand.hcards?.[hand.winner] ? ` (${hand.hcards[hand.winner]})` : ''}
        </div>
      )}
    </div>
  )
}
