import { ArrowRight, Check, House, TriangleAlert } from 'lucide-react'
import { calcSettle, playerName, inr } from '../lib/utils'
import type { Player } from '../lib/types'

interface SettlementProps {
  results: Record<string, number>
  players: Player[]
  households: [string, string][]
}

export function Settlement({ results, players, households }: SettlementProps) {
  const res = calcSettle(results, players, households)

  const name = (id: string) => playerName(id, players)

  const internalLines = res.households.filter(x => x.internal && x.internal.amount > 0)

  if (!res.txns.length && !internalLines.length) {
    return (
      <div style={{
        background: 'var(--accent-dim)', border: '1px solid var(--accent-line)',
        borderRadius: 12, padding: '11px', textAlign: 'center',
        color: 'var(--accent)', fontSize: 13, marginTop: 8, fontWeight: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}>
        <Check size={14} strokeWidth={2.6} /> All square — no payments needed
      </div>
    )
  }

  return (
    <div>
      {internalLines.length > 0 && (
        <>
          <div className="label" style={{ margin: '12px 0 8px' }}>
            <House size={12} strokeWidth={2.4} /> Household internal (no cash)
          </div>
          {internalLines.map((hh, i) => (
            <TxnRow key={i}
              from={name(hh.internal!.from)}
              to={name(hh.internal!.to)}
              amount={hh.internal!.amount}
              dim
            />
          ))}
        </>
      )}

      {Math.abs(res.imbalance) >= 1 && (
        <div style={{
          background: 'var(--neg-dim)', border: '1px solid var(--neg-line)',
          borderRadius: 11, padding: '10px 13px', marginTop: 10,
          fontSize: 12.5, color: 'var(--neg)', lineHeight: 1.5,
          display: 'flex', gap: 8, alignItems: 'flex-start',
        }}>
          <TriangleAlert size={14} strokeWidth={2.4} style={{ flexShrink: 0, marginTop: 2 }} />
          <span><strong>Settlement off by {inr(Math.abs(res.imbalance))}</strong>. Cashouts don't balance against buyins.</span>
        </div>
      )}

      {res.txns.length > 0 && (
        <>
          <div className="label accent" style={{ margin: '12px 0 8px' }}>
            Who pays who
          </div>
          {res.txns.map((t, i) => (
            <TxnRow key={i} from={name(t.from)} to={name(t.to)} amount={t.amount} />
          ))}
        </>
      )}
    </div>
  )
}

function TxnRow({ from, to, amount, dim }: { from: string; to: string; amount: number; dim?: boolean }) {
  return (
    <div className="row" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px', marginBottom: 6,
      opacity: dim ? 0.75 : 1,
    }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13.5 }}>
        <span style={{ color: 'var(--neg)', fontWeight: 600 }}>{from}</span>
        <ArrowRight size={13} strokeWidth={2.4} style={{ color: 'var(--ink-4)' }} />
        <span style={{ color: 'var(--pos)', fontWeight: 600 }}>{to}</span>
      </span>
      <span className="mono" style={{ color: 'var(--ink)', fontWeight: 700, fontSize: 13.5 }}>
        {inr(amount)}
      </span>
    </div>
  )
}
