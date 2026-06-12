import { useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { Avatar } from '../components/Avatar'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Modal } from '../components/Modal'
import { callClaude } from '../lib/claude'
import { buildProfilePrompt } from '../lib/utils'
import { toast } from '../components/Toast'
import { sfx } from '../lib/sounds'

const TAGS: Record<string, { l: string; c: string }> = {
  p1: { l: 'Hero', c: '#c9a84c' },
  p2: { l: 'Tight-Passive', c: '#60a5fa' },
  p3: { l: 'Loose-Aggressive', c: '#f87171' },
  p4: { l: 'Calling Station', c: '#c084fc' },
  p5: { l: 'Pair Hunter', c: '#4ade80' },
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
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
            <Card glow={i === 0 ? 'gold' : 'none'}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                <Avatar player={p} size="lg" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  {editId === p.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input value={editVal} onChange={e => setEditVal(e.target.value)}
                        style={{ flex: 1, fontSize: 16, padding: '7px 10px' }} autoFocus
                        onKeyDown={async e => { if (e.key === 'Enter' && editVal.trim()) { await renamePlayer(p.id, editVal.trim()); setEditId(null) } }}
                      />
                      <button onClick={async () => { await renamePlayer(p.id, editVal.trim()); setEditId(null) }}
                        style={{ background: 'var(--gold)', color: '#07050f', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--fb)' }}>
                        Save
                      </button>
                      <button onClick={() => setEditId(null)}
                        style={{ background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', fontSize: 14 }}>✕</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontFamily: 'var(--fs)', fontSize: 17, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.2px' }}>{p.name}</div>
                      {i === 0 && <div style={{ fontSize: 9, color: 'var(--gold)', fontWeight: 700, letterSpacing: '0.08em', background: 'rgba(212,168,67,.12)', padding: '2px 7px', borderRadius: 20, border: '1px solid rgba(212,168,67,.25)' }}>YOU</div>}
                    </div>
                  )}
                  {tag && (
                    <span style={{ display: 'inline-flex', fontSize: 9, border: '1px solid', borderRadius: 20, padding: '2px 8px', marginTop: 5, letterSpacing: '0.05em', fontWeight: 500, color: tag.c, borderColor: tag.c }}>
                      {tag.l}
                    </span>
                  )}
                  <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                    <span style={{ fontSize: 10, color: 'var(--t3)' }}>{cnt} sessions</span>
                    {cnt > 0 && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: totalPnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                        {totalPnl >= 0 ? '+' : ''}Rs.{totalPnl.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8, marginBottom: 12 }}>
                <ActionBtn color="gold" onClick={() => { setEditId(p.id); setEditVal(p.name) }}>✏ Rename</ActionBtn>
                <ActionBtn color="gold" onClick={() => openNote(p.id)}>📝 Notes</ActionBtn>
                {apiKey && cnt > 0 && (
                  <ActionBtn color="violet" onClick={() => runPlayerAI(p.id)}>⚡ AI Profile</ActionBtn>
                )}
                {i > 0 && (
                  <ActionBtn color="red" onClick={() => { if (confirm('Remove ' + p.name + '?')) removePlayer(p.id) }}>Remove</ActionBtn>
                )}
              </div>

              <div style={{ fontSize: 13, color: note ? 'var(--t2)' : 'var(--t4)', lineHeight: 1.65, fontStyle: note ? 'normal' : 'italic' }}>
                {note || 'No notes yet. Tap Notes to add your reads.'}
              </div>

              {(aiProfile || isLoading) && (
                <div style={{ background: 'linear-gradient(135deg,rgba(40,20,120,.1),transparent)', border: '1px solid rgba(155,93,229,.18)', borderRadius: 12, padding: 12, marginTop: 10 }}>
                  <div style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--violet)', marginBottom: 6, fontWeight: 600 }}>⚡ AI Profile</div>
                  {isLoading && !aiProfile ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--violet)', fontSize: 12, fontStyle: 'italic' }}>
                      <span className="dot-loader"><span/><span/><span/></span> Building…
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{aiProfile}</div>
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
          <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 12, fontWeight: 600 }}>Add Permanent Player</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Player name…"
              onKeyDown={async e => {
                if (e.key === 'Enter' && newName.trim()) {
                  await addPlayer(newName.trim()); toast(newName + ' added!', '♠'); sfx.chip(); setNewName('')
                }
              }}
            />
            <Button variant="gold" onClick={async () => {
              if (newName.trim()) { await addPlayer(newName.trim()); toast(newName + ' added!', '♠'); sfx.chip(); setNewName('') }
            }} style={{ whiteSpace: 'nowrap' }}>Add</Button>
          </div>
        </Card>
      </motion.div>

      {/* Note modal */}
      <Modal open={!!noteModal} onClose={() => setNoteModal(null)} title="📝 Notes">
        {noteModal && (() => {
          const p = players.find(x => x.id === noteModal)
          return (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                {p && <Avatar player={p} size="md" />}
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>{p?.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)' }}>Player reads & notes</div>
                </div>
              </div>
              <textarea value={noteVal} onChange={e => setNoteVal(e.target.value)}
                placeholder="Showdown tendencies, playing style, exploits, tells…"
                style={{ height: 140, marginBottom: 14 }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <Button variant="ghost" full onClick={() => setNoteModal(null)}>Cancel</Button>
                <Button variant="gold" full onClick={async () => { await saveNote(noteModal, noteVal); setNoteModal(null) }}>Save</Button>
              </div>
            </>
          )
        })()}
      </Modal>
    </motion.div>
  )
}

function ActionBtn({ children, color, onClick }: { children: React.ReactNode; color: 'gold' | 'violet' | 'red'; onClick: () => void }) {
  const colors = {
    gold:   { color: 'var(--gold)',   border: 'rgba(212,168,67,.25)' },
    violet: { color: '#a78bfa',       border: 'rgba(155,93,229,.25)' },
    red:    { color: 'var(--red)',    border: 'rgba(255,51,85,.25)'  },
  }
  const c = colors[color]
  return (
    <button onClick={onClick} style={{
      background: 'rgba(0,0,0,.2)', border: `1px solid ${c.border}`, borderRadius: 8,
      padding: '5px 10px', cursor: 'pointer', fontFamily: 'var(--fb)',
      fontSize: 11, color: c.color, fontWeight: 500, transition: '.15s',
    }}>
      {children}
    </button>
  )
}
