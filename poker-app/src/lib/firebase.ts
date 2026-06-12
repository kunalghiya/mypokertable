import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import {
  getFirestore, collection, doc, getDocs,
  addDoc, setDoc, deleteDoc, onSnapshot, serverTimestamp,
  type Firestore
} from 'firebase/firestore'

let _app: FirebaseApp | null = null
let _db: Firestore | null = null

export function initFirebase(config: Record<string, string>): Firestore {
  if (!_app) {
    _app = getApps().length ? getApp() : initializeApp(config)
  }
  if (!_db) {
    _db = getFirestore(_app)
  }
  return _db
}

export function getDb(): Firestore {
  if (!_db) throw new Error('Firebase not initialized')
  return _db
}

export function parseConfig(raw: string): Record<string, string> {
  let s = raw.trim()
  s = s.replace(/\/\/[^\n]*/g, '')
  s = s.replace(/\/\*[\s\S]*?\*\//g, '')
  s = s.replace(/([{,]\s*)([A-Za-z_]\w*)\s*:/g, '$1"$2":')
  s = s.replace(/'/g, '"')
  s = s.replace(/,(\s*[}\]])/g, '$1')
  const match = s.match(/\{[\s\S]*\}/)
  if (match) s = match[0]
  return JSON.parse(s)
}

export async function saveSess(data: Record<string, unknown>): Promise<Record<string, unknown>> {
  const db = getDb()
  if (data.id) {
    const id = data.id as string
    const d: Record<string, unknown> = {}
    Object.keys(data).forEach(k => { if (k !== 'id') d[k] = data[k] })
    await setDoc(doc(db, 'sessions', id), d)
    return data
  } else {
    data.createdAt = serverTimestamp()
    const ref = await addDoc(collection(db, 'sessions'), data)
    data.id = ref.id
    return data
  }
}

export async function delSess(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), 'sessions', id))
}

export async function saveHand(data: Record<string, unknown>): Promise<Record<string, unknown>> {
  const db = getDb()
  if (data.id) {
    const id = data.id as string
    const d: Record<string, unknown> = {}
    Object.keys(data).forEach(k => { if (k !== 'id') d[k] = data[k] })
    await setDoc(doc(db, 'hands', id), d)
    return data
  }
  const ref = await addDoc(collection(db, 'hands'), data)
  data.id = ref.id
  return data
}

export async function savePlayer(p: Record<string, unknown>): Promise<void> {
  await setDoc(doc(getDb(), 'players', p.id as string), p)
}

export async function saveMeta(key: string, val: unknown): Promise<void> {
  await setDoc(doc(getDb(), 'meta', key), { value: val, updatedAt: serverTimestamp() })
}

export async function deleteAllFinishedSessions(): Promise<void> {
  const db = getDb()
  const snap = await getDocs(collection(db, 'sessions'))
  for (const d of snap.docs) {
    if (d.data().status !== 'active') await deleteDoc(d.ref)
  }
}

export {
  collection, doc, onSnapshot, serverTimestamp, deleteDoc,
  type Firestore
}
