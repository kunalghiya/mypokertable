import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Spade, Timer, X, Plus, ArrowLeft, ArrowRight, Trophy, Sparkles,
  ChevronDown, NotebookPen, ClipboardList, Square, UserPlus, History, Minus,
} from 'lucide-react'
import { useStore } from '../store'
import { Avatar } from '../components/Avatar'
import { Card, SectionLabel } from '../components/Card'
import { Button } from '../components/Button'
import { Settlement } from '../components/Settlement'
import { callClaude } from '../lib/claude'
import { buildSessPrompt, rs, inr, fmtDate } from '../lib/utils'
import { sfx } from '../lib/sounds'
import type { CardObj, Player, Session, StreetData } from '../lib/types'

const ACTS_PRE  = ['Fold', 'Call', 'Raise', 'All-In']
const ACTS_POST = ['Check', 'Fold', 'Call', 'Bet', 'Raise', 'All-In']
const STEPS = ['dealer', 'preflop', 'flop', 'turn', 'river', 'showdown'] as const

const ACT_CLS: Record<string, string> = {
  Fold: 'fold', Call: 'call', Check: 'check', Raise: 'raise', Bet: 'bet', 'All-In': 'allin',
}

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

  // ── No active session — empty state + past sessions ───────
  if (!activeSessId || !sess) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '14px 14px 0' }}>
        {!activeSessId && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '38px 28px 26px', textAlign: 'center' }}>
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: 64, height: 64, borderRadius: 20, marginBottom: 16,
                background: 'var(--accent-dim)', border: '1px solid var(--accent-line)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--accent)',
              }}
            >
              <Spade size={28} strokeWidth={2} fill="currentColor" />
            </motion.div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', marginBottom: 7, letterSpacing: '-0.02em' }}>No active game</div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.7 }}>
              Tap <strong style={{ color: 'var(--accent)' }}>+ Session</strong> in the header to start
            </div>
          </div>
        )}
        {pastSessions.length > 0 && (
          <div className="label" style={{ padding: '4px 2px 10px' }}><History size={12} strokeWidth={2.4} /> Past sessions</div>
        )}
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

  const onTable = Object.values(liveBuyins).reduce((sum, cnt) => sum + cnt * (sess.buyinAmt || 500), 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={{ padding: '14px 14px 0' }}
    >
      {/* ── Session header ── */}
      <div className="panel" style={{
        borderColor: 'var(--live-line)',
        padding: 16, marginBottom: 12,
        boxShadow: '0 8px 32px oklch(0% 0 0 / 30%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--live)', fontWeight: 700, marginBottom: 5 }}>
              <span className="live-dot" /> Live
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{fmtDate(sess.date)}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
              {inr(sess.buyinAmt || 500)}/buyin · {pl.length} players
            </div>
            {sess.startedAt && (
              <div className="mono" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--live)', marginTop: 6, fontWeight: 600 }}>
                <Timer size={13} strokeWidth={2.4} /> {liveDuration}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div className="mono" style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)', lineHeight: 1 }}>
              {inr(onTable)}
            </div>
            <div style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 3, fontWeight: 600 }}>On table</div>
            <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)', marginTop: 8, lineHeight: 1 }}>
              #{(lh.count ?? 0) + 1}
            </div>
            <div style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2, fontWeight: 600 }}>Hand</div>
          </div>
        </div>
      </div>

      {/* ── Rebuy tracker ── */}
      <Card>
        <SectionLabel accent><Plus size={13} strokeWidth={2.6} /> Rebuy tracker</SectionLabel>
        {pl.map(p => {
          const cnt = liveBuyins[p.id] || 1
          const inv = cnt * (sess.buyinAmt || 500)
          return (
            <div key={p.id} className="row" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '11px 13px', marginBottom: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                <Avatar player={p} size="sm" />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{p.name}</div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                    {cnt}× · {inr(inv)}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Stepper value={cnt} onDec={() => handleRebuy(p.id, -1)} onInc={() => handleRebuy(p.id, 1)} />
                <button
                  onClick={() => removePlayerFromLive(p.id)}
                  aria-label={`Remove ${p.name}`}
                  style={{ width: 30, height: 36, borderRadius: 8, background: 'transparent', border: 'none', color: 'var(--ink-4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                ><X size={15} strokeWidth={2.2} /></button>
              </div>
            </div>
          )
        })}

        {/* Add late player */}
        {!showAddPlayer ? (
          <Button variant="dashed" size="md" onClick={() => setShowAddPlayer(true)} style={{ marginTop: 4, borderRadius: 12 }}>
            <UserPlus size={15} strokeWidth={2.2} /> Add player
          </Button>
        ) : (
          <div className="row" style={{ marginTop: 8, padding: 12 }}>
            <div className="label accent" style={{ marginBottom: 10 }}>Add to session</div>
            {allPlayers.filter(p => !pl.find(sp => sp.id === p.id)).map(p => (
              <button key={p.id} onClick={async () => { await addPlayerToLive(p.id, null); sfx.chip(); setShowAddPlayer(false) }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '7px 4px', borderRadius: 10, fontFamily: 'var(--fb)' }}>
                <Avatar player={p} size="sm" />
                <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{p.name}</span>
              </button>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input
                value={guestInput}
                onChange={e => setGuestInput(e.target.value)}
                placeholder="Guest name…"
                onKeyDown={async e => { if (e.key === 'Enter' && guestInput.trim()) { await addPlayerToLive(null, guestInput.trim()); sfx.chip(); setGuestInput(''); setShowAddPlayer(false) }}}
                style={{ flex: 1 }}
              />
              <Button variant="primary" size="sm" style={{ minHeight: 44 }} onClick={async () => { if (guestInput.trim()) { await addPlayerToLive(null, guestInput.trim()); sfx.chip(); setGuestInput(''); setShowAddPlayer(false) }}}>Add</Button>
            </div>
            <button onClick={() => { setShowAddPlayer(false); setGuestInput('') }} style={{ width: '100%', marginTop: 10, background: 'none', border: 'none', color: 'var(--ink-3)', fontSize: 12.5, cursor: 'pointer', fontFamily: 'var(--fb)', fontWeight: 500 }}>Cancel</button>
          </div>
        )}
      </Card>

      {/* ── Hand logger ── */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <SectionLabel accent><Spade size={13} strokeWidth={2.4} /> Hand logger</SectionLabel>
          <Button variant="ghost" size="sm" onClick={() => { skipHand(); sfx.shuffle() }}>Skip hand</Button>
        </div>

        {/* Street progress */}
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
            transition={{ duration: 0.16, ease: 'easeOut' }}
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
        <Square size={14} strokeWidth={2.4} /> End session &amp; enter cashouts
      </Button>

      {/* ── Logged hands ── */}
      {sessHands.length > 0 && (
        <Card>
          <SectionLabel accent><ClipboardList size={13} strokeWidth={2.4} /> Logged hands ({sessHands.length})</SectionLabel>
          {sessHands.slice(0, 8).map((hand, idx) => (
            <HandLog key={hand.id || idx} hand={hand} idx={idx} pl={pl} />
          ))}
          {sessHands.length > 8 && (
            <div style={{ fontSize: 11.5, color: 'var(--ink-3)', textAlign: 'center', padding: 6 }}>
              + {sessHands.length - 8} more
            </div>
          )}
        </Card>
      )}

      {/* ── Past sessions ── */}
      {pastSessions.length > 0 && (
        <div style={{ marginTop: 4 }}>
          <div className="label" style={{ padding: '8px 2px 10px' }}><History size={12} strokeWidth={2.4} /> Past sessions</div>
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
          <div key={s.id || i} className="panel" style={{ marginBottom: 10, overflow: 'hidden' }}>
            <div
              onClick={() => setOpenSess(isOpen ? null : (s.id || null))}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 15px', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                {myP && <Avatar player={myP} size="sm" />}
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{fmtDate(s.date || '')}</span>
                    {aiText && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9, fontWeight: 700, color: 'oklch(80% 0.12 300)', background: 'oklch(75% 0.14 300 / 12%)', padding: '2px 7px', borderRadius: 10 }}>
                        <Sparkles size={9} strokeWidth={2.4} /> AI
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {inr(s.buyinAmt || 500)}/buyin · {pl.length} players
                    {sessHands.length ? ` · ${sessHands.length} hands` : ''}
                    {duration ? ` · ${duration}` : ''}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <span className="mono" style={{ color: r >= 0 ? 'var(--pos)' : 'var(--neg)', fontWeight: 700, fontSize: 14 }}>{rs(r)}</span>
                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ color: 'var(--ink-3)', display: 'flex' }}
                >
                  <ChevronDown size={15} strokeWidth={2.2} />
                </motion.span>
              </div>
            </div>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: 'easeInOut' }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ padding: '14px 15px', borderTop: '1px solid var(--border)' }}>
                    {pl.map(p => {
                      const pr = (s.results && s.results[p.id]) || 0
                      const note = s.sessionNotes?.[p.id]
                      return (
                        <div key={p.id} className="row" style={{ padding: '10px 12px', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Avatar player={p} size="sm" />
                            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{p.name}{p.isGuest ? ' (guest)' : ''}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{(s.buyins && s.buyins[p.id]) || 1}×</span>
                                <span className="mono" style={{ color: pr >= 0 ? 'var(--pos)' : 'var(--neg)', fontWeight: 700, fontSize: 13.5 }}>{rs(pr)}</span>
                              </div>
                            </div>
                          </div>
                          {note && <div style={{ display: 'flex', gap: 6, fontSize: 11.5, color: 'var(--ink-3)', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)', lineHeight: 1.5 }}><NotebookPen size={12} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} /> {note}</div>}
                        </div>
                      )
                    })}
                    <Settlement results={s.results || {}} players={pl} households={households} />
                    {s.notes && <div className="row" style={{ display: 'flex', gap: 6, padding: '10px 12px', fontSize: 11.5, color: 'var(--ink-3)', marginTop: 8, lineHeight: 1.5 }}><ClipboardList size={12} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} /> {s.notes}</div>}
                    {aiText ? (
                      <div style={{ background: 'oklch(75% 0.14 300 / 7%)', border: '1px solid oklch(75% 0.14 300 / 22%)', borderRadius: 14, padding: 14, marginTop: 10 }}>
                        <div className="label" style={{ color: 'oklch(80% 0.12 300)', marginBottom: 8 }}><Sparkles size={12} strokeWidth={2.4} /> AI coaching</div>
                        <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{aiText}</div>
                      </div>
                    ) : apiKey && (
                      <Button variant="ai" full onClick={() => onRunAI(s)} style={{ marginTop: 10 }}>
                        {isAiLoading ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                            <span className="dot-loader"><span/><span/><span/></span> Analysing…
                          </span>
                        ) : (<><Sparkles size={14} strokeWidth={2.2} /> Generate AI coaching</>)}
                      </Button>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); if (confirm('Delete this session?')) onDelete(s.id!) }}
                      style={{ width: '100%', marginTop: 12, background: 'none', border: 'none', color: 'var(--neg)', opacity: 0.75, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'var(--fb)', padding: 6 }}
                    >
                      Delete session
                    </button>
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

/* ── Sub-steps ── */

function StepTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 14, letterSpacing: '-0.02em' }}>
      {children}
    </div>
  )
}

function StepDealer({ pl, dealer, onSelect, onNext }: {
  pl: Player[]; dealer: string | null
  onSelect: (id: string) => void; onNext: () => void
}) {
  return (
    <div>
      <StepTitle>Who is dealing?</StepTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6, marginBottom: 14 }}>
        {pl.map(p => (
          <motion.button key={p.id} onClick={() => onSelect(p.id)} whileTap={{ scale: 0.92 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 2px', borderRadius: 12, fontFamily: 'var(--fb)' }}>
            <Avatar player={p} size="md" selected={dealer === p.id} />
            <span style={{ fontSize: 10.5, color: dealer === p.id ? 'var(--accent)' : 'var(--ink-3)', textAlign: 'center', lineHeight: 1.2, fontWeight: dealer === p.id ? 700 : 500 }}>
              {p.name.split(' ')[0]}
            </span>
          </motion.button>
        ))}
      </div>
      <Button variant="primary" full onClick={onNext}>Preflop <ArrowRight size={15} strokeWidth={2.4} /></Button>
    </div>
  )
}

const BET_CHIPS = [10, 20, 50, 100]

function AmountPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const num = Number(value) || 0
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
        {BET_CHIPS.map(chip => (
          <motion.button key={chip} onClick={() => onChange(String(num + chip))} whileTap={{ scale: 0.92 }}
            style={{
              fontSize: 11.5, fontWeight: 700, padding: '6px 11px', borderRadius: 9,
              cursor: 'pointer', fontFamily: 'var(--fm)',
              background: 'var(--accent-dim)',
              border: '1px solid var(--accent-line)',
              color: 'var(--accent)',
            }}>
            +{chip}
          </motion.button>
        ))}
        {num > 0 && (
          <motion.button onClick={() => onChange('0')} whileTap={{ scale: 0.92 }}
            aria-label="Clear amount"
            style={{
              padding: '6px 9px', borderRadius: 9,
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              background: 'var(--neg-dim)', border: '1px solid var(--neg-line)',
              color: 'var(--neg)',
            }}>
            <X size={12} strokeWidth={2.6} />
          </motion.button>
        )}
      </div>
      {num > 0 && (
        <div className="mono" style={{ textAlign: 'right', marginTop: 6, fontSize: 13.5, fontWeight: 700, color: 'var(--accent)' }}>
          ₹{num}
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
      <StepTitle>{label}</StepTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {activePl.map(p => {
          const cur = data[p.id] || { action: isPre ? 'Call' : 'Check' }
          const showAmt = cur.action === 'Raise' || cur.action === 'Bet' || cur.action === 'All-In'
          return (
            <div key={p.id} className="row" style={{ padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <Avatar player={p} size="sm" />
                <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.name.split(' ')[0]}
                </span>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {acts.map(a => {
                    const active = cur.action === a
                    const cls = ACT_CLS[a] || 'check'
                    return (
                      <motion.button key={a} onClick={() => onAction(street, p.id, a)} whileTap={{ scale: 0.9 }}
                        className={active ? `chip-${cls}` : ''}
                        style={{
                          fontSize: 11.5, fontWeight: 600, padding: '7px 10px', borderRadius: 9,
                          cursor: 'pointer', fontFamily: 'var(--fb)',
                          background: active ? undefined : 'oklch(0% 0 0 / 25%)',
                          border: active ? undefined : '1px solid var(--border)',
                          color: active ? undefined : 'var(--ink-3)',
                        }}>
                        {a}
                      </motion.button>
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
        <Button variant="ghost" style={{ flex: 1 }} onClick={onBack}><ArrowLeft size={15} strokeWidth={2.4} /> Back</Button>
        <Button variant="primary" style={{ flex: 2 }} onClick={onNext}>
          {street === 'river' ? 'Showdown' : 'Next'} <ArrowRight size={15} strokeWidth={2.4} />
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
      <StepTitle>Flop cards</StepTitle>
      <div style={{ display: 'flex', gap: 7, marginBottom: 16 }}>
        {[0, 1, 2].map(i => (
          <PlayingCard key={i} card={fc[i] ?? null} onClick={() => { onCardPick('flop-' + i); sfx.card() }} />
        ))}
      </div>
      <StepActions street="flop" label="Flop actions" acts={ACTS_POST}
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
      <StepTitle>{label} card</StepTitle>
      <div style={{ display: 'flex', gap: 7, marginBottom: 16 }}>
        <PlayingCard card={card} onClick={() => { onCardPick(street); sfx.card() }} />
      </div>
      <StepActions street={street} label={`${label} actions`} acts={ACTS_POST}
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
      <StepTitle>Who won?</StepTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6, marginBottom: 16 }}>
        {activePl.map(p => (
          <motion.button key={p.id} onClick={() => onWinner(p.id)} whileTap={{ scale: 0.93 }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
              background: winner === p.id ? 'var(--accent-dim)' : 'oklch(0% 0 0 / 18%)',
              border: winner === p.id ? '1px solid var(--accent-line)' : '1px solid var(--border)',
              borderRadius: 12, padding: '9px 4px', cursor: 'pointer', fontFamily: 'var(--fb)',
              transition: 'background .18s, border-color .18s',
            }}>
            <Avatar player={p} size="sm" selected={winner === p.id} />
            <span style={{ fontSize: 10.5, color: winner === p.id ? 'var(--accent)' : 'var(--ink-3)', textAlign: 'center', fontWeight: winner === p.id ? 700 : 500 }}>
              {p.name.split(' ')[0]}
            </span>
            {winner === p.id && <Trophy size={11} strokeWidth={2.4} style={{ color: 'var(--accent)' }} />}
          </motion.button>
        ))}
      </div>
      <div className="label accent" style={{ marginBottom: 9 }}>Hole cards (optional)</div>
      {pl.map(p => (
        <div key={p.id} className="row" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, padding: '8px 10px' }}>
          <Avatar player={p} size="sm" />
          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-2)', flex: 1 }}>{p.name.split(' ')[0]}</span>
          <input className="mono" style={{ width: 110, fontSize: 13, padding: '7px 9px' }}
            placeholder="A♠ K♥" defaultValue={hcards[p.id] || ''}
            onChange={e => onHcard(p.id, e.target.value)} />
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <Button variant="ghost" style={{ flex: 1 }} onClick={onBack}><ArrowLeft size={15} strokeWidth={2.4} /> Back</Button>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--ink-3)', textAlign: 'center', marginTop: 12 }}>
        Tap a player above to log the winner and save the hand
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
          <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1, fontFamily: 'var(--fm)' }}>{card.v}</div>
          <div style={{ fontSize: 13, lineHeight: 1.3 }}>{card.s}</div>
        </>
      ) : <Plus size={18} strokeWidth={2} />}
    </div>
  )
}

function Stepper({ value, onDec, onInc }: { value: number; onDec: () => void; onInc: () => void }) {
  const btn: React.CSSProperties = {
    width: 34, height: 34, borderRadius: 9,
    background: 'var(--accent-dim)', border: 'none', color: 'var(--accent)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'oklch(0% 0 0 / 28%)', border: '1px solid var(--border)', borderRadius: 11, padding: 3 }}>
      <motion.button whileTap={{ scale: 0.88 }} onClick={onDec} style={btn} aria-label="Remove buyin"><Minus size={16} strokeWidth={2.6} /></motion.button>
      <span className="mono" style={{ width: 26, textAlign: 'center', fontSize: 14.5, fontWeight: 700, color: 'var(--ink)' }}>{value}</span>
      <motion.button whileTap={{ scale: 0.88 }} onClick={onInc} style={btn} aria-label="Add buyin"><Plus size={16} strokeWidth={2.6} /></motion.button>
    </div>
  )
}

function HandLog({ hand, idx, pl }: { hand: any; idx: number; pl: Player[] }) {
  const name = (id: string) => pl.find(p => p.id === id)?.name || id
  const allCards = [...(hand.fc || []).filter(Boolean), hand.tc, hand.rc].filter(Boolean) as CardObj[]
  const streets: [string, string][] = [['pre', 'Preflop'], ['flop', 'Flop'], ['turn', 'Turn'], ['river', 'River']]
  const actCls: Record<string, string> = { fold: 'chip-fold', call: 'chip-call', check: 'chip-check', raise: 'chip-raise', bet: 'chip-bet', allin: 'chip-allin' }

  return (
    <div className="row" style={{ padding: '10px 12px', marginBottom: 6, fontSize: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 11, color: 'var(--ink-3)' }}>
        <span className="mono">Hand #{hand.handNumber || idx + 1}</span>
        {hand.dealer && <span>{name(hand.dealer)} deals</span>}
      </div>
      {allCards.length > 0 && (
        <div style={{ display: 'flex', gap: 3, margin: '3px 0' }}>
          {allCards.map((c, i) => (
            <span key={i} className="mono" style={{ padding: '2px 6px', borderRadius: 5, fontSize: 11, fontWeight: 700, background: 'oklch(96% 0.005 90)', color: c.r ? 'oklch(52% 0.2 25)' : 'oklch(20% 0.01 260)', display: 'inline-block' }}>
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
            <div style={{ fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-4)', margin: '6px 0 3px', fontWeight: 700 }}>{lbl}</div>
            {Object.keys(sd).map(pid => {
              const act = sd[pid]
              if (!act?.action) return null
              const a = act.action.toLowerCase().replace(/-/g, '')
              return (
                <span key={pid} className={actCls[a] || 'chip-check'}
                  style={{ display: 'inline-flex', alignItems: 'center', fontSize: 10.5, padding: '2px 8px', borderRadius: 8, margin: '2px 3px 0 0', fontWeight: 500 }}>
                  {name(pid).split(' ')[0]} {act.action}{act.amount ? ' ₹' + act.amount : ''}
                </span>
              )
            })}
          </div>
        )
      })}
      {hand.winner && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--accent-dim)', color: 'var(--accent)', fontSize: 10.5, padding: '3px 9px', borderRadius: 8, fontWeight: 600, marginTop: 6 }}>
          <Trophy size={11} strokeWidth={2.4} /> {name(hand.winner)} won{hand.hcards?.[hand.winner] ? ` (${hand.hcards[hand.winner]})` : ''}
        </div>
      )}
    </div>
  )
}
