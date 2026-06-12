export interface Player {
  id: string
  name: string
  order: number
  isGuest?: boolean
}

export interface CardObj {
  v: string
  s: string
  r: boolean // red suit?
}

export interface StreetAction {
  action: string
  amount?: string
}

export type StreetData = Record<string, StreetAction>

export interface Hand {
  id?: string
  sessionId: string
  dealer: string | null
  pre: StreetData
  flop: StreetData
  turn: StreetData
  river: StreetData
  fc: (CardObj | null)[]
  tc: CardObj | null
  rc: CardObj | null
  winner: string | null
  hcards: Record<string, string>
  handNumber: number
  createdAt?: unknown
}

export interface Session {
  id?: string
  date: string
  buyinAmt: number
  players: Player[]
  buyins: Record<string, number>
  cashouts?: Record<string, string>
  sessionNotes: Record<string, string>
  notes: string
  results: Record<string, number>
  status: 'active' | 'done'
  aiAnalysis?: string
  createdAt?: unknown
}

export interface LiveHandState {
  step: 'dealer' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown'
  dealer: string | null
  pre: StreetData
  flop: StreetData
  turn: StreetData
  river: StreetData
  fc: (CardObj | null)[]
  tc: CardObj | null
  rc: CardObj | null
  winner: string | null
  hcards: Record<string, string>
  count: number
}

export interface Settlement {
  txns: { from: string; to: string; amount: number }[]
  households: HouseholdResult[]
  imbalance: number
  unpaid: { id: string; amt: number }[]
}

export interface HouseholdResult {
  a: string; b: string
  aN: number; bN: number
  combined: number
  internal: { from: string; to: string; amount: number } | null
}

export type Tab = 'dashboard' | 'live' | 'sessions' | 'leaderboard' | 'players' | 'settings'
