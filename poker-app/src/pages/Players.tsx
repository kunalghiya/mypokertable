import { useState } from 'react'
import { motion } from 'framer-motion'
import { Pencil, NotebookPen, Sparkles, Trash2, UserPlus, X } from 'lucide-react'
import { useStore } from '../store'
import { Avatar } from '../components/Avatar'
import { Card, SectionLabel } from '../components/Card'
import { Button } from '../components/Button'
import { Modal } from '../components/Modal'
import { callClaude } from '../lib/claude'
import { buildProfilePrompt } from '../lib/utils'
import { toast } from '../components/Toast'
import { sfx } from '../lib/sounds'

const TAGS: Record<string, { l: string; c: string }> = {
  p1: { l: 'Hero',             c: 'oklch(85% 0.14 90)' },
  p2: { l: 'Tight-Passive',    c: 'oklch(75% 0.1 240)' },
  p3: { l: 'Loose-Aggressive', c: 'oklch(72% 0.14 22)' },
  p4: { l: 'Calling Station',  c: 'oklch(78% 0.12 300)' },
  p5: { l: 'Pair Hunter',      c: 'oklch(82% 0.14 150)' },
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 340, damping: 28 } } }

export function Players() {
  const players = useStore(s => s.players)
  const sessions = useStore(s => s.sessions)
  const hands = useStore(s => s.hands)
  const notes = useStore(s => s.notes)
  const aiProfiles = useStore(s => s.aiProfiles)
  const apiKey = useStore(s => s.apiKey)
  const saveNote = useStore(s => s.saveNote)
  const saveAiProfile = useStore(s => s.saveAiProfile)
  const addPlayer = useStore(s => s.addPlayer)
  const renamePlayer = useStore(s => s.renamePlayer)
  const removePlayer = useStore(s => s.removePlayer)

  const [noteModal, setNoteModal] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [editVal, setEditVal] = useState('')
  const [newName, setNewName] = useState('')
  const [aiTexts, setAiTexts] = useState<Record<string, string>>({})
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({})
  const [noteVal, setNoteVal] = useState('')

  const runPlayerAI = (pid: string) => {
    const p = players.find(x => x.id === pid)
    if (!p || !apiKey) return
    const prompt = buildProfilePrompt(p, sessions, hands, notes)
    if (!prompt) { alert('Not enough session data yet.'); return }
    setAiLoading(prev => ({ ...prev, [pid]: true }))
    let text = ''
    callClaude(prompt, apiKey,
      chunk => { text += chunk; setAiTexts(prev => ({ ...prev, [pid]: text })) },
      async () => { setAiLoading(prev => ({ ...prev, [pid]: false })); await saveAiProfile(pid, text) },
      err => { setAiLoading(prev => ({ ...prev, [pid]: false })); setAiTexts(prev => ({ ...prev, [pid]: 'Error: ' + err })) }
    )
  }

  const openNote = (pid: string) => {
    setNoteVal(notes[pid] || '')
    setNoteModal(pid)
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ padding: '14px 14px 0' }}>
      {players.map((p, i) => {
        const tag = TAGS[p.id]
        const note = notes[p.id] || ''
        const aiProfile = aiProfiles[p.id] || aiTexts[p.id] || ''
        const cnt = sessions.filter(s => s.status !== 'active' && s.results && s.results[p.id] !== undefined).length
        const isLoading = aiLoading[p.id]
        const totalPnl = sessions
          .filter(s => s.status !== 'active' && s.results && s.results[p.id] !== undefined)
          .reduce((sum, s) => sum + (s.results![p.id] || 0), 0)

        return (
          <motion.div key={p.id} variants={item}>
            <Card glow={i === 0 ? 'accent' : 'none'}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                <Avatar player={p} size="lg" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  {editId === p.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input value={editVal} onChange={e => setEditVal(e.target.value)}
                        style={{ flex: 1, fontSize: 16, padding: '8px 11px' }} autoFocus
                        onKeyDown={async e => { if (e.key === 'Enter' && editVal.trim()) { await renamePlayer(p.id, editVal.trim()); setEditId(null) } }}
                      />
                      <Button variant="primary" size="sm" style={{ minHeight: 38 }} onClick={async () => { await renamePlayer(p.id, editVal.trim()); setEditId(null) }}>
                        Save
                      </Button>
                      <button onClick={() => setEditId(null)} aria-label="Cancel rename"
                        style={{ background: 'none', border: 'none', color: 'var(--ink-3)', cursor: 'pointer', display: 'flex' }}><X size={16} strokeWidth={2.2} /></button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontSize: 16.5, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>{p.name}</div>
                      {i === 0 && <div style={{ fontSize: 9, color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.07em', background: 'var(--accent-dim)', padding: '3px 8px', borderRadius: 20 }}>YOU</div>}
                    </div>
                  )}
                  {tag && (
                    <span style={{ display: 'inline-flex', fontSize: 9.5, border: `1px solid ${tag.c.replace(')', ' / 40%)')}`, borderRadius: 20, padding: '2px 9px', marginTop: 6, letterSpacing: '0.04em', fontWeight: 600, color: tag.c }}>
                      {tag.l}
                    </span>
                  )}
                  <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                    <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{cnt} sessions</span>
                    {cnt > 0 && (
                      <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: totalPnl >= 0 ? 'var(--pos)' : 'var(--neg)' }}>
                        {totalPnl >= 0 ? '+' : '-'}₹{Math.abs(totalPnl).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 8, marginBottom: 12 }}>
                <ActionBtn onClick={() => { setEditId(p.id); setEditVal(p.name) }}><Pencil size={12} strokeWidth={2.2} /> Rename</ActionBtn>
                <ActionBtn onClick={() => openNote(p.id)}><NotebookPen size={12} strokeWidth={2.2} /> Notes</ActionBtn>
                {apiKey && cnt > 0 && (
                  <ActionBtn tone="ai" onClick={() => runPlayerAI(p.id)}><Sparkles size={12} strokeWidth={2.2} /> AI profile</ActionBtn>
                )}
                {i > 0 && (
                  <ActionBtn tone="danger" onClick={() => { if (confirm('Remove ' + p.name + '?')) removePlayer(p.id) }}><Trash2 size={12} strokeWidth={2.2} /> Remove</ActionBtn>
                )}
              </div>

              <div style={{ fontSize: 13, color: note ? 'var(--ink-2)' : 'var(--ink-4)', lineHeight: 1.65 }}>
                {note || 'No notes yet. Tap Notes to add your reads.'}
              </div>

              {(aiProfile || isLoading) && (
                <div style={{ background: 'oklch(75% 0.14 300 / 7%)', border: '1px solid oklch(75% 0.14 300 / 22%)', borderRadius: 13, padding: 13, marginTop: 12 }}>
                  <div className="label" style={{ color: 'oklch(80% 0.12 300)', marginBottom: 7 }}><Sparkles size={12} strokeWidth={2.4} /> AI profile</div>
                  {isLoading && !aiProfile ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'oklch(80% 0.12 300)', fontSize: 12.5 }}>
                      <span className="dot-loader"><span/><span/><span/></span> Building…
                    </div>
                  ) : (
                    <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{aiProfile}</div>
                  )}
                </div>
              )}
            </Card>
          </motion.div>
        )
      })}

      {/* Add player */}
      <motion.div variants={item}>
        <Card>
          <SectionLabel accent><UserPlus size={13} strokeWidth={2.4} /> Add permanent player</SectionLabel>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Player name…"
              onKeyDown={async e => {
                if (e.key === 'Enter' && newName.trim()) {
                  await addPlayer(newName.trim()); toast(newName + ' added'); sfx.chip(); setNewName('')
                }
              }}
            />
            <Button variant="primary" onClick={async () => {
              if (newName.trim()) { await addPlayer(newName.trim()); toast(newName + ' added'); sfx.chip(); setNewName('') }
            }} style={{ whiteSpace: 'nowrap' }}>Add</Button>
          </div>
        </Card>
      </motion.div>

      {/* Note modal */}
      <Modal open={!!noteModal} onClose={() => setNoteModal(null)} title="Player notes" icon={<NotebookPen size={18} strokeWidth={2.2} />}>
        {noteModal && (() => {
          const p = players.find(x => x.id === noteModal)
          return (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                {p && <Avatar player={p} size="md" />}
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{p?.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>Reads, tells and exploits</div>
                </div>
              </div>
              <textarea value={noteVal} onChange={e => setNoteVal(e.target.value)}
                placeholder="Showdown tendencies, playing style, exploits, tells…"
                style={{ height: 140, marginBottom: 14 }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <Button variant="ghost" full onClick={() => setNoteModal(null)}>Cancel</Button>
                <Button variant="primary" full onClick={async () => { await saveNote(noteModal, noteVal); setNoteModal(null) }}>Save notes</Button>
              </div>
            </>
          )
        })()}
      </Modal>
    </motion.div>
  )
}

function ActionBtn({ children, tone, onClick }: { children: React.ReactNode; tone?: 'ai' | 'danger'; onClick: () => void }) {
  const tones = {
    default: { color: 'var(--ink-2)',            border: 'var(--border-2)',                 bg: 'oklch(100% 0 0 / 4%)' },
    ai:      { color: 'oklch(80% 0.12 300)',     border: 'oklch(75% 0.14 300 / 30%)',       bg: 'oklch(75% 0.14 300 / 10%)' },
    danger:  { color: 'var(--neg)',              border: 'var(--neg-line)',                 bg: 'var(--neg-dim)' },
  }
  const c = tones[tone || 'default']
  return (
    <motion.button onClick={onClick} whileTap={{ scale: 0.94 }} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: c.bg, border: `1px solid ${c.border}`, borderRadius: 9,
      padding: '7px 11px', cursor: 'pointer', fontFamily: 'var(--fb)',
      fontSize: 11.5, color: c.color, fontWeight: 600,
    }}>
      {children}
    </motion.button>
  )
}
