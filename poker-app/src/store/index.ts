import { create } from 'zustand'
import { collection, onSnapshot } from 'firebase/firestore'
import type { Player, Session, Hand, LiveHandState, Tab, CardObj } from '../lib/types'
import { sortByTs } from '../lib/utils'
import { initFirebase, saveSess, saveHand, savePlayer, saveMeta, delSess } from '../lib/firebase'
import { serverTimestamp } from 'firebase/firestore'
import { doc, setDoc } from 'firebase/firestore'

function lsGet<T>(k: string): T | null {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null } catch { return null }
}
function lsSet(k: string, v: unknown) {
  try { localStorage.setItem(k, JSON.stringify(v)) } catch {}
}

// Guard against duplicate listener registration on HMR / StrictMode double-invoke
let _listenersStarted = false
let _unsubscribers: (() => void)[] = []

const freshHand = (count = 0): LiveHandState => ({
  step: 'dealer', dealer: null,
  pre: {}, flop: {}, turn: {}, river: {},
  fc: [null, null, null], tc: null, rc: null,
  winner: null, hcards: {}, count,
})

interface AppState {
  // Config
  fbConfig: Record<string, string> | null
  apiKey: string

  // Data
  players: Player[]
  sessions: Session[]
  hands: Hand[]
  notes: Record<string, string>
  aiProfiles: Record<string, string>

  // UI state
  tab: Tab
  activeSessId: string | null
  liveBuyins: Record<string, number>
  lh: LiveHandState
  households: [string, string][]

  // Sync
  syncState: 'ok' | 'saving' | 'err'
  syncMsg: string
  listenerFired: boolean

  // Actions
  setTab: (tab: Tab) => void
  setApiKey: (key: string) => void
  setHouseholds: (pairs: [string, string][]) => void
  setSync: (state: 'ok' | 'saving' | 'err', msg?: string) => void

  initApp: (config: Record<string, string>) => Promise<void>
  resetConfig: () => void

  startSession: (params: {
    date: string; buyinAmt: number
    playerIds: string[]; guests: string[]
  }) => Promise<void>

  updateLiveBuyins: () => Promise<void>
  setLiveBuyin: (id: string, count: number) => void

  addPlayerToLive: (existingId: string | null, guestName: string | null) => Promise<void>
  removePlayerFromLive: (pid: string) => Promise<void>

  setLhStep: (step: LiveHandState['step']) => void
  setLhDealer: (id: string) => void
  setLhAction: (street: string, pid: string, action: string) => void
  setLhAmount: (street: string, pid: string, amount: string) => void
  setLhCard: (target: string, card: CardObj) => void
  setLhWinner: (id: string) => void
  setLhHcard: (pid: string, val: string) => void
  skipHand: () => void
  logHand: () => Promise<void>

  endSession: (cashouts: Record<string, string>, notes: string) => Promise<void>
  deleteSession: (id: string) => Promise<void>
  saveAiAnalysis: (sessId: string, text: string) => Promise<void>

  addPlayer: (name: string) => Promise<void>
  renamePlayer: (id: string, name: string) => Promise<void>
  removePlayer: (id: string) => Promise<void>
  saveNote: (pid: string, note: string) => Promise<void>
  saveAiProfile: (pid: string, text: string) => Promise<void>
}

export const useStore = create<AppState>((set, get) => ({
  fbConfig: lsGet('pkl-fbconfig'),
  apiKey: lsGet('pkl-aikey') || '',
  players: [],
  sessions: [],
  hands: [],
  notes: {},
  aiProfiles: {},
  tab: 'dashboard',
  activeSessId: null,
  liveBuyins: {},
  lh: freshHand(),
  households: JSON.parse(lsGet<string>('pkl-households') || '[]'),
  syncState: 'ok',
  syncMsg: 'Connected',
  listenerFired: false,

  setTab: tab => set({ tab }),
  setApiKey: key => {
    lsSet('pkl-aikey', key)
    set({ apiKey: key })
  },
  setHouseholds: pairs => {
    lsSet('pkl-households', JSON.stringify(pairs))
    set({ households: pairs })
  },
  setSync: (syncState, syncMsg) => set({
    syncState,
    syncMsg: syncMsg || { ok: 'Connected', saving: 'Saving…', err: 'Sync error' }[syncState]
  }),

  initApp: async (config) => {
    lsSet('pkl-fbconfig', config)
    set({ fbConfig: config })
    const db = initFirebase(config)

    // Seed / fetch players
    const { collection: col, getDocs } = await import('firebase/firestore')
    const snap = await getDocs(col(db, 'players'))
    if (snap.empty) {
      const defs: Player[] = [
        { id: 'p1', name: 'Kunal', order: 0 },
        { id: 'p2', name: 'Preetish', order: 1 },
        { id: 'p3', name: 'Pranav', order: 2 },
        { id: 'p4', name: 'Sakshi', order: 3 },
        { id: 'p5', name: 'Japneet', order: 4 },
      ]
      const defNotes: Record<string, string> = {
        p1: 'Hero. Improving every session.',
        p2: 'Only plays strong hands. Folds to small raises. When he calls, believe him.',
        p3: 'Bets frequently. Moderate bluffer. Let him bluff into you.',
        p4: 'Calls everything. Shows sets, straights. NEVER bluff her.',
        p5: 'Calls only with a pair. Bluff on high boards she missed.',
      }
      for (const p of defs) {
        await savePlayer(p as unknown as Record<string, unknown>)
        await saveMeta('note_' + p.id, defNotes[p.id])
      }
    } else {
      // Migration
      const renames: Record<string, string> = {
        'Nit Guy': 'Preetish', 'Aggro Guy': 'Pranav',
        'Girl 1': 'Sakshi', 'Girl 2': 'Japneet',
      }
      for (const d of snap.docs) {
        const p = { ...d.data(), id: d.id } as Player
        if (renames[p.name]) {
          await savePlayer({ ...p, name: renames[p.name] } as unknown as Record<string, unknown>)
        }
      }
    }

    // Start realtime listeners — only once per app lifecycle
    if (!_listenersStarted) {
      _listenersStarted = true

      // Tear down any stale listeners first (HMR safety)
      _unsubscribers.forEach(u => u())
      _unsubscribers = []

      _unsubscribers.push(
        onSnapshot(collection(db, 'sessions'), snap => {
          const sessions = sortByTs(snap.docs.map(d => ({ ...d.data(), id: d.id }))) as Session[]
          const active = sessions.find(s => s.status === 'active')
          const { activeSessId } = get()
          let newActiveSessId = active?.id || null
          let newLiveBuyins = get().liveBuyins
          if (active && activeSessId !== active.id) {
            newLiveBuyins = JSON.parse(JSON.stringify(active.buyins || {}))
          }
          set({ sessions, activeSessId: newActiveSessId, liveBuyins: newLiveBuyins, listenerFired: true, syncState: 'ok', syncMsg: 'Connected' })
        }, e => {
          console.error('sessions:', e)
          set({ syncState: 'err', syncMsg: 'DB error: ' + (e as any).code })
        })
      )

      _unsubscribers.push(
        onSnapshot(collection(db, 'hands'), snap => {
          const hands = sortByTs(snap.docs.map(d => ({ ...d.data(), id: d.id }))) as Hand[]
          set({ hands, listenerFired: true })
        }, e => console.error('hands:', e))
      )

      _unsubscribers.push(
        onSnapshot(collection(db, 'players'), snap => {
          if (!snap.empty) {
            const players = snap.docs
              .map(d => ({ ...d.data(), id: d.id }))
              .sort((a: any, b: any) => (a.order || 0) - (b.order || 0)) as Player[]
            set({ players, listenerFired: true })
          }
        }, e => console.error('players:', e))
      )

      _unsubscribers.push(
        onSnapshot(collection(db, 'meta'), snap => {
          const notes: Record<string, string> = {}
          const aiProfiles: Record<string, string> = {}
          snap.docs.forEach(d => {
            const key = d.id, val = d.data().value
            if (key.startsWith('note_')) notes[key.slice(5)] = val
            else if (key.startsWith('aiProfile_')) aiProfiles[key.slice(10)] = val
          })
          set({ notes, aiProfiles, listenerFired: true })
        }, e => console.error('meta:', e))
      )
    }
  },

  resetConfig: () => {
    localStorage.removeItem('pkl-fbconfig')
    window.location.reload()
  },

  startSession: async ({ date, buyinAmt, playerIds, guests }) => {
    const { players } = get()
    const sessionPlayers: Player[] = []
    playerIds.forEach(pid => {
      const p = players.find(x => x.id === pid)
      if (p) sessionPlayers.push({ id: p.id, name: p.name, order: p.order })
    })
    guests.forEach(name => sessionPlayers.push({ id: 'p' + Math.random().toString(36).slice(2, 8), name, order: 99, isGuest: true }))
    const buyins: Record<string, number> = {}
    sessionPlayers.forEach(p => { buyins[p.id] = 1 })
    set({ syncState: 'saving', syncMsg: 'Saving…' })
    const saved = await saveSess({ date, buyinAmt, players: sessionPlayers, buyins, sessionNotes: {}, notes: '', results: {}, status: 'active', createdAt: serverTimestamp() })
    set({
      activeSessId: saved.id as string,
      liveBuyins: { ...buyins },
      lh: freshHand(),
      tab: 'live',
      syncState: 'ok', syncMsg: 'Connected',
    })
  },

  setLiveBuyin: (id, count) => {
    const lb = { ...get().liveBuyins, [id]: count }
    set({ liveBuyins: lb })
  },

  updateLiveBuyins: async () => {
    const { activeSessId, liveBuyins } = get()
    if (!activeSessId) return
    const db = (await import('../lib/firebase')).getDb()
    await setDoc(doc(db, 'sessions', activeSessId), { buyins: { ...liveBuyins } }, { merge: true })
  },

  addPlayerToLive: async (existingId, guestName) => {
    const { activeSessId, sessions, players, liveBuyins } = get()
    if (!activeSessId) return
    const sess = sessions.find(s => s.id === activeSessId)
    if (!sess) return
    let newP: Player
    if (existingId) {
      const p = players.find(x => x.id === existingId)
      if (!p) return
      newP = { id: p.id, name: p.name, order: p.order }
    } else {
      newP = { id: 'p' + Math.random().toString(36).slice(2, 8), name: guestName!, order: 99, isGuest: true }
    }
    const newPlayers = [...(sess.players || []), newP]
    const newBuyins = { ...(sess.buyins || {}), [newP.id]: 1 }
    set({ liveBuyins: { ...liveBuyins, [newP.id]: 1 } })
    await saveSess({ ...sess, players: newPlayers, buyins: newBuyins })
  },

  removePlayerFromLive: async (pid) => {
    const { activeSessId, sessions, liveBuyins, lh } = get()
    if (!activeSessId) return
    const sess = sessions.find(s => s.id === activeSessId)
    if (!sess) return
    const newPlayers = (sess.players || []).filter(x => x.id !== pid)
    const newBuyins = { ...(sess.buyins || {}) }
    delete newBuyins[pid]
    const newLb = { ...liveBuyins }
    delete newLb[pid]
    const newLh = { ...lh }
    if (newLh.dealer === pid) newLh.dealer = null
    if (newLh.winner === pid) newLh.winner = null
    ;['pre', 'flop', 'turn', 'river'].forEach(k => {
      if ((newLh as any)[k]?.[pid]) delete (newLh as any)[k][pid]
    })
    if (newLh.hcards?.[pid]) delete newLh.hcards[pid]
    set({ liveBuyins: newLb, lh: newLh })
    await saveSess({ ...sess, players: newPlayers, buyins: newBuyins })
  },

  setLhStep: step => set(s => ({ lh: { ...s.lh, step } })),
  setLhDealer: id => set(s => ({ lh: { ...s.lh, dealer: id } })),

  setLhAction: (street, pid, action) => set(s => {
    const key = street === 'preflop' ? 'pre' : street
    const streetData = { ...(s.lh as any)[key] }
    streetData[pid] = { ...(streetData[pid] || {}), action }
    return { lh: { ...s.lh, [key]: streetData } }
  }),

  setLhAmount: (street, pid, amount) => set(s => {
    const key = street === 'preflop' ? 'pre' : street
    const streetData = { ...(s.lh as any)[key] }
    streetData[pid] = { ...(streetData[pid] || {}), amount }
    return { lh: { ...s.lh, [key]: streetData } }
  }),

  setLhCard: (target, card) => set(s => {
    const lh = { ...s.lh }
    if (target.startsWith('flop-')) {
      const fc = [...lh.fc] as (CardObj | null)[]
      fc[parseInt(target.split('-')[1])] = card
      lh.fc = fc
    } else if (target === 'turn') lh.tc = card
    else if (target === 'river') lh.rc = card
    return { lh }
  }),

  setLhWinner: id => set(s => ({ lh: { ...s.lh, winner: id } })),
  setLhHcard: (pid, val) => set(s => ({
    lh: { ...s.lh, hcards: { ...s.lh.hcards, [pid]: val } }
  })),

  skipHand: () => set(s => ({ lh: freshHand(s.lh.count + 1) })),

  logHand: async () => {
    const { lh, activeSessId } = get()
    if (!lh.winner || !activeSessId) return
    await saveHand({
      sessionId: activeSessId,
      dealer: lh.dealer,
      pre: JSON.parse(JSON.stringify(lh.pre || {})),
      flop: JSON.parse(JSON.stringify(lh.flop || {})),
      turn: JSON.parse(JSON.stringify(lh.turn || {})),
      river: JSON.parse(JSON.stringify(lh.river || {})),
      fc: lh.fc,
      tc: lh.tc,
      rc: lh.rc,
      winner: lh.winner,
      hcards: JSON.parse(JSON.stringify(lh.hcards || {})),
      handNumber: lh.count + 1,
      createdAt: serverTimestamp(),
    })
    set({ lh: freshHand(lh.count + 1) })
  },

  endSession: async (cashouts, notes) => {
    const { activeSessId, sessions, liveBuyins } = get()
    if (!activeSessId) return
    const sess = sessions.find(s => s.id === activeSessId)
    if (!sess) return
    const pl = sess.players || []
    const buyinAmt = sess.buyinAmt || 500
    const finalResults: Record<string, number> = {}
    pl.forEach(p => {
      finalResults[p.id] = (Number(cashouts[p.id]) || 0) - (liveBuyins[p.id] || 1) * buyinAmt
    })
    set({ syncState: 'saving', syncMsg: 'Saving…' })
    await saveSess({
      id: sess.id,
      date: sess.date,
      buyinAmt,
      players: pl,
      buyins: { ...liveBuyins },
      cashouts: JSON.parse(JSON.stringify(cashouts)),
      sessionNotes: sess.sessionNotes || {},
      notes,
      results: finalResults,
      status: 'done',
      createdAt: sess.createdAt,
    })
    set({ activeSessId: null, tab: 'sessions', syncState: 'ok', syncMsg: 'Connected' })
  },

  deleteSession: async (id) => {
    set({ syncState: 'saving', syncMsg: 'Deleting…' })
    if (get().activeSessId === id) set({ activeSessId: null })
    await delSess(id)
    set({ syncState: 'ok', syncMsg: 'Connected' })
  },

  saveAiAnalysis: async (sessId, text) => {
    const sess = get().sessions.find(s => s.id === sessId)
    if (!sess) return
    await saveSess({ ...sess, aiAnalysis: text })
  },

  addPlayer: async (name) => {
    const { players } = get()
    const id = 'p' + Math.random().toString(36).slice(2, 8)
    await savePlayer({ id, name, order: players.length } as unknown as Record<string, unknown>)
    await saveMeta('note_' + id, '')
  },

  renamePlayer: async (id, name) => {
    const p = get().players.find(x => x.id === id)
    if (!p) return
    await savePlayer({ ...p, name } as unknown as Record<string, unknown>)
  },

  removePlayer: async (id) => {
    const db = (await import('../lib/firebase')).getDb()
    const { deleteDoc, doc: fbDoc } = await import('firebase/firestore')
    await deleteDoc(fbDoc(db, 'players', id))
  },

  saveNote: async (pid, note) => {
    set(s => ({ notes: { ...s.notes, [pid]: note } }))
    await saveMeta('note_' + pid, note)
  },

  saveAiProfile: async (pid, text) => {
    set(s => ({ aiProfiles: { ...s.aiProfiles, [pid]: text } }))
    await saveMeta('aiProfile_' + pid, text)
  },
}))
